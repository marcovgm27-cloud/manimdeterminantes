# Determinantes con Manim

Video introductorio (~2:20 min, en español) sobre el concepto inicial del
determinante de una matriz 2×2, hecho con [Manim Community](https://www.manim.community/).

Video final: [`determinante_concepto_inicial.mp4`](determinante_concepto_inicial.mp4)

## Contenido

1. **Introducción** – a cada matriz cuadrada se le asocia un número, `det(A)`, y sus notaciones.
2. **Transformación** – una matriz transforma el plano; sus columnas son las imágenes de î y ĵ.
3. **Área** – el cuadrado unitario se convierte en un paralelogramo de área 5 = det(A).
4. **Deducción de la fórmula** – rectángulo menos triángulos y rectángulos: `ad − bc`.
5. **Ejemplo numérico** – diagonal principal menos diagonal secundaria.
6. **Determinante negativo** – el plano cambia de orientación.
7. **Determinante cero** – el plano colapsa a una recta y la matriz no es invertible.
8. **Resumen**.

## Cómo renderizar

Requiere Manim (`pip install manim`), LaTeX y ffmpeg.

```bash
# Todas las escenas en alta calidad
manim -qh determinante.py -a

# Una sola escena en vista previa rápida
manim -pql determinante.py AreaGeometrica
```

Para unir las escenas en un solo video:

```bash
for f in Introduccion Transformacion AreaGeometrica DeduccionFormula \
         EjemploNumerico DeterminanteNegativo DeterminanteCero Resumen; do
  echo "file 'media/videos/determinante/1080p60/$f.mp4'"
done > lista.txt
ffmpeg -f concat -safe 0 -i lista.txt -c copy determinante_concepto_inicial.mp4
```
