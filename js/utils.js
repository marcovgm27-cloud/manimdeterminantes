/* =====================================================================
 * utils.js — Funciones auxiliares reutilizables
 * (aleatoriedad, identificadores, KaTeX, DOM, almacenamiento local).
 * Lo usan tanto la app del estudiante como el panel docente.
 * ===================================================================== */

const Utils = (() => {
  /* ---------------- Aleatoriedad reproducible ---------------- */

  /** Convierte un texto en un número de 32 bits (hash FNV-1a). */
  function hashTexto(texto) {
    let h = 0x811c9dc5;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /** Generador pseudoaleatorio con semilla (mulberry32). Devuelve () => [0, 1). */
  function crearAleatorio(semilla) {
    let a = typeof semilla === "number" ? semilla >>> 0 : hashTexto(String(semilla));
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Devuelve una copia mezclada del arreglo (Fisher–Yates). */
  function mezclar(arreglo, aleatorio = Math.random) {
    const copia = arreglo.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(aleatorio() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  /* ---------------- Identificadores ---------------- */

  const ALFABETO_ID = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I para evitar confusiones

  function textoAleatorio(longitud) {
    const bytes = new Uint8Array(longitud);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.from(bytes, (b) => ALFABETO_ID[b % ALFABETO_ID.length]).join("");
  }

  /** Identificador único del intento: CODIGO-AÑO-XXXXXXXX */
  function generarIdIntento(codigoCurso) {
    const codigo = String(codigoCurso || "CURSO").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return `${codigo}-${new Date().getFullYear()}-${textoAleatorio(8)}`;
  }

  /** Letra para una posición: 0 → A, 1 → B, ... */
  const letra = (i) => String.fromCharCode(65 + i);

  /* ---------------- Texto y números ---------------- */

  function escaparHtml(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Quita etiquetas HTML y delimitadores $ para guardar texto plano en la hoja. */
  function textoPlano(texto) {
    return String(texto ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/\$\$?/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function redondear(valor, decimales = 2) {
    const f = 10 ** decimales;
    return Math.round((valor + Number.EPSILON) * f) / f;
  }

  function formatearNumero(valor, decimales = 1) {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "—";
    return Number(valor).toLocaleString("es", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimales,
    });
  }

  /** 125 → "2 min 05 s" */
  function formatearDuracion(segundos) {
    const s = Math.max(0, Math.round(segundos || 0));
    const m = Math.floor(s / 60);
    const r = String(s % 60).padStart(2, "0");
    return m > 0 ? `${m} min ${r} s` : `${s % 60} s`;
  }

  /* ---------------- DOM ---------------- */

  /** Crea un elemento: el("div", { class: "x" }, [hijos]) */
  function el(etiqueta, atributos = {}, hijos = []) {
    const nodo = document.createElement(etiqueta);
    for (const [clave, valor] of Object.entries(atributos)) {
      if (valor === null || valor === undefined || valor === false) continue;
      if (clave === "html") nodo.innerHTML = valor;
      else if (clave === "text") nodo.textContent = valor;
      else if (clave.startsWith("on") && typeof valor === "function") nodo.addEventListener(clave.slice(2), valor);
      else nodo.setAttribute(clave, valor === true ? "" : valor);
    }
    for (const hijo of [].concat(hijos)) {
      if (hijo === null || hijo === undefined || hijo === false) continue;
      nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
    }
    return nodo;
  }

  /* ---------------- KaTeX ---------------- */

  const DELIMITADORES = [
    { left: "$$", right: "$$", display: true },
    { left: "\\[", right: "\\]", display: true },
    { left: "$", right: "$", display: false },
    { left: "\\(", right: "\\)", display: false },
  ];

  /** Renderiza las fórmulas $...$ contenidas en un elemento. */
  function renderizarMatematica(elemento) {
    if (window.renderMathInElement) {
      window.renderMathInElement(elemento, { delimiters: DELIMITADORES, throwOnError: false });
    }
  }

  /** Renderiza una fórmula LaTeX (sin $) dentro de un elemento. */
  function renderizarFormula(elemento, latex, enBloque = true) {
    if (window.katex) {
      window.katex.render(latex, elemento, { displayMode: enBloque, throwOnError: false });
    } else {
      elemento.textContent = latex; // respaldo si KaTeX no cargó
    }
  }

  /* ---------------- Almacenamiento local seguro ---------------- */

  const almacen = {
    leer(clave, porDefecto = null) {
      try {
        const v = localStorage.getItem(clave);
        return v === null ? porDefecto : JSON.parse(v);
      } catch {
        return porDefecto;
      }
    },
    guardar(clave, valor) {
      try {
        localStorage.setItem(clave, JSON.stringify(valor));
        return true;
      } catch {
        return false;
      }
    },
    borrar(clave) {
      try {
        localStorage.removeItem(clave);
      } catch {
        /* sin acceso a localStorage: nada que borrar */
      }
    },
  };

  /* ---------------- Carga de scripts ---------------- */

  /** Carga un archivo .js y espera a que termine. Funciona también con file://. */
  function cargarScript(src) {
    return new Promise((resolver, rechazar) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolver(s);
      s.onerror = () => rechazar(new Error(`No se encontró el archivo «${src}».`));
      document.head.append(s);
    });
  }

  return {
    hashTexto,
    crearAleatorio,
    mezclar,
    generarIdIntento,
    letra,
    escaparHtml,
    textoPlano,
    redondear,
    formatearNumero,
    formatearDuracion,
    el,
    renderizarMatematica,
    renderizarFormula,
    almacen,
    cargarScript,
  };
})();
