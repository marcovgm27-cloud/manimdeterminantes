/* =====================================================================
 * question-types.js — TIPOS DE PREGUNTA (arquitectura modular)
 * ---------------------------------------------------------------------
 * Cada tipo es un objeto con la misma "forma":
 *
 *   etiqueta                     Nombre legible del tipo.
 *   validar(p)                   Lista de errores de la definición (para el docente).
 *   normalizarClave(p)           Convierte respuestaCorrecta a un formato interno.
 *   publica(p, aleatorio, mezclarOpciones)
 *                                Datos que SÍ puede ver la interfaz (sin la respuesta).
 *   crearControl(contenedor, pub) Dibuja los controles y devuelve un "controlador":
 *        .obtener()  → { valor } | { vacia: true } | { error: "mensaje" }
 *        .bloquear() → impide cambiar la respuesta
 *        .marcar(resultado) → pinta correcto/incorrecto
 *        .restaurar(valor)  → vuelve a mostrar una respuesta guardada
 *   calificar(valor, clave, p)   Fracción obtenida entre 0 y 1.
 *   describir(valor, pub)        Respuesta en texto plano (para Google Sheets).
 *   describirClave(clave, p)     Respuesta correcta: { texto, html }.
 *
 * Para crear un tipo nuevo (por ejemplo "ordenar" o "emparejar") basta
 * con añadir otro objeto con esta forma a TIPOS_PREGUNTA.
 *
 * "Imagen", "gráfico" y "GeoGebra" NO son tipos de respuesta: son RECURSOS
 * que se pueden agregar a cualquier pregunta (ver resources.js). Así una
 * pregunta con GeoGebra puede ser de selección única, numérica, etc.
 * ===================================================================== */

const TIPOS_PREGUNTA = (() => {
  const { el, letra, renderizarMatematica, renderizarFormula, textoPlano, escaparHtml } = Utils;

  /* ==================================================================
   * Base compartida para preguntas con opciones (única, múltiple, V/F)
   * ================================================================== */

  /** Opciones visibles: [{ clave: "B", texto: "..." }] en el orden a mostrar. */
  function opcionesPublicas(p, aleatorio, mezclarOpciones) {
    const lista = p.opciones.map((texto, i) => ({ clave: letra(i), texto: String(texto) }));
    const mezclar = mezclarOpciones && p.mezclarOpciones !== false;
    return mezclar ? Utils.mezclar(lista, aleatorio) : lista;
  }

  function crearControlOpciones(contenedor, pub, multiple) {
    const nombre = `resp-${pub.id}-${Math.random().toString(36).slice(2, 7)}`;
    const lista = el("div", {
      class: `opciones ${pub.opciones.length === 2 ? "opciones--dos" : ""}`,
      role: multiple ? "group" : "radiogroup",
      "aria-label": "Opciones de respuesta",
    });
    const entradas = pub.opciones.map((op, i) => {
      const entrada = el("input", { type: multiple ? "checkbox" : "radio", name: nombre, value: op.clave });
      const etiqueta = el("label", { class: "opcion" }, [
        entrada,
        el("span", { class: "opcion__letra", "aria-hidden": "true", text: letra(i) }),
        el("span", { class: "opcion__texto", html: op.texto }),
        el("span", { class: "opcion__marca", "aria-hidden": "true" }),
      ]);
      lista.append(etiqueta);
      return entrada;
    });
    contenedor.append(lista);
    renderizarMatematica(lista);

    return {
      obtener() {
        const marcadas = entradas.filter((e) => e.checked).map((e) => e.value);
        if (!marcadas.length) {
          return { vacia: true, mensaje: multiple ? "Seleccione al menos una opción." : "Seleccione una opción." };
        }
        return { valor: multiple ? marcadas.sort() : marcadas[0] };
      },
      bloquear() {
        entradas.forEach((e) => (e.disabled = true));
        lista.classList.add("opciones--bloqueadas");
      },
      restaurar(valor) {
        const v = [].concat(valor ?? []);
        entradas.forEach((e) => (e.checked = v.includes(e.value)));
      },
      /** resultado.claveVisible: letras correctas (null si no se deben revelar). */
      marcar(resultado) {
        const correctas = resultado.claveVisible ? [].concat(resultado.claveVisible) : null;
        entradas.forEach((e) => {
          const op = e.closest(".opcion");
          const esCorrecta = correctas ? correctas.includes(e.value) : null;
          if (e.checked) {
            op.classList.add(esCorrecta ?? resultado.estado === "correcta" ? "opcion--correcta" : "opcion--incorrecta");
          } else if (esCorrecta) {
            op.classList.add("opcion--faltante");
          }
        });
      },
      enfocar() {
        entradas[0]?.focus();
      },
    };
  }

  /** "B" → "B) x^x(ln x + 1)" usando la letra ORIGINAL del banco. */
  function describirOpciones(valor, pub) {
    return []
      .concat(valor ?? [])
      .map((clave) => {
        const op = pub.opciones.find((o) => o.clave === clave);
        return op ? `${clave}) ${textoPlano(op.texto)}` : clave;
      })
      .join(" | ");
  }

  function validarOpciones(p) {
    const errores = [];
    if (!Array.isArray(p.opciones) || p.opciones.length < 2) errores.push("Debe tener al menos 2 opciones.");
    return errores;
  }

  const letrasValidas = (p) => (p.opciones || []).map((_, i) => letra(i));

  /* ==================================================================
   * Base compartida para respuestas escritas (numérica, algebraica)
   * ================================================================== */

  function crearControlTexto(contenedor, pub, { placeholder, ayuda, convertir, vistaPrevia }) {
    const id = `entrada-${pub.id}`;
    const entrada = el("input", {
      id,
      class: "campo__entrada campo__entrada--respuesta",
      type: "text",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      placeholder,
    });
    const previa = el("div", { class: "vista-previa", "aria-live": "polite" });
    const fila = el("div", { class: "respuesta-escrita__fila" }, [
      entrada,
      pub.unidad ? el("span", { class: "respuesta-escrita__unidad", text: pub.unidad }) : null,
    ]);
    contenedor.append(
      el("div", { class: "respuesta-escrita" }, [
        el("label", { class: "campo__etiqueta", for: id, text: "Su respuesta" }),
        fila,
        previa,
        ayuda ? el("p", { class: "respuesta-escrita__ayuda", html: ayuda }) : null,
      ])
    );

    const actualizarVista = () => {
      const texto = entrada.value.trim();
      previa.classList.remove("vista-previa--error");
      if (!texto) { previa.textContent = ""; return; }
      try {
        renderizarFormula(previa, vistaPrevia(texto), false);
      } catch (e) {
        previa.textContent = "Expresión incompleta…";
        previa.classList.add("vista-previa--error");
      }
    };
    entrada.addEventListener("input", actualizarVista);

    return {
      obtener() {
        const texto = entrada.value.trim();
        if (!texto) return { vacia: true, mensaje: "Escriba su respuesta antes de comprobar." };
        try {
          return { valor: convertir(texto) };
        } catch (e) {
          return { error: e.message || "La respuesta no es válida." };
        }
      },
      bloquear() {
        entrada.readOnly = true;
        entrada.classList.add("campo__entrada--bloqueada");
      },
      restaurar(valor) {
        entrada.value = valor?.texto ?? "";
        actualizarVista();
      },
      marcar(resultado) {
        entrada.classList.add(resultado.estado === "correcta" ? "campo__entrada--correcta" : "campo__entrada--incorrecta");
      },
      enfocar() {
        entrada.focus();
      },
      entrada,
    };
  }

  /* ==================================================================
   * Definición de cada tipo
   * ================================================================== */

  const unica = {
    etiqueta: "Selección única",
    indicacion: "Seleccione una opción.",
    validar(p) {
      const e = validarOpciones(p);
      if (!letrasValidas(p).includes(String(p.respuestaCorrecta).toUpperCase())) {
        e.push(`respuestaCorrecta debe ser una de: ${letrasValidas(p).join(", ")}.`);
      }
      return e;
    },
    normalizarClave: (p) => String(p.respuestaCorrecta).trim().toUpperCase(),
    publica: (p, aleatorio, mezclar) => ({ opciones: opcionesPublicas(p, aleatorio, mezclar) }),
    crearControl: (c, pub) => crearControlOpciones(c, pub, false),
    calificar: (valor, clave) => (valor === clave ? 1 : 0),
    describir: describirOpciones,
    describirClave(clave, p) {
      const texto = p.opciones[clave.charCodeAt(0) - 65];
      return { texto: `${clave}) ${textoPlano(texto)}`, html: texto, letras: clave };
    },
  };

  const multiple = {
    etiqueta: "Selección múltiple",
    indicacion: "Seleccione todas las opciones correctas.",
    validar(p) {
      const e = validarOpciones(p);
      const clave = [].concat(p.respuestaCorrecta ?? []);
      if (!clave.length) e.push('respuestaCorrecta debe ser una lista, por ejemplo ["A", "C"].');
      clave.forEach((c) => {
        if (!letrasValidas(p).includes(String(c).toUpperCase())) e.push(`La letra «${c}» no corresponde a ninguna opción.`);
      });
      return e;
    },
    normalizarClave: (p) => [].concat(p.respuestaCorrecta).map((c) => String(c).trim().toUpperCase()).sort(),
    publica: (p, aleatorio, mezclar) => ({ opciones: opcionesPublicas(p, aleatorio, mezclar) }),
    crearControl: (c, pub) => crearControlOpciones(c, pub, true),
    /** Todo o nada; o bien puntaje parcial: (aciertos − errores) / correctas, mínimo 0. */
    calificar(valor, clave, p, config) {
      const elegidas = [].concat(valor);
      const aciertos = elegidas.filter((v) => clave.includes(v)).length;
      const errores = elegidas.length - aciertos;
      const exacta = errores === 0 && aciertos === clave.length;
      if (exacta) return 1;
      const parcial = p.puntajeParcial ?? config.calificacion.puntajeParcialMultiple;
      return parcial ? Math.max(0, (aciertos - errores) / clave.length) : 0;
    },
    describir: describirOpciones,
    describirClave(clave, p) {
      const textos = clave.map((c) => p.opciones[c.charCodeAt(0) - 65]);
      return {
        texto: clave.map((c, i) => `${c}) ${textoPlano(textos[i])}`).join(" | "),
        html: textos.join("<br>"),
        letras: clave,
      };
    },
  };

  const vf = {
    etiqueta: "Verdadero / Falso",
    indicacion: "Indique si la afirmación es verdadera o falsa.",
    validar(p) {
      return typeof p.respuestaCorrecta === "boolean" || /^(v|f|verdadero|falso|true|false)$/i.test(String(p.respuestaCorrecta))
        ? []
        : ["respuestaCorrecta debe ser true (verdadero) o false (falso)."];
    },
    normalizarClave(p) {
      const r = p.respuestaCorrecta;
      return r === true || /^(v|verdadero|true)$/i.test(String(r)) ? "A" : "B";
    },
    publica: () => ({ opciones: [{ clave: "A", texto: "Verdadero" }, { clave: "B", texto: "Falso" }] }),
    crearControl: (c, pub) => crearControlOpciones(c, pub, false),
    calificar: (valor, clave) => (valor === clave ? 1 : 0),
    describir: (valor) => (valor === "A" ? "Verdadero" : valor === "B" ? "Falso" : ""),
    describirClave: (clave) => {
      const texto = clave === "A" ? "Verdadero" : "Falso";
      return { texto, html: texto, letras: clave };
    },
  };

  const numerica = {
    etiqueta: "Respuesta numérica",
    indicacion: "Escriba su respuesta numérica.",
    validar(p) {
      let valor = NaN;
      try { valor = numerica.normalizarClave(p); } catch { /* se informa abajo */ }
      return Number.isFinite(valor) ? [] : ['respuestaCorrecta debe ser un número, por ejemplo -61 o "1/3".'];
    },
    normalizarClave: (p) => (typeof p.respuestaCorrecta === "number" ? p.respuestaCorrecta : MathEngine.evaluarNumero(p.respuestaCorrecta)),
    publica: (p) => ({ unidad: p.unidad || "" }),
    crearControl: (c, pub) =>
      crearControlTexto(c, pub, {
        placeholder: "Ej.: -61, 0.25, 1/3",
        ayuda: "Use punto o coma decimal. Se aceptan fracciones (<code>1/3</code>) y raíces (<code>sqrt(2)</code>).",
        convertir: (texto) => ({ texto, numero: MathEngine.evaluarNumero(texto) }),
        vistaPrevia: (texto) => MathEngine.textoATex(/^[^,.]*,[^,.]*$/.test(texto) ? texto.replace(",", ".") : texto),
      }),
    calificar(valor, clave, p, config) {
      const tolerancia = p.tolerancia ?? config.preguntas.toleranciaNumerica;
      return Math.abs(valor.numero - clave) <= tolerancia + 1e-12 ? 1 : 0;
    },
    describir: (valor) => valor?.texto ?? "",
    describirClave(clave, p) {
      const texto = typeof p.respuestaCorrecta === "number" ? String(clave) : String(p.respuestaCorrecta);
      return { texto: p.unidad ? `${texto} ${p.unidad}` : texto, html: `$${escaparHtml(texto)}$${p.unidad ? " " + escaparHtml(p.unidad) : ""}` };
    },
  };

  const algebraica = {
    etiqueta: "Respuesta algebraica",
    indicacion: "Escriba una expresión algebraica.",
    validar(p) {
      try {
        MathEngine.analizar(p.respuestaCorrecta, p.variables || ["x"]);
        return [];
      } catch (e) {
        return [`respuestaCorrecta no es una expresión válida: ${e.message}`];
      }
    },
    normalizarClave: (p) => String(p.respuestaCorrecta),
    publica: (p) => ({ variables: p.variables || ["x"] }),
    crearControl: (c, pub) =>
      crearControlTexto(c, pub, {
        placeholder: "Ej.: 2*x*sin(x) + x^2*cos(x)",
        ayuda:
          `Variables: <code>${pub.variables.join(", ")}</code>. Use <code>*</code> para multiplicar, <code>^</code> para potencias, ` +
          "<code>sqrt( )</code>, <code>ln( )</code>, <code>sin( )</code>, <code>e^( )</code>, <code>pi</code>.",
        convertir: (texto) => {
          MathEngine.analizar(texto, pub.variables); // valida la sintaxis
          return { texto };
        },
        vistaPrevia: (texto) => MathEngine.textoATex(texto, pub.variables),
      }),
    calificar(valor, clave, p) {
      try {
        return MathEngine.sonEquivalentes(valor.texto, clave, {
          variables: p.variables || ["x"],
          dominio: p.dominio || [-3, 3],
          tolerancia: p.tolerancia ?? 1e-6,
        }) ? 1 : 0;
      } catch {
        return 0;
      }
    },
    describir: (valor) => valor?.texto ?? "",
    describirClave(clave, p) {
      let tex;
      try { tex = MathEngine.textoATex(clave, p.variables || ["x"]); } catch { tex = escaparHtml(clave); }
      return { texto: clave, html: `$${tex}$` };
    },
  };

  return { unica, multiple, vf, numerica, algebraica };
})();
