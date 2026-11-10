"""
Genera musica_fondo.wav: pista instrumental original y suave, hecha solo con
numpy + wave. Acordes sostenidos lentos (pad), sin percusión ni melodía
protagonista.

Progresión (8 s por acorde, fundidos de 3 s entre acordes):
    La m  ->  Fa maj7  ->  Do  ->  Sol/Si   (se repite)

Uso:
    python generar_musica.py            # 130 s
    python generar_musica.py 125        # duración en segundos
"""

import sys
import wave

import numpy as np

SR = 32000                 # Hz, mono 16 bits (archivo liviano)
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 130.0
SALIDA = "musica_fondo.wav"
SEG_ACORDE = 8.0
FUNDIDO = 3.0


def hz(nota):
    """Nombre tipo 'A3' -> frecuencia (La4 = 440 Hz)."""
    nombres = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    semis = nombres[nota[0]] + 12 * (int(nota[-1]) - 4)
    if "#" in nota:
        semis += 1
    return 440.0 * 2 ** (semis / 12)


ACORDES = [
    ["A2", "E3", "A3", "C4", "E4"],    # La menor
    ["F2", "C3", "A3", "E4"],          # Fa maj7
    ["C3", "G3", "C4", "E4"],          # Do mayor
    ["B2", "D3", "G3", "B3"],          # Sol / Si
]


def pad(freqs, n, rng):
    t = np.arange(n) / SR
    y = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):               # leve coro
            fase = rng.uniform(0, 2 * np.pi)
            ff = f + det
            y += np.sin(2 * np.pi * ff * t + fase)
            y += 0.25 * np.sin(2 * np.pi * 2 * ff * t + fase)
            y += 0.08 * np.sin(2 * np.pi * 3 * ff * t + fase)
    y /= len(freqs) * 3
    # respiración lenta de amplitud
    y *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * t + rng.uniform(0, 6.28))
    return y


def envolvente(n):
    """Subida y bajada de coseno elevado de FUNDIDO segundos."""
    e = np.ones(n)
    k = int(FUNDIDO * SR)
    r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k))
    e[:k] = r
    e[-k:] = r[::-1]
    return e


def pasa_bajos(x, corte=1800.0):
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):          # filtro de un polo
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def main():
    rng = np.random.default_rng(27)
    total = int(DUR * SR)
    mezcla = np.zeros(total + int(SEG_ACORDE * SR) * 2)
    paso = int(SEG_ACORDE * SR)
    largo = paso + int(FUNDIDO * SR)
    i, k = 0, 0
    while i < total:
        seg = pad([hz(n) for n in ACORDES[k % len(ACORDES)]], largo, rng)
        mezcla[i:i + largo] += seg * envolvente(largo)
        i += paso
        k += 1
    y = pasa_bajos(mezcla[:total])
    # fundido global de entrada y salida (la mezcla final aplica 2 s / 3 s)
    y *= envolvente(total) if DUR > 2 * FUNDIDO else 1
    y = y / np.max(np.abs(y)) * 0.6          # pico ≈ −4.4 dBFS
    datos = (y * 32767).astype(np.int16)
    with wave.open(SALIDA, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(datos.tobytes())
    print(f"{SALIDA}: {DUR:.1f} s, {SR} Hz mono")


if __name__ == "__main__":
    main()
