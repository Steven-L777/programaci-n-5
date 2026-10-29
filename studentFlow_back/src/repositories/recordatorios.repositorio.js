import { pool } from "../config/database.js";

const sortableColumns = {
  id: "r.id_recordatorio",
  mensaje: "r.mensaje",
  fechaHora: "r.fecha_hora",
  canal: "r.canal",
  leido: "r.leido"
};

function normalizeSort(sort, order) {
  const column = sortableColumns[sort] || sortableColumns.fechaHora;
  const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";
  return `${column} ${direction}`;
}

function mapRecordatorio(row) {
  return {
    id: row.id,
    tareaId: row.tareaId,
    tareaTitulo: row.tareaTitulo,
    materiaNombre: row.materiaNombre,
    mensaje: row.mensaje,
    fechaHora: row.fechaHora,
    canal: row.canal,
    leido: Boolean(row.leido),
    createdAt: row.createdAt
  };
}

/**
 * Consulta listado paginado y filtrado de recordatorios pertenecientes al usuario.
 *
 * @param {number} userId
 * @param {Object} filters
 * @returns {Promise<{recordatorios: Array, total: number}>}
 */
export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (typeof filters.leido === "boolean") {
    conditions.push("r.leido = ?");
    params.push(filters.leido ? 1 : 0);
  }

  if (filters.search) {
    conditions.push("(r.mensaje LIKE ? OR t.titulo LIKE ? OR m.nombre LIKE ?)");
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM recordatorio r
     INNER JOIN tarea t ON r.id_tarea = t.id_tarea
     INNER JOIN materia m ON t.id_materia = m.id_materia
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  const orderBy = normalizeSort(filters.sort, filters.order);
  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;

  const [rows] = await pool.execute(
    `SELECT
       r.id_recordatorio AS id,
       r.id_tarea AS tareaId,
       t.titulo AS tareaTitulo,
       m.nombre AS materiaNombre,
       r.mensaje,
       r.fecha_hora AS fechaHora,
       r.canal,
       r.leido,
       r.created_at AS createdAt
     FROM recordatorio r
     INNER JOIN tarea t ON r.id_tarea = t.id_tarea
     INNER JOIN materia m ON t.id_materia = m.id_materia
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    recordatorios: rows.map(mapRecordatorio),
    total: countRows[0].total
  };
}

/**
 * Busca un recordatorio por ID asegurando propiedad del usuario autenticado.
 *
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       r.id_recordatorio AS id,
       r.id_tarea AS tareaId,
       t.titulo AS tareaTitulo,
       m.nombre AS materiaNombre,
       r.mensaje,
       r.fecha_hora AS fechaHora,
       r.canal,
       r.leido,
       r.created_at AS createdAt
     FROM recordatorio r
     INNER JOIN tarea t ON r.id_tarea = t.id_tarea
     INNER JOIN materia m ON t.id_materia = m.id_materia
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapRecordatorio(rows[0]) : null;
}

/**
 * Verifica si una tarea existe y pertenece al usuario autenticado.
 *
 * @param {number} tareaId
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
export async function existsTareaByUserId(tareaId, userId) {
  const [rows] = await pool.execute(
    `SELECT t.id_tarea
     FROM tarea t
     INNER JOIN materia m ON t.id_materia = m.id_materia
     WHERE t.id_tarea = ? AND m.id_usuario = ?
     LIMIT 1`,
    [tareaId, userId]
  );

  return rows.length > 0;
}

/**
 * Obtiene las tareas disponibles del usuario para asociar a recordatorios.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export async function findTareasByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
       t.id_tarea AS id,
       t.id_materia AS materiaId,
       m.nombre AS materiaNombre,
       t.titulo,
       t.descripcion,
       t.fecha_entrega AS fechaEntrega,
       t.hora_entrega AS horaEntrega,
       t.prioridad,
       t.estado
     FROM tarea t
     INNER JOIN materia m ON t.id_materia = m.id_materia
     WHERE m.id_usuario = ?
     ORDER BY t.fecha_entrega ASC, t.hora_entrega ASC, t.titulo ASC`,
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    materiaId: row.materiaId,
    materiaNombre: row.materiaNombre,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaEntrega: row.fechaEntrega,
    horaEntrega: row.horaEntrega,
    prioridad: row.prioridad,
    estado: row.estado
  }));
}

/**
 * Inserta un nuevo recordatorio.
 *
 * @param {number} userId
 * @param {Object} recordatorio
 * @returns {Promise<Object>}
 */
export async function createRecordatorio(userId, recordatorio) {
  const [result] = await pool.execute(
    `INSERT INTO recordatorio (id_tarea, mensaje, fecha_hora, canal, leido)
     VALUES (?, ?, ?, ?, ?)`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}

/**
 * Reemplaza los datos de un recordatorio existente.
 *
 * @param {number} id
 * @param {number} userId
 * @param {Object} recordatorio
 * @returns {Promise<Object>}
 */
export async function updateRecordatorio(id, userId, recordatorio) {
  await pool.execute(
    `UPDATE recordatorio
     SET id_tarea = ?, mensaje = ?, fecha_hora = ?, canal = ?, leido = ?
     WHERE id_recordatorio = ?`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0,
      id
    ]
  );

  return findByIdAndUserId(id, userId);
}

/**
 * Aplica cambios parciales a un recordatorio existente.
 *
 * @param {number} id
 * @param {number} userId
 * @param {Object} partialRecordatorio
 * @returns {Promise<Object>}
 */
export async function patchRecordatorio(id, userId, partialRecordatorio) {
  const fields = [];
  const params = [];

  if (partialRecordatorio.tareaId !== undefined) {
    fields.push("id_tarea = ?");
    params.push(partialRecordatorio.tareaId);
  }

  if (partialRecordatorio.mensaje !== undefined) {
    fields.push("mensaje = ?");
    params.push(partialRecordatorio.mensaje);
  }

  if (partialRecordatorio.fechaHora !== undefined) {
    fields.push("fecha_hora = ?");
    params.push(partialRecordatorio.fechaHora);
  }

  if (partialRecordatorio.canal !== undefined) {
    fields.push("canal = ?");
    params.push(partialRecordatorio.canal);
  }

  if (partialRecordatorio.leido !== undefined) {
    fields.push("leido = ?");
    params.push(partialRecordatorio.leido ? 1 : 0);
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  params.push(id);

  await pool.execute(
    `UPDATE recordatorio
     SET ${fields.join(", ")}
     WHERE id_recordatorio = ?`,
    params
  );

  return findByIdAndUserId(id, userId);
}

/**
 * Elimina un recordatorio por ID.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteRecordatorio(id) {
  const [result] = await pool.execute(
    "DELETE FROM recordatorio WHERE id_recordatorio = ?",
    [id]
  );

  return result.affectedRows > 0;
}

