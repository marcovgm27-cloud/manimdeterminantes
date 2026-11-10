#!/usr/bin/env bash
# Mezcla posterior al render: voz (audio del render de Manim) + música de fondo.
#  - voz llevada a ≈ −16 LUFS
#  - música ≈ 20 dB por debajo de la voz (≈ −36 LUFS), con atenuación
#    automática mientras se habla (sidechaincompress)
#  - entrada de la música 2 s, salida 3 s
# Uso: bash mezclar.sh [video_render.mp4] [musica.wav|musica.mp3]
set -euo pipefail
VIDEO=${1:-media/videos/video_logaritmica/720p30/EcuacionLogaritmica.mp4}
if [ -f musica.mp3 ]; then MUSICA_DEF=musica.mp3; else MUSICA_DEF=musica_fondo.wav; fi
MUSICA=${2:-$MUSICA_DEF}
SALIDA=video_logaritmica_final.mp4

lufs() { ffmpeg -nostats -i "$1" -map a:0 -af ebur128 -f null - 2>&1 \
         | grep -A1 "Integrated loudness" | tail -1 | awk '{print $2}'; }

D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
LV=$(lufs "$VIDEO"); LM=$(lufs "$MUSICA")
GV=$(python3 -c "print(round(-16-($LV),1))")
GM=$(python3 -c "print(round(-36-($LM),1))")
FO=$(python3 -c "print(round($D-3,2))")
DA=$(ffprobe -v error -select_streams a:0 -show_entries stream=duration -of csv=p=0 "$VIDEO")
if python3 -c "import sys; sys.exit(0 if $DA < $D - 8 else 1)"; then
  echo "ERROR: la pista de voz ($DA s) es mucho más corta que el video ($D s)." >&2; exit 1
fi
echo "duración=$D s  voz hasta $DA s  voz=$LV LUFS (ganancia $GV dB)  música=$LM LUFS (ganancia $GM dB)"

ffmpeg -v error -y -i "$VIDEO" -stream_loop -1 -i "$MUSICA" -filter_complex "
[0:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur=${D},volume=${GV}dB,alimiter=limit=0.95:level=disabled,asplit=2[voz][sc];
[1:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:${D},asetpts=N/SR/TB,volume=${GM}dB,
     afade=t=in:st=0:d=2,afade=t=out:st=${FO}:d=3[mus];
[mus][sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=700[musd];
[voz][musd]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -movflags +faststart "$SALIDA"
echo "Listo: $SALIDA"
