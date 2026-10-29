import * as recordatoriosRepository from "../repositories/recordatorios.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Consulta la lista paginada de recordatorios de un usuario con filtros opcionales.
 *
 * @param {number} userId
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
export async function listRecordatorios(userId, filters) {
  const { recordatorios, total } = await recordatoriosRepository.findAllByUserId(userId, filters);

  return {
    data: recordatorios,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Obtiene el detalle de un recordatorio asegurando su pertenencia al usuario.
 *
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export async function getRecordatorioById(id, userId) {
  const recordatorio = await recordatoriosRepository.findByIdAndUserId(id, userId);

  if (!recordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "No se encontró el recordatorio para el usuario autenticado.");
  }

  return recordatorio;
}

/**
 * Retorna las tareas del usuario disponibles para vincular a un recordatorio.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export async function getTareasDisponibles(userId) {
  return recordatoriosRepository.findTareasByUserId(userId);
}

/**
 * Valida que una tarea exista y pertenezca al usuario.
 *
 * @param {number} tareaId
 * @param {number} userId
 * @throws {HttpError} 404 si la tarea no existe o no pertenece al usuario.
 */
async function ensureTareaBelongsToUser(tareaId, userId) {
  const exists = await recordatoriosRepository.existsTareaByUserId(tareaId, userId);

  if (!exists) {
    throw new HttpError(404, "TAREA_NOT_FOUND", "La tarea seleccionada no existe o no pertenece al usuario actual.");
  }
}

/**
 * Registra un nuevo recordatorio tras verificar la tarea asociada.
 *
 * @param {number} userId
 * @param {Object} recordatorio
 * @returns {Promise<Object>}
 */
export async function createRecordatorio(userId, recordatorio) {
  await ensureTareaBelongsToUser(recordatorio.tareaId, userId);
  return recordatoriosRepository.createRecordatorio(userId, recordatorio);
}

/**
 * Reemplaza completamente un recordatorio (PUT).
 *
 * @param {number} id
 * @param {number} userId
 * @param {Object} recordatorio
 * @returns {Promise<Object>}
 */
export async function replaceRecordatorio(id, userId, recordatorio) {
  await getRecordatorioById(id, userId);
  await ensureTareaBelongsToUser(recordatorio.tareaId, userId);
  return recordatoriosRepository.updateRecordatorio(id, userId, recordatorio);
}

/**
 * Modifica parcialmente los campos de un recordatorio (PATCH).
 *
 * @param {number} id
 * @param {number} userId
 * @param {Object} partialRecordatorio
 * @returns {Promise<Object>}
 */
export async function updateRecordatorio(id, userId, partialRecordatorio) {
  await getRecordatorioById(id, userId);

  if (partialRecordatorio.tareaId !== undefined) {
    await ensureTareaBelongsToUser(partialRecordatorio.tareaId, userId);
  }

  return recordatoriosRepository.patchRecordatorio(id, userId, partialRecordatorio);
}

/**
 * Elimina un recordatorio propio.
 *
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<void>}
 */
export async function removeRecordatorio(id, userId) {
  await getRecordatorioById(id, userId);
  await recordatoriosRepository.deleteRecordatorio(id);
}

