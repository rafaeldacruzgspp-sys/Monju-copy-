#!/usr/bin/env python3
"""Dribble-focused edit: one dribble per bar, zoomed onto the action, cuts on bar lines.
usage: edit2.py SOURCE.mp4 SONG.mp3 OUT.mp4"""
import os, subprocess, sys
import numpy as np, soundfile as sf, librosa

src, song, out = sys.argv[1:4]
START, LEN, DROP = 38.70, 37.6, 13.81       # song window; chorus starts at DROP (relative)
W, H, FPS, SR = 720, 960, 30, 44100
FONT = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
work = "work2"; os.makedirs(work, exist_ok=True)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(" ".join(cmd)); print(r.stderr[-2500:]); sys.exit(1)

y, _ = librosa.load(song, sr=SR, offset=START, duration=LEN)
sf.write(f"{work}/music.wav", y, SR)
_, bt = librosa.beat.beat_track(y=y, sr=SR, units="time")
di = int(np.argmin(abs(bt - DROP)))
bar = lambda n: bt[di + 4 * n] if 0 <= di + 4 * n < len(bt) else None

# (name, bars, src_start, speed, zoom, (cx0,cy0)->(cx1,cy1), style)   centers are fractions of the frame
CLIPS = [
    ("intro", None, 0.0, 0.60, 1.45, (0.38, 0.70), (0.50, 0.58), "intro"),
    ("B", 1, 3.6, 1.00, 1.55, (0.52, 0.66), (0.45, 0.60), "build"),
    ("C", 1, 7.0, 0.85, 1.55, (0.48, 0.47), (0.55, 0.50), "build"),
    ("E", 1, 16.4, 1.00, 1.45, (0.43, 0.30), (0.50, 0.42), "build"),
    ("F", 1, 20.0, 1.00, 1.45, (0.44, 0.25), (0.38, 0.30), "build"),
    ("G", 2, 24.0, 0.60, 1.00, (0.50, 0.50), (0.50, 0.50), "drop"),     # close-up vs Colombia
    ("H", 1, 28.0, 1.00, 1.60, (0.50, 0.50), (0.48, 0.45), "cut"),
    ("I", 1, 32.0, 1.00, 1.45, (0.55, 0.78), (0.36, 0.68), "cut"),
    ("J", 1, 36.5, 1.00, 1.55, (0.48, 0.35), (0.38, 0.42), "cut"),
    ("K", 1, 40.0, 1.00, 1.50, (0.50, 0.38), (0.36, 0.32), "cut"),
    ("L", 1, 44.4, 1.00, 1.60, (0.46, 0.68), (0.52, 0.55), "cut"),
    ("M", 1, 49.6, 1.00, 1.45, (0.42, 0.46), (0.55, 0.36), "cut"),
    ("N", 1, 52.6, 1.00, 1.45, (0.40, 0.38), (0.40, 0.48), "cut"),
    ("O", None, 56.6, 0.60, 1.50, (0.50, 0.36), (0.53, 0.40), "outro"),
]
# timeline: intro until 4 bars before drop, then bar by bar, outro to the end
t, n = [0.0, bar(-4)], -4
for c in CLIPS[1:-1]:
    n += c[1]; t.append(bar(n))
t.append(LEN)
assert len(t) == len(CLIPS) + 1, (len(t), len(CLIPS))

GRADE = ("eq=contrast=1.15:saturation=1.2:gamma=0.95,"
         "colorbalance=rs=-0.03:gs=-0.04:bs=0.07:gm=-0.04:rh=0.05:bh=-0.03,vignette=PI/5")
files = []
for k, (name, _, s0, sp, z, (x0, y0), (x1, y1), style) in enumerate(CLIPS):
    d = t[k + 1] - t[k]; nfr = round(d * FPS)
    cw, ch = int(576 / z) // 2 * 2, int(768 / z) // 2 * 2
    push = 0.06 if style != "drop" else 0.10
    f = "setpts=PTS-STARTPTS"
    if sp < 0.99:
        f += f",minterpolate=fps={round(FPS / sp)}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir"
    f += f",setpts=PTS/{sp:.3f},fps={FPS}"
    f += (f",crop={cw}:{ch}:x='clip(({x0}+({x1}-{x0})*t/{d:.3f})*iw-{cw}/2,0,iw-{cw})'"
          f":y='clip(({y0}+({y1}-{y0})*t/{d:.3f})*ih-{ch}/2,0,ih-{ch})'")
    # smooth push-in over the clip (no shake, no strobe)
    f += (f",scale=w='trunc({W}*(1+{push}*t/{d:.3f})/2)*2':h='trunc({H}*(1+{push}*t/{d:.3f})/2)*2'"
          f":eval=frame:flags=lanczos,crop={W}:{H},setsar=1,{GRADE},unsharp=5:5:0.6")
    if style == "intro": f += ",eq=saturation=0.35:brightness=-0.06,fade=t=in:st=0:d=0.8"
    if style == "drop":  f += ",eq=brightness='0.35*exp(-t*6)':eval=frame"   # single flash on the chorus hit
    if style == "outro": f += f",fade=t=out:st={d - 1.3:.2f}:d=1.3"
    fn = f"{work}/c{k:02d}.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{s0:.3f}", "-t", f"{d * sp + 0.3:.3f}", "-i", src,
         "-vf", f, "-frames:v", str(nfr), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "16",
         "-pix_fmt", "yuv420p", "-r", str(FPS), fn])
    files.append(fn); print(f"{name:5s} {t[k]:6.2f}-{t[k+1]:6.2f}  src {s0:.1f}  x{sp}", flush=True)

open(f"{work}/list.txt", "w").write("".join(f"file '{os.path.abspath(x)}'\n" for x in files))
def txt(s, size, ypos, a, b):
    return (f"drawtext=fontfile={FONT}:text='{s}':fontsize={size}:fontcolor=white:borderw=3:bordercolor=black@0.6:"
            f"x=(w-text_w)/2:y={ypos}:alpha='min(1\\,(t-{a})*4)*min(1\\,({b}-t)*4)':enable='between(t,{a},{b})'")
title = ",".join([txt("NEYMAR JR", 104, "h*0.40", 0.4, t[1] - 0.05),
                  txt("O  M A G O  D O  D R I B L E", 30, "h*0.40+120", 1.0, t[1] - 0.05),
                  txt("OUSADIA  &  ALEGRIA", 52, "h*0.44", t[-2] + 0.3, LEN - 0.3)])
run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{work}/list.txt", "-i", f"{work}/music.wav",
     "-filter_complex", f"[0:v]{title},format=yuv420p[v];[1:a]afade=t=out:st={LEN - 1.5:.2f}:d=1.5[a]",
     "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
     "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out])
print("done ->", out)
