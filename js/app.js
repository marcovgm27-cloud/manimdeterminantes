/* =====================================================================
 * app.js — APLICACIÓN DEL ESTUDIANTE
 * ---------------------------------------------------------------------
 * Pantallas:  identificación → retos (uno por tarjeta) → resultado y envío.
 *
 * El progreso se guarda en el navegador después de cada respuesta, de modo
 * que si la página se recarga o se pierde la conexión, el estudiante
 * continúa donde estaba y no pierde sus respuestas.
 * ===================================================================== */

(() => {
  "use strict";

  const CONFIG = window.CONFIG;
  const { el, renderizarMatematica, renderizarFormula, formatearNumero, formatearDuracion, almacen } = Utils;

  const raiz = document.getElementById("app");
  const barraProgreso = document.getElementById("progreso-barra");
  const contenedorProgreso = document.getElementById("progreso");
  const cronometro = document.getElementById("cronometro");

  /* Claves de almacenamiento local (una por actividad y carné) */
  const prefijo = `retoMat.${CONFIG.curso.codigo}.${CONFIG.actividad.codigo}`;
  const claveIntento = (carne) => `${prefijo}.intento.${carne.toUpperCase()}`;
  const CLAVE_ULTIMO = `${prefijo}.ultimo`;

  /* Estado en memoria */
  let intento = null;      // datos persistentes del intento (ver crearIntento)
  let preguntas = [];      // preguntas públicas del intento (sin respuestas)
  let control = null;      // controlador de la pregunta en pantalla
  let temporizador = null; // intervalo del cronómetro

  /* =================================================================
   * Inicio
   * ================================================================= */

  // Si questions.js tiene un error de escritura, mostrarlo de forma clara.
  let errorBanco = null;
  window.addEventListener("error", (e) => {
    if (e.filename && /question/i.test(e.filename)) errorBanco = `${e.message} (línea ${e.lineno})`;
  });

  document.addEventListener("DOMContentLoaded", iniciar);

  async function iniciar() {
    rellenarEncabezado();
    try {
      const { total } = await BancoPreguntas.cargar(CONFIG);
      if (!total) throw new Error("El banco no tiene preguntas activas. Revise js/questions.js.");
    } catch (e) {
      mostrarError("No fue posible cargar las preguntas.", errorBanco ? `Error en el banco de preguntas: ${errorBanco}` : e.message);
      return;
    }
    window.addEventListener("beforeunload", advertirSalida);
    window.addEventListener("online", reintentarPendientesEnSegundoPlano);

    // ¿Hay un intento sin terminar o sin enviar en este navegador?
    const ultimo = almacen.leer(CLAVE_ULTIMO);
    const guardado = ultimo && almacen.leer(claveIntento(ultimo.carne));
    if (guardado && guardado.estado !== "enviado") {
      reanudar(guardado);
    } else {
      pantallaIdentificacion(ultimo);
    }
    reintentarPendientesEnSegundoPlano();
  }

  function rellenarEncabezado() {
    const curso = `${CONFIG.curso.codigo} · ${CONFIG.curso.nombre}`;
    document.title = `${CONFIG.actividad.nombre} — ${CONFIG.curso.codigo}`;
    document.querySelectorAll('[data-campo="curso"]').forEach((n) => (n.textContent = curso));
    document.querySelectorAll('[data-campo="actividad"]').forEach((n) => (n.textContent = CONFIG.actividad.nombre));
    document.querySelectorAll('[data-campo="pie"]').forEach((n) => (n.textContent = `${CONFIG.curso.nombre} · ${CONFIG.curso.periodo || ""}`));
  }

  /** Cambia el contenido principal y lleva el foco al inicio. */
  function mostrar(nodo) {
    raiz.replaceChildren(nodo);
    renderizarMatematica(nodo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function mostrarError(titulo, detalle) {
    mostrar(
      el("section", { class: "tarjeta tarjeta--centrada" }, [
        el("h1", { class: "titulo", text: titulo }),
        el("div", { class: "aviso aviso--error", text: detalle }),
      ])
    );
  }

  /* =================================================================
   * Pantalla 1: identificación
   * ================================================================= */

  function campo(id, etiqueta, entrada, ayuda) {
    return el("div", { class: "campo" }, [
      el("label", { class: "campo__etiqueta", for: id, text: etiqueta }),
      entrada,
      ayuda ? el("p", { class: "campo__ayuda", text: ayuda }) : null,
      el("p", { class: "campo__error", id: `${id}-error`, "aria-live": "polite" }),
    ]);
  }

  function pantallaIdentificacion(previo) {
    const nombre = el("input", { id: "f-nombre", class: "campo__entrada", type: "text", autocomplete: "name", maxlength: "120", required: true });
    const carne = el("input", { id: "f-carne", class: "campo__entrada", type: "text", autocomplete: "off", maxlength: "30", required: true, autocapitalize: "characters" });
    const grupo = el("select", { id: "f-grupo", class: "campo__entrada", required: true }, [
      el("option", { value: "", text: "Seleccione su grupo" }),
      ...CONFIG.grupos.map((g) => el("option", { value: g, text: g })),
    ]);
    if (previo) {
      nombre.value = previo.nombre || "";
      carne.value = previo.carne || "";
      if (CONFIG.grupos.includes(previo.grupo)) grupo.value = previo.grupo;
    }

    const instrucciones = (CONFIG.actividad.instrucciones || []).map((t) => el("li", { text: t }));
    const n = cantidadPreguntas();
    const datos = [
      `${n} ${n === 1 ? "reto" : "retos"}`,
      CONFIG.tiempo.limiteMinutos ? `${CONFIG.tiempo.limiteMinutos} minutos` : "Sin límite de tiempo",
    ];

    const formulario = el("form", { class: "formulario", novalidate: true }, [
      campo("f-nombre", "Nombre completo", nombre),
      el("div", { class: "formulario__fila" }, [
        campo("f-carne", "Carné", carne),
        campo("f-grupo", "Grupo", grupo),
      ]),
      el("button", { class: "boton boton--primario boton--ancho", type: "submit", text: "Iniciar actividad" }),
    ]);

    formulario.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const valores = { nombre: nombre.value.replace(/\s+/g, " ").trim(), carne: carne.value.trim().toUpperCase(), grupo: grupo.value };
      const errores = {
        "f-nombre": valores.nombre.length < 3 ? "Escriba su nombre completo." : "",
        "f-carne": !valores.carne ? "Escriba su carné." : !/^[A-Z0-9-]+$/.test(valores.carne) ? "Use solo letras, números y guiones." : "",
        "f-grupo": !valores.grupo ? "Seleccione su grupo." : "",
      };
      let primero = null;
      for (const [id, mensaje] of Object.entries(errores)) {
        const entrada = document.getElementById(id);
        document.getElementById(`${id}-error`).textContent = mensaje;
        entrada.classList.toggle("campo__entrada--invalida", !!mensaje);
        entrada.setAttribute("aria-invalid", mensaje ? "true" : "false");
        if (mensaje && !primero) primero = entrada;
      }
      if (primero) { primero.focus(); return; }
      comenzar(valores);
    });

    mostrar(
      el("section", { class: "tarjeta tarjeta--inicio" }, [
        el("p", { class: "etiqueta-superior", text: CONFIG.curso.codigo }),
        el("h1", { class: "titulo", text: CONFIG.actividad.nombre }),
        CONFIG.actividad.descripcion ? el("p", { class: "texto-suave", text: CONFIG.actividad.descripcion }) : null,
        el("ul", { class: "chips" }, datos.map((d) => el("li", { class: "chip", text: d }))),
        instrucciones.length ? el("ol", { class: "instrucciones" }, instrucciones) : null,
        bannerPendientes(),
        formulario,
      ])
    );
    if (!previo) nombre.focus();
  }

  function cantidadPreguntas() {
    // Construir un intento de prueba es la forma más fiel de contar.
    return BancoPreguntas.construirIntento("conteo").length;
  }

  /** Aviso si quedaron intentos sin enviar en este navegador. */
  function bannerPendientes() {
    const lista = Api.pendientes.listar();
    if (!lista.length) return null;
    const estado = el("p", { class: "aviso__detalle" });
    const boton = el("button", { class: "boton boton--secundario boton--pequeno", type: "button", text: "Reintentar envío" });
    const caja = el("div", { class: "aviso aviso--atencion" }, [
      el("strong", { text: `Hay ${lista.length === 1 ? "un intento pendiente" : `${lista.length} intentos pendientes`} de envío en este equipo.` }),
      estado,
      boton,
    ]);
    boton.addEventListener("click", async () => {
      boton.disabled = true;
      estado.textContent = "Enviando…";
      const { enviados, fallidos } = await enviarPendientes();
      estado.textContent = fallidos
        ? "No fue posible enviar los resultados. Intente nuevamente."
        : `Resultados enviados correctamente (${enviados}).`;
      boton.disabled = false;
      if (!fallidos) { caja.classList.replace("aviso--atencion", "aviso--exito"); boton.remove(); }
    });
    return caja;
  }

  /* =================================================================
   * Creación y reanudación del intento
   * ================================================================= */

  function comenzar(estudiante) {
    almacen.guardar(CLAVE_ULTIMO, estudiante);
    const existente = almacen.leer(claveIntento(estudiante.carne));
    if (existente) {
      if (existente.estado !== "enviado") return reanudar(existente);
      if (!CONFIG.resultados.permitirNuevoIntento) return pantallaYaEnviado(existente);
    }
    intento = crearIntento(estudiante);
    guardar();
    reanudar(intento);
  }

  function crearIntento(estudiante) {
    const semilla = CONFIG.aleatoriedad.semillaPorEstudiante
      ? `${estudiante.carne}|${CONFIG.actividad.codigo}`
      : Utils.generarIdIntento("S");
    return {
      version: 1,
      idIntento: Utils.generarIdIntento(CONFIG.curso.codigo),
      semilla,
      estudiante,
      inicio: new Date().toISOString(),
      fin: null,
      indice: 0,
      estado: "en-curso",    // en-curso → finalizado → enviado
      ids: [],                // orden de preguntas (para detectar cambios en el banco)
      respuestas: {},         // id → { valor, resultado, tiempoSeg }
      mostradaEn: {},         // id → instante en que se mostró por primera vez
    };
  }

  function reanudar(datos) {
    intento = datos;
    preguntas = BancoPreguntas.construirIntento(intento.semilla);
    const ids = preguntas.map((p) => p.id);
    if (!intento.ids.length) intento.ids = ids;
    else if (intento.ids.join() !== ids.join()) {
      // El banco cambió desde que empezó el intento: se conservan solo las preguntas que siguen existiendo.
      const disponibles = new Map(preguntas.map((p) => [p.id, p]));
      preguntas = intento.ids.filter((id) => disponibles.has(id)).map((id) => disponibles.get(id));
    }
    guardar();
    if (intento.estado === "en-curso") {
      iniciarCronometro();
      pantallaPregunta();
    } else {
      pantallaResultado();
    }
  }

  function guardar() {
    if (intento) almacen.guardar(claveIntento(intento.estudiante.carne), intento);
  }

  /* =================================================================
   * Cronómetro y límite de tiempo
   * ================================================================= */

  const segundosDesde = (iso) => (Date.now() - new Date(iso).getTime()) / 1000;

  function iniciarCronometro() {
    clearInterval(temporizador);
    const limite = CONFIG.tiempo.limiteMinutos ? CONFIG.tiempo.limiteMinutos * 60 : null;
    cronometro.hidden = false;
    const actualizar = () => {
      const transcurrido = segundosDesde(intento.inicio);
      if (limite) {
        const resta = Math.max(0, limite - transcurrido);
        const m = Math.floor(resta / 60), s = String(Math.floor(resta % 60)).padStart(2, "0");
        cronometro.textContent = `⏱ ${m}:${s}`;
        cronometro.classList.toggle("cronometro--alerta", resta <= 60);
        if (resta <= 0) finalizar(true);
      } else {
        const m = Math.floor(transcurrido / 60), s = String(Math.floor(transcurrido % 60)).padStart(2, "0");
        cronometro.textContent = `⏱ ${m}:${s}`;
      }
    };
    actualizar();
    temporizador = setInterval(actualizar, 1000);
  }

  function detenerCronometro() {
    clearInterval(temporizador);
    cronometro.hidden = true;
  }

  function actualizarProgreso() {
    const respondidas = Object.keys(intento.respuestas).length;
    const pct = preguntas.length ? (respondidas / preguntas.length) * 100 : 0;
    contenedorProgreso.hidden = intento.estado !== "en-curso";
    barraProgreso.style.width = `${pct}%`;
    barraProgreso.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  /* =================================================================
   * Pantalla 2: un reto por tarjeta
   * ================================================================= */

  function pantallaPregunta() {
    // Saltar a la primera pregunta sin responder
    while (intento.indice < preguntas.length && intento.respuestas[preguntas[intento.indice].id]) intento.indice++;
    if (intento.indice >= preguntas.length) return finalizar(false);

    const pub = preguntas[intento.indice];
    const numero = intento.indice + 1;
    if (!intento.mostradaEn[pub.id]) {
      intento.mostradaEn[pub.id] = new Date().toISOString();
      guardar();
    }
    actualizarProgreso();

    const meta = [pub.tema, pub.puntaje === 1 ? "1 punto" : `${formatearNumero(pub.puntaje, 2)} puntos`].filter(Boolean);
    const zonaControl = el("div", { class: "reto__respuesta" });
    const mensaje = el("div", { class: "mensaje", role: "status", "aria-live": "polite" });
    const boton = el("button", { class: "boton boton--primario", type: "button", text: "Comprobar respuesta" });

    const tarjeta = el("article", { class: "tarjeta reto", "aria-labelledby": "reto-titulo" }, [
      el("div", { class: "reto__cabecera" }, [
        el("h1", { class: "reto__numero", id: "reto-titulo", text: `Reto ${numero}` }),
        el("span", { class: "reto__contador", text: `${numero} de ${preguntas.length}` }),
      ]),
      el("p", { class: "reto__meta", text: meta.join(" · ") }),
      pub.enunciado ? el("div", { class: "reto__enunciado", html: pub.enunciado }) : null,
      pub.formula ? el("div", { class: "reto__formula" }) : null,
      ...Recursos.crear(pub),
      el("p", { class: "reto__indicacion", text: pub.indicacion }),
      zonaControl,
      mensaje,
      el("div", { class: "reto__acciones" }, [boton]),
    ]);
    if (pub.formula) renderizarFormula(tarjeta.querySelector(".reto__formula"), pub.formula, true);

    mostrar(tarjeta);
    control = TIPOS_PREGUNTA[pub.tipo].crearControl(zonaControl, pub);

    const comprobar = () => {
      const lectura = control.obtener();
      if (lectura.vacia || lectura.error) {
        mostrarMensaje(mensaje, "atencion", lectura.mensaje || lectura.error);
        return;
      }
      const resultado = BancoPreguntas.calificar(pub, lectura.valor);
      intento.respuestas[pub.id] = {
        valor: lectura.valor,
        resultado,
        tiempoSeg: Math.round(segundosDesde(intento.mostradaEn[pub.id])),
      };
      guardar();
      actualizarProgreso();
      control.bloquear();
      mostrarRetroalimentacion(mensaje, resultado);
      if (CONFIG.retroalimentacion.mostrar) control.marcar(resultado);

      const ultima = intento.indice === preguntas.length - 1;
      boton.textContent = ultima ? "Ver resultados" : "Siguiente";
      boton.onclick = () => {
        intento.indice++;
        guardar();
        pantallaPregunta();
      };
      boton.focus();
    };
    boton.onclick = comprobar;
    zonaControl.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target.matches("input[type=text]")) { ev.preventDefault(); boton.click(); }
    });
    // Al escribir o elegir de nuevo, se limpia el aviso "seleccione una opción"
    zonaControl.addEventListener("input", () => mensaje.classList.contains("mensaje--atencion") && limpiarMensaje(mensaje));
  }

  function mostrarMensaje(caja, tipo, html) {
    caja.className = `mensaje mensaje--${tipo} mensaje--visible`;
    caja.innerHTML = html;
    renderizarMatematica(caja);
  }

  function limpiarMensaje(caja) {
    caja.className = "mensaje";
    caja.innerHTML = "";
  }

  function mostrarRetroalimentacion(caja, r) {
    if (!CONFIG.retroalimentacion.mostrar) {
      mostrarMensaje(caja, "neutro", "<strong>Respuesta registrada.</strong>");
      return;
    }
    const titulos = { correcta: "Correcto", incorrecta: "Incorrecto", parcial: "Parcialmente correcto" };
    const partes = [`<strong class="mensaje__titulo">${titulos[r.estado]}</strong>`];
    if (r.estado !== "correcta" && r.correctaHtml && !r.claveVisible) {
      partes.push(`<p>Respuesta correcta: ${r.correctaHtml}</p>`);
    }
    if (r.retroHtml) partes.push(`<p>${r.retroHtml}</p>`);
    mostrarMensaje(caja, r.estado === "correcta" ? "exito" : r.estado === "parcial" ? "atencion" : "error", partes.join(""));
  }

  /* =================================================================
   * Cálculo de la nota
   * ================================================================= */

  function finalizar(porTiempo) {
    if (intento.estado !== "en-curso") return;
    detenerCronometro();
    preguntas.forEach((pub) => {
      if (!intento.respuestas[pub.id]) {
        intento.respuestas[pub.id] = { valor: null, resultado: BancoPreguntas.calificarSinRespuesta(pub), tiempoSeg: 0 };
      }
    });
    intento.fin = new Date().toISOString();
    intento.estado = "finalizado";
    intento.porTiempo = !!porTiempo;
    intento.resumen = calcularResumen();
    guardar();
    actualizarProgreso();
    pantallaResultado();
  }

  function calcularResumen() {
    const resultados = preguntas.map((p) => intento.respuestas[p.id].resultado);
    const puntajeObtenido = resultados.reduce((s, r) => s + r.puntos, 0);
    const puntajeMaximo = resultados.reduce((s, r) => s + r.puntajeMax, 0);
    const correctas = resultados.filter((r) => r.estado === "correcta").length;
    const porcentaje = puntajeMaximo ? (puntajeObtenido / puntajeMaximo) * 100 : 0;
    const { notaMaxima, decimales } = CONFIG.calificacion;
    return {
      cantidadPreguntas: resultados.length,
      correctas,
      incorrectas: resultados.length - correctas,
      parciales: resultados.filter((r) => r.estado === "parcial").length,
      sinResponder: resultados.filter((r) => r.estado === "sin responder").length,
      puntajeObtenido: Utils.redondear(puntajeObtenido, 3),
      puntajeMaximo: Utils.redondear(puntajeMaximo, 3),
      porcentaje: Utils.redondear(porcentaje, 2),
      nota: Utils.redondear((porcentaje / 100) * notaMaxima, decimales),
      notaMaxima,
      tiempoTotalSeg: Math.round((new Date(intento.fin) - new Date(intento.inicio)) / 1000),
    };
  }

  /** Datos que se envían a Google Sheets (una fila por intento). */
  function construirEnvio() {
    const r = intento.resumen;
    return {
      idIntento: intento.idIntento,
      cursoCodigo: CONFIG.curso.codigo,
      curso: CONFIG.curso.nombre,
      periodo: CONFIG.curso.periodo || "",
      actividadCodigo: CONFIG.actividad.codigo,
      actividad: CONFIG.actividad.nombre,
      nombre: intento.estudiante.nombre,
      carne: intento.estudiante.carne,
      grupo: intento.estudiante.grupo,
      inicio: intento.inicio,
      fin: intento.fin,
      finalizadoPorTiempo: !!intento.porTiempo,
      ...r,
      respuestas: preguntas.map((p, i) => {
        const { resultado, tiempoSeg } = intento.respuestas[p.id];
        return {
          n: i + 1,
          id: p.id,
          tema: resultado.tema,
          tipo: resultado.tipo,
          dificultad: resultado.dificultad,
          respuesta: resultado.respuestaTexto,
          correcta: resultado.correctaTexto,
          estado: resultado.estado,
          puntos: resultado.puntos,
          puntajeMax: resultado.puntajeMax,
          tiempoSeg,
        };
      }),
    };
  }

  /* =================================================================
   * Pantalla 3: resultado y envío
   * ================================================================= */

  function pantallaResultado() {
    detenerCronometro();
    contenedorProgreso.hidden = true;
    const r = intento.resumen;
    const e = intento.estudiante;
    const verNota = CONFIG.resultados.mostrarNotaFinal;

    const estadoEnvio = el("div", { class: "envio__estado", role: "status", "aria-live": "polite" });
    const botonEnviar = el("button", { class: "boton boton--primario boton--ancho", type: "button", text: "Enviar evaluación" });
    const envio = el("div", { class: "envio" }, [
      el("p", { class: "envio__id" }, ["Identificador del intento: ", el("code", { text: intento.idIntento })]),
      estadoEnvio,
      botonEnviar,
    ]);

    const tarjeta = el("section", { class: "tarjeta resultado" }, [
      el("div", { class: "resultado__icono", "aria-hidden": "true", text: "✓" }),
      el("p", { class: "etiqueta-superior", text: intento.porTiempo ? "Tiempo agotado" : "Actividad completada" }),
      el("h1", { class: "titulo", text: e.nombre }),
      el("p", { class: "texto-suave", text: `Carné ${e.carne} · ${e.grupo}` }),
      verNota
        ? el("div", { class: "resultado__principal" }, [
            el("p", { class: "resultado__aciertos" }, [
              el("span", { class: "resultado__cifra", text: `${r.correctas} / ${r.cantidadPreguntas}` }),
              " respuestas correctas",
            ]),
            el("p", { class: "resultado__nota" }, [
              "Nota: ",
              el("strong", { text: r.notaMaxima === 100 ? `${formatearNumero(r.nota)}%` : `${formatearNumero(r.nota, 2)} / ${r.notaMaxima}` }),
            ]),
          ])
        : el("p", { class: "texto-suave", text: "Sus respuestas fueron registradas. Envíe la evaluación para finalizar." }),
      verNota
        ? el("dl", { class: "estadisticas" }, [
            estadistica("Correctas", r.correctas),
            estadistica("Incorrectas", r.incorrectas),
            estadistica("Puntaje", `${formatearNumero(r.puntajeObtenido, 2)} / ${formatearNumero(r.puntajeMaximo, 2)}`),
            estadistica("Porcentaje", `${formatearNumero(r.porcentaje)}%`),
            estadistica("Tiempo", formatearDuracion(r.tiempoTotalSeg)),
          ])
        : null,
      verNota && CONFIG.resultados.mostrarDetalle ? detallePreguntas() : null,
      envio,
    ]);

    const enviar = async () => {
      botonEnviar.disabled = true;
      botonEnviar.textContent = "Enviando…";
      estadoEnvio.className = "envio__estado envio__estado--cargando";
      estadoEnvio.textContent = "Enviando resultados al servidor…";
      const datos = construirEnvio();
      Api.pendientes.guardar(datos); // respaldo: se borra solo si el servidor confirma
      try {
        await Api.enviarIntento(datos);
        Api.pendientes.quitar(datos.idIntento);
        intento.estado = "enviado";
        intento.enviadoEn = new Date().toISOString();
        guardar();
        marcarEnviado();
      } catch (err) {
        estadoEnvio.className = "envio__estado envio__estado--error";
        estadoEnvio.replaceChildren(
          el("strong", { text: "No fue posible enviar los resultados. Intente nuevamente." }),
          el("span", { class: "envio__detalle", text: `${err.message} Sus respuestas siguen guardadas en este equipo.` })
        );
        botonEnviar.disabled = false;
        botonEnviar.textContent = "Reintentar envío";
      }
    };

    const marcarEnviado = () => {
      estadoEnvio.className = "envio__estado envio__estado--exito";
      estadoEnvio.replaceChildren(
        el("strong", { text: "Resultados enviados correctamente." }),
        el("span", { class: "envio__detalle", text: "Guarde el identificador del intento como comprobante. Ya puede cerrar esta ventana." })
      );
      botonEnviar.remove();
      if (CONFIG.resultados.permitirNuevoIntento) {
        envio.append(el("button", { class: "boton boton--secundario boton--ancho", type: "button", text: "Realizar otro intento", onclick: nuevoIntento }));
      }
      envio.append(el("button", { class: "boton boton--texto", type: "button", text: "Salir", onclick: salir }));
    };

    botonEnviar.addEventListener("click", enviar);
    mostrar(tarjeta);
    if (intento.estado === "enviado") marcarEnviado();
  }

  function estadistica(etiqueta, valor) {
    return el("div", { class: "estadistica" }, [el("dt", { text: etiqueta }), el("dd", { text: String(valor) })]);
  }

  function detallePreguntas() {
    const iconos = { correcta: "✓", incorrecta: "✗", parcial: "◐", "sin responder": "–" };
    const filas = preguntas.map((p, i) => {
      const r = intento.respuestas[p.id].resultado;
      return el("li", { class: `detalle__fila detalle__fila--${r.estado.replace(" ", "-")}` }, [
        el("span", { class: "detalle__icono", "aria-hidden": "true", text: iconos[r.estado] }),
        el("span", { class: "detalle__texto" }, [el("strong", { text: `Reto ${i + 1}` }), ` · ${r.tema}`]),
        el("span", { class: "detalle__puntos", text: `${formatearNumero(r.puntos, 2)} / ${formatearNumero(r.puntajeMax, 2)}` }),
        el("span", { class: "sr-only", text: r.estado }),
      ]);
    });
    return el("details", { class: "detalle" }, [el("summary", { text: "Ver detalle por reto" }), el("ol", { class: "detalle__lista" }, filas)]);
  }

  function pantallaYaEnviado(datos) {
    intento = datos;
    preguntas = BancoPreguntas.construirIntento(intento.semilla).filter((p) => intento.respuestas[p.id]);
    pantallaResultado();
  }

  function nuevoIntento() {
    const estudiante = intento.estudiante;
    almacen.borrar(claveIntento(estudiante.carne));
    intento = crearIntento(estudiante);
    if (CONFIG.aleatoriedad.semillaPorEstudiante) intento.semilla += `|${intento.idIntento}`; // versión distinta
    guardar();
    reanudar(intento);
  }

  function salir() {
    almacen.borrar(CLAVE_ULTIMO);
    intento = null;
    pantallaIdentificacion(null);
  }

  /* =================================================================
   * Envíos pendientes y protección contra cierres accidentales
   * ================================================================= */

  async function enviarPendientes(excluirId = null) {
    let enviados = 0, fallidos = 0;
    for (const datos of Api.pendientes.listar().filter((p) => p.idIntento !== excluirId)) {
      try {
        await Api.enviarIntento(datos);
        Api.pendientes.quitar(datos.idIntento);
        const guardado = almacen.leer(claveIntento(datos.carne));
        if (guardado && guardado.idIntento === datos.idIntento) {
          guardado.estado = "enviado";
          almacen.guardar(claveIntento(datos.carne), guardado);
        }
        enviados++;
      } catch {
        fallidos++;
      }
    }
    return { enviados, fallidos };
  }

  let reintentando = false;
  async function reintentarPendientesEnSegundoPlano() {
    if (reintentando || !navigator.onLine || !Api.estaConfigurado()) return;
    // Solo intentos de otras sesiones; el intento actual lo envía el estudiante con su botón.
    const ajenos = Api.pendientes.listar().filter((p) => !intento || p.idIntento !== intento.idIntento);
    if (!ajenos.length) return;
    reintentando = true;
    await enviarPendientes(intento?.idIntento);
    reintentando = false;
  }

  function advertirSalida(ev) {
    if (intento && intento.estado === "finalizado") {
      ev.preventDefault();
      ev.returnValue = "";
    }
  }
})();
