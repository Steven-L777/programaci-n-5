import * as recordatoriosService from "../services/recordatorios.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";
import {
  validateCreateRecordatorio,
  validatePatchRecordatorio,
  validateRecordatorioId,
  validateRecordatorioListQuery
} from "../validators/recordatorios.validator.js";

/**
 * Consulta la colección paginada y filtrada de recordatorios del usuario.
 */
export async function listRecordatorios(request, response, next) {
  try {
    const filters = validateRecordatorioListQuery(request.query);
    const result = await recordatoriosService.listRecordatorios(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

/**
 * Consulta las tareas del usuario disponibles para asignar un recordatorio.
 */
export async function getTareas(request, response, next) {
  try {
    const tareas = await recordatoriosService.getTareasDisponibles(request.user.id);
    return sendSuccess(response, tareas, 200);
  } catch (error) {
    return next(error);
  }
}

/**
 * Consulta un recordatorio específico por su ID.
 */
export async function getRecordatorioById(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const recordatorio = await recordatoriosService.getRecordatorioById(id, request.user.id);
    return sendSuccess(response, recordatorio, 200);
  } catch (error) {
    return next(error);
  }
}

/**
 * Crea un nuevo recordatorio asociado a una tarea del usuario.
 */
export async function createRecordatorio(request, response, next) {
  try {
    const payload = validateCreateRecordatorio(request.body);
    const recordatorio = await recordatoriosService.createRecordatorio(request.user.id, payload);
    return sendSuccess(response, recordatorio, 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * Reemplaza por completo los datos de un recordatorio (PUT).
 */
export async function replaceRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const payload = validateCreateRecordatorio(request.body);
    const recordatorio = await recordatoriosService.replaceRecordatorio(id, request.user.id, payload);
    return sendSuccess(response, recordatorio, 200);
  } catch (error) {
    return next(error);
  }
}

/**
 * Actualiza parcialmente los campos enviados de un recordatorio (PATCH).
 */
export async function updateRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const payload = validatePatchRecordatorio(request.body);
    const recordatorio = await recordatoriosService.updateRecordatorio(id, request.user.id, payload);
    return sendSuccess(response, recordatorio, 200);
  } catch (error) {
    return next(error);
  }
}

/**
 * Elimina un recordatorio del usuario. Responde HTTP 204 No Content.
 */
export async function deleteRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    await recordatoriosService.removeRecordatorio(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}

