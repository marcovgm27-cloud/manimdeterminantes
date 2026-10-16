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

---

# Video 2: desarrollo por cofactores

Continúa la sección 4 del primer video (`ad − bc`) y explica paso a paso cómo
calcular un determinante por cofactores (~4 min).

Video final: [`determinante_cofactores.mp4`](determinante_cofactores.mp4) — código: [`cofactores.py`](cofactores.py)

1. **Repaso de la sección 4** – `|a b; c d| = ad − bc` y la pregunta del caso 3×3.
2. **Menores** – `Mᵢⱼ`: tachar la fila i y la columna j (ejemplos M₁₁, M₁₂, M₂₃).
3. **Cofactores** – `Cᵢⱼ = (−1)^(i+j) Mᵢⱼ` y el tablero de signos `+ − +`.
4. **Desarrollo general** – `det(A) = a₁₁C₁₁ + a₁₂C₁₂ + a₁₃C₁₃`, válido por cualquier fila o columna.
5. **Ejemplo por la fila 1** – `A = [[2,1,3],[0,4,−1],[5,−2,1]]`, det(A) = −61.
6. **Mismo ejemplo por la columna 1** – el cero ahorra un cálculo; mismo resultado.
7. **Resumen** – los cuatro pasos del método.

```bash
manim -qh cofactores.py -a
for f in RepasoSeccion4 Menores SignosCofactores DesarrolloGeneral \
         EjemploFila EjemploColumna ResumenCofactores; do
  echo "file 'media/videos/cofactores/1080p60/$f.mp4'"
done > lista.txt
ffmpeg -f concat -safe 0 -i lista.txt -c copy determinante_cofactores.mp4
```
