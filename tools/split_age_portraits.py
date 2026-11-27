"""Extract exact age-specific portraits from the canonical lossless atlases.

Run from anywhere: python tools/split_age_portraits.py
All visible pixels are preserved; only the already-authorised frame trims
are applied. The source atlases remain available for art and geometry audits.
"""
import json
from pathlib import Path
from PIL import Image

TRIM = {
    "magnus": {"young": 8, "middle": 8, "old": 8},
    "cal": {"young": 5, "middle": 5, "old": 0},
    "booker:union": {"young": 9, "middle": 9, "old": 9},
    "booker:dennis": {"young": 3, "middle": 3, "old": 3},
}

def split(target):
    records = json.loads((target / "manifest.json").read_text())["records"]
    out = target / "cells"
    out.mkdir(exist_ok=True)
    expected = set()
    total = 0
    for sheet in range(1, 11):
        with Image.open(target / f"atlas-{sheet:02d}.webp") as source:
            atlas = source.convert("RGBA")
        assert atlas.size == (1296, 1440)
        for r in records:
            if not r["atlas"].endswith(f"-{sheet:02d}.png"):
                continue
            x, y = r["x"], r["y"]
            h = 180 - TRIM.get(r["id"], {}).get(r["age"], 0)
            crop = atlas.crop((x, y, x + 144, y + h))
            name = f"{sheet:02d}-{x//144}-{y//180}.webp"
            assert name not in expected
            expected.add(name)
            file = out / name
            crop.save(file, "WEBP", lossless=True, method=4, exact=True)
            with Image.open(file) as im:
                decoded = im.convert("RGBA")
                assert decoded.size == crop.size
                # WebP may discard invisible RGB values; visible RGB and alpha
                # must be identical, including partially transparent pixels.
                a, b = crop.tobytes(), decoded.tobytes()
                assert a[3::4] == b[3::4]
                assert all(a[i:i+3] == b[i:i+3] for i in range(0,len(a),4) if a[i+3])
            assert file.stat().st_size < 100000, file
            total += file.stat().st_size
    assert len(expected) == len(records) == 681
    for file in out.glob("*.webp"):
        if file.name not in expected:
            file.unlink()
    print(f"Verified {len(expected)} lossless individual portraits: {total:,} bytes total")

if __name__ == "__main__":
    split(Path(__file__).resolve().parents[1] / "assets" / "portrait-ages")
