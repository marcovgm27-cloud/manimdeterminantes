# Verificación · video_logaritmica_final.mp4

## Datos del archivo (ffprobe)

| Dato | Valor medido |
|---|---|
| Resolución | 1280×720 (render `-qm`, 30 fps, H.264) |
| Duración | 117,70 s (video y audio). Rango pedido: 90 a 120 s |
| Peso | 4,58 MB (4 582 477 bytes). Límite: 20 MB |
| Audio | AAC 160 kb/s estéreo: voz + música mezcladas con ffmpeg |

## Cuadros revisados

Cada cuadro se extrajo con ffmpeg 0,1 s después de que termina la voz de su bloque. Están en `cuadros_verificacion/`; el nombre del archivo incluye el segundo.

| Momento | Esperado a mano | Observado | Corrección |
|---|---|---|---|
| 12,30 s · pregunta de dominio | Ecuación `log₂(x) + log₂(x − 2) = 3` y la pregunta | Coincide. Los subíndices ₂ se leen bien, sin recuadros vacíos | — |
| 29,43 s · fin de P1 | Etiqueta P1 celeste, «log_b(M) existe solo si M > 0», «log₂(−2) no existe», gráfica de y = log₂x solo en x > 0, ✗ en −2 | Coincide | En la 1.ª prueba la etiqueta «y = log₂x» tapaba la curva y el «−2» quedaba bajo la ✗. En la 2.ª el «8» del eje salía cortado. Se movió la gráfica y la etiqueta, se separaron los números del eje y se achicó la ✗ |
| 40,66 s · fin de P2 | P2 naranja, «log_b(M) + log_b(N) = log_b(M·N), M, N > 0», «log₂4 + log₂2 = 2 + 1 = 3 = log₂8» | Coincide. El ejemplo no toca la gráfica | Gráfica más angosta (4,7) para dejar espacio |
| 51,83 s · fin de P3 | P3 morado, «log_b(M) = c ⇔ b^c = M», «log₂8 = 3 ⇔ 2³ = 8» | Coincide. Superíndice c y ³ legibles; ⇔ se ve bien | — |
| 63,97 s · dominio | «x > 0 y x − 2 > 0» + P1 celeste, «⇒ x > 2», recta con círculo abierto en 2 y ]2, +∞[ sombreado | Coincide | — |
| 68,64 s · predicción | Ecuación sin resolver y la pregunta | Coincide. No se ve ningún paso de la solución | — |
| 74,37 s · paso 1 | `log₂(x(x − 2)) = 3` + P2 naranja; la ecuación original atenuada | Coincide | Se quitaron unas flechitas a la izquierda de cada paso porque parecían marcas sueltas |
| 78,64 s · paso 2 | `x(x − 2) = 2³ = 8` + P3 morado; pasos anteriores atenuados | Coincide. Las etiquetas atenuadas conservan su color | — |
| 83,82 s · paso 3 | `x² − 2x − 8 = 0` + «álgebra» | Coincide. x² se lee bien | — |
| 89,21 s · paso 4 | `(x − 4)(x + 2) = 0 ⇒ x = 4 o x = −2` + «álgebra» | Coincide. La cadena completa queda visible | — |
| 96,89 s · validación de −2 | Punto rojo en −2, «fuera de ]2, +∞[», «✗ se rechaza» en C_ALERTA, etiqueta P1 | Coincide | — |
| 99,17 s · validación de 4 | Punto verde en 4 dentro del tramo sombreado, «✓ se acepta» en C_OK | Coincide | — |
| 108,05 s · comprobación | «log₂4 + log₂2 = 2 + 1 = 3 ✓» + P3 morado | Coincide | — |
| 111,08 s · solución | «S = {4}» verde, en recuadro | Coincide | — |

## Controles obligatorios

| Control | Esperado a mano | Observado | Estado |
|---|---|---|---|
| (a) Dominio | x > 0 y x − 2 > 0 ⇒ x > 2, es decir ]2, +∞[ | 63,97 s: «⇒ x > 2» y ]2, +∞[ sombreado desde un círculo abierto en 2 | ✓ |
| (b) x = −2 rechazada por P1 | −2 ∉ ]2, +∞[ ⇒ log₂(−2) no existe | 96,89 s: punto rojo en −2, «✗ se rechaza» en C_ALERTA, etiqueta P1 celeste; la voz dice «por la propiedad uno, se rechaza» | ✓ |
| (c) log₂4 + log₂2 = 3 | log₂4 = 2 (2² = 4), log₂2 = 1, 2 + 1 = 3 | 108,05 s: «log₂4 + log₂2 = 2 + 1 = 3 ✓» con P3 | ✓ |

Comprobación extra a mano: 4(4 − 2) = 8 = 2³ ✓; (−2)(−2 − 2) = 8, pero log₂(−2) no existe, así que −2 se rechaza ✓.

## Voz contra pantalla

Los segundos salen de `voz_log.json`, que escribe la escena en cada bloque. En cada bloque, la animación de lo que se nombra empieza en el mismo instante que la voz.

| # | Inicio (s) | Texto de la voz | En pantalla en ese momento | ¿Coincide? |
|---|---|---|---|---|
| 1 | 0,00 | Resolvamos una ecuación logarítmica. | Se escribe el título | Sí |
| 2 | 2,50 | Logaritmo en base dos de equis, más logaritmo en base dos de equis menos dos, igual a tres. | Se escribe la ecuación | Sí |
| 3 | 8,23 | Piense: ¿para qué valores de equis tiene sentido esta ecuación? | Aparece la pregunta. Silencio de 12,20 a 14,80 s (2,6 s) | Sí |
| 4 | 14,80 | Primero, repasemos tres propiedades. | Aparece el título «Repaso de propiedades» | Sí |
| 5 | 17,33 | Propiedad uno, existencia: el logaritmo de eme existe solo si eme es positivo. | P1 y su enunciado | Sí |
| 6 | 22,60 | Su gráfica en base dos vive solo a la derecha del cero. | Ejes y luego la curva y = log₂x | Sí |
| 7 | 25,90 | Por eso, logaritmo en base dos de menos dos no existe. | ✗ en −2 y «log₂(−2) no existe» | Sí |
| 8 | 29,43 | Propiedad dos, producto: la suma de logaritmos es el logaritmo del producto. | P2 y su enunciado | Sí |
| 9 | 34,30 | Logaritmo en base dos de cuatro más el de dos: dos más uno, tres, que es logaritmo en base dos de ocho. | Ejemplo de P2 | Sí |
| 10 | 40,67 | Propiedad tres, definición: logaritmo en base be de eme igual a ce, equivale a be a la ce igual a eme. | P3 y su enunciado | Sí |
| 11 | 47,17 | Así, logaritmo en base dos de ocho es tres, porque dos al cubo es ocho. | Ejemplo de P3 | Sí |
| 12 | 52,33 | Por la propiedad uno, equis mayor que cero, y equis menos dos mayor que cero. | Condiciones + P1 | Sí |
| 13 | 57,27 | Ambas se cumplen si equis es mayor que dos. | «⇒ x > 2» | Sí |
| 14 | 60,27 | En la recta: el intervalo abierto de dos a más infinito. | Recta y luego ]2, +∞[ | Sí |
| 15 | 64,87 | Antes de resolver, prediga: ¿cuántas soluciones tendrá? | Pregunta de predicción. Silencio de 68,54 a 71,03 s (2,5 s) | Sí |
| 16 | 71,03 | Paso uno, propiedad dos: logaritmo del producto. | Paso 1 + P2 | Sí |
| 17 | 74,40 | Paso dos, propiedad tres: el producto es dos al cubo, ocho. | Paso 2 + P3 | Sí |
| 18 | 78,67 | Paso tres: equis al cuadrado, menos dos equis, menos ocho, igual a cero. | Paso 3 | Sí |
| 19 | 83,83 | Paso cuatro: factorizamos. Candidatos: equis igual a cuatro, o menos dos. | Paso 4 | Sí |
| 20 | 90,13 | Validemos con el dominio en la recta numérica. | Recta con el dominio | Sí |
| 21 | 93,03 | Menos dos queda fuera: por la propiedad uno, se rechaza. | Punto rojo, rechazo, P1 | Sí |
| 22 | 96,90 | Cuatro está dentro: se acepta. | Punto verde, aceptación | Sí |
| 23 | 100,37 | Comprobemos con equis igual a cuatro. | «x = 4: log₂4 + log₂(4 − 2) = 3 ?» | Sí |
| 24 | 102,93 | Logaritmo en base dos de cuatro más el de dos: dos más uno, tres. Se cumple. | Línea de comprobación + P3 | Sí |
| 25 | 108,07 | El conjunto solución contiene solo al cuatro. | S = {4} | Sí |
| 26 | 111,97 | Recuerde: siempre valide sus soluciones con el dominio. | Mensaje de cierre | Sí |

Ningún texto de voz usa símbolos: todo está escrito con palabras.

## Mezcla de audio

Ganancias que calculó `mezclar.sh`: voz +5,7 dB y música −17,3 dB. Los niveles de abajo se midieron sobre las pistas separadas que produce el mismo filtro.

| Medida (ebur128 / volumedetect) | Voz | Música sin atenuar | Música atenuada (sidechain) |
|---|---|---|---|
| Sonoridad integrada | −16,3 LUFS | −36,1 LUFS (**19,8 dB bajo la voz**) | −45,0 LUFS |
| Media durante voz (34,5–40,5 s) | −18,8 dB | −38,3 dB | −56,9 dB (**38 dB bajo la voz**) |
| Media durante voz (103,4–108,3 s) | −19,9 dB | −38,5 dB | −56,3 dB |
| Media en silencio (12,4–14,6 s) | sin voz | −34,4 dB | −35,1 dB (la música vuelve a subir) |
| Mezcla final | −16,3 LUFS integrados, pico −0,2 dBFS | | |

Entrada de la música: 2 s (afade in). Salida: 3 s (afade out de 114,7 a 117,7 s).

## Problemas encontrados y corregidos

1. **Primer render de 257 s.** Se acortó la narración de 433 a unas 280 palabras y se ajustaron las pausas. Resultado: 117,7 s.
2. **Audio cortado a 57 s.** Manim 0.19, con caché activa, descarta en silencio los `add_sound` que siguen a una animación cacheada. Se agregó `config.disable_caching = True`. Además, `mezclar.sh` ahora se detiene si la pista de voz es mucho más corta que el video.
3. **La salida de 3 s de la música se cortaba** porque la voz termina antes que el video. Se rellenó la voz con silencio (`apad`) hasta la duración total.
4. **Problemas de diseño** (etiqueta sobre la curva, «−2» bajo la ✗, «8» cortado, flechas sueltas): corregidos; detalle en la tabla de cuadros.

## Lo que no se pudo verificar

- **Voz gTTS.** La red de esta sesión no deja salir hacia `translate.google.com.mx`: gTTS respondió 403 y no se aprobó abrir ese host. El video entregado usa el **respaldo offline espeak-ng (voz es-419, español latinoamericano)**, que suena más robótico que gTTS. El código usa gTTS (`lang="es"`, `tld="com.mx"`) como motor principal. En un equipo con internet, el mismo comando genera la voz gTTS, y los tiempos se ajustan solos porque cada bloque espera lo que dure su audio. Con gTTS hay que volver a revisar que la duración quede entre 90 y 120 s y repetir `bash mezclar.sh`.
- **Escucha.** No se puede escuchar el audio en este entorno: la verificación de voz se hizo con los tiempos registrados y las mediciones de ffmpeg.
- No había `estilo_matia.py`, `musica.mp3` ni archivos `tasas_*.py` en la carpeta. Los colores C_* se definieron en el propio script y la música se generó con `generar_musica.py`.
