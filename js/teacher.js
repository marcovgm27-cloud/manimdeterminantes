/* =====================================================================
 * teacher.js — PANEL DOCENTE (docente.html)
 * ---------------------------------------------------------------------
 * - Descarga los resultados desde Google Sheets (vía Apps Script).
 * - Calcula indicadores, distribución de notas y rendimiento por pregunta.
 * - Exporta CSV (y enlaza la descarga .xlsx de Google Sheets).
 * - Muestra el banco de preguntas y genera una versión protegida.
 * ===================================================================== */

(() => {
  "use strict";

  const CONFIG = window.CONFIG;
  const { el, formatearNumero, renderizarMatematica, renderizarFormula, escaparHtml } = Utils;
  const $ = (id) => document.getElementById(id);
  const CLAVE_SESION = "retoMat.docente.clave";

  /* Columnas para el CSV de resultados (mismo orden que la hoja "Resultados" de Code.gs) */
  const COLUMNAS_RESULTADOS = [
    ["fecha", "Fecha y hora"], ["idIntento", "ID intento"], ["nombre", "Nombre"], ["carne", "Carné"],
    ["grupo", "Grupo"], ["cursoCodigo", "Curso"], ["actividadCodigo", "Código actividad"], ["actividad", "Actividad"],
    ["cantidadPreguntas", "Cantidad de preguntas"], ["correctas", "Correctas"], ["incorrectas", "Incorrectas"],
    ["puntajeObtenido", "Puntaje obtenido"], ["puntajeMaximo", "Puntaje máximo"], ["porcentaje", "Porcentaje"],
    ["nota", "Nota"], ["notaMaxima", "Nota máxima"], ["tiempoTotalSeg", "Tiempo total (s)"],
    ["inicio", "Inicio (estudiante)"], ["fin", "Fin (estudiante)"], ["finalizadoPorTiempo", "Terminó por tiempo"],
  ];
  const COLUMNAS_RESPUESTAS = [
    ["fecha", "Fecha y hora"], ["idIntento", "ID intento"], ["carne", "Carné"], ["nombre", "Nombre"], ["grupo", "Grupo"],
    ["actividadCodigo", "Código actividad"], ["n", "N.º"], ["idPregunta", "ID pregunta"], ["tema", "Tema"], ["tipo", "Tipo"],
    ["dificultad", "Dificultad"], ["respuesta", "Respuesta dada"], ["correcta", "Respuesta correcta"], ["estado", "Resultado"],
    ["puntos", "Puntos"], ["puntajeMax", "Puntaje máximo"], ["tiempoSeg", "Tiempo (s)"],
  ];

  let datos = null;              // { resultados, respuestas, hoja }
  let filtrados = { resultados: [], respuestas: [] };
  let orden = { campo: "fecha", sentido: -1 };
  let bancoCrudo = null;         // preguntas tal como están en questions.js

  document.addEventListener("DOMContentLoaded", iniciar);

  function iniciar() {
    const curso = `${CONFIG.curso.codigo} · ${CONFIG.curso.nombre}`;
    document.querySelectorAll('[data-campo="curso"]').forEach((n) => (n.textContent = curso));
    document.querySelectorAll('[data-campo="pie"]').forEach((n) => (n.textContent = `${CONFIG.curso.nombre} · ${CONFIG.curso.periodo || ""}`));

    try { $("clave").value = sessionStorage.getItem(CLAVE_SESION) || ""; } catch { /* sin sessionStorage */ }
    $("form-acceso").addEventListener("submit", (e) => { e.preventDefault(); cargarDesdeServidor(); });
    $("btn-demo").addEventListener("click", cargarDemostracion);
    ["f-actividad", "f-grupo", "f-intentos"].forEach((id) => $(id).addEventListener("change", aplicarFiltros));
    $("f-buscar").addEventListener("input", aplicarFiltros);
    $("btn-csv").addEventListener("click", descargarResumen);
    $("btn-csv-detalle").addEventListener("click", descargarDetalle);
    $("btn-ver-banco").addEventListener("click", mostrarBanco);
    $("btn-proteger").addEventListener("click", generarBancoProtegido);

    // Redibujar los gráficos al cambiar el tamaño de la ventana
    let espera;
    window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(aplicarFiltros, 200); });

    if (!Api.estaConfigurado()) {
      mensaje("atencion", "<strong>Falta conectar Google Sheets.</strong><p>Pegue la URL del Web App en <code>envio.urlAppsScript</code> dentro de <code>js/config.js</code>. Mientras tanto puede explorar el panel con «Ver datos de ejemplo».</p>");
    }
  }

  function mensaje(tipo, html) {
    const caja = $("estado-carga");
    caja.className = `mensaje mensaje--${tipo} mensaje--visible`;
    caja.innerHTML = html;
  }

  /* =================================================================
   * Carga de datos
   * ================================================================= */

  async function cargarDesdeServidor() {
    const clave = $("clave").value.trim();
    if (!clave) { mensaje("atencion", "Escriba la clave docente."); $("clave").focus(); return; }
    const boton = $("btn-cargar");
    boton.disabled = true;
    boton.textContent = "Cargando…";
    try {
      const r = await Api.obtenerResultados(clave);
      try { sessionStorage.setItem(CLAVE_SESION, clave); } catch { /* opcional */ }
      usarDatos({ resultados: r.resultados || [], respuestas: r.respuestas || [], hoja: r.hoja || null });
      mensaje("exito", `<strong>Datos actualizados.</strong> ${r.resultados.length} intentos leídos de «${escaparHtml(r.hoja?.nombre || "Google Sheets")}» (${escaparHtml(r.generado || "")}).`);
    } catch (e) {
      mensaje("error", `<strong>No fue posible cargar los resultados.</strong><p>${escaparHtml(e.message)}</p>`);
    } finally {
      boton.disabled = false;
      boton.textContent = "Cargar resultados";
    }
  }

  async function cargarDemostracion() {
    await cargarBancoCrudo().catch(() => null);
    usarDatos(generarDatosEjemplo());
    mensaje("neutro", "<strong>Datos de ejemplo.</strong> Son datos inventados para conocer el panel; no provienen de Google Sheets.");
  }

  /** Convierte números que lleguen como texto y guarda los datos. */
  function usarDatos(d) {
    const num = (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(",", ".")));
    d.resultados.forEach((r) => {
      ["cantidadPreguntas", "correctas", "incorrectas", "puntajeObtenido", "puntajeMaximo", "porcentaje", "nota", "notaMaxima", "tiempoTotalSeg"]
        .forEach((k) => (r[k] = num(r[k])));
      r.p = Array.isArray(r.p) ? r.p : [];
    });
    d.respuestas.forEach((r) => ["n", "puntos", "puntajeMax", "tiempoSeg"].forEach((k) => (r[k] = num(r[k]))));
    datos = d;

    llenarSelect($("f-actividad"), "Todas las actividades", unicos(d.resultados.map((r) => r.actividadCodigo)), (c) => {
      const r = d.resultados.find((x) => x.actividadCodigo === c);
      return r && r.actividad ? `${r.actividad} (${c})` : c;
    });
    llenarSelect($("f-grupo"), "Todos los grupos", unicos(d.resultados.map((r) => r.grupo)));
    if (d.hoja && d.hoja.id) {
      $("btn-xlsx").href = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(d.hoja.id)}/export?format=xlsx`;
      $("btn-hoja").href = d.hoja.url;
      $("btn-xlsx").hidden = $("btn-hoja").hidden = false;
    } else {
      $("btn-xlsx").hidden = $("btn-hoja").hidden = true;
    }
    $("zona-datos").hidden = false;
    aplicarFiltros();
  }

  const unicos = (lista) => [...new Set(lista.filter((v) => v !== "" && v !== null && v !== undefined))].sort((a, b) => String(a).localeCompare(String(b), "es", { numeric: true }));

  function llenarSelect(select, textoTodos, valores, etiqueta = (v) => v) {
    const actual = select.value;
    select.replaceChildren(el("option", { value: "", text: textoTodos }), ...valores.map((v) => el("option", { value: v, text: etiqueta(v) })));
    if (valores.includes(actual)) select.value = actual;
  }

  /* =================================================================
   * Filtros y cálculo de indicadores
   * ================================================================= */

  function aplicarFiltros() {
    if (!datos) return;
    const actividad = $("f-actividad").value;
    const grupo = $("f-grupo").value;
    const modo = $("f-intentos").value;
    const texto = $("f-buscar").value.trim().toLowerCase();

    let lista = datos.resultados.filter(
      (r) =>
        (!actividad || r.actividadCodigo === actividad) &&
        (!grupo || r.grupo === grupo) &&
        (!texto || `${r.nombre} ${r.carne}`.toLowerCase().includes(texto))
    );
    if (modo !== "todos") {
      const porEstudiante = new Map();
      lista.forEach((r) => {
        const clave = `${String(r.carne).toUpperCase()}|${r.actividadCodigo}`;
        const previo = porEstudiante.get(clave);
        const mejor = modo === "ultimo" ? !previo || r.fecha > previo.fecha : !previo || r.porcentaje > previo.porcentaje;
        if (mejor) porEstudiante.set(clave, r);
      });
      lista = [...porEstudiante.values()];
    }
    const ids = new Set(lista.map((r) => r.idIntento));
    filtrados = { resultados: lista, respuestas: datos.respuestas.filter((r) => ids.has(r.idIntento)) };

    dibujarIndicadores();
    dibujarDistribucion();
    dibujarGrupos();
    dibujarPreguntas();
    dibujarTabla();
  }

  function estadisticas(valores) {
    if (!valores.length) return { n: 0, promedio: null, max: null, min: null, mediana: null };
    const ordenados = valores.slice().sort((a, b) => a - b);
    const m = Math.floor(ordenados.length / 2);
    return {
      n: valores.length,
      promedio: valores.reduce((s, v) => s + v, 0) / valores.length,
      max: ordenados[ordenados.length - 1],
      min: ordenados[0],
      mediana: ordenados.length % 2 ? ordenados[m] : (ordenados[m - 1] + ordenados[m]) / 2,
    };
  }

  function dibujarIndicadores() {
    const lista = filtrados.resultados;
    const notas = lista.map((r) => r.nota).filter((v) => v !== null);
    const e = estadisticas(notas);
    const estudiantes = new Set(lista.map((r) => String(r.carne).toUpperCase())).size;
    const aprobados = notas.filter((n) => n >= CONFIG.calificacion.notaAprobacion).length;
    const escala = lista[0]?.notaMaxima ?? CONFIG.calificacion.notaMaxima;
    const tarjeta = (etiqueta, valor, detalle) =>
      el("div", { class: "indicador" }, [
        el("p", { class: "indicador__etiqueta", text: etiqueta }),
        el("p", { class: "indicador__valor", text: valor }),
        detalle ? el("p", { class: "indicador__detalle", text: detalle }) : null,
      ]);
    $("indicadores").replaceChildren(
      tarjeta("Estudiantes", String(estudiantes), `${lista.length} ${lista.length === 1 ? "intento" : "intentos"}`),
      tarjeta("Promedio", formatearNumero(e.promedio), `Mediana ${formatearNumero(e.mediana)} · escala 0–${escala}`),
      tarjeta("Nota máxima", formatearNumero(e.max)),
      tarjeta("Nota mínima", formatearNumero(e.min)),
      tarjeta("Aprobación", notas.length ? `${formatearNumero((aprobados / notas.length) * 100, 0)}%` : "—", `Nota ≥ ${CONFIG.calificacion.notaAprobacion}`)
    );
  }

  function dibujarDistribucion() {
    const rangos = Array.from({ length: 10 }, (_, i) => ({ desde: i * 10, hasta: i === 9 ? 100 : i * 10 + 9.999, valor: 0 }));
    filtrados.resultados.forEach((r) => {
      if (r.porcentaje === null) return;
      rangos[Math.min(9, Math.floor(r.porcentaje / 10))].valor++;
    });
    const umbralPct = (CONFIG.calificacion.notaAprobacion / CONFIG.calificacion.notaMaxima) * 100;
    Graficos.columnas(
      $("g-distribucion"),
      rangos.map((r) => ({
        etiqueta: `${r.desde}`,
        valor: r.valor,
        limite: r.desde + 10,
        texto: `${r.desde}–${r.desde === 90 ? 100 : r.desde + 9} %: ${r.valor} ${r.valor === 1 ? "intento" : "intentos"}`,
      })),
      { formato: (v) => formatearNumero(v, 0), umbral: umbralPct + 0.001, enteros: true }
    );
  }

  function dibujarGrupos() {
    const grupos = new Map();
    filtrados.resultados.forEach((r) => {
      if (r.nota === null) return;
      if (!grupos.has(r.grupo)) grupos.set(r.grupo, []);
      grupos.get(r.grupo).push(r.nota);
    });
    const lista = [...grupos.entries()]
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "es", { numeric: true }))
      .map(([g, notas]) => {
        const p = notas.reduce((s, v) => s + v, 0) / notas.length;
        return { etiqueta: g, subetiqueta: `${notas.length} ${notas.length === 1 ? "intento" : "intentos"}`, valor: p, texto: `${g}: promedio ${formatearNumero(p)} (${notas.length})` };
      });
    const escala = filtrados.resultados[0]?.notaMaxima ?? CONFIG.calificacion.notaMaxima;
    Graficos.barras($("g-grupos"), lista, { maximo: escala, formato: (v) => formatearNumero(v) });
  }

  function dibujarPreguntas() {
    const preguntas = new Map();
    filtrados.respuestas.forEach((r) => {
      if (!preguntas.has(r.idPregunta)) preguntas.set(r.idPregunta, { tema: r.tema, puntos: 0, max: 0, n: 0, correctas: 0, tiempo: 0 });
      const p = preguntas.get(r.idPregunta);
      p.puntos += r.puntos || 0;
      p.max += r.puntajeMax || 0;
      p.n++;
      p.tiempo += r.tiempoSeg || 0;
      if (r.estado === "correcta") p.correctas++;
    });
    const lista = [...preguntas.entries()]
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "es", { numeric: true }))
      .map(([id, p]) => {
        const pct = p.max ? (p.puntos / p.max) * 100 : 0;
        return {
          etiqueta: id,
          subetiqueta: p.tema,
          valor: pct,
          texto: `${id} · ${p.tema}: ${formatearNumero(pct)} % de acierto · ${p.correctas}/${p.n} correctas · ${formatearNumero(p.tiempo / p.n, 0)} s promedio`,
        };
      });
    Graficos.barras($("g-preguntas"), lista, { maximo: 100, formato: (v) => `${formatearNumero(v, 0)}%` });
  }

  /* ---------------- Tabla de intentos ---------------- */

  const COLUMNAS_TABLA = [
    ["fecha", "Fecha"], ["nombre", "Nombre"], ["carne", "Carné"], ["grupo", "Grupo"], ["actividadCodigo", "Actividad"],
    ["correctas", "Correctas", true], ["puntajeObtenido", "Puntaje", true], ["porcentaje", "%", true], ["nota", "Nota", true],
    ["tiempoTotalSeg", "Tiempo", true], ["idIntento", "ID intento"],
  ];

  function dibujarTabla() {
    const tabla = $("tabla");
    const lista = filtrados.resultados.slice().sort((a, b) => {
      const x = a[orden.campo], y = b[orden.campo];
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es", { numeric: true })) * orden.sentido;
    });
    const cabecera = el("tr", {}, COLUMNAS_TABLA.map(([campo, titulo, numerico]) =>
      el("th", {
        scope: "col",
        class: numerico ? "num" : null,
        tabindex: "0",
        "aria-sort": orden.campo === campo ? (orden.sentido > 0 ? "ascending" : "descending") : null,
        text: titulo,
        onclick: () => ordenarPor(campo),
        onkeydown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ordenarPor(campo)),
      })
    ));
    const aprobacion = CONFIG.calificacion.notaAprobacion;
    const filas = lista.map((r) =>
      el("tr", {}, [
        el("td", { text: r.fecha }),
        el("td", { text: r.nombre }),
        el("td", { text: r.carne }),
        el("td", { text: r.grupo }),
        el("td", { text: r.actividadCodigo }),
        el("td", { class: "num", text: `${r.correctas ?? "—"} / ${r.cantidadPreguntas ?? "—"}` }),
        el("td", { class: "num", text: `${formatearNumero(r.puntajeObtenido, 2)} / ${formatearNumero(r.puntajeMaximo, 2)}` }),
        el("td", { class: "num", text: formatearNumero(r.porcentaje) }),
        el("td", { class: "num" }, [el("span", { class: `etiqueta-estado ${r.nota >= aprobacion ? "etiqueta-estado--ok" : "etiqueta-estado--bajo"}`, text: formatearNumero(r.nota) })]),
        el("td", { class: "num", text: Utils.formatearDuracion(r.tiempoTotalSeg) }),
        el("td", {}, [el("code", { text: r.idIntento })]),
      ])
    );
    tabla.replaceChildren(el("thead", {}, cabecera), el("tbody", {}, filas.length ? filas : el("tr", {}, el("td", { colspan: String(COLUMNAS_TABLA.length), class: "vacio", text: "No hay intentos con estos filtros." }))));
    $("tabla-sub").textContent = `${lista.length} de ${datos.resultados.length} intentos. Las descargas incluyen solo los intentos filtrados.`;
  }

  function ordenarPor(campo) {
    orden = { campo, sentido: orden.campo === campo ? -orden.sentido : 1 };
    dibujarTabla();
  }

  /* =================================================================
   * Descargas
   * ================================================================= */

  function celdaCSV(valor, separador) {
    if (valor === null || valor === undefined) return "";
    let texto = typeof valor === "number" && separador === ";" ? String(valor).replace(".", ",") : String(valor);
    if (/^(=|\+|@|-(?!\d))/.test(texto) && typeof valor !== "number") texto = `'${texto}`; // evita fórmulas al abrir en Excel
    return /["\n\r;,]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  }

  function descargarCSV(nombre, encabezados, filas) {
    const sep = CONFIG.docente.separadorCSV || ";";
    const lineas = [encabezados, ...filas].map((f) => f.map((v) => celdaCSV(v, sep)).join(sep));
    // ﻿ (BOM) hace que Excel reconozca los acentos (UTF-8)
    const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const enlace = el("a", { href: URL.createObjectURL(blob), download: nombre });
    document.body.append(enlace);
    enlace.click();
    setTimeout(() => { URL.revokeObjectURL(enlace.href); enlace.remove(); }, 1000);
  }

  const fechaArchivo = () => new Date().toISOString().slice(0, 10);
  const nombreBase = () => `${CONFIG.curso.codigo}_${$("f-actividad").value || "todas"}_${fechaArchivo()}`;

  function descargarResumen() {
    const maxP = Math.max(0, ...filtrados.resultados.map((r) => r.p.length));
    const encabezados = [...COLUMNAS_RESULTADOS.map((c) => c[1]), ...Array.from({ length: maxP }, (_, i) => `P${i + 1}`)];
    const filas = filtrados.resultados.map((r) => [...COLUMNAS_RESULTADOS.map((c) => r[c[0]]), ...Array.from({ length: maxP }, (_, i) => r.p[i] ?? "")]);
    descargarCSV(`resultados_${nombreBase()}.csv`, encabezados, filas);
  }

  function descargarDetalle() {
    descargarCSV(
      `respuestas_${nombreBase()}.csv`,
      COLUMNAS_RESPUESTAS.map((c) => c[1]),
      filtrados.respuestas.map((r) => COLUMNAS_RESPUESTAS.map((c) => r[c[0]]))
    );
  }

  /* =================================================================
   * Banco de preguntas: revisión y versión protegida
   * ================================================================= */

  async function cargarBancoCrudo() {
    if (bancoCrudo) return bancoCrudo;
    if (!window.BANCO_PREGUNTAS) await Utils.cargarScript(CONFIG.preguntas.archivo);
    bancoCrudo = (window.BANCO_PREGUNTAS || []).slice();
    return bancoCrudo;
  }

  async function mostrarBanco() {
    const zona = $("banco");
    try {
      await cargarBancoCrudo();
    } catch (e) {
      zona.replaceChildren(el("div", { class: "aviso aviso--error", text: e.message }));
      return;
    }
    const vistos = new Set();
    const items = bancoCrudo.map((p, i) => {
      const errores = BancoPreguntas.validarPregunta(p, vistos);
      if (p?.id) vistos.add(p.id);
      const inactiva = p?.activa === false;
      let respuesta = "";
      if (!errores.length) {
        const tipo = TIPOS_PREGUNTA[p.tipo];
        const clave = tipo.normalizarClave({ ...p, respuestaCorrecta: BancoPreguntas.leerRespuesta(p) });
        respuesta = tipo.describirClave(clave, p).html;
      }
      const formula = p?.formula ? el("div", { class: "reto__formula" }) : null;
      if (formula) renderizarFormula(formula, p.formula, true);
      return el("article", { class: `banco-item ${errores.length ? "banco-item--error" : ""} ${inactiva ? "banco-item--inactiva" : ""}` }, [
        el("div", { class: "banco-item__cabecera" }, [
          el("strong", { text: p?.id || `Pregunta #${i + 1}` }),
          el("span", { text: [TIPOS_PREGUNTA[p?.tipo]?.etiqueta || p?.tipo, p?.tema, p?.dificultad, `${p?.puntaje ?? CONFIG.preguntas.puntajePorDefecto} pt`].filter(Boolean).join(" · ") }),
          inactiva ? el("span", { class: "chip", text: "inactiva" }) : null,
        ]),
        el("div", { html: p?.enunciado || "" }),
        formula,
        ...(p ? Recursos.crear(p) : []),
        p?.opciones ? el("ol", { type: "A" }, p.opciones.map((o) => el("li", { html: o }))) : null,
        respuesta ? el("p", { class: "banco-item__respuesta", html: `Respuesta correcta: ${respuesta}` }) : null,
        errores.length ? el("p", { class: "campo__error", text: errores.join(" ") }) : null,
      ]);
    });
    const activas = bancoCrudo.filter((p) => p?.activa !== false).length;
    zona.replaceChildren(
      el("p", { class: "seccion-sub", text: `${bancoCrudo.length} preguntas en ${CONFIG.preguntas.archivo} · ${activas} activas.` }),
      el("div", { class: "banco-lista" }, items)
    );
    renderizarMatematica(zona);
  }

  /** Descarga questions.protegido.js: igual al banco, pero con las respuestas ofuscadas. */
  async function generarBancoProtegido() {
    try {
      await cargarBancoCrudo();
    } catch (e) {
      $("banco").replaceChildren(el("div", { class: "aviso aviso--error", text: e.message }));
      return;
    }
    const protegido = bancoCrudo.map((p) => {
      if (!p || p.clave !== undefined || p.respuestaCorrecta === undefined) return p;
      const { respuestaCorrecta, ...resto } = p;
      return { ...resto, clave: Proteccion.codificar(respuestaCorrecta, p.id) };
    });
    const texto =
      "/* Banco de preguntas PROTEGIDO, generado desde docente.html el " + new Date().toLocaleString("es") + ".\n" +
      " * Las respuestas correctas están ofuscadas en el campo «clave».\n" +
      " * Para editar preguntas use su questions.js original y vuelva a generar este archivo. */\n\n" +
      "window.BANCO_PREGUNTAS = " + JSON.stringify(protegido, null, 2) + ";\n";
    const enlace = el("a", { href: URL.createObjectURL(new Blob([texto], { type: "text/javascript" })), download: "questions.protegido.js" });
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    $("banco").replaceChildren(
      el("div", {
        class: "aviso aviso--info",
        html:
          "<strong>Se descargó <code>questions.protegido.js</code>.</strong>" +
          "<span>1. Súbalo a la carpeta <code>js/</code> del repositorio. 2. En <code>js/config.js</code> cambie <code>archivo</code> a <code>\"js/questions.protegido.js\"</code>. " +
          "3. Para que las respuestas no queden públicas, guarde su <code>questions.js</code> original en su computadora y elimínelo del repositorio publicado (ver README, sección Seguridad).</span>",
      })
    );
  }

  /* =================================================================
   * Datos de ejemplo
   * ================================================================= */

  function generarDatosEjemplo() {
    const azar = Utils.crearAleatorio("demo-panel");
    const preguntas = (bancoCrudo || []).filter((p) => p && p.activa !== false).map((p) => ({ id: p.id, tema: p.tema || "", tipo: p.tipo }));
    if (!preguntas.length) preguntas.push({ id: "P-1", tema: "Demo", tipo: "unica" }, { id: "P-2", tema: "Demo", tipo: "unica" });
    const dificultad = preguntas.map(() => 0.45 + azar() * 0.45);
    const nombres = ["Ana", "Luis", "María", "José", "Sofía", "Daniel", "Valeria", "Andrés", "Camila", "Diego", "Paula", "Jorge", "Lucía", "Mateo", "Elena", "Carlos"];
    const apellidos = ["Rojas", "Mora", "Vargas", "Jiménez", "Solís", "Castro", "Araya", "Chaves", "Quesada", "Brenes"];
    const resultados = [], respuestas = [];
    const grupos = CONFIG.grupos.slice(0, 3);
    for (let i = 0; i < 42; i++) {
      const habilidad = 0.25 + azar() * 0.75;
      const id = Utils.generarIdIntento(CONFIG.curso.codigo);
      const carne = `C${String(10000 + Math.floor(azar() * 89999))}`;
      const fecha = `2026-10-${String(1 + Math.floor(azar() * 20)).padStart(2, "0")} ${String(8 + Math.floor(azar() * 9)).padStart(2, "0")}:${String(Math.floor(azar() * 60)).padStart(2, "0")}:00`;
      const base = {
        idIntento: id, carne, grupo: grupos[i % grupos.length],
        nombre: `${nombres[Math.floor(azar() * nombres.length)]} ${apellidos[Math.floor(azar() * apellidos.length)]}`,
        actividadCodigo: CONFIG.actividad.codigo,
      };
      let correctas = 0, tiempo = 0;
      const p = preguntas.map((q, k) => {
        const ok = azar() < habilidad * dificultad[k] * 1.35;
        const t = 20 + Math.floor(azar() * 120);
        tiempo += t;
        if (ok) correctas++;
        respuestas.push({ ...base, fecha, n: k + 1, idPregunta: q.id, tema: q.tema, tipo: q.tipo, dificultad: "", respuesta: ok ? "correcta" : "otra", correcta: "correcta", estado: ok ? "correcta" : "incorrecta", puntos: ok ? 1 : 0, puntajeMax: 1, tiempoSeg: t });
        return ok ? "✓" : "✗";
      });
      const porcentaje = Utils.redondear((correctas / preguntas.length) * 100, 2);
      resultados.push({
        ...base, fecha, cursoCodigo: CONFIG.curso.codigo, actividad: CONFIG.actividad.nombre,
        cantidadPreguntas: preguntas.length, correctas, incorrectas: preguntas.length - correctas,
        puntajeObtenido: correctas, puntajeMaximo: preguntas.length, porcentaje,
        nota: Utils.redondear((porcentaje / 100) * CONFIG.calificacion.notaMaxima, CONFIG.calificacion.decimales),
        notaMaxima: CONFIG.calificacion.notaMaxima, tiempoTotalSeg: tiempo, inicio: "", fin: "", finalizadoPorTiempo: false, p,
      });
    }
    return { resultados, respuestas, hoja: null };
  }
})();
