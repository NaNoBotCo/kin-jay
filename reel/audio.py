#!/usr/bin/env python3
"""audio.py — the reel's soundtrack, synthesised: a lion-dance drum, cymbals and gong on a 120 bpm
grid, with stamps, a buzzer for the garlic, pops for the map flags, firecrackers and star pings
landing on the same times stage.html cuts on. Writes out/kin-jay.wav (48 kHz stereo).

Run:  python3 audio.py
"""
import os
import wave

import numpy as np

SR, LEN = 48000, 45.0
N = int(SR * LEN)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(9)


def put(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - max(0, pan))
    R[i:i + len(sig)] += sig * (1 + min(0, pan))


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * d)


def lp(x, k):                                   # a moving-average low-pass
    return np.convolve(x, np.ones(k) / k, mode="same")


def drum(big=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t * 18) * big
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (7 / big))
    click = lp(rng.standard_normal(n), 6) * np.exp(-t * 60) * 0.5
    return (body + click) * 0.9


def cha(dur=0.3):
    n = int(dur * SR); x = rng.standard_normal(n)
    x = x - lp(x, 3)                            # keep the hiss
    return x * env(n, 0.002, 9 / dur) * 0.35


def gong(f0=98, dur=3.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f0 * r * (1 - 0.01 * t) * t) for r, a in ((1, 1), (1.47, .6), (2.09, .45), (2.56, .3), (3.2, .2), (4.1, .12)))
    return s * env(n, 0.02, 1.4) * 0.35


def ding(f=1320, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t)) * env(n, 0.002, 9) * 0.3


def pop(f0=420, f1=980, dur=0.09):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 30) * 0.5


def buzz(dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 98 * t)) + np.sign(np.sin(2 * np.pi * 104 * t))
    return lp(x, 8) * np.minimum(1, (dur - t) * 20) * 0.22


def slide(dur=0.5):                             # a slide whistle up, for "red pork?!"
    n = int(dur * SR); t = np.arange(n) / SR
    f = 500 * 2 ** (t / dur * 1.6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.02, 2) * 0.25


def whoosh(dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 12)
    return x * np.sin(np.pi * t / dur) ** 2 * 0.6


def pluck(f, dur=0.6):                          # Karplus-Strong, a plucked zither string
    n = int(dur * SR); p = int(SR / f)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * 0.35


def crackle(t0, t1, rate=90):
    t = t0
    while t < t1:
        n = int(rng.uniform(0.003, 0.012) * SR)
        b = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 400)
        put(b, t, rng.uniform(0.25, 0.7), rng.uniform(-0.7, 0.7))
        t += rng.exponential(1 / rate)


def snap():                                     # one firecracker
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (rng.standard_normal(n) * np.exp(-t * 70) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 40)) * 0.6


def boom(dur=1.2):                              # a firework going off: thump, then the stars crackling out
    n = int(dur * SR); t = np.arange(n) / SR
    f = 40 + 60 * np.exp(-t * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) + lp(rng.standard_normal(n), 20) * np.exp(-t * 9) * 0.8) * 0.8


def sizzle(dur=0.4):
    n = int(dur * SR); x = rng.standard_normal(n); x = x - lp(x, 4)
    return x * env(n, 0.01, 6 / dur) * 0.18


def popper():                                   # a party popper for the confetti
    x = np.concatenate([np.zeros(int(0.02 * SR)), sizzle(0.5)])[: int(0.5 * SR)]
    b = snap(); x[: len(b)] += b * 0.8
    return x


def sparkle(t0, dur=1.0, gain=0.35):            # the tail of a burst
    t = t0
    while t < t0 + dur:
        put(ding(rng.uniform(2400, 4200), 0.12) * 0.5, t, gain * (1 - (t - t0) / dur), rng.uniform(-0.8, 0.8))
        t += rng.exponential(0.035)


# ---------------- the drum pattern (eighths at 120 bpm = 0.25 s) ----------------
PAT_D = [1, 0, 1, 1, 0, 1, 1, 0]
PAT_C = [0, 1, 0, 0, 1, 0, 0, 1]


def groove(t0, t1, gain=1.0, cym=True):
    k = 0; t = t0
    while t < t1 - 1e-6:
        s = k % 8
        if PAT_D[s]:
            put(drum(1.0 if s == 0 else 0.7), t, gain * (1.0 if s == 0 else 0.7))
        if cym and PAT_C[s]:
            put(cha(0.22), t, gain * 0.8, 0.35 if k % 2 else -0.35)
        k += 1; t += 0.25


def roll(t0, t1, g0=0.3, g1=1.0):
    t = t0
    while t < t1:
        u = (t - t0) / (t1 - t0); put(drum(0.6), t, g0 + (g1 - g0) * u); t += 0.0625


# 0–3.5: hook
put(drum(1.8), 0.0, 1.2); put(cha(0.9), 0.0, 0.9)
put(drum(1.0), 0.55, 0.9); put(ding(1568, 0.5), 0.55, 0.8)
roll(0.75, 1.15, 0.3, 0.9)
put(whoosh(0.3), 1.05, 0.9)
for t in (1.2, 1.4):
    put(drum(1.2), t, 1.0); put(cha(0.25), t, 0.5)
put(buzz(0.45), 1.5, 1.4); put(drum(2.0), 1.5, 1.2)
put(drum(1.6), 2.0, 1.2); put(cha(1.2), 2.0, 1.0); put(gong(98, 2.5), 2.0, 0.8)
groove(2.5, 3.5, 0.8)
put(whoosh(), 3.3, 0.7)
# 3.5–8: the flag
groove(3.5, 8.0, 0.6)
for t in (4.2, 5.6):
    put(drum(1.8), t, 1.3); put(cha(0.9), t, 0.9)
put(ding(990), 6.4, 1.0); put(ding(1320), 7.0, 1.0)
put(whoosh(), 7.8, 0.7)
# 8–15.5: the wok
groove(8.0, 11.5, 0.5)
for i, t in enumerate((8.5, 9.0, 9.5)):
    put(ding(1047 * 2 ** (i * 4 / 12)), t + 0.1, 1.0)
put(slide(), 10.0, 1.0); put(ding(1568), 10.45, 0.9)
put(buzz(0.6), 11.5, 1.4); put(drum(2.0), 11.5, 1.2); put(cha(1.4), 11.5, 0.9)
for t in (12.5, 13.0, 13.5):
    put(buzz(0.18), t + 0.05, 1.0); put(drum(1.2), t, 0.9)
put(gong(110, 2.0), 14.0, 0.7)
groove(14.0, 15.5, 0.6)
# 15.5–21.5: the menu, with a zither tune
groove(15.5, 21.5, 0.55)
for t in (15.5, 16.8, 18.1, 19.4):
    put(whoosh(0.3), t - 0.15, 0.8)
TUNE = [(392, 0), (440, .25), (523, .5), (587, 1.0), (523, 1.25), (440, 1.5), (392, 2.0), (330, 2.5)]
for rep in (15.5, 18.5):
    for f, dt in TUNE:
        put(pluck(f), rep + dt, 0.8, 0.2)
for i, t in enumerate((19.4, 19.8, 20.2)):
    put(pop(400 + i * 120, 900 + i * 160), t, 1.0)
# 21.5–31: festival
put(whoosh(), 21.35, 0.8)
groove(21.5, 26.5, 0.7)
for i in range(9):
    put(pop(330 * 2 ** (i / 12 * 2), 800 * 2 ** (i / 12 * 2)), 21.8 + i * 0.5, 1.0, -0.4 + i * 0.1)
crackle(27.5, 28.6, 160)
for k in range(10):
    put(snap(), 27.5 + k * 0.1, 0.9, rng.uniform(-0.7, 0.7))
put(boom(), 28.55, 0.9); sparkle(28.7, 0.9)
groove(26.5, 29.5, 0.6, cym=False)
for t in (26.5, 27.5, 28.5):
    put(cha(0.6), t, 0.8)
roll(29.5, 30.0, 0.5, 1.0)
groove(30.0, 31.0, 1.0)
put(cha(1.0), 29.5, 0.9)
# 31–37: the legend, quiet
put(gong(73, 3.5), 31.0, 0.55)
PENTA = [523, 587, 659, 784, 880, 1047, 1175]
for i in range(7):
    put(ding(PENTA[i] * 1.5, 0.7), 31.4 + i * 0.25, 0.8, -0.5 + i * 0.16)
put(gong(98, 3.0), 33.5, 1.0); put(cha(2.0), 33.5, 0.35)
put(ding(1568, 1.2), 34.3, 0.8)
groove(35.0, 37.0, 0.45)
put(whoosh(), 36.85, 0.7)
# 37–41.5: Chiang Mai
groove(37.0, 41.5, 0.65)
for i in range(30):
    put(pop(600 + (i % 7) * 60, 1200 + (i % 5) * 80, 0.05), 37.3 + i * 0.07, 0.35, rng.uniform(-0.6, 0.6))
# 41.5–45: the end
put(gong(98, 3.5), 41.5, 1.0); put(drum(1.8), 41.5, 1.2); put(cha(1.4), 41.5, 0.9)
groove(42.0, 44.0, 0.85)
roll(44.0, 44.5, 0.5, 1.1)
put(drum(2.0), 44.5, 1.4); put(cha(0.5), 44.5, 1.0)

# sparks, confetti and fireworks, on the times stage.html bursts them
crackle(0.0, 0.5, 140)
for t, p in ((0.0, -0.6), (0.1, 0.6), (0.24, -0.4), (0.38, 0.4)):
    put(snap(), t, 1.0, p)
put(boom(), 0.55, 0.7); sparkle(0.65, 0.6, 0.3)
put(boom(), 2.0, 0.6); sparkle(2.1, 0.9)
for t in (1.2, 4.2, 5.6, 29.5, 44.5):
    put(popper(), t, 0.9)
for i, t in enumerate((8.5, 9.0, 9.5, 10.0, 11.5, 12.5, 13.0, 13.5)):
    put(sizzle(0.5), t + 0.55, 0.9, -0.3 + 0.08 * i)
for t in (19.4, 19.8, 20.2):
    put(popper(), t, 0.5)
put(boom(1.4), 33.5, 0.5); sparkle(33.6, 1.2, 0.3)
for i, t in enumerate((41.55, 42.2, 42.7, 43.2, 43.7, 44.15)):
    put(boom(), t, 0.85, (-0.5, 0.5, -0.3, 0.3, 0.0, -0.4)[i]); sparkle(t + 0.15, 1.0, 0.3)

# ---------------- out ----------------
fade = np.ones(N); fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR))
mix = np.stack([L * fade, R * fade], 1)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) * 0.89
os.makedirs("out", exist_ok=True)
with wave.open("out/kin-jay.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote out/kin-jay.wav", LEN, "s")
