import { HttpError } from "../utils/http-error.js";

/**
 * Normaliza y valida valores booleanos estrictos.
 *
 * @param {*} value
 * @param {string} fieldName
 * @returns {boolean|undefined}
 */
function parseBoolean(value, fieldName = "leido") {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase().trim();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser booleano (true o false).`);
}

/**
 * Valida que el ID de tarea sea un número entero positivo.
 *
 * @param {*} value
 * @returns {number}
 */
function parseTareaId(value) {
  if (value === undefined || value === null || value === "") {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'tareaId' es obligatorio.");
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'tareaId' debe ser un entero positivo válido.");
  }

  return parsed;
}

/**
 * Valida el texto del mensaje del recordatorio.
 *
 * @param {*} value
 * @returns {string}
 */
function parseMensaje(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' es obligatorio.");
  }

  const trimmed = value.trim();

  if (trimmed.length > 255) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' no puede superar los 255 caracteres.");
  }

  return trimmed;
}

/**
 * Valida el canal de notificación permitido (in_app | email).
 *
 * @param {*} value
 * @returns {"in_app"|"email"}
 */
function parseCanal(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'canal' es obligatorio.");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized !== "in_app" && normalized !== "email") {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'canal' debe ser 'in_app' o 'email'.");
  }

  return normalized;
}

/**
 * Valida el formato de fecha y hora ISO local (YYYY-MM-DDTHH:mm o YYYY-MM-DDTHH:mm:ss).
 *
 * @param {*} value
 * @returns {string}
 */
function parseFechaHora(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'fechaHora' es obligatorio.");
  }

  const trimmed = value.trim();
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

  if (!isoPattern.test(trimmed)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'fechaHora' debe tener el formato YYYY-MM-DDTHH:mm o YYYY-MM-DDTHH:mm:ss.");
  }

  const parsedDate = new Date(trimmed);

  if (isNaN(parsedDate.getTime())) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'fechaHora' no contiene una fecha válida.");
  }

  return trimmed;
}

/**
 * Valida el identificador numérico de un recordatorio proveniente de parámetros URL.
 *
 * @param {*} id
 * @returns {number}
 */
export function validateRecordatorioId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de recordatorio no es válido.");
  }

  return parsedId;
}

/**
 * Valida los parámetros de consulta para el listado de recordatorios.
 *
 * @param {Object} query
 * @returns {Object}
 */
export function validateRecordatorioListQuery(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  return {
    leido: parseBoolean(query.leido, "leido"),
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: typeof query.sort === "string" ? query.sort.trim() : undefined,
    order: typeof query.order === "string" ? query.order.trim() : undefined,
    page,
    limit
  };
}

/**
 * Valida el cuerpo para la creación o reemplazo total de un recordatorio.
 *
 * @param {Object} body
 * @returns {Object}
 */
export function validateCreateRecordatorio(body = {}) {
  const tareaId = parseTareaId(body.tareaId);
  const mensaje = parseMensaje(body.mensaje);
  const fechaHora = parseFechaHora(body.fechaHora);
  const canal = parseCanal(body.canal);
  const leido = body.leido === undefined ? false : (parseBoolean(body.leido, "leido") ?? false);

  return {
    tareaId,
    mensaje,
    fechaHora,
    canal,
    leido
  };
}

/**
 * Valida el cuerpo para la actualización parcial (PATCH) de un recordatorio.
 *
 * @param {Object} body
 * @returns {Object}
 */
export function validatePatchRecordatorio(body = {}) {
  const payload = {};

  if (body.tareaId !== undefined) {
    payload.tareaId = parseTareaId(body.tareaId);
  }

  if (body.mensaje !== undefined) {
    payload.mensaje = parseMensaje(body.mensaje);
  }

  if (body.fechaHora !== undefined) {
    payload.fechaHora = parseFechaHora(body.fechaHora);
  }

  if (body.canal !== undefined) {
    payload.canal = parseCanal(body.canal);
  }

  if (body.leido !== undefined) {
    payload.leido = parseBoolean(body.leido, "leido");
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "Debe proporcionar al menos un campo válido para actualizar.");
  }

  return payload;
}
