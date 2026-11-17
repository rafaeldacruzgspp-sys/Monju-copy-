#!/usr/bin/env python3
"""Beat-synced football edit.
usage: edit.py SOURCE.mp4 OUT.mp4 [--music song.mp3] [--start SECONDS] [--len SECONDS]
Without --music, an original epic beat is synthesized (royalty-free)."""
import argparse, os, subprocess, sys, json
import numpy as np
import soundfile as sf

W, H, FPS = 720, 960, 30
FONT = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
SR = 44100

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--music"); ap.add_argument("--start", type=float, default=0.0)
ap.add_argument("--len", type=float, default=36.0)
ap.add_argument("--work", default="work")
ap.add_argument("--intro", type=float, default=None)
ap.add_argument("--drop", type=float, default=None)
ap.add_argument("--outro", type=float, default=None)
a = ap.parse_args()
os.makedirs(a.work, exist_ok=True)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(" ".join(cmd)); print(r.stderr[-3000:]); sys.exit(1)

# ---------------------------------------------------------------- music
def synth(path):
    bpm = 105; b = 60 / bpm; bars = 16; n = int(bars * 4 * b * SR) + SR * 3
    y = np.zeros(n); t = lambda d: np.arange(int(d * SR)) / SR
    def add(sig, at, g=1.0):
        i = int(at * SR); j = min(n, i + len(sig)); y[i:j] += g * sig[:j - i]
    def kick():
        tt = t(0.5); f = 45 + 110 * np.exp(-tt * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    def snare():
        tt = t(0.35); nz = np.random.randn(len(tt))
        return (0.7 * nz * np.exp(-tt * 14) + 0.5 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 20))
    def hat():
        tt = t(0.05); nz = np.diff(np.random.randn(len(tt) + 1)); return nz * np.exp(-tt * 90)
    def b808(freq, d):
        tt = t(d); return np.tanh(2.5 * np.sin(2 * np.pi * freq * tt)) * np.exp(-tt * 1.6)
    def boom():
        tt = t(2.5); f = 30 + 80 * np.exp(-tt * 4)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.random.randn(len(tt)) * np.exp(-tt * 6)) * np.exp(-tt * 1.4)
    def riser(d):
        tt = t(d); nz = np.random.randn(len(tt)); k = np.linspace(1, 60, len(tt)).astype(int)
        lp = np.convolve(nz, np.ones(8) / 8, "same")
        return (lp * 0.5 + 0.3 * np.sin(2 * np.pi * (200 + 900 * (tt / d) ** 2) * tt)) * (tt / d) ** 2
    def pad(freqs, d):
        tt = t(d); s = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt) for f in freqs)
        env = np.minimum(1, tt / 0.6) * np.minimum(1, (d - tt) / 0.8); return s * env / len(freqs)
    chords = [[110, 130.8, 164.8], [87.3, 110, 130.8], [130.8, 164.8, 196], [98, 123.5, 146.8]]  # Am F C G
    roots = [55, 43.65, 65.4, 49]
    for bar in range(bars):
        t0 = bar * 4 * b; ch = chords[bar % 4]
        add(pad(ch, 4 * b), t0, 0.22 if bar < 14 else 0.3)
        if bar < 2:
            continue
        if bar < 6:   # build
            for k in range(4): add(kick(), t0 + k * b, 0.7)
            if bar >= 4: add(snare(), t0 + b, 0.4); add(snare(), t0 + 3 * b, 0.4)
            if bar == 5:
                for k in range(16): add(snare(), t0 + k * b / 4, 0.15 + 0.4 * k / 16)
        elif bar < 14:  # drop
            add(kick(), t0, 1); add(kick(), t0 + 1.5 * b, 0.9); add(kick(), t0 + 2.75 * b, 0.8)
            add(snare(), t0 + b, 0.8); add(snare(), t0 + 3 * b, 0.8)
            add(b808(roots[bar % 4], 4 * b), t0, 0.45)
            for k in range(8): add(hat(), t0 + k * b / 2, 0.25)
            if bar % 2: add(hat(), t0 + 3.75 * b, 0.25); add(hat(), t0 + 3.875 * b, 0.25)
        else:  # outro
            if bar == 14: add(boom(), t0, 0.9)
    add(riser(4 * 4 * b - 0.05), 2 * 4 * b, 0.35)   # riser over the build
    add(boom(), 6 * 4 * b, 1.0)                      # impact at the drop
    y = np.tanh(y * 0.9) * 0.9
    st = np.stack([y, np.roll(y, 40)], 1)  # tiny stereo width
    sf.write(path, st, SR)
    beats = [i * b for i in range(bars * 4)]
    energy = [0] * 8 + [1] * 16 + [2] * 32 + [3] * 8
    return beats, energy, bars * 4 * b + 2.0

def analyse(path, start, length):
    import librosa
    y, sr = librosa.load(path, sr=SR, offset=start, duration=length)
    sf.write(os.path.join(a.work, "music.wav"), y, sr)
    _, bt = librosa.beat.beat_track(y=y, sr=sr, units="time")
    rms = librosa.feature.rms(y=y)[0]; rt = librosa.times_like(rms, sr=sr)
    e = np.array([rms[(rt >= bt[i]) & (rt < (bt[i + 1] if i + 1 < len(bt) else rt[-1]))].mean() for i in range(len(bt))])
    q = np.quantile(e, [0.35, 0.7])
    energy = [0 if v < q[0] else (1 if v < q[1] else 2) for v in e]
    energy[-4:] = [3] * min(4, len(energy))
    if a.drop is not None:  # explicit song structure (seconds relative to --start)
        energy = [0 if b < a.intro else 1 if b < a.drop - 0.05 else 2 if b < a.outro - 0.05 else 3 for b in bt]
    return list(bt), energy, len(y) / sr

music = os.path.join(a.work, "music.wav")
if a.music: beats, energy, dur = analyse(a.music, a.start, a.len)
else: beats, energy, dur = synth(music)
print(f"{len(beats)} beats, dur {dur:.1f}s")

# ---------------------------------------------------------------- plan
srcdur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.src]))
segs = []  # (t_out, d_out, effect-kind, speed)
i = 0
if beats[0] > 0.05: segs.append((0, beats[0], "plain", 1.0))
while i < len(beats) - 1:
    lvl = energy[i]
    step = {0: 4, 1: 2, 2: 1, 3: 8}[lvl]
    if lvl == 2 and (i // 8) % 2 == 1 and i % 8 == 4: step = 4  # slow-mo moment every other bar-pair
    j = min(i + step, len(beats) - 1)
    d = beats[j] - beats[i]
    if lvl == 2: kind, sp = ("slowmo", 0.45) if step == 4 else ("punch", 1.0)
    elif lvl == 1: kind, sp = "build", 1.0
    elif lvl == 3: kind, sp = "outro", 0.5
    else: kind, sp = "intro", 0.8
    segs.append((beats[i], d, kind, sp)); i = j
segs.append((beats[-1], dur - beats[-1], "outro", 0.5))
need = sum(d * sp for _, d, _, sp in segs)
gap = max(0.0, (srcdur - 0.5 - need) / max(1, len(segs) - 1))
ptr, plan = 0.2, []
for t0, d, kind, sp in segs:
    plan.append(dict(t=t0, d=d, kind=kind, sp=sp, src=ptr)); ptr += d * sp + gap
json.dump(plan, open(os.path.join(a.work, "plan.json"), "w"), indent=1)

# ---------------------------------------------------------------- render segments
GRADE = ("eq=contrast=1.2:saturation=1.2:gamma=0.93,"
         "colorbalance=rs=-0.03:gs=-0.04:bs=0.08:rm=0.02:gm=-0.05:bm=0.03:rh=0.06:bh=-0.03,"
         "unsharp=5:5:0.8,vignette=PI/5")
files = []
for k, p in enumerate(plan):
    nfr = max(1, round(p["d"] * FPS)); srclen = p["d"] * p["sp"] + 0.1
    base = f"[0:v]setpts=PTS-STARTPTS"
    if p["sp"] < 0.99:
        base += f",minterpolate=fps={round(FPS / p['sp'])}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,setpts=PTS/{p['sp']:.3f}"
    base += f",fps={FPS},scale={W}:{H}:flags=lanczos,setsar=1"
    kind = p["kind"]
    if kind == "punch":
        fx = (f",scale=w='trunc({W}*(1+0.22*exp(-t*9))/2)*2':h='trunc({H}*(1+0.22*exp(-t*9))/2)*2':eval=frame,"
              f"crop={W}:{H}:x='(iw-{W})/2+18*sin(t*90)*exp(-t*10)':y='(ih-{H})/2+14*cos(t*70)*exp(-t*10)',"
              f"{GRADE},eq=brightness='0.55*exp(-t*14)':eval=frame")
        if k % 2: fx += f",rgbashift=rh=-6:bh=6"
    elif kind == "slowmo":
        fx = (f",scale=w='trunc({W}*(1.05+0.12*t/{p['d']:.3f})/2)*2':h='trunc({H}*(1.05+0.12*t/{p['d']:.3f})/2)*2':eval=frame,"
              f"crop={W}:{H},{GRADE},eq=contrast=1.08:saturation=1.15:brightness='0.4*exp(-t*12)':eval=frame")
    elif kind == "build":
        fx = (f",scale=w='trunc({W}*(1.0+0.08*t/{p['d']:.3f})/2)*2':h='trunc({H}*(1.0+0.08*t/{p['d']:.3f})/2)*2':eval=frame,"
              f"crop={W}:{H},{GRADE},eq=brightness='0.3*exp(-t*12)':eval=frame")
    elif kind == "intro":
        fx = f",{GRADE},eq=saturation=0.25:brightness=-0.08,fade=t=in:st=0:d=0.8" if k == 0 else f",{GRADE},eq=saturation=0.25:brightness=-0.08"
    else:  # outro
        fx = f",{GRADE},eq=saturation=0.6,fade=t=out:st={max(0, p['d'] - 1.2):.2f}:d=1.2"
    f = os.path.join(a.work, f"s{k:03d}.mp4")
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{p['src']:.3f}", "-t", f"{srclen:.3f}", "-i", a.src,
         "-filter_complex", base + fx, "-frames:v", str(nfr), "-an", "-c:v", "libx264", "-preset", "fast",
         "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS), f])
    files.append(f); print(f"seg {k:02d} {kind:6s} t={p['t']:.2f} d={p['d']:.2f} src={p['src']:.2f}", flush=True)

lst = os.path.join(a.work, "list.txt")
open(lst, "w").write("".join(f"file '{os.path.abspath(f)}'\n" for f in files))

# ---------------------------------------------------------------- titles + mux
drop_t = next((p["t"] for p in plan if p["kind"] in ("punch", "slowmo")), 4.0)
intro_end = next((p["t"] for p in plan if p["kind"] != "intro" and p["t"] > 0), 4.0)
outro_t = next((p["t"] for p in plan if p["kind"] == "outro"), dur - 3)
def txt(s, size, y, t0, t1, extra=""):
    return (f"drawtext=fontfile={FONT}:text='{s}':fontsize={size}:fontcolor=white:borderw=3:bordercolor=black@0.6:"
            f"x=(w-text_w)/2:y={y}:alpha='min(1\\,(t-{t0})*5)*min(1\\,({t1}-t)*4)':enable='between(t,{t0},{t1})'{extra}")
title = ",".join([
    txt("NEYMAR JR", 104, "h*0.40", 0.4, intro_end - 0.05),
    txt("O  M A G O  D O  D R I B L E", 30, "h*0.40+120", 1.0, intro_end - 0.05),
    txt("10", 260, "(h-text_h)/2", drop_t, drop_t + 0.45),
    txt("OUSADIA  &  ALEGRIA", 52, "h*0.44", outro_t + 0.3, dur - 0.3),
])
run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", music,
     "-filter_complex", f"[0:v]{title},format=yuv420p[v];[1:a]afade=t=out:st={dur - 1.5:.2f}:d=1.5[a]",
     "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
     "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.out])
print("done ->", a.out)
