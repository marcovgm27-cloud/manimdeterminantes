/* =====================================================================
 * charts.js — Gráficos de barras en SVG para el panel docente
 * (sin librerías externas). Una sola serie por gráfico, un solo color,
 * con etiqueta de valor en cada barra e información al pasar el cursor.
 * ===================================================================== */

const Graficos = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = (etiqueta, atributos = {}, texto) => {
    const n = document.createElementNS(NS, etiqueta);
    for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, v);
    if (texto !== undefined) n.textContent = texto;
    return n;
  };

  /** Ancho real en píxeles: así el texto del gráfico conserva su tamaño en cualquier pantalla. */
  const anchoDe = (contenedor) => Math.max(300, Math.round(contenedor.clientWidth || 560));

  /** Rectángulo con las esquinas del extremo de datos redondeadas (4 px). */
  function rutaBarra(x, y, ancho, alto, horizontal) {
    const r = Math.min(4, horizontal ? ancho : alto, horizontal ? alto / 2 : ancho / 2);
    if (alto <= 0 || ancho <= 0) return "";
    if (horizontal) {
      // crece hacia la derecha: redondeo a la derecha
      return `M${x},${y}H${x + ancho - r}Q${x + ancho},${y} ${x + ancho},${y + r}V${y + alto - r}Q${x + ancho},${y + alto} ${x + ancho - r},${y + alto}H${x}Z`;
    }
    // crece hacia arriba: redondeo arriba
    return `M${x},${y + alto}V${y + r}Q${x},${y} ${x + r},${y}H${x + ancho - r}Q${x + ancho},${y} ${x + ancho},${y + r}V${y + alto}Z`;
  }

  /** Información emergente compartida por un contenedor. */
  function crearInfo(contenedor) {
    const info = document.createElement("div");
    info.className = "info-emergente";
    info.hidden = true;
    contenedor.append(info);
    return {
      mostrar(texto, x, y) {
        info.textContent = texto;
        info.style.left = `${x}px`;
        info.style.top = `${y}px`;
        info.hidden = false;
      },
      ocultar() { info.hidden = true; },
    };
  }

  /** Añade la zona sensible (más grande que la barra) y la interacción. */
  function zonaInteractiva(raiz, info, contenedor, rect, texto, ancla) {
    const zona = svg("rect", { ...rect, class: "barra-zona", tabindex: "0", role: "img", "aria-label": texto });
    const mostrar = () => {
      const caja = raiz.getBoundingClientRect();
      const escala = caja.width / raiz.viewBox.baseVal.width;
      const base = contenedor.getBoundingClientRect();
      info.mostrar(texto, caja.left - base.left + ancla.x * escala, caja.top - base.top + ancla.y * escala);
    };
    zona.addEventListener("mouseenter", mostrar);
    zona.addEventListener("focus", mostrar);
    zona.addEventListener("mouseleave", info.ocultar);
    zona.addEventListener("blur", info.ocultar);
    return zona;
  }

  function vacio(contenedor, texto = "Sin datos para mostrar.") {
    contenedor.replaceChildren(Object.assign(document.createElement("p"), { className: "vacio", textContent: texto }));
  }

  /**
   * Columnas verticales. datos: [{ etiqueta, valor, texto }]
   * opciones: { maximo, formato(valor) }
   */
  function columnas(contenedor, datos, { maximo, formato = String, umbral = null, enteros = false } = {}) {
    if (!datos.length || datos.every((d) => !d.valor)) return vacio(contenedor);
    contenedor.replaceChildren();
    contenedor.classList.add("grafico-barras");
    const ANCHO = anchoDe(contenedor), ALTO = 260, M = { izq: 34, der: 8, sup: 22, inf: 30 };
    let max = maximo || Math.max(...datos.map((d) => d.valor)) || 1;
    if (enteros) max = Math.max(4, Math.ceil(max / 4) * 4); // marcas enteras en el eje
    const area = ANCHO - M.izq - M.der;
    const banda = area / datos.length;
    const grosor = Math.min(24, banda * 0.6);
    const py = (v) => ALTO - M.inf - (v / max) * (ALTO - M.sup - M.inf);
    const raiz = svg("svg", { viewBox: `0 0 ${ANCHO} ${ALTO}`, role: "group" });
    const info = crearInfo(contenedor);

    // Rejilla horizontal recesiva (4 divisiones)
    for (let i = 0; i <= 4; i++) {
      const v = (max * i) / 4;
      raiz.append(svg("line", { x1: M.izq, x2: ANCHO - M.der, y1: py(v), y2: py(v), class: i ? "rejilla-linea" : "eje-linea" }));
      raiz.append(svg("text", { x: M.izq - 6, y: py(v) + 4, class: "eje-texto", "text-anchor": "end" }, formato(Math.round(v * 10) / 10)));
    }
    datos.forEach((d, i) => {
      const cx = M.izq + banda * i + banda / 2;
      const y = py(d.valor);
      const alto = ALTO - M.inf - y;
      raiz.append(
        zonaInteractiva(raiz, info, contenedor, { x: cx - banda / 2, y: M.sup, width: banda, height: ALTO - M.sup - M.inf }, d.texto || `${d.etiqueta}: ${formato(d.valor)}`, { x: cx, y })
      );
      raiz.append(svg("path", { d: rutaBarra(cx - grosor / 2, y, grosor, alto, false), class: umbral !== null && d.limite < umbral ? "barra barra--baja" : "barra" }));
      if (d.valor) raiz.append(svg("text", { x: cx, y: y - 6, class: "eje-texto eje-texto--valor", "text-anchor": "middle" }, formato(d.valor)));
      raiz.append(svg("text", { x: cx, y: ALTO - M.inf + 18, class: "eje-texto", "text-anchor": "middle" }, d.etiqueta));
    });
    contenedor.prepend(raiz);
  }

  /**
   * Barras horizontales. datos: [{ etiqueta, subetiqueta, valor, texto }]
   * opciones: { maximo, formato(valor) }
   */
  function barras(contenedor, datos, { maximo, formato = String } = {}) {
    if (!datos.length) return vacio(contenedor);
    contenedor.replaceChildren();
    contenedor.classList.add("grafico-barras");
    const FILA = 34, ANCHO = anchoDe(contenedor), M = { izq: 150, der: 52, sup: 6, inf: 6 };
    const ALTO = M.sup + M.inf + FILA * datos.length;
    const max = maximo || Math.max(...datos.map((d) => d.valor)) || 1;
    const px = (v) => M.izq + (v / max) * (ANCHO - M.izq - M.der);
    const raiz = svg("svg", { viewBox: `0 0 ${ANCHO} ${ALTO}`, role: "group" });
    const info = crearInfo(contenedor);
    const grosor = Math.min(18, FILA * 0.55);

    raiz.append(svg("line", { x1: M.izq, x2: M.izq, y1: M.sup, y2: ALTO - M.inf, class: "eje-linea" }));
    datos.forEach((d, i) => {
      const cy = M.sup + FILA * i + FILA / 2;
      const ancho = px(d.valor) - M.izq;
      raiz.append(
        zonaInteractiva(raiz, info, contenedor, { x: 0, y: cy - FILA / 2, width: ANCHO, height: FILA }, d.texto || `${d.etiqueta}: ${formato(d.valor)}`, { x: px(d.valor), y: cy - grosor / 2 })
      );
      raiz.append(svg("path", { d: rutaBarra(M.izq, cy - grosor / 2, Math.max(ancho, 0.01), grosor, true), class: "barra" }));
      raiz.append(svg("text", { x: M.izq - 10, y: cy + (d.subetiqueta ? -2 : 4), class: "eje-texto eje-texto--valor", "text-anchor": "end" }, d.etiqueta));
      if (d.subetiqueta) raiz.append(svg("text", { x: M.izq - 10, y: cy + 12, class: "eje-texto", "text-anchor": "end" }, d.subetiqueta));
      raiz.append(svg("text", { x: px(d.valor) + 8, y: cy + 4, class: "eje-texto eje-texto--valor" }, formato(d.valor)));
    });
    contenedor.prepend(raiz);
  }

  return { columnas, barras, vacio };
})();
