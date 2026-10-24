/* =====================================================================
 * Code.gs — Servidor de resultados en Google Apps Script
 * ---------------------------------------------------------------------
 * Se instala DENTRO de una hoja de cálculo de Google Sheets
 * (Extensiones → Apps Script). Ver README.md, secciones 6 a 10.
 *
 * Hace tres cosas:
 *   1. Recibe cada intento de los estudiantes y lo guarda:
 *        - hoja "Resultados": una fila por intento (P1, P2, ... al final);
 *        - hoja "Respuestas": una fila por cada pregunta respondida.
 *   2. Ignora envíos repetidos del mismo intento (mismo ID).
 *   3. Entrega los resultados al panel docente si recibe la CLAVE_DOCENTE.
 * ===================================================================== */

/* ------------------------------------------------------------------
 * CONFIGURACIÓN — cambie la clave AQUÍ, en el editor de Apps Script.
 * No escriba su clave real en el archivo publicado en GitHub.
 * ------------------------------------------------------------------ */
const CLAVE_DOCENTE = 'CAMBIE-ESTA-CLAVE';
const HOJA_RESULTADOS = 'Resultados';
const HOJA_RESPUESTAS = 'Respuestas';
const VERSION = '1.0';

/* Columnas fijas de la hoja Resultados: [clave interna, título visible] */
const COLUMNAS_RESULTADOS = [
  ['fecha', 'Fecha y hora'],
  ['idIntento', 'ID intento'],
  ['nombre', 'Nombre'],
  ['carne', 'Carné'],
  ['grupo', 'Grupo'],
  ['cursoCodigo', 'Curso'],
  ['actividadCodigo', 'Código actividad'],
  ['actividad', 'Actividad'],
  ['cantidadPreguntas', 'Cantidad de preguntas'],
  ['correctas', 'Correctas'],
  ['incorrectas', 'Incorrectas'],
  ['puntajeObtenido', 'Puntaje obtenido'],
  ['puntajeMaximo', 'Puntaje máximo'],
  ['porcentaje', 'Porcentaje'],
  ['nota', 'Nota'],
  ['notaMaxima', 'Nota máxima'],
  ['tiempoTotalSeg', 'Tiempo total (s)'],
  ['inicio', 'Inicio (estudiante)'],
  ['fin', 'Fin (estudiante)'],
  ['finalizadoPorTiempo', 'Terminó por tiempo'],
];

/* Columnas de la hoja Respuestas (una fila por pregunta) */
const COLUMNAS_RESPUESTAS = [
  ['fecha', 'Fecha y hora'],
  ['idIntento', 'ID intento'],
  ['carne', 'Carné'],
  ['nombre', 'Nombre'],
  ['grupo', 'Grupo'],
  ['actividadCodigo', 'Código actividad'],
  ['n', 'N.º'],
  ['idPregunta', 'ID pregunta'],
  ['tema', 'Tema'],
  ['tipo', 'Tipo'],
  ['dificultad', 'Dificultad'],
  ['respuesta', 'Respuesta dada'],
  ['correcta', 'Respuesta correcta'],
  ['estado', 'Resultado'],
  ['puntos', 'Puntos'],
  ['puntajeMax', 'Puntaje máximo'],
  ['tiempoSeg', 'Tiempo (s)'],
];

const MARCAS = { 'correcta': '✓', 'incorrecta': '✗', 'parcial': '◐', 'sin responder': '–' };

/* =====================================================================
 * Puntos de entrada del Web App
 * ===================================================================== */

/** Abrir la URL del Web App en el navegador muestra este mensaje (sirve para probarla). */
function doGet() {
  return responder({ ok: true, mensaje: 'Servicio de resultados activo.', version: VERSION });
}

/** Todas las peticiones de la aplicación llegan por POST. */
function doPost(e) {
  try {
    const cuerpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (cuerpo.accion === 'registrar') return responder(registrarIntento(cuerpo.intento));
    if (cuerpo.accion === 'resultados') return responder(leerResultados(cuerpo.clave));
    return responder({ ok: false, error: 'Acción desconocida.' });
  } catch (err) {
    return responder({ ok: false, error: 'Error del servidor: ' + err.message });
  }
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================================
 * Registro de intentos
 * ===================================================================== */

function registrarIntento(datos) {
  const error = validarIntento(datos);
  if (error) return { ok: false, error: error };

  // El candado evita que dos envíos simultáneos se mezclen o dupliquen.
  const candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    const hojas = configurarHojas();
    if (existeIntento(hojas.resultados, datos.idIntento)) {
      return { ok: true, estado: 'duplicado', idIntento: datos.idIntento };
    }
    const fecha = new Date();
    const respuestas = Array.isArray(datos.respuestas) ? datos.respuestas.slice(0, 200) : [];

    // --- Hoja Resultados: columnas fijas + P1..Pn ---
    asegurarColumnasP(hojas.resultados, respuestas.length);
    const fila = COLUMNAS_RESULTADOS.map(function (c) {
      return c[0] === 'fecha' ? fecha : limpiar(datos[c[0]]);
    });
    respuestas.forEach(function (r) {
      fila.push(limpiar((MARCAS[r.estado] || '') + ' ' + (r.respuesta || '(sin respuesta)')));
    });
    hojas.resultados.appendRow(fila);

    // --- Hoja Respuestas: una fila por pregunta ---
    if (respuestas.length) {
      const filas = respuestas.map(function (r) {
        return COLUMNAS_RESPUESTAS.map(function (c) {
          switch (c[0]) {
            case 'fecha': return fecha;
            case 'idIntento': case 'carne': case 'nombre': case 'grupo': case 'actividadCodigo':
              return limpiar(datos[c[0]]);
            case 'idPregunta': return limpiar(r.id);
            default: return limpiar(r[c[0]]);
          }
        });
      });
      const h = hojas.respuestas;
      h.getRange(h.getLastRow() + 1, 1, filas.length, COLUMNAS_RESPUESTAS.length).setValues(filas);
    }
    return { ok: true, estado: 'registrado', idIntento: datos.idIntento };
  } finally {
    candado.releaseLock();
  }
}

/** Revisión mínima de los datos recibidos. */
function validarIntento(d) {
  if (!d || typeof d !== 'object') return 'No se recibieron datos.';
  if (!/^[A-Z0-9]+-\d{4}-[A-Z0-9]{8}$/.test(String(d.idIntento || ''))) return 'Identificador de intento no válido.';
  if (!String(d.nombre || '').trim() || !String(d.carne || '').trim() || !String(d.grupo || '').trim()) {
    return 'Faltan datos del estudiante.';
  }
  const numeros = ['cantidadPreguntas', 'correctas', 'puntajeObtenido', 'puntajeMaximo', 'porcentaje', 'nota'];
  for (var i = 0; i < numeros.length; i++) {
    if (typeof d[numeros[i]] !== 'number' || !isFinite(d[numeros[i]])) return 'Dato numérico no válido: ' + numeros[i];
  }
  if (d.porcentaje < 0 || d.porcentaje > 100) return 'Porcentaje fuera de rango.';
  return null;
}

/**
 * Evita la "inyección de fórmulas": un texto que empieza con = + - @
 * se guarda como texto y no se ejecuta como fórmula de la hoja.
 */
function limpiar(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number' || typeof valor === 'boolean') return valor;
  var texto = String(valor).slice(0, 1000);
  return /^(=|\+|@|-(?!\d))/.test(texto) ? "'" + texto : texto;
}

function existeIntento(hoja, idIntento) {
  const ultima = hoja.getLastRow();
  if (ultima < 2) return false;
  const columna = indiceColumna('idIntento') + 1;
  return !!hoja.getRange(2, columna, ultima - 1, 1).createTextFinder(idIntento).matchEntireCell(true).findNext();
}

function indiceColumna(clave) {
  return COLUMNAS_RESULTADOS.findIndex(function (c) { return c[0] === clave; });
}

/** Agrega encabezados P1, P2, ... si este intento tiene más preguntas que los anteriores. */
function asegurarColumnasP(hoja, cantidad) {
  const fijas = COLUMNAS_RESULTADOS.length;
  const actuales = Math.max(0, hoja.getLastColumn() - fijas);
  if (cantidad <= actuales) return;
  const nuevos = [];
  for (var k = actuales + 1; k <= cantidad; k++) nuevos.push('P' + k);
  hoja.getRange(1, fijas + actuales + 1, 1, nuevos.length).setValues([nuevos]).setFontWeight('bold').setBackground('#eef0fc');
}

/* =====================================================================
 * Preparación de la hoja de cálculo
 * ===================================================================== */

/**
 * Crea (si no existen) las hojas "Resultados" y "Respuestas" con sus encabezados.
 * Puede ejecutarla manualmente desde el editor: seleccione «configurarHojas» y pulse ▶ Ejecutar.
 */
function configurarHojas() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  return {
    resultados: prepararHoja(libro, HOJA_RESULTADOS, COLUMNAS_RESULTADOS),
    respuestas: prepararHoja(libro, HOJA_RESPUESTAS, COLUMNAS_RESPUESTAS),
  };
}

function prepararHoja(libro, nombre, columnas) {
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    const titulos = columnas.map(function (c) { return c[1]; });
    hoja.getRange(1, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold').setBackground('#eef0fc');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    hoja.autoResizeColumns(1, titulos.length);
  }
  return hoja;
}

/* =====================================================================
 * Lectura para el panel docente
 * ===================================================================== */

function leerResultados(clave) {
  if (CLAVE_DOCENTE === 'CAMBIE-ESTA-CLAVE') {
    return { ok: false, error: 'Primero cambie CLAVE_DOCENTE en Code.gs y publique una nueva versión.' };
  }
  if (String(clave || '') !== CLAVE_DOCENTE) {
    Utilities.sleep(800); // frena intentos de adivinar la clave
    return { ok: false, error: 'Clave docente incorrecta.' };
  }
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = configurarHojas();
  const zona = Session.getScriptTimeZone();

  const resultados = leerFilas(hojas.resultados, COLUMNAS_RESULTADOS, zona, true);
  const respuestas = leerFilas(hojas.respuestas, COLUMNAS_RESPUESTAS, zona, false);
  return {
    ok: true,
    resultados: resultados,
    respuestas: respuestas,
    hoja: { id: libro.getId(), url: libro.getUrl(), nombre: libro.getName() },
    generado: Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd HH:mm:ss'),
  };
}

function leerFilas(hoja, columnas, zona, conColumnasP) {
  const ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  const valores = hoja.getRange(2, 1, ultima - 1, hoja.getLastColumn()).getValues();
  return valores.map(function (fila) {
    const obj = {};
    columnas.forEach(function (c, i) {
      const v = fila[i];
      obj[c[0]] = v instanceof Date ? Utilities.formatDate(v, zona, 'yyyy-MM-dd HH:mm:ss') : v;
    });
    if (conColumnasP) obj.p = fila.slice(columnas.length).filter(function (v) { return v !== ''; });
    return obj;
  });
}

/* =====================================================================
 * Prueba desde el editor
 * ===================================================================== */

/**
 * Inserta un intento de prueba. En el editor de Apps Script seleccione
 * «probarRegistro» y pulse ▶ Ejecutar; luego revise la hoja Resultados.
 */
function probarRegistro() {
  const id = 'PRUEBA-' + new Date().getFullYear() + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  const r = registrarIntento({
    idIntento: id, nombre: 'Estudiante de prueba', carne: 'A00000', grupo: 'Grupo 01',
    cursoCodigo: 'MA1103', actividadCodigo: 'PRUEBA', actividad: 'Prueba de conexión',
    cantidadPreguntas: 2, correctas: 1, incorrectas: 1, puntajeObtenido: 1, puntajeMaximo: 2,
    porcentaje: 50, nota: 50, notaMaxima: 100, tiempoTotalSeg: 60,
    inicio: new Date().toISOString(), fin: new Date().toISOString(), finalizadoPorTiempo: false,
    respuestas: [
      { n: 1, id: 'DER-001', tema: 'Derivadas', tipo: 'unica', respuesta: 'B) x^x(ln x + 1)', correcta: 'B) x^x(ln x + 1)', estado: 'correcta', puntos: 1, puntajeMax: 1, tiempoSeg: 30 },
      { n: 2, id: 'DET-001', tema: 'Determinantes', tipo: 'numerica', respuesta: '-60', correcta: '-61', estado: 'incorrecta', puntos: 0, puntajeMax: 1, tiempoSeg: 30 },
    ],
  });
  Logger.log(JSON.stringify(r));
}
