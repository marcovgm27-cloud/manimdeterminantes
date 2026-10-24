/* =====================================================================
 * question-bank.js — LECTURA, VALIDACIÓN Y CALIFICACIÓN DEL BANCO
 * ---------------------------------------------------------------------
 * - Carga el archivo indicado en config.js (js/questions.js).
 * - Valida cada pregunta y avisa de errores de escritura.
 * - Guarda las respuestas correctas en una variable PRIVADA de este
 *   módulo: la interfaz solo recibe versiones "públicas" sin respuesta,
 *   y nunca se escriben en el HTML.
 * - Construye cada intento (selección, orden y opciones aleatorias).
 * - Califica las respuestas.
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * Protección (ofuscación) opcional de las respuestas.
 * Convierte la respuesta correcta en un texto ilegible a simple vista.
 * NO es cifrado fuerte: ver la sección de seguridad del README.
 * ------------------------------------------------------------------- */
const Proteccion = (() => {
  const SAL = "reto-matematico";
  const bytesClave = (id) => new TextEncoder().encode(`${SAL}:${id}:${SAL.length}`);

  function xor(bytes, clave) {
    return bytes.map((b, i) => b ^ clave[i % clave.length] ^ ((i * 31) & 0xff));
  }

  function codificar(valor, id) {
    const bytes = xor(new TextEncoder().encode(JSON.stringify(valor)), bytesClave(id));
    return btoa(String.fromCharCode(...bytes));
  }

  function decodificar(texto, id) {
    const bytes = Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(xor(bytes, bytesClave(id))));
  }

  return { codificar, decodificar };
})();

const BancoPreguntas = (() => {
  /** id → { def: definición sin respuesta, clave: respuesta normalizada } */
  const privado = new Map();
  let ordenOriginal = [];
  let config = null;

  /* Campos que la interfaz puede ver de cada pregunta */
  const CAMPOS_PUBLICOS = ["id", "tema", "tipo", "dificultad", "enunciado", "formula", "imagen", "grafico", "geogebra", "unidad", "indicacion"];

  /** Lee la respuesta correcta, sea normal (respuestaCorrecta) o protegida (clave). */
  function leerRespuesta(p) {
    if (p.clave !== undefined) return Proteccion.decodificar(p.clave, p.id);
    return p.respuestaCorrecta;
  }

  /** Revisa una definición. Devuelve la lista de problemas encontrados. */
  function validarPregunta(p, idsVistos) {
    const errores = [];
    if (!p || typeof p !== "object") return ["La pregunta no tiene el formato { ... }."];
    if (!p.id) errores.push("Falta el campo id.");
    else if (idsVistos.has(p.id)) errores.push(`El id «${p.id}» está repetido.`);
    const tipo = TIPOS_PREGUNTA[p.tipo];
    if (!tipo) {
      errores.push(`Tipo «${p.tipo}» desconocido. Use: ${Object.keys(TIPOS_PREGUNTA).join(", ")}.`);
      return errores;
    }
    if (!p.enunciado && !p.formula) errores.push("Falta el enunciado.");
    try {
      const copia = { ...p, respuestaCorrecta: leerRespuesta(p) };
      if (copia.respuestaCorrecta === undefined) errores.push("Falta respuestaCorrecta.");
      else errores.push(...tipo.validar(copia));
    } catch {
      errores.push("La respuesta protegida (clave) no se pudo leer.");
    }
    if (p.puntaje !== undefined && !(Number(p.puntaje) >= 0)) errores.push("El puntaje debe ser un número positivo.");
    return errores;
  }

  /**
   * Carga y valida el banco. Las preguntas con errores se descartan.
   * Devuelve { total, problemas: [{ id, errores }] }.
   */
  async function cargar(configuracion) {
    config = configuracion;
    privado.clear();
    ordenOriginal = [];
    if (!window.BANCO_PREGUNTAS) await Utils.cargarScript(config.preguntas.archivo);
    const lista = window.BANCO_PREGUNTAS;
    if (!Array.isArray(lista)) {
      throw new Error("El banco de preguntas no se pudo leer. Revise que questions.js comience con «window.BANCO_PREGUNTAS = [».");
    }
    // Se retira del objeto global para no dejar las respuestas a mano en la consola.
    try { delete window.BANCO_PREGUNTAS; } catch { window.BANCO_PREGUNTAS = undefined; }

    const problemas = [];
    const idsVistos = new Set();
    lista.forEach((p, indice) => {
      if (p && p.activa === false) return;
      const errores = validarPregunta(p, idsVistos);
      if (errores.length) {
        problemas.push({ id: p?.id || `pregunta #${indice + 1}`, errores });
        return;
      }
      idsVistos.add(p.id);
      const { respuestaCorrecta, clave, ...resto } = p;
      const def = { ...resto, puntaje: Number(p.puntaje ?? config.preguntas.puntajePorDefecto) };
      const normalizada = TIPOS_PREGUNTA[p.tipo].normalizarClave({ ...def, respuestaCorrecta: leerRespuesta(p) });
      privado.set(p.id, { def, clave: normalizada });
      ordenOriginal.push(p.id);
    });
    problemas.forEach((pr) => console.warn(`[Banco] ${pr.id}: ${pr.errores.join(" ")}`));
    return { total: ordenOriginal.length, problemas };
  }

  /** Ids que participan según los temas configurados. */
  function idsDisponibles() {
    const temas = (config.preguntas.temas || []).map((t) => t.toLowerCase());
    return ordenOriginal.filter((id) => !temas.length || temas.includes(String(privado.get(id).def.tema).toLowerCase()));
  }

  /**
   * Crea las preguntas de un intento a partir de una semilla.
   * La misma semilla produce siempre el mismo intento (útil para reanudar).
   */
  function construirIntento(semilla) {
    const aleatorio = Utils.crearAleatorio(semilla);
    const { mezclarPreguntas, mezclarOpciones, seleccionAleatoria } = config.aleatoriedad;
    let ids = idsDisponibles();
    const cantidad = config.preguntas.cantidad ? Math.min(config.preguntas.cantidad, ids.length) : ids.length;

    if (seleccionAleatoria) {
      const elegidas = new Set(Utils.mezclar(ids, aleatorio).slice(0, cantidad));
      ids = ids.filter((id) => elegidas.has(id)); // conserva el orden del banco
    } else {
      ids = ids.slice(0, cantidad);
    }
    if (mezclarPreguntas) ids = Utils.mezclar(ids, aleatorio);

    return ids.map((id) => {
      const { def } = privado.get(id);
      const tipo = TIPOS_PREGUNTA[def.tipo];
      const pub = { indicacion: tipo.indicacion };
      CAMPOS_PUBLICOS.forEach((c) => def[c] !== undefined && (pub[c] = def[c]));
      return Object.freeze({ ...pub, puntaje: def.puntaje, ...tipo.publica(def, aleatorio, mezclarOpciones) });
    });
  }

  /** Arma el resultado común de una calificación. */
  function armarResultado(pub, fraccion, valor) {
    const { def, clave } = privado.get(pub.id);
    const tipo = TIPOS_PREGUNTA[def.tipo];
    const r = config.retroalimentacion;
    const estado = valor === undefined ? "sin responder" : fraccion >= 1 ? "correcta" : fraccion > 0 ? "parcial" : "incorrecta";
    const correcta = tipo.describirClave(clave, def);

    let retroHtml = "";
    if (r.mostrarExplicacion && def.retroalimentacion) {
      const rf = def.retroalimentacion;
      retroHtml = typeof rf === "string" ? rf : estado === "correcta" ? rf.correcta || "" : rf.incorrecta || "";
    }
    const revelar = r.mostrar && r.mostrarRespuestaCorrecta;
    return {
      id: pub.id,
      tema: def.tema || "",
      tipo: def.tipo,
      dificultad: def.dificultad || "",
      estado,
      fraccion,
      puntos: Utils.redondear(fraccion * def.puntaje, 3),
      puntajeMax: def.puntaje,
      respuestaTexto: valor === undefined ? "" : tipo.describir(valor, pub),
      correctaTexto: correcta.texto,
      // Para la interfaz (solo si la configuración permite revelar la respuesta):
      correctaHtml: revelar ? correcta.html : null,
      claveVisible: revelar ? correcta.letras ?? null : null,
      retroHtml,
    };
  }

  /** Califica una respuesta. valor es lo que devuelve el control de la pregunta. */
  function calificar(pub, valor) {
    const { def, clave } = privado.get(pub.id);
    const fraccion = TIPOS_PREGUNTA[def.tipo].calificar(valor, clave, def, config);
    return armarResultado(pub, Math.max(0, Math.min(1, fraccion)), valor);
  }

  /** Pregunta no respondida (por ejemplo, si se agotó el tiempo). */
  const calificarSinRespuesta = (pub) => armarResultado(pub, 0, undefined);

  return { cargar, construirIntento, calificar, calificarSinRespuesta, validarPregunta, leerRespuesta };
})();
