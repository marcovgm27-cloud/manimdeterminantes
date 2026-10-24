/* =====================================================================
 * config.js — CONFIGURACIÓN GENERAL DE LA ACTIVIDAD
 * ---------------------------------------------------------------------
 * Este es el ÚNICO archivo que necesita modificar para cambiar el curso,
 * la actividad, los grupos, la calificación, la aleatoriedad y la
 * conexión con Google Sheets.
 *
 * Reglas para editar sin errores:
 *   - Los textos van entre comillas: "así".
 *   - true = activado, false = desactivado.
 *   - No borre las comas al final de cada línea.
 * ===================================================================== */

window.CONFIG = {
  /* ---------------- Curso ---------------- */
  curso: {
    nombre: "Cálculo Diferencial e Integral",
    codigo: "MA1103",          // Se usa también en el identificador del intento
    periodo: "II-2026",
  },

  /* ---------------- Actividad ---------------- */
  actividad: {
    nombre: "Reto matemático 1",
    codigo: "RETO-01",         // Código corto para identificar la actividad en la hoja
    descripcion: "Derivadas, límites, matrices y números complejos.",
    instrucciones: [
      "Lea cada reto con atención antes de responder.",
      "Pulse «Comprobar respuesta» para registrar su respuesta. Después ya no podrá cambiarla.",
      "Al terminar, pulse «Enviar evaluación» y espere el mensaje de confirmación.",
    ],
  },

  /* ---------------- Grupos (menú desplegable) ---------------- */
  grupos: ["Grupo 01", "Grupo 02", "Grupo 03", "Grupo 04"],

  /* ---------------- Banco de preguntas ---------------- */
  preguntas: {
    // Archivo con el banco. Normalmente "js/questions.js".
    // Si genera un banco protegido desde docente.html, cambie a "js/questions.protegido.js".
    archivo: "js/questions.js",
    // Cuántas preguntas tendrá cada intento. null = todas las preguntas activas.
    cantidad: null,
    // Usar solo ciertos temas, por ejemplo ["Derivadas", "Límites"]. [] = todos.
    temas: [],
    // Puntaje que se usa si una pregunta no indica "puntaje".
    puntajePorDefecto: 1,
    // Tolerancia por defecto para respuestas numéricas (diferencia máxima aceptada).
    toleranciaNumerica: 0.001,
  },

  /* ---------------- Aleatoriedad ---------------- */
  aleatoriedad: {
    mezclarPreguntas: true,      // Cambiar el orden de las preguntas
    mezclarOpciones: true,       // Cambiar el orden de las opciones (A, B, C, D)
    seleccionAleatoria: false,   // Elegir al azar "cantidad" preguntas del banco
    // true: el mismo carné siempre recibe la misma versión (útil si recarga la página).
    // false: cada intento es diferente.
    semillaPorEstudiante: true,
  },

  /* ---------------- Calificación ---------------- */
  calificacion: {
    notaMaxima: 100,             // Escala de la nota: 100, 10, 7, ...
    decimales: 1,                // Decimales de la nota
    notaAprobacion: 70,          // Solo se usa para colorear resultados en el panel docente
    // Selección múltiple: true = puntaje parcial; false = todo o nada.
    puntajeParcialMultiple: false,
  },

  /* ---------------- Tiempo ---------------- */
  tiempo: {
    limiteMinutos: null,         // null = sin límite. Ej.: 20 → la actividad termina a los 20 min.
  },

  /* ---------------- Retroalimentación y resultados ---------------- */
  retroalimentacion: {
    mostrar: true,               // Mostrar "Correcto / Incorrecto" después de comprobar
    mostrarRespuestaCorrecta: true, // Mostrar cuál era la respuesta correcta si falla
    mostrarExplicacion: true,    // Mostrar el texto de "retroalimentacion" de cada pregunta
  },
  resultados: {
    mostrarNotaFinal: true,      // Mostrar la nota en la pantalla final
    mostrarDetalle: true,        // Mostrar el resumen pregunta por pregunta al final
    permitirNuevoIntento: false, // Mostrar botón "Realizar otro intento" tras enviar
  },

  /* ---------------- Conexión con Google Sheets ---------------- */
  envio: {
    // Pegue aquí la URL del Web App de Google Apps Script (termina en /exec).
    urlAppsScript: "https://script.google.com/macros/s/AKfycbxLMGLwEaZmLdS9AcCiVkO3dXVmA53GccgdVV_hpvELBD-Kipa5dbaEPHU68V66mtGC/exec",
    tiempoEsperaSegundos: 25,    // Tiempo máximo de espera de la respuesta del servidor
  },

  /* ---------------- Panel docente ---------------- */
  docente: {
    separadorCSV: ";",           // ";" funciona mejor con Excel en español; "," para inglés
  },
};
