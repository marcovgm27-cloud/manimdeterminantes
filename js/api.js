/* =====================================================================
 * api.js — COMUNICACIÓN CON GOOGLE APPS SCRIPT (Google Sheets)
 * ---------------------------------------------------------------------
 * - Las peticiones se envían como texto plano (text/plain) para evitar el
 *   bloqueo CORS de los navegadores con Apps Script.
 * - Un envío solo se considera exitoso si el servidor responde { ok: true }.
 * - Los envíos fallidos se guardan en el navegador ("pendientes") para
 *   reintentarlos; el identificador del intento evita filas duplicadas.
 * ===================================================================== */

const Api = (() => {
  const CLAVE_PENDIENTES = "retoMat.pendientes";

  class ErrorEnvio extends Error {}

  const urlServidor = () => (window.CONFIG.envio.urlAppsScript || "").trim();
  const estaConfigurado = () => /^https:\/\/script\.google(usercontent)?\.com\//.test(urlServidor());

  /** POST con tiempo de espera. Devuelve el JSON de la respuesta. */
  async function peticion(cuerpo) {
    if (!estaConfigurado()) {
      throw new ErrorEnvio("La URL del servidor (Google Apps Script) no está configurada en js/config.js.");
    }
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), (window.CONFIG.envio.tiempoEsperaSegundos || 25) * 1000);
    try {
      const respuesta = await fetch(urlServidor(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
        redirect: "follow",
      });
      if (!respuesta.ok) throw new ErrorEnvio(`El servidor respondió con el código ${respuesta.status}.`);
      let datos;
      try {
        datos = await respuesta.json();
      } catch {
        throw new ErrorEnvio("El servidor no devolvió una respuesta válida. Revise la publicación del Apps Script.");
      }
      if (!datos || datos.ok !== true) throw new ErrorEnvio(datos?.error || "El servidor rechazó la solicitud.");
      return datos;
    } catch (e) {
      if (e.name === "AbortError") throw new ErrorEnvio("El servidor tardó demasiado en responder.");
      if (e instanceof ErrorEnvio) throw e;
      throw new ErrorEnvio("No hay conexión con el servidor.");
    } finally {
      clearTimeout(espera);
    }
  }

  /* ---------------- Estudiante ---------------- */

  /** Envía un intento. Resuelve con { ok, estado: "registrado" | "duplicado" }. */
  function enviarIntento(intento) {
    return peticion({ accion: "registrar", intento });
  }

  /* ---------------- Docente ---------------- */

  /** Descarga todos los resultados (requiere la clave docente de Code.gs). */
  function obtenerResultados(claveDocente) {
    return peticion({ accion: "resultados", clave: claveDocente });
  }

  /* ---------------- Envíos pendientes (respaldo local) ---------------- */

  const pendientes = {
    listar: () => Utils.almacen.leer(CLAVE_PENDIENTES, []),
    guardar(intento) {
      const lista = pendientes.listar().filter((p) => p.idIntento !== intento.idIntento);
      lista.push(intento);
      Utils.almacen.guardar(CLAVE_PENDIENTES, lista);
    },
    quitar(idIntento) {
      Utils.almacen.guardar(CLAVE_PENDIENTES, pendientes.listar().filter((p) => p.idIntento !== idIntento));
    },
  };

  return { enviarIntento, obtenerResultados, pendientes, estaConfigurado, ErrorEnvio };
})();
