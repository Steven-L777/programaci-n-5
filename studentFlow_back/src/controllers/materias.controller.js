import * as materiasService from "../services/materias.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";

import {
    validateCreateMateria,
    validateMateriaListQuery,
    validateMateriaId,
    validatePatchMateria
} from "../validators/materias.validator.js";

export async function listMaterias(request, response, next) {
  try {
    const filters = validateMateriaListQuery(request.query);
    const result = await materiasService.listMaterias(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function getMateriaById(request, response, next) {
  try {

    const id  = validateMateriaId(request.params.id);
    const materia = await materiasService.getMateriaById(id, request.user.id);
    return sendSuccess(response, materia)

  } catch (error) {
    return next(error);
  }
}

export async function createMateria(request, response, next) {
  try {
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.createMateria(request.user.id, payload);
    return sendSuccess(response, materia, 201);
  } catch (error) {
    return next(error);
  }
}

export async function replaceMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.replaceMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

export async function updateMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validatePatchMateria(request.body);
    const materia = await materiasService.updateMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    await materiasService.removeMateria(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}

/**
 * Controlador para obtener todas las tareas de una materia específica dado su ID y el usuario autenticado.
 *
 * @async
 * @function getTareasByMateriaId
 * @param {Object} request - Objeto de solicitud HTTP de Express.
 * @param {Object} request.params - Parámetros de ruta en la URL.
 * @param {string} request.params.id - Identificador de la materia.
 * @param {Object} request.user - Objeto de usuario autenticado.
 * @param {string|number} request.user.id - ID del usuario autenticado.
 * @param {Object} response - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función para delegar errores al manejador global.
 *
 * @returns {Promise<void>} Envía respuesta HTTP 200 con la lista de tareas de la materia.
 */
export async function getTareasByMateriaId(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const tareas = await materiasService.getTareasByMateriaId(id, request.user.id);
    return sendSuccess(response, tareas);
  } catch (error) {
    return next(error);
  }
}