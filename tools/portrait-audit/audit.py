#!/usr/bin/env python3
"""Phase 4C: artwork similarity screening, not biometric identification."""
import argparse, base64, csv, hashlib, html, io, itertools, json, re, subprocess, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[2]
ORIGINALS=ROOT/'assets/portraits'
BANK=ROOT/'assets/academy/portraits'
MANIFEST=ROOT/'assets/academy/manifest.json'
IDS='mara rex lyra brick juno sol dee kit dax val nico cal imani otis kira ezra red roxy silas night rev malik dean rocco nova ace magnus tori faye bao zara miro aisha ellis anya nolan ivo rina priya nate cass jun sylvia kofi mae theo soraya milo winnie bronte gus nikita jett alina cedric marisol felix eira gideon vera tomas ari tomasash kezia dev liya emmett nadia leandro iris kellan ayla sasha morgan noelle ash zane elodie bashir cleo'.split()
EXTS={'.png','.webp','.jpg','.jpeg'}
assert len(IDS)==len(set(IDS))==80
cv2.setNumThreads(1)
cv2.setRNGSeed(7261)
SIFT=cv2.SIFT_create(nfeatures=500,contrastThreshold=.015)
BF=cv2.BFMatcher(cv2.NORM_L2)

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def gray(im):
    a=np.asarray(im.convert('RGBA'),dtype=np.float32)
    alpha=a[:,:,3:4]/255
    rgb=(a[:,:,:3]*alpha+np.array([45,40,40])*(1-alpha)).astype(np.uint8)
    return cv2.cvtColor(cv2.resize(rgb,(256,256),interpolation=cv2.INTER_AREA),cv2.COLOR_RGB2GRAY)
def phash(g):
    v=cv2.dct(cv2.resize(g,(32,32),interpolation=cv2.INTER_AREA).astype(np.float32))[:8,:8].ravel()[1:]
    return v>np.median(v)
def features(g):
    k,d=SIFT.detectAndCompute(g,None)
    return np.float32([x.pt for x in k]),d

class Portrait:
    def __init__(self,p,group):
        self.path=p; self.name=p.stem; self.group=group; self.sha=sha(p)
        with Image.open(p) as im:self.im=ImageOps.exif_transpose(im).convert('RGBA')
        self.pixelsha=hashlib.sha256(str(self.im.size).encode()+self.im.tobytes()).hexdigest()
        g=gray(self.im)
        self.hashes=[phash(g),phash(g[:,::-1].copy())]
        self.features=[features(g),features(g[:,::-1].copy())]
        head=g[12:177,32:224]
        self.headhashes=[phash(head),phash(head[:,::-1].copy())]
    def thumb(self):
        im=self.im.copy(); im.thumbnail((144,180)); buf=io.BytesIO(); im.save(buf,format='PNG')
        return 'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()

def geom(f1,f2):
    k,d=f1; kk,dd=f2
    if d is None or dd is None or min(len(d),len(dd))<4:return 0,0
    good=[a for pair in BF.knnMatch(d,dd,k=2) if len(pair)==2 for a,b in [pair] if a.distance<.82*b.distance]
    uniq={}
    for m in sorted(good,key=lambda x:x.distance):uniq.setdefault(m.trainIdx,m)
    good=list(uniq.values())
    if len(good)<4:return 0,len(good)
    A=np.float32([k[x.queryIdx] for x in good]); B=np.float32([kk[x.trainIdx] for x in good])
    _,mask=cv2.estimateAffinePartial2D(A,B,method=cv2.RANSAC,ransacReprojThreshold=5,maxIters=1000)
    return int(mask.sum()) if mask is not None else 0,len(good)
def compare(a,b):
    exact=a.sha==b.sha or a.pixelsha==b.pixelsha
    h=min(int(np.count_nonzero(a.hashes[0]!=v)) for v in b.hashes)
    fh=min(int(np.count_nonzero(a.headhashes[0]!=v)) for v in b.headhashes)
    inliers,matches,mirror=max([(*geom(a.features[0],b.features[i]),i) for i in range(2)]+[(*geom(b.features[0],a.features[i]),i) for i in range(2)])
    risk='BLOCK' if exact or inliers>=15 or h<=5 else 'REVIEW' if inliers>=8 or h<=12 or fh<=10 else 'LOW'
    key=':'.join(sorted([a.sha,b.sha]))
    return dict(a=a.name,b=b.name,a_sha256=a.sha,b_sha256=b.sha,key=key,risk=risk,exact=exact,inliers=inliers,matches=matches,hash_distance=h,head_hash_distance=fh,mirrored=bool(mirror))
def rank(r):
    return ({'BLOCK':2,'REVIEW':1,'LOW':0}[r['risk']],r['exact'],r['inliers'],-r['hash_distance'],-r['head_hash_distance'])
def baseline():
    return [Portrait(ORIGINALS/(id+'.png'),'original') for id in IDS]
def files(folder):
    return sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in EXTS) if folder.exists() else []
def screen(originals,prior,new):
    ids=[p.name for p in originals+prior+new]
    if len(set(ids))!=len(ids):raise ValueError('duplicate portrait ID')
    pairs=[compare(a,b) for a in new for b in originals+prior]
    pairs.extend(compare(a,b) for a,b in itertools.combinations(new,2))
    return sorted(pairs,key=rank,reverse=True)
def report(out,originals,prior,new,pairs,unresolved):
    out.mkdir(parents=True,exist_ok=True)
    data=dict(baseline_count=len(originals),approved_count=len(prior),candidate_count=len(new),pair_count=len(pairs),unresolved=len(unresolved),candidate_sha256={p.name:p.sha for p in new},pairs=pairs)
    (out/'report.json').write_text(json.dumps(data,indent=2))
    with (out/'pairs.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(pairs[0]) if pairs else ['a','b','risk']);writer.writeheader();writer.writerows(pairs)
    by={p.name:p for p in originals+prior+new}
    # Every flagged comparison and five nearest non-flagged comparisons per candidate.
    selected={}
    for p in new:
        related=[r for r in pairs if p.name in (r['a'],r['b'])]
        for r in [r for r in related if r['risk']!='LOW']+[r for r in related if r['risk']=='LOW'][:5]:selected[r['key']]=r
    thumbs={p.name:p.thumb() for p in originals+prior+new} if selected else {}
    esc=html.escape
    tiles=[]
    for r in sorted(selected.values(),key=rank,reverse=True):
        faces=''.join(f'<figure><img src="{thumbs[id]}"><figcaption>{esc(id)}</figcaption></figure>' for id in (r['a'],r['b']))
        tiles.append(f'<article class="{r["risk"]}"><div>{faces}</div><b>{r["risk"]}</b> — {r["inliers"]} aligned features, pHash {r["hash_distance"]}, head {r["head_hash_distance"]}</article>')
    (out/'report.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Academy portrait screening</title><style>body{background:#171b22;color:#eee;font:15px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}article{padding:10px;border:1px solid #777}.BLOCK{border-color:#e37669}.REVIEW{border-color:#bd9e59}article div{display:flex;gap:8px}figure{margin:0;flex:1;min-width:0}img{width:100%;height:144px;object-fit:contain;image-rendering:pixelated}</style><h1>Academy portrait screening</h1><p>'+f'{len(originals)} original / {len(prior)} approved / {len(new)} new; {len(pairs)} comparisons; {len(unresolved)} unresolved. LOW is not visual approval.'+'</p><main>'+''.join(tiles)+'</main>')
    print(f'{len(originals)} originals | {len(prior)} prior | {len(new)} candidates | {len(pairs)} pairs | {len(unresolved)} unresolved')
def old_manifest(base):
    if not re.fullmatch('[0-9a-f]{40}',base or '') or set(base)=={'0'}:return None
    if subprocess.run(['git','cat-file','-e',base+'^{commit}'],cwd=ROOT,stderr=subprocess.DEVNULL).returncode:return None
    p=subprocess.run(['git','show',base+':assets/academy/manifest.json'],cwd=ROOT,capture_output=True,text=True)
    if p.returncode:
        # A genuinely new manifest has no approved predecessors.
        return {'portraits':{},'waivers':{}}
    return json.loads(p.stdout)
def gate(base,out):
    manifest=json.loads(MANIFEST.read_text())
    if manifest.get('version')!=1:raise ValueError('unknown manifest version')
    records=manifest['portraits']; waivers=manifest['waivers']
    paths=files(BANK)
    if len(paths)!=len(records) or {p.stem for p in paths}!=set(records):raise ValueError('manifest and portrait directory must match exactly')
    if len(paths)>120:raise ValueError('reserve bank exceeds 120')
    for p in paths:
        id=p.stem
        if not re.fullmatch(r'academy-(00[1-9]|0[1-9][0-9]|1[01][0-9]|120)',id):raise ValueError('invalid registered academy ID '+id)
        r=records[id]
        if r.get('sha256')!=sha(p) or r.get('visual_approved') is not True:raise ValueError('missing visual approval or changed hash: '+id)
        with Image.open(p) as im:
            if im.size!=(144,180) or im.mode!='RGBA' or im.getchannel('A').getextrema()[0]!=0:raise ValueError('expected transparent 144x180 RGBA portrait: '+id)
    old=old_manifest(base)
    prev=old['portraits'] if old is not None else {}
    for id,r in prev.items():
        if records.get(id)!=r:raise ValueError('previously accepted identity removed or altered: '+id)
    # If original art, the auditor, or existing waivers change, rescreen all.
    changed=subprocess.run(['git','diff','--name-only',base,'HEAD'],cwd=ROOT,capture_output=True,text=True) if old is not None else None
    full=old is None or changed.returncode!=0 or any(p.startswith(('assets/portraits/','tools/portrait-audit/')) for p in changed.stdout.splitlines()) or any(waivers.get(k)!=v for k,v in old['waivers'].items())
    originals=baseline()
    prior=[Portrait(p,'approved') for p in paths if not full and p.stem in prev]
    new=[Portrait(p,'candidate') for p in paths if full or p.stem not in prev]
    pairs=screen(originals,prior,new)
    unresolved=[]
    for r in pairs:
        if r['risk']=='LOW':continue
        waiver=waivers.get(r['key'],{})
        # Exact duplicates cannot be waived. A non-exact false positive requires
        # a specific hash-bound reason and explicit visual decision.
        if r['exact'] or waiver.get('visual_distinct') is not True or len(str(waiver.get('reason','')).strip())<20:unresolved.append(r)
    report(out,originals,prior,new,pairs,unresolved)
    return 2 if unresolved else 0

def selftest():
    import tempfile
    original=Portrait(ORIGINALS/'aisha.png','original')
    with tempfile.TemporaryDirectory() as d:
        d=Path(d)
        same=d/'exact.png'; original.im.save(same)
        mirror=d/'mirror.png'; ImageOps.mirror(original.im).save(mirror)
        resize=d/'resize.png'; original.im.resize((288,360),Image.Resampling.NEAREST).save(resize)
        for p in (same,mirror,resize):
            r=compare(original,Portrait(p,'candidate'))
            assert r['risk']=='BLOCK',r
        assert compare(original,Portrait(same,'candidate'))['exact']
    print('PASS exact, mirrored and resized original artwork checks')
def main():
    p=argparse.ArgumentParser(description=__doc__); sub=p.add_subparsers(dest='cmd',required=True)
    sub.add_parser('self-test')
    g=sub.add_parser('gate');g.add_argument('--base',default='');g.add_argument('--out',type=Path,required=True)
    a=sub.add_parser('screen');a.add_argument('--candidates',type=Path,required=True);a.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    if args.cmd=='self-test':selftest();return 0
    if args.cmd=='gate':return gate(args.base,args.out)
    original=baseline();prior=[Portrait(p,'approved') for p in files(BANK)];new=[Portrait(p,'candidate') for p in files(args.candidates)]
    if not new:raise ValueError('no candidate images')
    pairs=screen(original,prior,new); unresolved=[r for r in pairs if r['risk']!='LOW']
    report(args.out,original,prior,new,pairs,unresolved)
    return 2 if any(r['risk']=='BLOCK' for r in unresolved) else 1 if unresolved else 0
if __name__=='__main__':sys.exit(main())
