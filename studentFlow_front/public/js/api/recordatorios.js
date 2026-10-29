import { request } from "./http.js";

function recordatorioPath(id) {
  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new TypeError("El ID debe ser un entero mayor que cero.");
  }
  return `/recordatorios/${parsed}`;
}

/**
 * Consulta listado de recordatorios con filtros opcionales.
 * Filtros: leido, search, page, limit, sort, order.
 */
export function listarRecordatorios(filtros = {}) {
  return request("/recordatorios", { query: filtros });
}

/**
 * Consulta las tareas del usuario disponibles para asignar un recordatorio.
 */
export function listarTareasDisponibles() {
  return request("/recordatorios/tareas");
}

/**
 * Obtiene un recordatorio por ID.
 */
export function obtenerRecordatorio(id) {
  return request(recordatorioPath(id));
}

/**
 * Crea un nuevo recordatorio.
 * tareaId, mensaje, fechaHora y canal son obligatorios; leido es opcional.
 */
export function crearRecordatorio(recordatorio) {
  return request("/recordatorios", { method: "POST", body: recordatorio });
}

/**
 * Reemplaza completamente un recordatorio (PUT).
 */
export function reemplazarRecordatorio(id, recordatorio) {
  return request(recordatorioPath(id), { method: "PUT", body: recordatorio });
}

/**
 * Actualiza parcialmente un recordatorio (PATCH).
 */
export function actualizarRecordatorio(id, cambios) {
  return request(recordatorioPath(id), { method: "PATCH", body: cambios });
}

/**
 * Elimina un recordatorio. Devuelve null con HTTP 204.
 */
export function eliminarRecordatorio(id) {
  return request(recordatorioPath(id), { method: "DELETE" });
}

