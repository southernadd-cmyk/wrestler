#!/usr/bin/env python3
"""Pack The Office's 52 v4 cutouts below the untouched original portrait atlas.

Usage:
    python3 pack_portraits.py path/to/renders --repo .
    python3 pack_portraits.py assets/portraits --repo . --strict

Source images must be named by real wrestler ID (faye.png, bao.png, ...).
Missing renders stay blank in the atlas and fall back to the game's
character-directed procedural face. Re-running is safe: original rows 1-8
are always copied from the first 480px of the input atlas.
Requires Pillow: python3 -m pip install pillow
"""
import argparse
import html
import json
from pathlib import Path
import re
from PIL import Image

W, H, COLS = 48, 60, 4

def replace_once(text, pattern, replacement, file):
    updated, count = re.subn(pattern, lambda _: replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Could not locate unique update target in {file}: {pattern[:40]}")
    return updated

def set_if_changed(path, text):
    if not path.exists() or path.read_text(encoding='utf8') != text:
        path.write_text(text, encoding='utf8')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('renders',type=Path,help='Directory with ID-named transparent PNGs')
    parser.add_argument('--repo',type=Path,default=Path('.'))
    parser.add_argument('--strict',action='store_true',help='Require every new wrestler portrait')
    args=parser.parse_args()
    repo=args.repo.resolve()
    source=args.renders.resolve()
    cast=json.loads((repo/'docs/living-roster-v4.json').read_text(encoding='utf8'))
    newcomers=cast['new_wrestlers']
    original_ids=cast['preserved_originals']['talent_ids']+cast['preserved_originals']['opponent_ids']
    ids=[w['id'] for w in newcomers]
    if len(ids)!=52 or len(set(ids))!=52 or len(original_ids)!=28:
        raise RuntimeError('Expected 52 new and 28 original unique wrestler IDs')
    if not source.is_dir():
        raise RuntimeError(f'Not a portrait directory: {source}')
    missing=[id for id in ids if not (source/(id+'.png')).is_file()]
    if args.strict and missing:
        raise RuntimeError('Missing portraits: '+', '.join(missing))

    atlas_path=repo/'assets/portrait-atlas.png'
    with Image.open(atlas_path) as im:
        if im.width!=W*COLS or im.height not in (H*8,H*21):
            raise RuntimeError(f'Unexpected existing atlas size: {im.size}')
        original=im.convert('RGBA').crop((0,0,W*COLS,H*8))
    output=Image.new('RGBA',(W*COLS,H*21),(0,0,0,0))
    output.paste(original,(0,0))
    packed=[]
    for i,id in enumerate(ids):
        file=source/(id+'.png')
        if not file.is_file():
            continue
        with Image.open(file) as sprite:
            if sprite.size!=(W,H):
                raise RuntimeError(f'{id}: portrait must be 48x60, got {sprite.size}')
            sprite=sprite.convert('RGBA')
            if not any(alpha==0 for alpha in sprite.getchannel('A').getdata()):
                raise RuntimeError(f'{id}: image is not a transparent cutout')
            output.paste(sprite,((i%4)*W,(8+i//4)*H))
        packed.append(id)
    output.save(atlas_path,optimize=True)

    # The 28 originals remain pixel-identical in the atlas, including bookers.
    # Provide crops for README; preserve explicit transparent redraws of the
    # first four originals if the renderer exported them already.
    for i,id in enumerate(original_ids):
        path=repo/'assets/portraits'/f'{id}.png'
        path.parent.mkdir(parents=True,exist_ok=True)
        if not path.exists():
            original.crop(((i%4)*W,(i//4)*H,(i%4+1)*W,(i//4+1)*H)).save(path,optimize=True)

    js_path=repo/'assets/js/portraits.js'
    js=js_path.read_text(encoding='utf8')
    rows=[
       ['wrestler:'+id for id in original_ids[i:i+COLS]]
       for i in range(0,28,COLS)
    ]
    rows.append(['booker:dock','booker:pulse','booker:crown','booker:union'])
    rows.extend([['wrestler:'+id for id in ids[i:i+COLS]] for i in range(0,52,COLS)])
    assert len(rows)==21 and all(len(row)==4 for row in rows)
    block="const portraitRows=[\n"+''.join(" ["+','.join(repr(k) for k in row)+"],\n" for row in rows)+"];"
    js=replace_once(js,r"const portraitRows=\[\n.*?\n\];",block,'portraits.js')
    packed_set="const packedPortraitIds=new Set("+json.dumps(packed,separators=(',',':'))+");"
    if re.search(r"const packedPortraitIds=new Set\([^\n]*\);",js):
        js=replace_once(js,r"const packedPortraitIds=new Set\([^\n]*\);",packed_set,'portraits.js')
    else:
        js=js.replace(block,block+'\n'+packed_set)
    old="if(position&&!(typeof document!=='undefined'&&transparentPortrait(actor?.key)))"
    new="if(position&&!(typeof document!=='undefined'&&transparentPortrait(actor?.key)&&!packedPortraitIds.has(actor?.key?.slice(9))))"
    if old in js: js=js.replace(old,new)
    elif new not in js: raise RuntimeError('Unexpected avatar branch; refusing to rewrite')
    set_if_changed(js_path,js)

    css_path=repo/'assets/css/core.css'
    css=css_path.read_text(encoding='utf8')
    if 'background-size:400% 800%' in css: css=css.replace('background-size:400% 800%','background-size:400% 2100%',1)
    elif 'background-size:400% 2100%' not in css: raise RuntimeError('Unexpected roster atlas CSS')
    set_if_changed(css_path,css)

    # Keep both dimension-pinning tests aligned with the packed atlas.
    roster_test=repo/'tests/roster.test.cjs'
    s=roster_test.read_text(encoding='utf8')
    s=s.replace('8 * 60','21 * 60').replace('background-size:400% 800%','background-size:400% 2100%').replace('100*column/3}% 100%','100*column/3}% 35%')
    set_if_changed(roster_test,s)
    structure=repo/'tests/structure.test.cjs'
    s=structure.read_text(encoding='utf8').replace('readUInt32BE(20),480','readUInt32BE(20),1260')
    set_if_changed(structure,s)

    roster_art_test=repo/'tests/portrait-art.test.cjs'
    s=roster_art_test.read_text(encoding='utf8')
    start=s.find("const poster=fs.readFileSync")
    end=s.find("console.log('PASS portraits:",start)
    if start>=0 and end>=0:
        s=s[:start]+"""const readme=fs.readFileSync(path.join(__dirname,'..','readme.md'),'utf8');
for(const w of D.ALL){
 assert.ok(readme.includes('assets/portraits/'+w.id+'.png'),'missing README portrait '+w.name);
 assert.ok(fs.existsSync(path.join(__dirname,'..','assets','portraits',w.id+'.png')),'missing sprite '+w.id);
}
for(const w of D.V4.newCast){
 const markup=P.avatar({key:'wrestler:'+w.id,name:w.name});
 assert.match(markup,/roster-portrait/,'packed face absent '+w.id);
}
""" +s[end:]
        s=s.replace('README roster art','README portraits from actual game assets')
        set_if_changed(roster_art_test,s)

    # One continuous alphabetical-style publication grid: no original/new
    # split, badges, contracts, fictional names or made-up allocations.
    names={w['id']:w['name'] for w in newcomers}
    # The old names come from existing game/README roster data, not guessed.
    old_names={
      'mara':'Mara Vale','rex':'Rex Titan','lyra':'Lyra Knox','brick':'Brick Rowan',
    }
    # For all other originals, rely on the canonical roster-poster labels
    # already in the README source rather than fabricating names.
    # Read names directly from assets/js/data.js TALENT/FOES records.
    data=(repo/'assets/js/data.js').read_text(encoding='utf8')
    for id in original_ids:
        match=re.search(r"\{id:'"+re.escape(id)+r"',name:'([^']+)'",data)
        if not match: raise RuntimeError(f'Missing original wrestler name for {id}')
        old_names[id]=match.group(1)
    names.update(old_names)
    ordered=sorted(original_ids+ids,key=lambda id:names[id].casefold())
    lines=['<!-- LIVING ROSTER START -->','<table align="center">']
    for start in range(0,80,8):
        lines.append('<tr>')
        for id in ordered[start:start+8]:
            label=html.escape(names[id])
            lines.append(f'<td align="center"><img src="assets/portraits/{id}.png" alt="Pixel-art portrait of {label}" width="48" height="60"><br><sub>{label}</sub></td>')
        lines.append('</tr>')
    lines.extend(['</table>','<!-- LIVING ROSTER END -->'])
    gallery='\n'.join(lines)
    readme_path=repo/'readme.md'
    readme=readme_path.read_text(encoding='utf8')
    if '<!-- LIVING ROSTER START -->' in readme:
        readme=replace_once(readme,r'<!-- LIVING ROSTER START -->.*?<!-- LIVING ROSTER END -->',gallery,'readme.md')
    else:
        readme=replace_once(readme,r'<p align="center"><img src="docs/readme/living-roster-v4.svg"[^>]*></p>',gallery,'readme.md')
    set_if_changed(readme_path,readme)

    if output.size!=(192,1260):raise RuntimeError('Atlas dimensions incorrect')
    print(f'Atlas {output.width}x{output.height}: {len(packed)}/52 new PNGs packed; 28 originals + four bookers preserved')
    if missing:print('Procedural fallback:',', '.join(missing))
    print('README: 80 real wrestlers, one continuous portrait grid; safe to rerun')

if __name__=='__main__':
    main()
