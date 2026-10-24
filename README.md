# Retos matemáticos — actividades y evaluaciones cortas

Aplicación web para que sus estudiantes resuelvan retos de Matemática, uno por
tarjeta. Califica automáticamente, muestra retroalimentación y envía cada intento
a una hoja central de **Google Sheets**. Incluye un **panel docente** con
estadísticas, gráficos y descarga de resultados en CSV o Excel.

- Funciona en computadora, tableta y celular.
- No usa frameworks: HTML, CSS y JavaScript. Las fórmulas se dibujan con [KaTeX](https://katex.org).
- Se publica gratis con **GitHub Pages**.
- Las preguntas se escriben en un archivo aparte (`js/questions.js`). No hay que tocar el HTML.

> Este repositorio también contiene los videos de Manim sobre determinantes.
> Su documentación original está al final: [Videos de Manim](#videos-de-manim-sobre-determinantes).

---

## Índice

1. [Cómo abrir el proyecto](#1-cómo-abrir-el-proyecto)
2. [Cómo modificar preguntas](#2-cómo-modificar-preguntas)
3. [Cómo agregar nuevas preguntas](#3-cómo-agregar-nuevas-preguntas)
4. [Cómo cambiar las respuestas correctas](#4-cómo-cambiar-las-respuestas-correctas)
5. [Cómo cambiar el curso y la actividad](#5-cómo-cambiar-el-curso-y-la-actividad)
6. [Cómo crear la hoja de Google Sheets](#6-cómo-crear-la-hoja-de-google-sheets)
7. [Cómo instalar el Apps Script](#7-cómo-instalar-el-apps-script)
8. [Cómo obtener la URL del Web App](#8-cómo-obtener-la-url-del-web-app)
9. [Dónde colocar esa URL](#9-dónde-colocar-esa-url)
10. [Cómo probar un envío](#10-cómo-probar-un-envío)
11. [Cómo publicar el proyecto en GitHub Pages](#11-cómo-publicar-el-proyecto-en-github-pages)
12. [Cómo compartir el enlace con los estudiantes](#12-cómo-compartir-el-enlace-con-los-estudiantes)
13. [Cómo revisar los resultados](#13-cómo-revisar-los-resultados)
14. [Cómo descargar los resultados como Excel](#14-cómo-descargar-los-resultados-como-excel)
- [Referencia: todos los tipos de pregunta](#referencia-tipos-de-pregunta)
- [Referencia: config.js](#referencia-configjs)
- [Seguridad y limitaciones](#seguridad-y-limitaciones)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)

---

## Qué ve el estudiante

1. **Identificación**: nombre completo, carné y grupo (menú desplegable). No puede
   iniciar si falta algún dato; los errores aparecen junto a cada casilla.
2. **Retos**: una tarjeta por pregunta, con número («Reto 1»), tema, puntaje,
   barra de progreso y cronómetro. Elige o escribe su respuesta y pulsa
   **Comprobar respuesta**. La respuesta queda fija y, si usted lo permite, ve si
   acertó y una explicación. Luego pulsa **Siguiente**.
3. **Resultado**: correctas, incorrectas, puntaje, porcentaje, nota y tiempo.
4. **Enviar evaluación**: los datos van a Google Sheets. El mensaje
   «Resultados enviados correctamente.» aparece **solo** cuando el servidor
   confirma que guardó la fila. Si falla, aparece «No fue posible enviar los
   resultados. Intente nuevamente.» y las respuestas siguen guardadas en el equipo.

Si el estudiante recarga la página o se le cierra el navegador, al volver
continúa en la misma pregunta con las respuestas que ya había dado (no puede
«reiniciar» para cambiarlas).

---

## 1. Cómo abrir el proyecto

**Opción A — En su computadora, sin instalar nada**

1. En GitHub, pulse el botón verde **Code → Download ZIP** y descomprima el archivo.
2. Haga doble clic en `index.html`. Se abre en el navegador y ya puede probar la actividad.
3. Para ver el panel docente, abra `docente.html` de la misma forma.

Necesita conexión a Internet (la tipografía y KaTeX se cargan desde la web).
Mientras no configure Google Sheets (pasos 6 a 9), la actividad funciona pero
el envío final mostrará que falta la URL del servidor.

**Opción B — Publicado en Internet**: siga el [paso 11](#11-cómo-publicar-el-proyecto-en-github-pages).

**Para editar archivos** no necesita programas especiales:

- **En GitHub (lo más sencillo)**: abra el archivo, pulse el ícono del lápiz
  (✏️ *Edit this file*), haga el cambio y pulse **Commit changes…** → **Commit changes**.
  GitHub Pages se actualiza solo en uno o dos minutos.
- **En su computadora**: use cualquier editor de texto plano. Se recomienda
  [Visual Studio Code](https://code.visualstudio.com/) porque marca los errores de escritura.
  No use Word.

---

## 2. Cómo modificar preguntas

Todas las preguntas están en **`js/questions.js`**. Cada pregunta es un bloque
entre llaves `{ ... }`. Ejemplo (la pregunta de demostración principal):

```js
{
  id: "DER-001",                 // código único, no se repite
  activa: true,                  // false = la pregunta no se usa
  tema: "Derivadas",
  tipo: "unica",                 // selección única
  dificultad: "media",
  enunciado: "Para $x > 0$, determine la derivada de la función",
  formula: "f(x) = x^{x}",       // fórmula destacada, sin signos $
  opciones: [
    "$f'(x) = x^{x}\\ln(x)$",                       // A
    "$f'(x) = x^{x}\\left(\\ln(x) + 1\\right)$",    // B
    "$f'(x) = x \\cdot x^{x-1}$",                   // C
    "$f'(x) = x^{x+1}$",                            // D
  ],
  respuestaCorrecta: "B",
  retroalimentacion: "Escriba $f(x) = e^{x\\ln x}$. Por la regla de la cadena, ...",
  puntaje: 1,
  imagen: null,
},
```

Reglas de escritura:

| Regla | Ejemplo |
|---|---|
| Los textos van entre comillas dobles | `tema: "Límites",` |
| Cada línea termina en coma | `puntaje: 1,` |
| Las fórmulas dentro de un texto van entre `$ ... $` | `"Sea $x > 0$"` |
| El campo `formula` va **sin** `$` | `formula: "\\int_0^1 x^2\\,dx"` |
| **Cada barra invertida `\` se escribe doble `\\`** | `\frac{1}{2}` → `"\\frac{1}{2}"` |
| Puede usar negrita en el enunciado | `"Seleccione <strong>todas</strong> las correctas"` |

Para comprobar que quedó bien, abra **`docente.html` → Banco de preguntas →
Revisar banco**: verá cada pregunta dibujada con su respuesta correcta y, en
rojo, cualquier error (por ejemplo, un `id` repetido o una letra que no existe).

> Si se le olvida una coma o unas comillas, la actividad muestra
> «No fue posible cargar las preguntas» con el número de línea del error.

---

## 3. Cómo agregar nuevas preguntas

1. Abra `js/questions.js`.
2. Copie un bloque completo `{ ... },` (desde `{` hasta `},`) del mismo tipo que
   quiere crear. Al final del archivo hay **plantillas** desactivadas
   (`activa: false`) de respuesta algebraica, con imagen y con GeoGebra.
3. Péguelo antes del `];` final.
4. Cambie el `id` por uno nuevo (por ejemplo `INT-001`) y edite los demás campos.
5. Guarde y revise en `docente.html` → **Revisar banco**.

La aplicación lee el banco automáticamente: no hay que cambiar nada más.

Sugerencia para los `id`: un prefijo por tema y un número, por ejemplo
`LIM-` límites, `DER-` derivadas, `INT-` integrales, `CPX-` complejos,
`MAT-` matrices, `DET-` determinantes, `SIS-` sistemas, `SER-` series,
`ALG-` álgebra, `GEO-` geometría. El `id` aparece en la hoja de resultados y en
el rendimiento por pregunta del panel, así que **no lo cambie** una vez que la
pregunta se haya usado con estudiantes.

### Imágenes

1. Suba la imagen a la carpeta `assets/img/` (en GitHub: entre a la carpeta →
   **Add file → Upload files**).
2. En la pregunta escriba:

```js
imagen: { src: "assets/img/mi-figura.png", alt: "Descripción de la figura", ancho: 320 },
```

`alt` es el texto que leen los lectores de pantalla. `ancho` (en píxeles) es opcional.

### Gráficos de funciones (los dibuja la aplicación)

```js
grafico: {
  x: [-12, 12],                       // ventana horizontal
  y: [-0.5, 1.4],                     // ventana vertical
  funciones: [{ expresion: "sin(x)/x", etiqueta: "g(x)" }],
  puntos: [{ x: 0, y: 1, hueco: true }],   // hueco: true → círculo vacío
},
```

Puede poner hasta tres funciones (cada una con su color). La escritura de las
expresiones es la misma que la de las respuestas algebraicas (ver [referencia](#referencia-tipos-de-pregunta)).

### GeoGebra

```js
geogebra: {
  app: "graphing",                    // graphing, geometry, 3d, classic
  comandos: ["p(x) = x^2 - 4"],       // comandos de GeoGebra que se ejecutan al cargar
  // materialId: "abcd1234",          // o un material publicado en geogebra.org
  alto: 360,
},
```

Imagen, gráfico y GeoGebra son **recursos**: se pueden agregar a una pregunta de
cualquier tipo (única, múltiple, numérica…).

---

## 4. Cómo cambiar las respuestas correctas

Edite el campo `respuestaCorrecta` de la pregunta:

| Tipo | Cómo se escribe | Ejemplo |
|---|---|---|
| `unica` | La letra de la opción, según el orden en que las escribió | `respuestaCorrecta: "B",` |
| `multiple` | Lista de letras | `respuestaCorrecta: ["A", "C"],` |
| `vf` | `true` (verdadero) o `false` (falso), sin comillas | `respuestaCorrecta: true,` |
| `numerica` | Un número, o un texto con una expresión | `respuestaCorrecta: -61,` · `respuestaCorrecta: "1/3",` |
| `algebraica` | La expresión correcta | `respuestaCorrecta: "2*x*sin(x) + x^2*cos(x)",` |

Las letras se refieren al **orden en `questions.js`**, aunque la aplicación
muestre las opciones mezcladas a cada estudiante. En la hoja de resultados
también se guarda esa letra original, de modo que todos los intentos se comparan
con la misma clave.

Si cambia una respuesta después de que algunos estudiantes ya respondieron, esos
intentos **no** se recalifican: la nota se calculó en el momento.

---

## 5. Cómo cambiar el curso y la actividad

Todo se configura en **`js/config.js`**. Las partes más usadas:

```js
curso: { nombre: "Cálculo Diferencial e Integral", codigo: "MA1103", periodo: "II-2026" },
actividad: { nombre: "Reto matemático 1", codigo: "RETO-01", descripcion: "...", instrucciones: [ ... ] },
grupos: ["Grupo 01", "Grupo 02", "Grupo 03", "Grupo 04"],
```

- `codigo` del curso forma parte del identificador de cada intento (`MA1103-2026-XXXXXXXX`).
- `codigo` de la actividad sirve para distinguir actividades en la hoja y en el panel.
  **Cámbielo cada vez que haga una actividad nueva** (`RETO-02`, `QUIZ-03`…): así
  los resultados de cada actividad se filtran por separado y un estudiante puede
  hacer la nueva aunque ya haya enviado la anterior.

Para una actividad nueva lo habitual es: cambiar `actividad`, poner
`activa: false` a las preguntas de la actividad anterior y `activa: true` a las
nuevas (o usar `preguntas.temas` para elegir por tema). Todas las actividades
pueden usar la misma hoja de Google Sheets.

La [referencia completa de config.js](#referencia-configjs) explica cada opción
(cantidad de preguntas, aleatoriedad, límite de tiempo, retroalimentación, escala de la nota…).

---

## 6. Cómo crear la hoja de Google Sheets

1. Entre a <https://sheets.google.com> con la cuenta de Google que guardará los resultados.
2. Cree una hoja en blanco y póngale un nombre, por ejemplo `Resultados MA1103`.
3. No necesita escribir encabezados: el script crea solo las pestañas
   **Resultados** y **Respuestas** con sus columnas.

Qué guarda cada pestaña:

**Resultados** — una fila por intento:

`Fecha y hora · ID intento · Nombre · Carné · Grupo · Curso · Código actividad ·
Actividad · Cantidad de preguntas · Correctas · Incorrectas · Puntaje obtenido ·
Puntaje máximo · Porcentaje · Nota · Nota máxima · Tiempo total (s) · Inicio ·
Fin · Terminó por tiempo · P1 · P2 · P3 …`

En `P1, P2, …` va la respuesta dada a cada reto en el orden en que el estudiante
lo vio, con una marca: `✓` correcta, `✗` incorrecta, `◐` parcial, `–` sin responder.
«Incorrectas» cuenta todo lo que no fue totalmente correcto.

**Respuestas** — una fila por cada pregunta respondida:

`Fecha y hora · ID intento · Carné · Nombre · Grupo · Código actividad · N.º ·
ID pregunta · Tema · Tipo · Dificultad · Respuesta dada · Respuesta correcta ·
Resultado · Puntos · Puntaje máximo · Tiempo (s)`

Esta pestaña es la que permite analizar cada pregunta (qué distractor se eligió
más, cuánto tiempo tomó, etc.). La «Fecha y hora» es la del servidor de Google,
no la del equipo del estudiante.

---

## 7. Cómo instalar el Apps Script

1. En la hoja de cálculo, vaya al menú **Extensiones → Apps Script**. Se abre el editor.
2. Borre todo el contenido del archivo `Código.gs` (o `Code.gs`).
3. Abra el archivo [`apps-script/Code.gs`](apps-script/Code.gs) de este
   repositorio, copie **todo** su contenido y péguelo en el editor.
4. Cambie la clave del panel docente en la línea:
   ```js
   const CLAVE_DOCENTE = 'CAMBIE-ESTA-CLAVE';
   ```
   por una clave suya, por ejemplo `'Mate-2026-ñandú'`.
   **Cámbiela solo en el editor de Apps Script, nunca en el archivo de GitHub**
   (lo que está en GitHub es público).
5. Pulse el ícono de guardar 💾.
6. Arriba, en el menú desplegable de funciones, elija **`configurarHojas`** y pulse **▶ Ejecutar**.
7. Google pedirá permisos la primera vez:
   **Revisar permisos** → elija su cuenta → si aparece «Google no ha verificado
   esta app», pulse **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**.
   (Es su propio script; el aviso aparece porque no está publicado en la tienda de Google.)
8. Vuelva a la hoja: deben aparecer las pestañas **Resultados** y **Respuestas**.

---

## 8. Cómo obtener la URL del Web App

1. En el editor de Apps Script, pulse **Implementar → Nueva implementación**.
2. Junto a «Seleccionar tipo», pulse el engranaje ⚙️ y elija **Aplicación web**.
3. Complete:
   - **Descripción**: `Resultados` (cualquier texto).
   - **Ejecutar como**: **Yo** (su cuenta).
   - **Quién tiene acceso**: **Cualquier persona** (*Anyone*).
     Es necesario para que los estudiantes puedan enviar sin iniciar sesión.
     Nadie puede *leer* los resultados sin la clave docente.
4. Pulse **Implementar** y, si lo pide, vuelva a autorizar.
5. Copie la **URL de la aplicación web**. Tiene esta forma:
   ```
   https://script.google.com/macros/s/AKfycb................/exec
   ```

**Si después modifica `Code.gs`** (por ejemplo, para cambiar la clave): use
**Implementar → Gestionar implementaciones → ✏️ (editar) → Versión: Nueva versión → Implementar**.
Así la URL **no cambia**. Si en cambio crea una «Nueva implementación», obtendrá
una URL distinta y tendrá que actualizar `config.js`.

---

## 9. Dónde colocar esa URL

En **`js/config.js`**, sección `envio`:

```js
envio: {
  urlAppsScript: "https://script.google.com/macros/s/AKfycb................/exec",
  tiempoEsperaSegundos: 25,
},
```

Pegue la URL entre las comillas y guarde (en GitHub: **Commit changes**).

---

## 10. Cómo probar un envío

1. **¿Responde el servidor?** Pegue la URL del Web App en el navegador. Debe ver:
   `{"ok":true,"mensaje":"Servicio de resultados activo.","version":"1.0"}`
2. **¿Escribe en la hoja?** En el editor de Apps Script elija la función
   **`probarRegistro`** y pulse **▶ Ejecutar**. En la pestaña Resultados aparece
   una fila de «Estudiante de prueba».
3. **Prueba completa**: abra `index.html` (o el enlace de GitHub Pages), haga la
   actividad con un carné de prueba (por ejemplo `PRUEBA1`) y pulse
   **Enviar evaluación**. Debe ver «Resultados enviados correctamente.» y una
   nueva fila en la hoja con el mismo identificador del intento.
4. **Panel docente**: abra `docente.html`, escriba la clave docente y pulse
   **Cargar resultados**.

Después borre las filas de prueba de la hoja (seleccione la fila → clic derecho
→ **Borrar fila**). No borre la fila 1 de encabezados.

> Para repetir la actividad con el mismo carné en el mismo navegador, use otro
> carné o active `permitirNuevoIntento` en `config.js`. También puede abrir una
> ventana de incógnito.

---

## 11. Cómo publicar el proyecto en GitHub Pages

1. Asegúrese de que los archivos estén en la rama principal (`main`) del
   repositorio. Si este trabajo está en otra rama, abra un *pull request* y
   combínelo (**Merge**) en `main`.
2. En GitHub, entre al repositorio → **Settings** → **Pages** (menú izquierdo).
3. En **Build and deployment → Source** elija **Deploy from a branch**.
4. En **Branch** elija `main` y la carpeta `/ (root)`. Pulse **Save**.
5. Espere uno o dos minutos y recargue la página de **Settings → Pages**. Arriba
   aparecerá la dirección, por ejemplo:
   ```
   https://SU-USUARIO.github.io/manimdeterminantes/
   ```

Notas:

- En una cuenta gratuita, GitHub Pages requiere que el repositorio sea **público**.
- El archivo `.nojekyll` (vacío) ya está incluido para que GitHub publique los
  archivos tal cual.
- Cada vez que haga un cambio y lo guarde en `main`, el sitio se actualiza solo
  (puede tardar uno o dos minutos; si no ve el cambio, recargue con Ctrl+F5).

---

## 12. Cómo compartir el enlace con los estudiantes

- Actividad de los estudiantes: `https://SU-USUARIO.github.io/manimdeterminantes/`
  (es el `index.html`).
- Panel docente (solo para usted): `https://SU-USUARIO.github.io/manimdeterminantes/docente.html`

Compártalo por Mediación Virtual, correo, Teams o con un código QR (por ejemplo,
desde el menú «Compartir → Crear código QR» de Chrome). **No comparta el enlace
de `docente.html`**; aun así, sin la clave nadie puede ver los resultados.

Recomendaciones antes de cada actividad:

1. Haga usted la actividad una vez de principio a fin y envíela.
2. Verifique que la fila llegó a la hoja.
3. Pida a los estudiantes que no cierren la página hasta ver
   «Resultados enviados correctamente.» y que anoten el identificador del intento.

---

## 13. Cómo revisar los resultados

**En el panel docente (`docente.html`)**

1. Escriba la clave docente (la `CLAVE_DOCENTE` de `Code.gs`) y pulse **Cargar resultados**.
2. Use los filtros: actividad, grupo, intentos (todos / último / mejor por
   estudiante) y búsqueda por nombre o carné.
3. Verá:
   - número de estudiantes e intentos, promedio, mediana, nota máxima, nota mínima
     y porcentaje de aprobación (según `notaAprobacion` de `config.js`);
   - **distribución de notas** por rangos de 10 %;
   - **promedio por grupo**;
   - **rendimiento por pregunta**: porcentaje de acierto de cada `id`, con su tema.
     Pase el cursor sobre una barra para ver correctas, total y tiempo promedio;
   - la tabla de intentos (pulse un encabezado para ordenar).
4. Con **Ver datos de ejemplo** puede explorar el panel con datos inventados
   antes de tener resultados reales.

**Directamente en Google Sheets**: abra la hoja. Puede usar filtros
(**Datos → Crear un filtro**), tablas dinámicas, etc. Sugerencia: no reordene ni
inserte columnas en las pestañas Resultados y Respuestas; si quiere hacer
cálculos propios, hágalos en otra pestaña.

**Intentos repetidos o con problemas de envío**: cada intento tiene un ID único
(`MA1103-2026-XXXXXXXX`). Si un estudiante pulsa enviar dos veces o reintenta
tras un fallo de conexión, el servidor reconoce el ID y **no** crea una segunda
fila. Si un estudiante dice que envió, pídale el identificador que aparece en su
pantalla y búsquelo en la columna «ID intento».

---

## 14. Cómo descargar los resultados como Excel

**Opción 1 — Excel (.xlsx) desde Google Sheets** (recomendada)

- En la hoja: **Archivo → Descargar → Microsoft Excel (.xlsx)**.
- O en el panel docente, después de cargar los resultados: botón
  **Descargar Excel (.xlsx)** (abre la descarga de Google; debe tener la sesión
  de Google iniciada con la cuenta dueña de la hoja).

**Opción 2 — CSV desde el panel docente**

- **Descargar resultados**: una fila por intento, con las columnas P1, P2, …
- **Respuestas detalladas (CSV)**: una fila por pregunta respondida.

Los CSV incluyen solo los intentos que se ven con los filtros actuales. Se
generan con `;` como separador y coma decimal para que Excel en español los abra
directamente con doble clic, con tildes y ñ correctas. Si su Excel está en
inglés, cambie `separadorCSV` a `","` en `config.js`.

---

## Referencia: tipos de pregunta

| `tipo` | Qué hace el estudiante | Calificación |
|---|---|---|
| `unica` | Elige una opción | Correcta o incorrecta |
| `multiple` | Marca varias casillas | Todo o nada, o parcial (`puntajeParcialMultiple` en `config.js`, o `puntajeParcial: true` en la pregunta): (aciertos − errores) / correctas, mínimo 0 |
| `vf` | Verdadero o Falso | Correcta o incorrecta |
| `numerica` | Escribe un número | Correcta si la diferencia con la respuesta es ≤ `tolerancia` (por defecto `preguntas.toleranciaNumerica`) |
| `algebraica` | Escribe una expresión | Se compara con la respuesta correcta en 12 puntos al azar del `dominio`. Acepta cualquier forma equivalente: `x(2sin x + x cos x)` = `2x sin(x) + x^2 cos(x)` |

Campos adicionales:

- `numerica`: `tolerancia` (ej. `0.01`), `unidad` (ej. `"cm²"`).
- `algebraica`: `variables` (ej. `["x"]` o `["x", "y"]`), `dominio` (ej. `[0.5, 3]`;
  use un intervalo donde la expresión esté definida, por ejemplo positivo si hay `ln(x)`).
- Cualquier tipo: `mezclarOpciones: false` para fijar el orden (útil con «Ninguna de las anteriores»),
  `retroalimentacion` como texto o como `{ correcta: "...", incorrecta: "..." }`.

**Cómo escriben los estudiantes** en respuestas numéricas y algebraicas (también
vale para `grafico.funciones`):

| Escritura | Significado |
|---|---|
| `2x`, `3(x+1)`, `x sin(x)` | Multiplicación implícita |
| `*` `/` `^` | Multiplicación, división, potencia |
| `sqrt(x)` o `√x`, `cbrt(x)`, `abs(x)` | Raíz cuadrada, raíz cúbica, valor absoluto |
| `sin cos tan sec csc cot`, `sen` | Trigonométricas (en radianes) |
| `asin acos atan` (o `arcsin`…) | Inversas |
| `exp(x)` o `e^x`, `ln(x)`, `log(x)` | Exponencial, logaritmo natural, logaritmo base 10 |
| `pi` o `π`, `e` | Constantes |
| `0,5` o `0.5`, `1/3` | Decimales y fracciones |

Debajo de la casilla el estudiante ve una vista previa de lo que escribió en
notación matemática, para evitar errores de paréntesis.

**Agregar un tipo nuevo** (por ejemplo «ordenar pasos»): en
`js/question-types.js` cada tipo es un objeto con las mismas funciones
(`validar`, `normalizarClave`, `publica`, `crearControl`, `calificar`,
`describir`, `describirClave`). Basta con añadir uno nuevo a la lista; el resto
de la aplicación no cambia.

---

## Referencia: config.js

| Opción | Para qué sirve |
|---|---|
| `curso.nombre`, `curso.codigo`, `curso.periodo` | Encabezado, pie y prefijo del ID de intento |
| `actividad.nombre`, `.codigo`, `.descripcion`, `.instrucciones` | Pantalla de inicio y columnas de la hoja |
| `grupos` | Opciones del menú desplegable |
| `preguntas.archivo` | Archivo del banco (`js/questions.js` o `js/questions.protegido.js`) |
| `preguntas.cantidad` | Cuántas preguntas por intento (`null` = todas las activas) |
| `preguntas.temas` | Usar solo ciertos temas, ej. `["Derivadas"]` (`[]` = todos) |
| `preguntas.puntajePorDefecto` | Puntaje si la pregunta no indica `puntaje` |
| `preguntas.toleranciaNumerica` | Tolerancia por defecto de las respuestas numéricas |
| `aleatoriedad.mezclarPreguntas` | Cambia el orden de las preguntas |
| `aleatoriedad.mezclarOpciones` | Cambia el orden de las opciones |
| `aleatoriedad.seleccionAleatoria` | Elige al azar `cantidad` preguntas del banco (cada estudiante recibe un subconjunto distinto) |
| `aleatoriedad.semillaPorEstudiante` | `true`: el mismo carné siempre recibe la misma versión. `false`: cada intento es distinto |
| `calificacion.notaMaxima` | Escala: 100, 10, 7… La nota = porcentaje × notaMaxima / 100 |
| `calificacion.decimales` | Decimales de la nota |
| `calificacion.notaAprobacion` | Para el indicador de aprobación y los colores del panel |
| `calificacion.puntajeParcialMultiple` | Puntaje parcial en selección múltiple |
| `tiempo.limiteMinutos` | Límite de tiempo (`null` = sin límite). Al llegar a cero la actividad termina y las preguntas sin responder valen 0 |
| `retroalimentacion.mostrar` | Mostrar «Correcto/Incorrecto» al comprobar. Si es `false` solo dice «Respuesta registrada.» |
| `retroalimentacion.mostrarRespuestaCorrecta` | Marcar la opción correcta cuando el estudiante falla |
| `retroalimentacion.mostrarExplicacion` | Mostrar el texto `retroalimentacion` de la pregunta |
| `resultados.mostrarNotaFinal` | Mostrar la nota en la pantalla final |
| `resultados.mostrarDetalle` | Mostrar el resumen reto por reto |
| `resultados.permitirNuevoIntento` | Permitir otro intento al mismo carné en el mismo navegador |
| `envio.urlAppsScript` | URL del Web App (paso 9) |
| `envio.tiempoEsperaSegundos` | Espera máxima de la respuesta del servidor |
| `docente.separadorCSV` | `";"` (Excel en español) o `","` |

Para una **evaluación** (no práctica) suele convenir:
`retroalimentacion.mostrar: false`, `mostrarNotaFinal: false` o `true` según su
criterio, `mezclarPreguntas: true`, `mezclarOpciones: true` y, si el banco es
grande, `seleccionAleatoria: true` con una `cantidad`.

---

## Seguridad y limitaciones

Esta es una aplicación **puramente frontend** (todo se ejecuta en el navegador
del estudiante) con un registro central en Google Sheets. Es adecuada para
actividades formativas y evaluaciones cortas de **bajo riesgo**. Debe conocer
sus límites:

**Qué medidas tiene**

- Las respuestas correctas **no están en el HTML** ni en atributos de la página.
  La interfaz recibe solo versiones «públicas» de las preguntas; la clave queda
  en una variable privada del módulo `question-bank.js`, y el banco se retira
  del objeto global después de cargarse.
- **Banco protegido (opcional)**: en `docente.html → Generar banco protegido` se
  descarga `questions.protegido.js`, donde las respuestas están ofuscadas.
  Súbalo a `js/`, cambie `preguntas.archivo` en `config.js` y **retire el
  `questions.js` original del repositorio publicado** (guárdelo en su computadora
  para seguir editando; cada vez que cambie preguntas, genere de nuevo el protegido).
- Una vez comprobada, una respuesta no se puede cambiar, ni recargando la página.
- Cada intento tiene un **ID único**; el servidor descarta los envíos duplicados.
- Los envíos fallidos se guardan en el navegador y se reintentan; la
  confirmación solo aparece si el servidor responde que guardó la fila.
- El servidor valida los datos recibidos, usa un candado para envíos
  simultáneos y neutraliza textos que empiezan con `=`, `+`, `@` o `-`
  (evita que un «nombre» se ejecute como fórmula en la hoja).
- Los resultados solo se pueden **leer** con la clave docente, que está en el
  Apps Script (no en GitHub).

**Qué NO puede impedir**

- **Un estudiante con conocimientos técnicos puede ver las respuestas.** Todo el
  código que llega al navegador puede inspeccionarse (herramientas de
  desarrollador). La ofuscación del banco protegido solo evita que las respuestas
  se lean «a simple vista»; no es cifrado. Mientras el repositorio sea público,
  cualquier archivo que esté en él también lo es.
- **Se pueden enviar resultados falsos.** Como la nota se calcula en el
  navegador, alguien con conocimientos podría enviar al Web App una nota
  inventada. Revise los casos sospechosos comparando con la pestaña Respuestas
  (respuestas dadas, tiempos muy cortos).
- **No verifica la identidad.** Cualquiera puede escribir cualquier nombre y carné.
- **No impide consultar otras fuentes** (libros, compañeros, otras pestañas).
- Varios intentos con el mismo carné desde **otro navegador o dispositivo** sí
  quedan registrados (aparecen como filas distintas; use el filtro
  «Último/Mejor intento por estudiante»).

Para evaluaciones de alto impacto se necesita calificar en el servidor (que las
respuestas correctas nunca lleguen al navegador) y autenticar a los estudiantes,
por ejemplo con el sistema de cuestionarios de su plataforma institucional.

---

## Estructura del proyecto

```
index.html              Actividad del estudiante (solo estructura; no contiene preguntas)
docente.html            Panel docente
.nojekyll               Indica a GitHub Pages que publique los archivos tal cual
css/styles.css          Todo el diseño (colores en variables al inicio; modo oscuro automático)
js/config.js            ← CONFIGURACIÓN (lo único que necesita tocar además de las preguntas)
js/questions.js         ← BANCO DE PREGUNTAS
js/utils.js             Funciones comunes: azar con semilla, IDs, KaTeX, almacenamiento
js/math-engine.js       Intérprete de expresiones (respuestas numéricas, algebraicas y gráficos)
js/question-types.js    Tipos de pregunta: única, múltiple, V/F, numérica, algebraica
js/resources.js         Recursos: imagen, gráfico de funciones, GeoGebra
js/question-bank.js     Carga, valida y califica; guarda las respuestas en privado
js/api.js               Comunicación con Google Apps Script y envíos pendientes
js/app.js               Lógica de las pantallas del estudiante
js/charts.js            Gráficos de barras del panel docente
js/teacher.js           Lógica del panel docente
apps-script/Code.gs     Servidor que se pega en Google Apps Script
assets/img/             Imágenes de las preguntas
```

**Decisiones respecto a la estructura propuesta**

- **`questions.js` en lugar de `questions.json`.** El formato es prácticamente
  igual (un JSON dentro de `window.BANCO_PREGUNTAS = [ ... ];`), pero un `.js` se
  puede abrir con doble clic desde la computadora. Los navegadores bloquean la
  lectura de archivos `.json` locales (`file://`), lo que obligaría a instalar un
  servidor solo para probar. Además, el `.js` permite comentarios para recordar
  qué hace cada pregunta.
- **Archivos adicionales** (`utils`, `math-engine`, `question-types`,
  `resources`, `question-bank`, `api`, `charts`): separan datos, presentación,
  lógica y comunicación, como pide el diseño. Cada uno es pequeño y tiene una
  sola responsabilidad. Por ejemplo, para un tipo de pregunta nuevo solo se toca
  `question-types.js`.
- **Imagen, gráfico y GeoGebra como recursos y no como tipos**: una pregunta con
  GeoGebra puede ser de selección única o numérica; así no se multiplican los tipos.

---

## Solución de problemas

| Problema | Causa probable y solución |
|---|---|
| «No fue posible cargar las preguntas» | Error de escritura en `questions.js` (coma, comillas o llave). El mensaje indica la línea. |
| Las fórmulas aparecen como `$x^2$` | Sin conexión a Internet (KaTeX no cargó), o falta cerrar un `$`. |
| Una fórmula sale en rojo | Error de LaTeX. Revise que cada `\` esté escrita como `\\`. |
| «La URL del servidor no está configurada» | Falta el paso 9. |
| «El servidor no devolvió una respuesta válida» | En la implementación, «Quién tiene acceso» no es «Cualquier persona», o la URL no termina en `/exec`. |
| «Primero cambie CLAVE_DOCENTE…» | Cambie la clave en `Code.gs` y publique una **nueva versión** (paso 8). |
| Cambié `Code.gs` pero no se nota | Debe publicar una **nueva versión** en «Gestionar implementaciones». |
| Un estudiante ve «Hay un intento pendiente de envío» | Un envío anterior falló en ese equipo. Pulse «Reintentar envío». |
| El estudiante recargó y volvió a su intento | Es intencional: el avance se guarda en el navegador. |
| Cambié `config.js` y no veo cambios | Espere 1–2 minutos a GitHub Pages y recargue con Ctrl+F5. |

---

# Videos de Manim sobre determinantes

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

## Video 2: desarrollo por cofactores

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
