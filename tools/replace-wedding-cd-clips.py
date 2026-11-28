#!/usr/bin/env python3
"""Replace only the two wedding-CD recordings with dedicated CC0 clips."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/audio/entrance-incidents"
SOURCES = {
    "disco": {
        "url": "https://opengameart.org/sites/default/files/funkydiscobeatstoboogieslashwoogieto_0.ogg",
        "source": "https://opengameart.org/content/funky-disco-beats-to-boogiewoogie-to",
        "credit": "Fupi — Funky Disco Beats to Boogie/Woogie to",
        "license": "CC0-1.0",
        "offset": 16,
    },
    "slow": {
        "url": "https://github.com/btahir/open-lofi/releases/download/v1.0.0/openlofi.zip",
        "source": "https://github.com/btahir/open-lofi",
        "credit": "btahir / Open Lo-Fi — Slow Dance in the Living Room",
        "license": "CC0-1.0",
        "archiveMember": "slow-dance-in-the-living-room.mp3",
        "offset": 24,
    },
}

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

def main():
    index = json.loads((DEST / "index.json").read_text())
    with tempfile.TemporaryDirectory() as temp:
        stage = Path(temp)
        for key, meta in SOURCES.items():
            raw = stage / (key + ".source")
            print("Downloading", key, flush=True)
            run("curl", "--fail", "--location", "--silent", "--show-error", "--retry", "2",
                "--max-time", "180", "--max-filesize", "600000000", "--output", str(raw), meta["url"])
            if "archiveMember" in meta:
                with zipfile.ZipFile(raw) as archive:
                    matches = [n for n in archive.namelist() if Path(n).name == meta["archiveMember"]]
                    if len(matches) != 1:
                        raise ValueError("Expected exactly one matching slow dance recording: " + str(matches))
                    if archive.getinfo(matches[0]).file_size > 30000000:
                        raise ValueError("Unexpectedly large track")
                    track = stage / (key + ".mp3.source")
                    track.write_bytes(archive.read(matches[0]))
                    raw = track
            target = stage / (key + ".mp3")
            run("ffmpeg","-nostdin","-v","error","-y","-ss",str(meta["offset"]),"-i",str(raw),
                "-map","0:a:0","-t","12","-af","loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st=11.25:d=0.75",
                "-ar","44100","-ac","2","-c:a","libmp3lame","-b:a","96k","-map_metadata","-1",str(target))
            duration = float(run("ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(target)))
            if not 11.95 <= duration <= 12.15 or not 100000 < target.stat().st_size < 200000:
                raise ValueError(f"{key}: invalid duration or size")
            index[key] = {**meta,"sourceSha256":hashlib.sha256(raw.read_bytes()).hexdigest(),
                          "duration":duration,"bytes":target.stat().st_size,"outputSha256":hashlib.sha256(target.read_bytes()).hexdigest()}
            print(key, duration, "seconds", flush=True)
        for key in SOURCES:
            (DEST / (key + ".mp3")).write_bytes((stage / (key + ".mp3")).read_bytes())
        (DEST / "index.json").write_text(json.dumps(index,indent=2)+"\n")
        print("Verified both replacement wedding clips")

if __name__ == "__main__":
    main()
