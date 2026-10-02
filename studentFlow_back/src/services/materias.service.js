import * as materiasRepository from "../repositories/materias.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Obtiene la lista paginada de materias asociadas a un usuario según los filtros dados.
 *
 * @async
 * @function listMaterias
 * @param {string|number} userId - Identificador único del usuario dueño de las materias.
 * @param {Object} filters - Filtros de consulta y opciones de paginación.
 * @param {number} filters.page - Número de página actual.
 * @param {number} filters.limit - Cantidad máxima de registros por página.
 * @param {boolean} [filters.activa] - Filtro opcional por estado activo/inactivo.
 * @param {string} [filters.search] - Criterio de búsqueda por nombre o código.
 * @param {string} [filters.sort] - Campo de ordenamiento.
 * @param {string} [filters.order] - Dirección del orden (asc/desc).
 *
 * @returns {Promise<Object>} Objeto con las materias obtenidas (data) y metadatos de paginación (meta).
 */
export async function listMaterias(userId, filters) {
  const { materias, total } = await materiasRepository.findAllByUserId(userId, filters);

  return {
    data: materias,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Obtiene los detalles de una materia por su ID y valida que pertenezca al usuario especificado.
 *
 * @async
 * @function getMateriaById
 * @param {string|number} id - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario propietario.
 *
 * @returns {Promise<Object>} Datos de la materia encontrada.
 *
 * @throws {HttpError} Código 404 (Materia_not_found) si no se encuentra la materia para el usuario.
 */
export async function getMateriaById(id, userId) {
  const materia = await materiasRepository.findByIdAndUserId(id, userId);

  if (!materia) {
    throw new HttpError(404, "Materia_not_found", "No se encontró la materia con el ID proporcionado para el usuario especificado.");
  }

  return materia;
}

/**
 * Crea una nueva materia para el usuario verificando la unicidad del código y nombre.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Objeto con los datos de la materia a registrar.
 *
 * @returns {Promise<Object>} Datos de la materia creada con su ID generado.
 *
 * @throws {HttpError} Código 409 si el código o nombre ya están registrados para el usuario.
 */
export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}

/**
 * Valida que el código y el nombre de una materia sean únicos para un usuario específico.
 *
 * @async
 * @function ensureUniqueFields
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Objeto que contiene los datos de la materia a validar.
 * @param {string} [materia.codigo] - Código identificador de la materia (opcional).
 * @param {string} [materia.nombre] - Nombre de la materia (opcional).
 * @param {string|number} [excludeId] - ID de una materia existente a excluir de la validación.
 *
 * @returns {Promise} No retorna ningún valor si las validaciones son exitosas.
 *
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
async function ensureUniqueFields(userId, materia, excludeId) {
  if (materia.codigo) {
    const duplicatedCode = await materiasRepository.existsByCode(userId, materia.codigo, excludeId);

    if (duplicatedCode) {
      throw new HttpError(409, "DUPLICATE_CODE", "Ya existe una materia con ese código.");
    }
  }

  if (materia.nombre) {
    const duplicatedName = await materiasRepository.existsByName(userId, materia.nombre, excludeId);

    if (duplicatedName) {
      throw new HttpError(409, "DUPLICATE_NAME", "Ya existe una materia con ese nombre.");
    }
  }
}

/**
 * Reemplaza completamente los datos de una materia existente (PUT).
 *
 * @async
 * @function replaceMateria
 * @param {string|number} id - Identificador de la materia a reemplazar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Nuevos datos completos de la materia.
 *
 * @returns {Promise<Object>} Datos de la materia actualizada.
 *
 * @throws {HttpError} Código 404 si la materia no existe.
 * @throws {HttpError} Código 409 si el nuevo código o nombre ya están en uso por otra materia.
 */
export async function replaceMateria(id, userId, materia) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, materia, id);
  return materiasRepository.updateMateria(id, userId, materia);
}

/**
 * Actualiza parcialmente los datos de una materia existente (PATCH).
 *
 * @async
 * @function updateMateria
 * @param {string|number} id - Identificador de la materia a actualizar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} partialMateria - Datos parciales a modificar.
 *
 * @returns {Promise<Object>} Datos de la materia actualizada.
 *
 * @throws {HttpError} Código 404 si la materia no existe.
 * @throws {HttpError} Código 409 si los campos actualizados colisionan con otra materia existente.
 */
export async function updateMateria(id, userId, partialMateria) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, partialMateria, id);
  return materiasRepository.patchMateria(id, userId, partialMateria);
}

/**
 * Elimina una materia perteneciente al usuario por su ID.
 *
 * @async
 * @function removeMateria
 * @param {string|number} id - Identificador único de la materia a eliminar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<void>} No retorna ningún valor tras la eliminación exitosa.
 *
 * @throws {HttpError} Código 404 si la materia no existe para el usuario.
 */
export async function removeMateria(id, userId) {
  await getMateriaById(id, userId);
  await materiasRepository.deleteMateria(id, userId);
}

/**
 * Obtiene todas las tareas asociadas a una materia verificando pertenencia al usuario.
 *
 * @async
 * @function getTareasByMateriaId
 * @param {string|number} materiaId - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Array<Object>>} Lista de tareas asociadas a la materia.
 *
 * @throws {HttpError} Código 404 (Materia_not_found) si la materia no existe o no pertenece al usuario.
 */
export async function getTareasByMateriaId(materiaId, userId) {
  await getMateriaById(materiaId, userId);
  return materiasRepository.findTareasByMateriaIdAndUserId(materiaId, userId);
}

/**
 * Obtiene todos los eventos asociados a una materia del usuario autenticado.
 *
 * @async
 * @function listEventosByMateria
 * @param {string|number} id - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Array<Object>>} Lista de eventos pertenecientes a la materia del usuario.
 */
export async function listEventosByMateria(id, userId) {
  return materiasRepository.findEventosByMateriaAndUserId(id, userId);
}
