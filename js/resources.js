/* =====================================================================
 * resources.js — RECURSOS que acompañan a una pregunta
 * ---------------------------------------------------------------------
 *   imagen    → <img> con texto alternativo
 *   grafico   → gráfico de funciones en SVG (sin librerías externas)
 *   geogebra  → applet de GeoGebra (se carga solo si alguna pregunta lo usa)
 * Cualquier pregunta, de cualquier tipo, puede incluir uno o varios.
 * ===================================================================== */

const Recursos = (() => {
  const { el } = Utils;
  const SVG = "http://www.w3.org/2000/svg";

  /** Crea un nodo SVG con atributos. */
  function svg(etiqueta, atributos = {}, texto) {
    const n = document.createElementNS(SVG, etiqueta);
    for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, v);
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  /* ---------------- Imagen ---------------- */

  function crearImagen(def) {
    const d = typeof def === "string" ? { src: def } : def;
    return el("figure", { class: "recurso recurso--imagen" }, [
      el("img", {
        src: d.src,
        alt: d.alt || "Imagen de la pregunta",
        loading: "lazy",
        style: d.ancho ? `max-width:${Number(d.ancho)}px` : null,
      }),
      d.pie ? el("figcaption", { html: d.pie }) : null,
    ]);
  }

  /* ---------------- Gráfico de funciones ---------------- */

  /** Paso "bonito" (1, 2, 5 × 10^n) para las marcas de los ejes. */
  function pasoBonito(rango, marcas = 8) {
    const bruto = rango / marcas;
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const n = bruto / potencia;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * potencia;
  }

  const formatoMarca = (v) => String(Math.round(v * 1000) / 1000).replace("-", "−");

  function crearGrafico(def) {
    const ANCHO = 640, ALTO = 380, M = { izq: 36, der: 16, sup: 14, inf: 30 };
    const [x0, x1] = def.x || [-10, 10];
    const [y0, y1] = def.y || [-10, 10];
    const px = (x) => M.izq + ((x - x0) / (x1 - x0)) * (ANCHO - M.izq - M.der);
    const py = (y) => ALTO - M.inf - ((y - y0) / (y1 - y0)) * (ALTO - M.sup - M.inf);

    const descripcion = (def.funciones || []).map((f) => `${f.etiqueta || "f(x)"} = ${f.expresion}`).join("; ");
    const raiz = svg("svg", {
      viewBox: `0 0 ${ANCHO} ${ALTO}`,
      class: "grafico",
      role: "img",
      "aria-label": def.descripcion || `Gráfico de ${descripcion}`,
    });

    // Cuadrícula y marcas
    const grupoEjes = svg("g", { class: "grafico__ejes" });
    const pasoX = def.pasoX || pasoBonito(x1 - x0);
    const pasoY = def.pasoY || pasoBonito(y1 - y0, 6);
    for (let x = Math.ceil(x0 / pasoX) * pasoX; x <= x1 + 1e-9; x += pasoX) {
      grupoEjes.append(svg("line", { x1: px(x), x2: px(x), y1: py(y0), y2: py(y1), class: "grafico__rejilla" }));
      if (Math.abs(x) > 1e-9 && x > x0 + pasoX / 2 && x < x1 - pasoX / 2) {
        const yEtiqueta = Math.min(Math.max(py(0) + 18, M.sup + 12), ALTO - 8);
        grupoEjes.append(svg("text", { x: px(x), y: yEtiqueta, class: "grafico__marca", "text-anchor": "middle" }, formatoMarca(x)));
      }
    }
    for (let y = Math.ceil(y0 / pasoY) * pasoY; y <= y1 + 1e-9; y += pasoY) {
      grupoEjes.append(svg("line", { x1: px(x0), x2: px(x1), y1: py(y), y2: py(y), class: "grafico__rejilla" }));
      if (Math.abs(y) > 1e-9 && y > y0 + pasoY / 2 && y < y1 - pasoY / 2) {
        const xEtiqueta = Math.min(Math.max(px(0) - 6, M.izq + 4), ANCHO - 30);
        grupoEjes.append(svg("text", { x: xEtiqueta, y: py(y) + 4, class: "grafico__marca", "text-anchor": "end" }, formatoMarca(y)));
      }
    }
    // Ejes x e y (si están dentro de la ventana)
    if (y0 <= 0 && y1 >= 0) grupoEjes.append(svg("line", { x1: px(x0), x2: px(x1), y1: py(0), y2: py(0), class: "grafico__eje" }));
    if (x0 <= 0 && x1 >= 0) grupoEjes.append(svg("line", { x1: px(0), x2: px(0), y1: py(y0), y2: py(y1), class: "grafico__eje" }));
    raiz.append(grupoEjes);

    // Recorte para que las curvas no salgan del área
    const idRecorte = `recorte-${Math.random().toString(36).slice(2, 8)}`;
    const defs = svg("defs");
    const clip = svg("clipPath", { id: idRecorte });
    clip.append(svg("rect", { x: M.izq, y: M.sup, width: ANCHO - M.izq - M.der, height: ALTO - M.sup - M.inf }));
    defs.append(clip);
    raiz.append(defs);
    const grupoCurvas = svg("g", { "clip-path": `url(#${idRecorte})` });

    (def.funciones || []).forEach((f, indice) => {
      let funcion;
      try {
        funcion = MathEngine.compilar(f.expresion, ["x"]);
      } catch (e) {
        console.warn(`Gráfico: la expresión «${f.expresion}» no es válida.`, e);
        return;
      }
      const muestras = 800;
      const altoVentana = y1 - y0;
      let d = "";
      let anterior = null;
      for (let i = 0; i <= muestras; i++) {
        const x = x0 + ((x1 - x0) * i) / muestras;
        const y = funcion({ x });
        const valido = Number.isFinite(y) && Math.abs(y - (y0 + y1) / 2) < altoVentana * 50;
        // Cortar el trazo en discontinuidades (asíntotas, puntos no definidos)
        const salto = anterior !== null && Math.abs(y - anterior) > altoVentana * 2;
        if (!valido) { anterior = null; continue; }
        d += `${anterior === null || salto ? "M" : "L"}${px(x).toFixed(2)},${py(y).toFixed(2)}`;
        anterior = y;
      }
      grupoCurvas.append(svg("path", { d, class: `grafico__curva grafico__curva--${(indice % 3) + 1}` }));
      if (f.etiqueta) {
        // Etiqueta cerca del extremo derecho visible de la curva
        const xe = x1 - (x1 - x0) * 0.12;
        const ye = funcion({ x: xe });
        if (Number.isFinite(ye) && ye > y0 && ye < y1) {
          grupoCurvas.append(svg("text", { x: px(xe), y: py(ye) - 14, class: "grafico__etiqueta", "text-anchor": "end" }, f.etiqueta));
        }
      }
    });

    (def.puntos || []).forEach((p) => {
      grupoCurvas.append(
        svg("circle", { cx: px(p.x), cy: py(p.y), r: 5.5, class: p.hueco ? "grafico__punto grafico__punto--hueco" : "grafico__punto" })
      );
    });
    raiz.append(grupoCurvas);

    return el("figure", { class: "recurso recurso--grafico" }, [raiz, def.pie ? el("figcaption", { html: def.pie }) : null]);
  }

  /* ---------------- GeoGebra ---------------- */

  let promesaGeoGebra = null;
  function cargarGeoGebra() {
    if (!promesaGeoGebra) promesaGeoGebra = Utils.cargarScript("https://www.geogebra.org/apps/deployggb.js");
    return promesaGeoGebra;
  }

  function crearGeoGebra(def) {
    const id = `ggb-${Math.random().toString(36).slice(2, 9)}`;
    const marco = el("div", { class: "recurso recurso--geogebra" }, [
      el("div", { id, class: "geogebra__lienzo", style: `min-height:${def.alto || 360}px` }, [
        el("p", { class: "geogebra__cargando", text: "Cargando GeoGebra…" }),
      ]),
    ]);

    // Se inyecta cuando el contenedor ya está en la página (para medir su ancho)
    requestAnimationFrame(() => {
      cargarGeoGebra()
        .then(() => {
          const lienzo = document.getElementById(id);
          if (!lienzo) return;
          const parametros = {
            appName: def.app || "graphing",
            width: Math.max(280, lienzo.clientWidth),
            height: def.alto || 360,
            showToolBar: !!def.herramientas,
            showAlgebraInput: !!def.entradaAlgebraica,
            showMenuBar: false,
            showResetIcon: true,
            enableShiftDragZoom: true,
            language: "es",
            appletOnLoad: (api) => (def.comandos || []).forEach((c) => api.evalCommand(c)),
          };
          if (def.materialId) parametros.material_id = def.materialId;
          new window.GGBApplet(parametros, true).inject(id);
        })
        .catch(() => {
          const lienzo = document.getElementById(id);
          if (lienzo) lienzo.innerHTML = '<p class="geogebra__cargando">No fue posible cargar GeoGebra. Verifique la conexión a Internet.</p>';
        });
    });
    return marco;
  }

  /** Devuelve los nodos de todos los recursos de una pregunta pública. */
  function crear(pub) {
    const nodos = [];
    if (pub.imagen) nodos.push(crearImagen(pub.imagen));
    if (pub.grafico) nodos.push(crearGrafico(pub.grafico));
    if (pub.geogebra) nodos.push(crearGeoGebra(pub.geogebra));
    return nodos;
  }

  return { crear, crearGrafico, crearImagen };
})();
