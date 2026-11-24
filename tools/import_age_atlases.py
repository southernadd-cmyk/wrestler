"""Import The Office's 9×8 age portrait sheets from the portrait-pack archive.

Usage: python tools/import_age_atlases.py /path/to/portrait-pack
The manifest provides three consecutive 144×180 cells (young, middle, old)
per character. Asset names and coordinates stay stable for later art swaps.
"""
import json
import hashlib
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image


def main(pack: Path) -> None:
    root = Path(__file__).resolve().parents[1]
    target = root / "assets" / "portrait-ages"
    target.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((pack / "manifest.json").read_text())
    assert manifest["atlas_pixels"] == [1296, 1440]
    assert manifest["slot_pixels"] == [144, 180]
    records = defaultdict(dict)
    for item in manifest["records"]:
        records[item["id"]][item["age"]] = item
    atlases = sorted((pack / "atlases").glob("portrait-atlas-*.png"))
    assert len(atlases) == 10
    overrides = {}
    override_dir = root / "art" / "source" / "age-portrait-overrides"
    for item in manifest["records"]:
        replacement = override_dir / f"{item['id'].replace(':', '-')}__{item['age']}.png"
        if replacement.is_file():
            with Image.open(replacement) as portrait:
                assert portrait.mode == "RGBA" and portrait.size == (144, 180), replacement
            item["file"] = replacement.relative_to(root).as_posix()
            item["sha256"] = hashlib.sha256(replacement.read_bytes()).hexdigest()
            overrides[(item["atlas"], item["x"], item["y"])] = replacement
    for i, atlas in enumerate(atlases, 1):
        with Image.open(atlas) as image:
            assert image.size == (1296, 1440)
            image = image.convert("RGBA")
            for (sheet, x, y), replacement in overrides.items():
                if sheet != f"atlases/portrait-atlas-{i:02d}.png":
                    continue
                image.paste((0, 0, 0, 0), (x, y, x + 144, y + 180))
                with Image.open(replacement) as portrait:
                    image.alpha_composite(portrait, (x, y))
            image.save(target / f"atlas-{i:02d}.webp", "WEBP", lossless=True, method=6)
    cells = {}
    for key, ages in records.items():
        assert set(ages) == {"young", "middle", "old"}, key
        young, middle, old = (ages[age] for age in ("young", "middle", "old"))
        assert young["atlas"] == middle["atlas"] == old["atlas"]
        assert young["y"] == middle["y"] == old["y"]
        assert [middle["x"] - young["x"], old["x"] - young["x"]] == [144, 288]
        assert young["x"] % 432 == 0 and young["y"] % 180 == 0
        assert (young["width"], young["height"]) == (144, 180)
        sheet = int(Path(young["atlas"]).stem.rsplit("-", 1)[1])
        cells[key] = [sheet, young["x"] // 144, young["y"] // 180]
    # Keep the source manifest as an art handoff; the smaller JS file is what
    # the no-build static game reads at startup.
    # One record per line keeps art handoffs reviewable without a 10k-line diff.
    lines = ["{"] + [
        f"  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},"
        for k, v in manifest.items() if k != "records"
    ]
    lines += ['  "records": [']
    lines += [
        "    " + json.dumps(record, separators=(",", ":"), ensure_ascii=False)
        + ("," if i + 1 < len(manifest["records"]) else "")
        for i, record in enumerate(manifest["records"])
    ]
    lines += ["  ]", "}"]
    (target / "manifest.json").write_text("\n".join(lines) + "\n")
    js = "// Generated from portrait-pack/manifest.json by tools/import_age_atlases.py.\n"
    js += "// [sheet, first column, row]; the next two columns are middle and old.\n"
    js += "(function(root){root.OfficeAgePortraitCells=Object.freeze(\n"
    js += json.dumps(cells, separators=(",", ":"), ensure_ascii=False) + "\n"
    js += ");})(typeof window!=='undefined'?window:globalThis);\n"
    (root / "assets" / "js" / "portrait-age-map.js").write_text(js)
    characters = json.loads((pack / "characters.json").read_text())
    rookies = [
        {k: person[k] for k in ("id", "name", "division", "entry_age", "wrestling_style", "face", "gear")}
        for person in characters["wrestlers"] if person["id"].startswith("academy-")
    ]
    assert len(rookies) == 120
    assert sum(person["division"] == "women" for person in rookies) == 60
    assert len({person["id"] for person in rookies}) == len({person["name"] for person in rookies}) == 120
    assert all(18 <= person["entry_age"] <= 26 and person["id"] in cells for person in rookies)
    academy_js = "// Authored academy identities from portrait-pack/characters.json.\n"
    academy_js += "(function(root){root.OfficeAcademyRegister=Object.freeze([\n"
    academy_js += ",\n".join(json.dumps(person, separators=(",", ":"), ensure_ascii=False) for person in rookies)
    academy_js += "\n]);})(typeof window!=='undefined'?window:globalThis);\n"
    (root / "assets" / "js" / "academy-register.js").write_text(academy_js)
    print(f"Imported {len(cells)} identities across {len(atlases)} lossless atlases")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python tools/import_age_atlases.py /path/to/portrait-pack")
    main(Path(sys.argv[1]))
