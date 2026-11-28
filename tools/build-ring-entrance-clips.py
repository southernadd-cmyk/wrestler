#!/usr/bin/env python3
"""One-off asset import: verify CC0 source files, then retain only 12-second MP3 clips."""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "assets/audio/entrance-sources.json").read_text())
TRACKS = MANIFEST["tracks"]
DEST = ROOT / "assets/audio/entrances"
SECONDS = MANIFEST["clipSeconds"]
assert len(TRACKS) == 200
assert len({t["file"] for t in TRACKS.values()}) == 200
assert SECONDS == 12

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

def build(item, staging):
    identity, track = item
    assert re.fullmatch(r"[a-z0-9-]+", identity)
    assert re.fullmatch(r"[\w.-]+\.ogg", track["file"])
    source = staging / (identity + ".ogg")
    result = staging / (identity + ".mp3")
    url = MANIFEST["mirror"] + urllib.parse.quote(track["file"], safe="")
    run("curl", "--fail", "--location", "--silent", "--show-error", "--retry", "2",
        "--connect-timeout", "15", "--max-time", "120", "--output", str(source), url)
    if hashlib.sha256(source.read_bytes()).hexdigest() != track["sha256"]:
        raise ValueError(f"{identity}: source checksum mismatch")
    run("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(source), "-t", str(SECONDS),
        "-map", "0:a:0", "-af", "loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st=11.25:d=0.75",
        "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k",
        "-map_metadata", "-1", str(result))
    duration = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration",
                         "-of", "default=noprint_wrappers=1:nokey=1", str(result)))
    if not 11.95 <= duration <= 12.15 or not 60000 <= result.stat().st_size <= 200000:
        raise ValueError(f"{identity}: invalid duration/size {duration}/{result.stat().st_size}")
    source.unlink()
    return identity, result, duration

def main():
    # No partial asset bank is copied into the repository on a failed import.
    with tempfile.TemporaryDirectory(prefix="ring-music-") as temp:
        staging = pathlib.Path(temp)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(lambda item: build(item, staging), TRACKS.items()))
        assert len(results) == 200
        DEST.mkdir(parents=True, exist_ok=True)
        report = {}
        for identity, result, duration in results:
            target = DEST / result.name
            target.write_bytes(result.read_bytes())
            report[identity] = {"duration": duration, "bytes": target.stat().st_size,
                                "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}
        (DEST / "index.json").write_text(json.dumps(report, indent=2) + "\n")
        print(f"Verified {len(report)} clips; {sum(t['bytes'] for t in report.values()):,} bytes")

if __name__ == "__main__":
    main()
