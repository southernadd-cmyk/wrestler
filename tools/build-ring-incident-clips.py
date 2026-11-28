#!/usr/bin/env python3
"""One-off local import of entrance incident cues (no runtime external audio)."""
from pathlib import Path
import hashlib, json, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/audio/entrance-incidents"
SOURCES = {
    "slow": {
        "url": "https://github.com/todd-apptivity/video-background-music/releases/download/v1/interior-birdecorator-menu_loop.ogg",
        "credit": "Abstraction / Tallbeard Studios — Interior Birdecorator Menu_LOOP",
        "source": "https://tallbeard.itch.io/music-loop-bundle", "license": "CC0-1.0",
        "sha256": "28a3f62eddcea1e30817c04cd934df191d71ea9ca970b252b6834e5d564d84e3",
    },
    "hum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/5b/Woman_humming_a_nondescript_tune.wav",
        "credit": "PSsoundproject — Woman humming a nondescript tune",
        "source": "https://commons.wikimedia.org/wiki/File:Woman_humming_a_nondescript_tune.wav", "license": "CC0-1.0",
    },
    "march": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/cb/A_Midsummer_Night%27s_Dream_Op._61_Wedding_March_%28Mendelssohn%29_European_Archive.ogg",
        "credit": "Felix Mendelssohn — Wedding March, European Archive recording via Musopen",
        "source": "https://commons.wikimedia.org/wiki/File:A_Midsummer_Night%27s_Dream_Op._61_Wedding_March_(Mendelssohn)_European_Archive.ogg",
        "license": "CC0 / public domain (see source)", "sha1": "1fc5f898efd2fa13a0fcb11e328a8b69145b2f01",
    },
    "shanty": {
        "url": "https://opengameart.org/sites/default/files/oga_jam_menu_music_loopable_0.ogg",
        "credit": "Thimras — A sailor's chant",
        "source": "https://opengameart.org/content/a-sailors-chant", "license": "CC0-1.0",
    }
}

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

def group_filter(rates, delays):
    # Layer the real vocal performance with slightly different pitches and timings.
    # This is an approximate generic humming group, not a transcription of 200 themes.
    parts = ["[0:a]aformat=sample_rates=44100:channel_layouts=mono,asplit=3[a][b][c]"]
    for i, (label, rate, delay) in enumerate(zip("abc", rates, delays)):
        parts.append(f"[{label}]asetrate={rate},aresample=44100,adelay={delay}:all=1[v{i}]")
    parts.append("[v0][v1][v2]amix=inputs=3:duration=longest,lowpass=f=2600,aecho=0.8:0.8:55:0.2,loudnorm=I=-21:TP=-2:LRA=7,afade=t=out:st=11.25:d=0.75[out]")
    return ";".join(parts)

def main():
    report = {}
    with tempfile.TemporaryDirectory() as temp:
        stage = Path(temp)
        raw = {}
        for key, meta in SOURCES.items():
            file = stage / (key + ".source")
            run("curl","--fail","--location","--silent","--show-error","--retry","2","--max-time","90",
                "--user-agent","TheOfficeAudioImport/1.0 (github.com/southernadd-cmyk/wrestler)","--output",str(file),meta["url"])
            for kind in ("sha1","sha256"):
                if kind in meta and hashlib.new(kind,file.read_bytes()).hexdigest() != meta[kind]:
                    raise ValueError(f"{key}: source checksum mismatch")
            raw[key] = file
        for key in ("slow","hum","choir","choirBad","march","shanty"):
            source = "hum" if key in ("hum","choir","choirBad") else key
            target = stage / (key+".mp3")
            args = ["ffmpeg","-nostdin","-v","error","-y","-i",str(raw[source])]
            if source == "hum":
                rates = {"hum":(44100,42700,45500),"choir":(44100,44010,44200),"choirBad":(44100,41624,46720)}[key]
                delays = {"hum":(0,180,370),"choir":(0,55,110),"choirBad":(0,80,160)}[key]
                args += ["-filter_complex",group_filter(rates,delays),"-map","[out]"]
            else:
                args += ["-map","0:a:0","-af","loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st=11.25:d=0.75"]
            run(*args,"-t","12","-ar","44100","-ac","2","-c:a","libmp3lame","-b:a","96k","-map_metadata","-1",str(target))
            duration=float(run("ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(target)))
            if not 11.95 <= duration <= 12.15:
                raise ValueError(f"{key}: invalid duration {duration}")
            report[key]={**SOURCES[source],"duration":duration,"bytes":target.stat().st_size,"outputSha256":hashlib.sha256(target.read_bytes()).hexdigest()}
        DEST.mkdir(parents=True, exist_ok=True)
        for key in report:
            (DEST/(key+".mp3")).write_bytes((stage/(key+".mp3")).read_bytes())
        (DEST/"index.json").write_text(json.dumps(report,indent=2)+"\n")
        print("Verified",len(report),"local incident clips")

if __name__=="__main__":
    main()
