# Storyboard · Ecuación logarítmica log₂(x) + log₂(x − 2) = 3

Video: `video_logaritmica_final.mp4` (1280×720, 30 fps, 117,7 s). Escena Manim: `EcuacionLogaritmica` en `video_logaritmica.py`, con 6 bloques.
Los tiempos de la columna «Narración» son los segundos de inicio de cada bloque de voz, tomados de `voz_log.json`.

Colores fijos: **P1 celeste** `#4FC3F7` · **P2 naranja** `#FFB74D` · **P3 morado** `#CE93D8` · álgebra gris `#B0BEC5` · C_OK verde `#66BB6A` · C_ALERTA rojo `#EF5350`.

| Escena | Estado de pantalla | Qué se mueve o aparece | Narración | Valor de control | Justificación |
|---|---|---|---|---|---|
| 1 · Portada | Fondo azul oscuro vacío | Se escribe «Ecuaciones logarítmicas» y aparece «MATEM-UNA · Precálculo» | 0,00 s · «Resolvamos una ecuación logarítmica.» | — | Presenta el tema antes de mostrar la ecuación |
| 1 · Planteamiento | Título arriba | Se escribe `log₂(x) + log₂(x − 2) = 3` | 2,50 s · «Logaritmo en base dos de equis, más logaritmo en base dos de equis menos dos, igual a tres.» | Ecuación de referencia | La voz lee la ecuación con palabras mientras aparece |
| 1 · Pregunta | Título + ecuación | Aparece en celeste «¿Para qué valores de x tiene sentido esta ecuación?» | 8,23 s · «Piense: ¿para qué valores de equis tiene sentido esta ecuación?» + **2,6 s de silencio** | — | Pregunta de dominio. La pausa da tiempo para pensar |
| 2 · Repaso | Pantalla limpia | Título «Repaso de propiedades» y «base b > 0, b ≠ 1» | 14,80 s · «Primero, repasemos tres propiedades.» | b > 0, b ≠ 1 | El título aparece al mismo tiempo que se anuncia el repaso |
| 2 · P1 | Título | Etiqueta celeste «P1 · Existencia» y «log_b(M) existe solo si M > 0» | 17,33 s · «Propiedad uno, existencia: el logaritmo de eme existe solo si eme es positivo.» | M > 0 | Primero la regla general |
| 2 · P1 gráfica | P1 a la izquierda | Ejes, franja rojiza en x ≤ 0 y luego la curva amarilla y = log₂x | 22,60 s · «Su gráfica en base dos vive solo a la derecha del cero.» | La curva existe solo para x > 0 | Muestra P1 con la gráfica, como se pidió |
| 2 · P1 ejemplo | Gráfica completa | ✗ roja en x = −2 y «Ejemplo: log₂(−2) no existe» | 25,90 s · «Por eso, logaritmo en base dos de menos dos no existe.» | log₂(−2) ∄ | Ejemplo numérico de P1 sobre la gráfica |
| 2 · P2 | P1 + gráfica | Etiqueta naranja «P2 · Producto» y «log_b(M) + log_b(N) = log_b(M·N), M, N > 0» | 29,43 s · «Propiedad dos, producto: la suma de logaritmos es el logaritmo del producto.» | M, N > 0 | Regla general de P2 |
| 2 · P2 ejemplo | P1, P2 | «Ejemplo: log₂4 + log₂2 = 2 + 1 = 3 = log₂8» (naranja) | 34,30 s · «Logaritmo en base dos de cuatro más el de dos: dos más uno, tres, que es logaritmo en base dos de ocho.» | 2 + 1 = 3 = log₂8 | Ejemplo numérico de P2 |
| 2 · P3 | P1, P2 | Etiqueta morada «P3 · Definición» y «log_b(M) = c ⇔ b^c = M» | 40,67 s · «Propiedad tres, definición: logaritmo en base be de eme igual a ce, equivale a be a la ce igual a eme.» | equivalencia log ⇔ potencia | Regla general de P3 |
| 2 · P3 ejemplo | P1, P2, P3 | «Ejemplo: log₂8 = 3 ⇔ 2³ = 8» (morado) | 47,17 s · «Así, logaritmo en base dos de ocho es tres, porque dos al cubo es ocho.» | 2³ = 8 | Ejemplo numérico de P3. Las tres propiedades quedan visibles |
| 3 · Dominio | Pantalla limpia | Título, ecuación, «x > 0 y x − 2 > 0» con etiqueta **P1** celeste | 52,33 s · «Por la propiedad uno, equis mayor que cero, y equis menos dos mayor que cero.» | Dos condiciones | Responde la pregunta de la escena 1 usando P1 |
| 3 · Dominio | Condiciones | Se escribe «⇒ x > 2» en celeste | 57,27 s · «Ambas se cumplen si equis es mayor que dos.» | **x > 2** | La intersección de ambas condiciones |
| 3 · Recta | Condiciones + resultado | Recta numérica de −4 a 6, círculo abierto en 2, tramo celeste hacia +∞ y «]2, +∞[» | 60,27 s · «En la recta: el intervalo abierto de dos a más infinito.» | ]2, +∞[ | Muestra el dominio sombreado en la recta |
| 4 · Predicción | Pantalla limpia | Título «Resolución», «Dominio: x > 2» arriba a la derecha, ecuación original y la pregunta amarilla | 64,87 s · «Antes de resolver, prediga: ¿cuántas soluciones tendrá?» + **2,5 s de silencio** | — | Pregunta de predicción con pausa de al menos 2 s |
| 4 · Paso 1 | Ecuación original (se atenúa) | Aparece `log₂(x(x − 2)) = 3` con etiqueta **P2** naranja | 71,03 s · «Paso uno, propiedad dos: logaritmo del producto.» | log₂(x(x − 2)) = 3 | Un cambio por transición. El paso anterior queda atenuado |
| 4 · Paso 2 | Original y paso 1 atenuados | `x(x − 2) = 2³ = 8` con **P3** morado | 74,40 s · «Paso dos, propiedad tres: el producto es dos al cubo, ocho.» | 2³ = 8 | Se usa P3 para quitar el logaritmo |
| 4 · Paso 3 | Pasos anteriores atenuados | `x² − 2x − 8 = 0` con etiqueta «álgebra» gris | 78,67 s · «Paso tres: equis al cuadrado, menos dos equis, menos ocho, igual a cero.» | x² − 2x − 8 = 0 | Desarrollo algebraico |
| 4 · Paso 4 | Pasos anteriores atenuados | `(x − 4)(x + 2) = 0 ⇒ x = 4 o x = −2` con «álgebra» | 83,83 s · «Paso cuatro: factorizamos. Candidatos: equis igual a cuatro, o menos dos.» | x = 4, x = −2 | Se llaman «candidatos» porque falta validarlos |
| 5 · Validación | Pantalla limpia | Título, «Candidatos: x = 4 o x = −2», recta con ]2, +∞[ sombreado | 90,13 s · «Validemos con el dominio en la recta numérica.» | ]2, +∞[ | Vuelve al dominio de la escena 3 |
| 5 · −2 | Recta | Punto rojo en −2, «x = −2 · fuera de ]2, +∞[ · ✗ se rechaza» en C_ALERTA y etiqueta **P1** | 93,03 s · «Menos dos queda fuera: por la propiedad uno, se rechaza.» | **−2 rechazada (P1)** | Rechazo en C_ALERTA, justificado con P1 |
| 5 · 4 | Recta + rechazo | Punto verde en 4, «x = 4 · dentro de ]2, +∞[ · ✓ se acepta» en C_OK | 96,90 s · «Cuatro está dentro: se acepta.» | 4 aceptada | Aceptación en C_OK |
| 6 · Comprobación | Pantalla limpia | Título, «x = 4:» y «log₂4 + log₂(4 − 2) = 3 ?» | 100,37 s · «Comprobemos con equis igual a cuatro.» | Sustitución | Se plantea la comprobación |
| 6 · Comprobación | Línea anterior (se atenúa) | «log₂4 + log₂2 = 2 + 1 = 3 ✓» con **P3** morado | 102,93 s · «Logaritmo en base dos de cuatro más el de dos: dos más uno, tres. Se cumple.» | **log₂4 + log₂2 = 3** | Se usa P3: log₂4 = 2 y log₂2 = 1 |
| 6 · Solución | Comprobación | «S = {4}» en verde, dentro de un recuadro | 108,07 s · «El conjunto solución contiene solo al cuatro.» | S = {4} | Resultado final |
| 6 · Cierre | Pantalla limpia | «Siempre valide sus soluciones con el dominio.» y «MATEM-UNA · Universidad Nacional, Costa Rica» | 111,97 s · «Recuerde: siempre valide sus soluciones con el dominio.» | — | Mensaje final; la música baja en los últimos 3 s |

La escena 5 no incluye la intersección opcional de y = log₂x + log₂(x − 2) con y = 3. Se dejó fuera para que el video no pasara de 120 s.
