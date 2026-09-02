#!/usr/bin/env python3
"""플레이스홀더 효과음을 합성해 audio/sfx/ 에 넣는다.

아트와 같은 방식이다. 진짜 음원이 생기면 **같은 파일 이름으로 덮어쓰면** 그대로 돌아간다.
소리가 없으면 "언제 어떤 소리가 나야 하는가" 라는 배선을 검증할 수 없어서,
빈 채로 두느니 임시 소리라도 넣는다.

  python3 tools/gen_sfx.py
"""
from __future__ import annotations
import math, struct, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "sfx"
RATE = 44100


def env(n: int, attack: float, decay: float, power: float = 1.0) -> np.ndarray:
    """어택-디케이 포락선. 타격음은 어택이 짧을수록 또렷하다."""
    a = max(1, int(attack * RATE))
    d = max(1, n - a)
    return np.concatenate([
        np.linspace(0.0, 1.0, a),
        np.linspace(1.0, 0.0, d) ** power,
    ])[:n]


def tone(freq, dur, kind="sine", sweep=1.0):
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    # sweep 은 끝 주파수 배수. 1보다 작으면 떨어지고 크면 올라간다.
    f = np.geomspace(freq, freq * sweep, n) if sweep != 1.0 else np.full(n, float(freq))
    phase = np.cumsum(2.0 * np.pi * f / RATE)
    if kind == "sine":
        return np.sin(phase)
    if kind == "square":
        return np.sign(np.sin(phase))
    if kind == "saw":
        return 2.0 * (phase / (2.0 * np.pi) % 1.0) - 1.0
    if kind == "tri":
        return 2.0 * np.abs(2.0 * (phase / (2.0 * np.pi) % 1.0) - 1.0) - 1.0
    raise ValueError(kind)


def noise(dur: float, rng: np.random.Generator) -> np.ndarray:
    return rng.uniform(-1.0, 1.0, int(dur * RATE))


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """한 극 저역통과. 화이트 노이즈의 쉭 소리를 둔탁한 퍽 소리로 바꾼다."""
    a = math.exp(-2.0 * math.pi * cutoff / RATE)
    out = np.empty_like(x)
    prev = 0.0
    for i, v in enumerate(x):
        prev = (1.0 - a) * v + a * prev
        out[i] = prev
    return out


def save(name: str, data: np.ndarray, peak: float = 0.7) -> None:
    data = np.asarray(data, dtype=np.float64)
    m = float(np.max(np.abs(data))) or 1.0
    data = data / m * peak
    # 앞뒤 2ms 페이드. 안 하면 재생 시작/끝에 딸깍 소리가 난다.
    fade = int(0.002 * RATE)
    if len(data) > 2 * fade:
        data[:fade] *= np.linspace(0.0, 1.0, fade)
        data[-fade:] *= np.linspace(1.0, 0.0, fade)
    pcm = np.clip(data * 32767.0, -32768, 32767).astype("<i2")
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    print("  %-14s %5.0fms" % (name + ".wav", len(data) / RATE * 1000))


def build() -> None:
    rng = np.random.default_rng(20260902)
    print("효과음 합성 →", OUT)

    # --- 전투 ---
    # 적 피격: 짧은 퍽. 초당 수십 번 나므로 최대한 짧고 낮게.
    n = int(0.07 * RATE)
    save("hit", (lowpass(noise(0.07, rng), 1800) * 0.8
                 + tone(180, 0.07, "tri", 0.5) * 0.4) * env(n, 0.001, 0.069, 2.2))

    # 크리티컬: 금속성 한 방. 피격보다 높고 또렷하다.
    n = int(0.12 * RATE)
    save("crit", (tone(880, 0.12, "square", 0.55) * 0.5
                  + lowpass(noise(0.12, rng), 5000) * 0.5) * env(n, 0.001, 0.119, 2.0))

    # 적 사망: 아래로 떨어지는 짧은 소리
    n = int(0.14 * RATE)
    save("kill", tone(420, 0.14, "tri", 0.35) * env(n, 0.002, 0.138, 1.6))

    # 플레이어 피격: 낮고 둔탁. 적 소리와 확실히 달라야 한다.
    n = int(0.22 * RATE)
    save("player_hurt", (tone(150, 0.22, "saw", 0.55) * 0.7
                         + lowpass(noise(0.22, rng), 900) * 0.5) * env(n, 0.003, 0.217, 1.4))

    # --- 획득/성장 ---
    # 짬 획득: 위로 올라가는 짧은 블립
    n = int(0.09 * RATE)
    save("pickup", tone(660, 0.09, "sine", 1.5) * env(n, 0.002, 0.088, 1.2), peak=0.5)

    # 회복
    n = int(0.3 * RATE)
    save("heal", (tone(523, 0.3, "sine", 1.26) * 0.6
                  + tone(784, 0.3, "sine", 1.26) * 0.4) * env(n, 0.02, 0.28, 1.0))

    # 진급: 나팔 느낌의 3음
    parts = []
    for f in (392, 523, 659):
        n = int(0.13 * RATE)
        parts.append(tone(f, 0.13, "saw") * env(n, 0.004, 0.126, 1.1))
    save("level_up", np.concatenate(parts))

    # 진화: 위로 쓸어 올리는 소리 + 착지
    n = int(0.5 * RATE)
    sweep = tone(220, 0.35, "saw", 4.0) * env(int(0.35 * RATE), 0.01, 0.34, 0.8)
    land = tone(880, 0.15, "square", 1.0) * env(int(0.15 * RATE), 0.002, 0.148, 1.8)
    save("evolve", np.concatenate([sweep, land]))

    # 보물상자
    n = int(0.25 * RATE)
    save("chest", (tone(587, 0.25, "tri", 1.34) * 0.6
                   + tone(880, 0.25, "sine", 1.34) * 0.4) * env(n, 0.005, 0.245, 1.0))

    # --- 보스 ---
    # 등장: 낮게 깔리는 경고음
    n = int(1.1 * RATE)
    save("boss_spawn", (tone(98, 1.1, "saw", 1.06) * 0.7
                        + tone(147, 1.1, "saw", 1.06) * 0.3) * env(n, 0.25, 0.85, 0.7))

    # 사망: 무너지는 소리
    n = int(0.9 * RATE)
    save("boss_die", (tone(330, 0.9, "saw", 0.2) * 0.6
                      + lowpass(noise(0.9, rng), 1200) * 0.6) * env(n, 0.01, 0.89, 1.3))

    # --- UI / 판 흐름 ---
    n = int(0.06 * RATE)
    save("ui_click", tone(1200, 0.06, "square", 0.9) * env(n, 0.001, 0.059, 2.5), peak=0.35)

    n = int(0.08 * RATE)
    save("ui_move", tone(700, 0.08, "sine", 1.1) * env(n, 0.002, 0.078, 2.0), peak=0.3)

    # 전역: 올라가는 팡파레
    parts = []
    for f, d in ((523, 0.16), (659, 0.16), (784, 0.16), (1047, 0.45)):
        n = int(d * RATE)
        parts.append(tone(f, d, "saw") * env(n, 0.006, d - 0.006, 0.9))
    save("victory", np.concatenate(parts))

    # 전역 연기: 내려가는 두 음
    parts = []
    for f, d in ((392, 0.28), (262, 0.6)):
        n = int(d * RATE)
        parts.append(tone(f, d, "tri") * env(n, 0.01, d - 0.01, 0.9))
    save("defeat", np.concatenate(parts))


if __name__ == "__main__":
    build()
