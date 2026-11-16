#!/usr/bin/env python3
"""Build The Office's portrait atlas and README portraits from the source art.

Usage (from the repository root):
    python tools/build_portraits.py          # rebuild everything
    python tools/build_portraits.py --check  # verify committed outputs are current

Inputs (committed, never modified by this script):
    art/source/original-atlas-v3.png  48x60 cells: the 28 original wrestlers and
                                      the 4 promoters, exactly as shipped in v3.
    art/source/new52-sheet.png        the 52 newcomer paintings, 8 per row, in the
                                      same order as the v4 cast in
                                      docs/living-roster-v4.json.

Outputs:
    art/masters/<id>.png              each newcomer cleanly cut out of the sheet
                                      at native resolution.
    assets/portraits/<id>.png         one 144x180 portrait per wrestler (all 80).
    assets/portrait-atlas.png         4 x 21 grid of 144x180 cells, read by
                                      .roster-portrait in assets/css/core.css.
    readme.md                         the LIVING ROSTER gallery between its
                                      START/END markers.

Originals are scaled 3x with nearest-neighbour, so they look exactly as before
(Mara, Rex, Lyra and Brick keep the painted backgrounds they were drawn with).
Requires Pillow (python -m pip install pillow).
"""
import argparse
import html
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CELL_W, CELL_H, COLS = 144, 180, 4

ORIGINAL_ORDER = [
    'mara', 'rex', 'lyra', 'brick', 'juno', 'sol', 'dee', 'kit',
    'dax', 'val', 'nico', 'cal', 'imani', 'otis', 'kira', 'ezra',
    'red', 'roxy', 'silas', 'night', 'rev', 'malik', 'dean', 'rocco',
    'nova', 'ace', 'magnus', 'tori',
]
BOOKERS = ['dock', 'pulse', 'crown', 'union']

# The source sheet is 1304px wide (8 columns of 163px). Its rows are NOT evenly
# spaced: each is separated by a ~5px rule, so slice on the measured content
# bands (top inclusive, bottom exclusive) rather than a fixed grid.
SHEET_COL_W = 163
SHEET_ROWS = [(0, 169), (176, 344), (351, 518), (525, 686), (694, 838), (845, 993), (998, 1141)]

def new_cast():
    data = json.loads((ROOT / 'docs' / 'living-roster-v4.json').read_text(encoding='utf8'))
    return {w['id']: w['name'] for w in data['new_wrestlers']}


def original_names():
    source = (ROOT / 'assets' / 'js' / 'data.js').read_text(encoding='utf8')
    names = dict(re.findall(r"id:'([a-z]+)',name:'([^']+)'", source))
    missing = [w for w in ORIGINAL_ORDER if w not in names]
    if missing:
        sys.exit('Names not found in data.js: ' + ', '.join(missing))
    return {w: names[w] for w in ORIGINAL_ORDER}


def readme_gallery(names):
    lines = ['<!-- LIVING ROSTER START -->', '<table align="center">']
    roster = sorted(names.items(), key=lambda kv: kv[1])
    for start in range(0, len(roster), 8):
        lines.append('<tr>')
        for wid, name in roster[start:start + 8]:
            safe = html.escape(name)
            lines.append(f'<td align="center"><img src="assets/portraits/{wid}.png" '
                         f'alt="Pixel-art portrait of {safe}" width="72" height="90"><br><sub>{safe}</sub></td>')
        lines.append('</tr>')
    lines += ['</table>', '<!-- LIVING ROSTER END -->']
    return '\n'.join(lines)


def largest_component(img):
    """Keep only the alpha-connected region containing most pixels (the figure),
    dropping specks of neighbouring cells."""
    w, h = img.size
    a = img.getchannel('A').load()
    seen = bytearray(w * h)
    best = []
    for sy in range(h):
        for sx in range(w):
            if a[sx, sy] == 0 or seen[sy * w + sx]:
                continue
            stack, comp = [(sx, sy)], []
            seen[sy * w + sx] = 1
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny] > 0:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    keep = Image.new('L', (w, h), 0)
    kp = keep.load()
    for x, y in best:
        kp[x, y] = 255
    out = img.copy()
    alpha = Image.composite(img.getchannel('A'), Image.new('L', (w, h), 0), keep)
    out.putalpha(alpha)
    return out


def cut_masters(sheet, ids):
    if sheet.size != (SHEET_COL_W * 8, 1141):
        sys.exit(f'Unexpected sheet size {sheet.size}')
    masters = {}
    for i, wid in enumerate(ids):
        top, bottom = SHEET_ROWS[i // 8]
        x = (i % 8) * SHEET_COL_W
        cell = sheet.crop((x, top, x + SHEET_COL_W, bottom))
        cell = largest_component(cell)
        masters[wid] = cell.crop(cell.getbbox())
    return masters


def fit_newcomer(master, ref_h):
    """Scale every newcomer by the same factor (so heads stay the same size
    across the roster), centre horizontally and sit the shoulders on the
    bottom edge of the cell."""
    scale = CELL_H / ref_h
    w, h = master.size
    img = master.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.LANCZOS)
    if img.width > CELL_W:
        left = (img.width - CELL_W) // 2
        img = img.crop((left, 0, left + CELL_W, img.height))
    cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    cell.alpha_composite(img, ((CELL_W - img.width) // 2, CELL_H - img.height))
    return cell


def original_cell(atlas, index):
    x, y = (index % COLS) * 48, (index // COLS) * 60
    cell = atlas.crop((x, y, x + 48, y + 60))
    return cell.resize((CELL_W, CELL_H), Image.Resampling.NEAREST)


def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, 'PNG', optimize=True)
    return buf.getvalue()


def build():
    cast = new_cast()
    ids = list(cast)
    if len(ids) != 52:
        sys.exit(f'Expected 52 newcomers, found {len(ids)}')
    old = Image.open(ROOT / 'art' / 'source' / 'original-atlas-v3.png').convert('RGBA')
    sheet = Image.open(ROOT / 'art' / 'source' / 'new52-sheet.png').convert('RGBA')
    masters = cut_masters(sheet, ids)
    ref_h = max(m.height for m in masters.values())

    cells = {}
    for i, wid in enumerate(ORIGINAL_ORDER):
        cells['wrestler:' + wid] = original_cell(old, i)
    for i, bid in enumerate(BOOKERS):
        cells['booker:' + bid] = original_cell(old, 28 + i)
    for wid in ids:
        cells['wrestler:' + wid] = fit_newcomer(masters[wid], ref_h)

    order = ['wrestler:' + w for w in ORIGINAL_ORDER] + ['booker:' + b for b in BOOKERS] + ['wrestler:' + w for w in ids]
    rows = len(order) // COLS
    atlas = Image.new('RGBA', (COLS * CELL_W, rows * CELL_H), (0, 0, 0, 0))
    for i, key in enumerate(order):
        atlas.alpha_composite(cells[key], ((i % COLS) * CELL_W, (i // COLS) * CELL_H))

    files = {'assets/portrait-atlas.png': png_bytes(atlas)}
    for key, img in cells.items():
        if key.startswith('wrestler:'):
            files[f'assets/portraits/{key[9:]}.png'] = png_bytes(img)
    for wid, img in masters.items():
        files[f'art/masters/{wid}.png'] = png_bytes(img)
    names = {**original_names(), **cast}
    if len(names) != 80:
        sys.exit(f'Expected 80 wrestlers, found {len(names)}')
    readme = (ROOT / 'readme.md').read_text(encoding='utf8')
    readme, count = re.subn(r'<!-- LIVING ROSTER START -->.*?<!-- LIVING ROSTER END -->',
                            lambda _: readme_gallery(names), readme, flags=re.S)
    if count != 1:
        sys.exit('readme.md needs exactly one LIVING ROSTER START/END block')
    files['readme.md'] = readme.encode('utf8')
    return files, order


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='fail if committed outputs differ from a fresh build')
    args = parser.parse_args()
    files, order = build()
    stale = []
    for rel, data in files.items():
        path = ROOT / rel
        if args.check:
            if not path.exists():
                stale.append(rel)
            elif rel.endswith('.png'):
                if Image.open(path).convert('RGBA').tobytes() != Image.open(io.BytesIO(data)).convert('RGBA').tobytes():
                    stale.append(rel)
            elif path.read_bytes().replace(b'\r\n', b'\n') != data:
                stale.append(rel)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    if stale:
        sys.exit('Out of date: ' + ', '.join(stale))
    print(('Checked ' if args.check else 'Wrote ') + f'{len(files)} files; atlas order: {len(order)} cells')


if __name__ == '__main__':
    main()
