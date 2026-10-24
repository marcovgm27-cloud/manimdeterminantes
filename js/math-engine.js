/* =====================================================================
 * math-engine.js — Intérprete de expresiones matemáticas (sin librerías)
 * ---------------------------------------------------------------------
 * Lo usan:
 *   - las respuestas numéricas ("1/3", "sqrt(2)", "-61", "0,5");
 *   - las respuestas algebraicas (comparación de expresiones);
 *   - los gráficos de funciones.
 *
 * Sintaxis aceptada:
 *   + - * / ^ (o **), paréntesis, multiplicación implícita (2x, 3(x+1), x sin(x))
 *   funciones: sin cos tan sec csc cot asin acos atan arcsin arccos arctan
 *              sinh cosh tanh exp ln log log10 log2 sqrt raiz cbrt abs
 *   constantes: pi, π, e
 * Nunca se usa eval(): la expresión se analiza y se evalúa con un árbol.
 * ===================================================================== */

const MathEngine = (() => {
  const FUNCIONES = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sen: Math.sin,
    sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
    sqrt: Math.sqrt, raiz: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
  };
  const CONSTANTES = { pi: Math.PI, "π": Math.PI, e: Math.E };
  const TEX_FUNCIONES = {
    sin: "\\sin", sen: "\\sin", cos: "\\cos", tan: "\\tan", sec: "\\sec", csc: "\\csc", cot: "\\cot",
    asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan",
    arcsin: "\\arcsin", arccos: "\\arccos", arctan: "\\arctan",
    sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", exp: "\\exp", ln: "\\ln",
    log: "\\log", log10: "\\log_{10}", log2: "\\log_{2}",
  };
  // Nombres ordenados de mayor a menor longitud para separar "xln" en x · ln.
  const NOMBRES = [...Object.keys(FUNCIONES), ...Object.keys(CONSTANTES)].sort((a, b) => b.length - a.length);

  class ErrorExpresion extends Error {}

  /* ---------------- 1. Análisis léxico ---------------- */

  function tokenizar(texto, variables) {
    const fuente = String(texto)
      .replace(/\*\*/g, "^")
      .replace(/[·×]/g, "*")
      .replace(/÷/g, "/")
      .replace(/[−–]/g, "-")
      .replace(/√/g, "sqrt");
    const tokens = [];
    let i = 0;
    while (i < fuente.length) {
      const c = fuente[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        const m = fuente.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
        if (!m) throw new ErrorExpresion(`Número no válido cerca de «${fuente.slice(i, i + 5)}».`);
        tokens.push({ tipo: "num", valor: parseFloat(m[0]) });
        i += m[0].length;
        continue;
      }
      if (/[a-zA-Zπ_]/.test(c)) {
        const m = fuente.slice(i).match(/^[a-zA-Zπ_][a-zA-Z0-9_]*/);
        tokens.push(...separarIdentificador(m[0], variables));
        i += m[0].length;
        continue;
      }
      if ("+-*/^(),".includes(c)) {
        tokens.push({ tipo: "op", valor: c });
        i++;
        continue;
      }
      if ("[{".includes(c)) { tokens.push({ tipo: "op", valor: "(" }); i++; continue; }
      if ("]}".includes(c)) { tokens.push({ tipo: "op", valor: ")" }); i++; continue; }
      throw new ErrorExpresion(`Carácter no permitido: «${c}».`);
    }
    return tokens;
  }

  /** "xsin" → [x, sin];  "xy" → [x, y] (si x e y son variables). */
  function separarIdentificador(id, variables) {
    if (variables.includes(id) || FUNCIONES[id] || id in CONSTANTES) return [tokenNombre(id, variables)];
    const resultado = [];
    let i = 0;
    while (i < id.length) {
      const resto = id.slice(i);
      const nombre =
        variables.filter((v) => resto.startsWith(v)).sort((a, b) => b.length - a.length)[0] ||
        NOMBRES.find((n) => resto.startsWith(n));
      if (!nombre) {
        throw new ErrorExpresion(
          variables.length
            ? `«${id}» no es una variable o función reconocida. Variables permitidas: ${variables.join(", ")}.`
            : `«${id}» no es un número o función reconocida.`
        );
      }
      resultado.push(tokenNombre(nombre, variables));
      i += nombre.length;
    }
    return resultado;
  }

  function tokenNombre(nombre, variables) {
    if (variables.includes(nombre)) return { tipo: "var", valor: nombre };
    if (FUNCIONES[nombre]) return { tipo: "fun", valor: nombre };
    return { tipo: "const", valor: nombre };
  }

  /* ---------------- 2. Análisis sintáctico (descenso recursivo) ----------------
   * expresion := termino (('+'|'-') termino)*
   * termino   := unario (('*'|'/') unario | unario-implícito)*
   * unario    := ('-'|'+') unario | potencia
   * potencia  := primario ('^' unario)?
   * primario  := num | var | const | fun primario | '(' expresion ')'
   * --------------------------------------------------------------------------- */

  function analizar(texto, variables = []) {
    if (!String(texto).trim()) throw new ErrorExpresion("La expresión está vacía.");
    const tokens = tokenizar(texto, variables);
    let pos = 0;
    const ver = () => tokens[pos];
    const esOp = (v) => ver() && ver().tipo === "op" && ver().valor === v;
    const consumir = () => tokens[pos++];

    function expresion() {
      let nodo = termino();
      while (esOp("+") || esOp("-")) {
        const op = consumir().valor;
        nodo = { tipo: "bin", op, izq: nodo, der: termino() };
      }
      return nodo;
    }

    function iniciaFactor() {
      const t = ver();
      return t && (t.tipo !== "op" || t.valor === "(");
    }

    function termino() {
      let nodo = unario();
      for (;;) {
        if (esOp("*") || esOp("/")) {
          const op = consumir().valor;
          nodo = { tipo: "bin", op, izq: nodo, der: unario() };
        } else if (iniciaFactor()) {
          nodo = { tipo: "bin", op: "*", izq: nodo, der: potencia(), implicita: true };
        } else break;
      }
      return nodo;
    }

    function unario() {
      if (esOp("-")) { consumir(); return { tipo: "neg", arg: unario() }; }
      if (esOp("+")) { consumir(); return unario(); }
      return potencia();
    }

    function potencia() {
      const base = primario();
      if (esOp("^")) {
        consumir();
        return { tipo: "bin", op: "^", izq: base, der: unario() };
      }
      return base;
    }

    function primario() {
      const t = consumir();
      if (!t) throw new ErrorExpresion("La expresión está incompleta.");
      if (t.tipo === "num") return { tipo: "num", valor: t.valor };
      if (t.tipo === "var") return { tipo: "var", nombre: t.valor };
      if (t.tipo === "const") return { tipo: "const", nombre: t.valor };
      if (t.tipo === "fun") {
        if (!ver()) throw new ErrorExpresion(`Falta el argumento de ${t.valor}.`);
        // sin x  →  sin(x);  sin(x)^2 se interpreta como (sin x)^2
        return { tipo: "fun", nombre: t.valor, arg: esOp("(") ? primario() : potencia() };
      }
      if (t.valor === "(") {
        const dentro = expresion();
        if (!esOp(")")) throw new ErrorExpresion("Falta cerrar un paréntesis.");
        consumir();
        return { tipo: "par", arg: dentro };
      }
      throw new ErrorExpresion(`Símbolo inesperado: «${t.valor}».`);
    }

    const arbol = expresion();
    if (pos < tokens.length) throw new ErrorExpresion(`Símbolo inesperado: «${ver().valor}».`);
    return arbol;
  }

  /* ---------------- 3. Evaluación ---------------- */

  function evaluarArbol(n, ambito) {
    switch (n.tipo) {
      case "num": return n.valor;
      case "var": return ambito[n.nombre];
      case "const": return CONSTANTES[n.nombre];
      case "par": return evaluarArbol(n.arg, ambito);
      case "neg": return -evaluarArbol(n.arg, ambito);
      case "fun": return FUNCIONES[n.nombre](evaluarArbol(n.arg, ambito));
      case "bin": {
        const a = evaluarArbol(n.izq, ambito);
        const b = evaluarArbol(n.der, ambito);
        switch (n.op) {
          case "+": return a + b;
          case "-": return a - b;
          case "*": return a * b;
          case "/": return a / b;
          case "^": return Math.pow(a, b);
        }
      }
    }
    return NaN;
  }

  /** Compila una expresión: devuelve una función (ambito) => número. */
  function compilar(texto, variables = []) {
    const arbol = analizar(texto, variables);
    return (ambito = {}) => evaluarArbol(arbol, ambito);
  }

  /** Evalúa una expresión sin variables: "1/3" → 0.333..., "0,5" → 0.5 */
  function evaluarNumero(texto) {
    let t = String(texto).trim();
    // Coma decimal: "0,5" o "-2,75" (solo si hay una coma y no hay punto)
    if (/^[^,.]*,[^,.]*$/.test(t)) t = t.replace(",", ".");
    const valor = compilar(t, [])();
    if (!Number.isFinite(valor)) throw new ErrorExpresion("La expresión no da un número real.");
    return valor;
  }

  /**
   * ¿Son equivalentes dos expresiones? Se comparan en varios puntos al azar
   * del dominio. Es el método estándar de los sistemas de evaluación en línea.
   */
  function sonEquivalentes(exprA, exprB, { variables = ["x"], dominio = [-3, 3], puntos = 12, tolerancia = 1e-6 } = {}) {
    const fa = compilar(exprA, variables);
    const fb = compilar(exprB, variables);
    const aleatorio = Utils.crearAleatorio(`${exprA}|${exprB}`);
    let validos = 0;
    for (let intento = 0; intento < puntos * 4 && validos < puntos; intento++) {
      const ambito = {};
      variables.forEach((v) => (ambito[v] = dominio[0] + aleatorio() * (dominio[1] - dominio[0])));
      const a = fa(ambito);
      const b = fb(ambito);
      if (!Number.isFinite(b)) continue; // punto fuera del dominio de la respuesta correcta
      if (!Number.isFinite(a)) return false;
      if (Math.abs(a - b) > tolerancia * Math.max(1, Math.abs(b))) return false;
      validos++;
    }
    return validos >= Math.min(4, puntos);
  }

  /* ---------------- 4. Conversión a LaTeX (vista previa) ---------------- */

  const PRECEDENCIA = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4 };

  function aTex(n) {
    switch (n.tipo) {
      case "num": return String(n.valor);
      case "var": return n.nombre.length > 1 ? `\\mathit{${n.nombre}}` : n.nombre;
      case "const": return n.nombre === "e" ? "e" : "\\pi";
      case "par": return `\\left(${aTex(n.arg)}\\right)`;
      case "neg": return `-${aTex(n.arg)}`;
      case "fun": {
        const arg = n.arg.tipo === "par" ? n.arg.arg : n.arg;
        if (n.nombre === "sqrt" || n.nombre === "raiz") return `\\sqrt{${aTex(arg)}}`;
        if (n.nombre === "cbrt") return `\\sqrt[3]{${aTex(arg)}}`;
        if (n.nombre === "abs") return `\\left|${aTex(arg)}\\right|`;
        return `${TEX_FUNCIONES[n.nombre]}\\left(${aTex(arg)}\\right)`;
      }
      case "bin": {
        if (n.op === "/") return `\\frac{${aTex(sinParentesis(n.izq))}}{${aTex(sinParentesis(n.der))}}`;
        if (n.op === "^") {
          const base = n.izq.tipo === "bin" || n.izq.tipo === "neg" ? `\\left(${aTex(n.izq)}\\right)` : aTex(n.izq);
          return `{${base}}^{${aTex(sinParentesis(n.der))}}`;
        }
        const izq = envolver(n.izq, n.op);
        const der = envolver(n.der, n.op, true);
        if (n.op === "*") {
          const necesitaPunto = n.der.tipo === "num" || n.der.tipo === "neg";
          return `${izq}${necesitaPunto ? " \\cdot " : " "}${der}`;
        }
        return `${izq} ${n.op} ${der}`;
      }
    }
    return "";
  }

  const sinParentesis = (n) => (n.tipo === "par" ? n.arg : n);

  function envolver(hijo, op, esDerecho = false) {
    if (hijo.tipo !== "bin") return aTex(hijo);
    const ph = PRECEDENCIA[hijo.op];
    const p = PRECEDENCIA[op];
    const necesita = ph < p || (esDerecho && ph === p && (op === "-" || op === "/"));
    return necesita ? `\\left(${aTex(hijo)}\\right)` : aTex(hijo);
  }

  /** Texto del estudiante → LaTeX para la vista previa. Lanza error si no es válido. */
  function textoATex(texto, variables = []) {
    return aTex(analizar(texto, variables));
  }

  return { analizar, compilar, evaluarNumero, sonEquivalentes, textoATex, ErrorExpresion };
})();
