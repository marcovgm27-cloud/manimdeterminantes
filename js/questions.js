/* =====================================================================
 * questions.js — BANCO DE PREGUNTAS
 * ---------------------------------------------------------------------
 * Aquí se definen TODOS los ejercicios. No necesita tocar el HTML.
 * Cada pregunta es un bloque { ... } separado por comas.
 *
 * CAMPOS DISPONIBLES
 *   id                 Código único. Ej.: "DER-001". No lo repita.
 *   activa             true = se usa; false = se ignora (plantillas, borradores).
 *   tema               "Derivadas", "Límites", "Integrales", "Matrices", ...
 *   tipo               "unica" | "multiple" | "vf" | "numerica" | "algebraica"
 *   dificultad         "baja" | "media" | "alta"
 *   enunciado          Texto. Las fórmulas en línea van entre $ ... $.
 *   formula            (opcional) Fórmula destacada, en LaTeX, SIN signos $.
 *   opciones           (unica / multiple) Lista de textos. Se rotulan A, B, C, D...
 *                      en el orden en que se escriben aquí.
 *   respuestaCorrecta  unica:      "B"
 *                      multiple:   ["A", "C"]
 *                      vf:         true  o  false
 *                      numerica:   -61   (o un texto como "1/3", "sqrt(2)")
 *                      algebraica: "2*x*sin(x) + x^2*cos(x)"
 *   retroalimentacion  Texto que se muestra al comprobar, o bien
 *                      { correcta: "...", incorrecta: "..." }
 *   puntaje            Puntos de la pregunta (si se omite, usa config.js).
 *   imagen             (opcional) "assets/img/archivo.png"  o
 *                      { src: "...", alt: "descripción", ancho: 320 }
 *   grafico            (opcional) Gráfico de funciones dibujado por la app.
 *   geogebra           (opcional) Applet de GeoGebra incrustado.
 *   tolerancia         (numerica) Diferencia máxima aceptada.
 *   unidad             (numerica) Texto que aparece junto a la casilla (cm², s...).
 *   variables          (algebraica) Variables permitidas, ej.: ["x"].
 *   dominio            (algebraica) Intervalo donde se comparan expresiones, ej.: [0.5, 3].
 *   mezclarOpciones    (opcional) false para que esta pregunta nunca mezcle sus opciones.
 *
 * IMPORTANTE SOBRE LaTeX
 *   Dentro de las comillas, cada barra invertida se escribe DOBLE:
 *   \ln  →  "\\ln"      \frac{1}{2}  →  "\\frac{1}{2}"
 * ===================================================================== */

window.BANCO_PREGUNTAS = [
  /* ------------------------------------------------------------------
   * 1. Selección única — pregunta principal de demostración
   * ------------------------------------------------------------------ */
  {
    id: "DER-001",
    activa: true,
    tema: "Derivadas",
    tipo: "unica",
    dificultad: "media",
    enunciado: "Para $x > 0$, determine la derivada de la función",
    formula: "f(x) = x^{x}",
    opciones: [
      "$f'(x) = x^{x}\\ln(x)$",
      "$f'(x) = x^{x}\\left(\\ln(x) + 1\\right)$",
      "$f'(x) = x \\cdot x^{x-1}$",
      "$f'(x) = x^{x+1}$",
    ],
    respuestaCorrecta: "B",
    retroalimentacion:
      "Escriba $f(x) = e^{x\\ln x}$. Por la regla de la cadena, " +
      "$f'(x) = e^{x\\ln x}\\,(\\ln x + 1) = x^{x}(\\ln x + 1)$.",
    puntaje: 1,
    imagen: null,
  },

  /* ------------------------------------------------------------------
   * 2. Respuesta numérica — determinante 3×3
   * ------------------------------------------------------------------ */
  {
    id: "DET-001",
    activa: true,
    tema: "Determinantes",
    tipo: "numerica",
    dificultad: "media",
    enunciado: "Calcule el determinante de la matriz",
    formula: "A = \\begin{pmatrix} 2 & 1 & 3 \\\\ 0 & 4 & -1 \\\\ 5 & -2 & 1 \\end{pmatrix}",
    respuestaCorrecta: -61,
    tolerancia: 0,
    retroalimentacion:
      "Desarrollando por la primera columna: " +
      "$\\det(A) = 2\\begin{vmatrix} 4 & -1 \\\\ -2 & 1 \\end{vmatrix} + 5\\begin{vmatrix} 1 & 3 \\\\ 4 & -1 \\end{vmatrix} " +
      "= 2(2) + 5(-13) = -61$.",
    puntaje: 1,
  },

  /* ------------------------------------------------------------------
   * 3. Selección única con gráfico — límite
   * ------------------------------------------------------------------ */
  {
    id: "LIM-001",
    activa: true,
    tema: "Límites",
    tipo: "unica",
    dificultad: "baja",
    enunciado: "Observe la gráfica de $g(x) = \\dfrac{\\sin x}{x}$ y determine",
    formula: "\\lim_{x \\to 0} \\frac{\\sin x}{x}",
    grafico: {
      x: [-12, 12],
      y: [-0.5, 1.4],
      funciones: [{ expresion: "sin(x)/x", etiqueta: "g(x)" }],
      puntos: [{ x: 0, y: 1, hueco: true }], // círculo vacío: g no está definida en 0
    },
    opciones: ["$0$", "$1$", "$\\infty$", "El límite no existe"],
    respuestaCorrecta: "B",
    mezclarOpciones: false,
    retroalimentacion: {
      correcta: "Aunque $g(0)$ no está definida, los valores de $g(x)$ se acercan a $1$.",
      incorrecta: "Observe el hueco en $(0,1)$: la función no está definida en $0$, pero se acerca a $1$ por ambos lados.",
    },
    puntaje: 1,
  },

  /* ------------------------------------------------------------------
   * 4. Verdadero / Falso — números complejos
   * ------------------------------------------------------------------ */
  {
    id: "CPX-001",
    activa: true,
    tema: "Números complejos",
    tipo: "vf",
    dificultad: "baja",
    enunciado: "Determine si la siguiente igualdad es verdadera o falsa:",
    formula: "(1 + i)^{2} = 2i",
    respuestaCorrecta: true,
    retroalimentacion: "$(1+i)^2 = 1 + 2i + i^2 = 1 + 2i - 1 = 2i$.",
    puntaje: 1,
  },

  /* ------------------------------------------------------------------
   * 5. Selección múltiple — propiedades de los determinantes
   * ------------------------------------------------------------------ */
  {
    id: "DET-002",
    activa: true,
    tema: "Determinantes",
    tipo: "multiple",
    dificultad: "media",
    enunciado: "Sean $A$ y $B$ matrices de tamaño $3 \\times 3$. Seleccione <strong>todas</strong> las afirmaciones verdaderas.",
    opciones: [
      "$\\det(AB) = \\det(A)\\det(B)$",
      "$\\det(A^{T}) = \\det(A)$",
      "$\\det(A + B) = \\det(A) + \\det(B)$",
      "$\\det(2A) = 2\\det(A)$",
    ],
    respuestaCorrecta: ["A", "B"],
    retroalimentacion:
      "El determinante es multiplicativo y no cambia al trasponer. No es aditivo, " +
      "y $\\det(2A) = 2^{3}\\det(A) = 8\\det(A)$.",
    puntaje: 1,
  },

  /* ==================================================================
   * PLANTILLAS (activa: false). Cambie a true para usarlas.
   * ================================================================== */

  /* Respuesta algebraica: el estudiante escribe una expresión. */
  {
    id: "ALG-001",
    activa: false,
    tema: "Derivadas",
    tipo: "algebraica",
    dificultad: "media",
    enunciado: "Escriba la derivada de la función",
    formula: "h(x) = x^{2}\\sin(x)",
    respuestaCorrecta: "2*x*sin(x) + x^2*cos(x)",
    variables: ["x"],
    dominio: [-3, 3],
    retroalimentacion: "Regla del producto: $h'(x) = 2x\\sin x + x^2\\cos x$.",
    puntaje: 1,
  },

  /* Pregunta con imagen. */
  {
    id: "GEO-001",
    activa: false,
    tema: "Geometría",
    tipo: "numerica",
    dificultad: "baja",
    enunciado: "Calcule el área del triángulo rectángulo de la figura.",
    imagen: { src: "assets/img/triangulo.svg", alt: "Triángulo rectángulo de catetos 3 cm y 4 cm", ancho: 300 },
    respuestaCorrecta: 6,
    unidad: "cm²",
    tolerancia: 0.01,
    retroalimentacion: "$A = \\dfrac{3 \\cdot 4}{2} = 6\\ \\text{cm}^2$.",
    puntaje: 1,
  },

  /* Pregunta con GeoGebra. Use "materialId" (de geogebra.org) o "comandos". */
  {
    id: "GGB-001",
    activa: false,
    tema: "Álgebra",
    tipo: "numerica",
    dificultad: "baja",
    enunciado: "Explore la gráfica en GeoGebra. ¿Cuál es la raíz positiva de $p(x) = x^2 - 4$?",
    geogebra: {
      app: "graphing",
      comandos: ["p(x) = x^2 - 4"],
      // materialId: "xxxxxxxx",   // alternativa: un material publicado en geogebra.org
      alto: 360,
    },
    respuestaCorrecta: 2,
    tolerancia: 0.001,
    retroalimentacion: "$x^2 - 4 = 0 \\Rightarrow x = \\pm 2$. La raíz positiva es $2$.",
    puntaje: 1,
  },
];
