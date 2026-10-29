import test from "node:test";
import assert from "node:assert/strict";
import {
  validateRecordatorioId,
  validateRecordatorioListQuery,
  validateCreateRecordatorio,
  validatePatchRecordatorio
} from "../src/validators/recordatorios.validator.js";
import { HttpError } from "../src/utils/http-error.js";
import { pool } from "../src/config/database.js";
import app from "../src/app.js";

test("Validador: validateRecordatorioId rechaza IDs no enteros o menores a 1", () => {
  assert.equal(validateRecordatorioId(5), 5);
  assert.equal(validateRecordatorioId("12"), 12);

  for (const invalid of [0, -1, "abc", null, undefined, 2.5]) {
    assert.throws(
      () => validateRecordatorioId(invalid),
      (err) => err instanceof HttpError && err.statusCode === 400 && err.code === "INVALID_ID"
    );
  }
});

test("Validador: validateRecordatorioListQuery valida paginación y filtros", () => {
  const query = validateRecordatorioListQuery({
    page: "2",
    limit: "10",
    leido: "true",
    search: "examen",
    sort: "mensaje",
    order: "desc"
  });

  assert.deepEqual(query, {
    page: 2,
    limit: 10,
    leido: true,
    search: "examen",
    sort: "mensaje",
    order: "desc"
  });

  // Valores por defecto
  const defaultQuery = validateRecordatorioListQuery({});
  assert.equal(defaultQuery.page, 1);
  assert.equal(defaultQuery.limit, 20);
  assert.equal(defaultQuery.leido, undefined);
  assert.equal(defaultQuery.search, "");

  // Page o limit inválidos
  assert.throws(() => validateRecordatorioListQuery({ page: 0 }), { statusCode: 422 });
  assert.throws(() => validateRecordatorioListQuery({ limit: 150 }), { statusCode: 422 });
  assert.throws(() => validateRecordatorioListQuery({ leido: "quizas" }), { statusCode: 422 });
});

test("Validador: validateCreateRecordatorio valida campos obligatorios y tipos", () => {
  const valid = validateCreateRecordatorio({
    tareaId: 1,
    mensaje: "Recordatorio de entrega",
    fechaHora: "2026-10-30T10:00",
    canal: "in_app"
  });

  assert.equal(valid.tareaId, 1);
  assert.equal(valid.mensaje, "Recordatorio de entrega");
  assert.equal(valid.fechaHora, "2026-10-30T10:00");
  assert.equal(valid.canal, "in_app");
  assert.equal(valid.leido, false);

  // Faltan campos o son inválidos
  assert.throws(() => validateCreateRecordatorio({}), { statusCode: 422 });
  assert.throws(() => validateCreateRecordatorio({ tareaId: "invalid" }), { statusCode: 422 });
  assert.throws(() => validateCreateRecordatorio({ tareaId: 1, mensaje: "" }), { statusCode: 422 });
  assert.throws(() => validateCreateRecordatorio({ tareaId: 1, mensaje: "x", fechaHora: "fecha-invalida" }), { statusCode: 422 });
  assert.throws(() => validateCreateRecordatorio({ tareaId: 1, mensaje: "x", fechaHora: "2026-10-30T10:00", canal: "sms" }), { statusCode: 422 });
});

test("Validador: validatePatchRecordatorio permite actualización parcial", () => {
  const partial = validatePatchRecordatorio({ leido: true });
  assert.deepEqual(partial, { leido: true });

  const partial2 = validatePatchRecordatorio({ mensaje: "Nuevo texto", canal: "email" });
  assert.deepEqual(partial2, { mensaje: "Nuevo texto", canal: "email" });

  assert.throws(() => validatePatchRecordatorio({}), { statusCode: 422 });
});

test("Integración Express: endpoints responden con status y formato esperado", async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/recordatorios`;

  t.after(async () => {
    server.close();
    await pool.end();
  });

  // GET / -> 200
  const resList = await fetch(baseUrl);
  assert.equal(resList.status, 200);
  const dataList = await resList.json();
  assert.equal(dataList.success, true);
  assert.ok(Array.isArray(dataList.data));
  assert.ok(dataList.meta);

  // GET /tareas -> 200
  const resTareas = await fetch(`${baseUrl}/tareas`);
  assert.equal(resTareas.status, 200);
  const dataTareas = await resTareas.json();
  assert.equal(dataTareas.success, true);
  assert.ok(Array.isArray(dataTareas.data));

  // GET /:id inválido -> 400
  const resInvalidId = await fetch(`${baseUrl}/abc`);
  assert.equal(resInvalidId.status, 400);

  // GET /:id no existente -> 404
  const resNotFound = await fetch(`${baseUrl}/999999`);
  assert.equal(resNotFound.status, 404);

  // POST con datos incompletos -> 422
  const resPostInvalid = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensaje: "Sin tarea" })
  });
  assert.equal(resPostInvalid.status, 422);

  // POST con tarea que no existe o es de otro usuario -> 404
  const resPostTaskNotFound = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tareaId: 999999,
      mensaje: "Prueba tarea inexistente",
      fechaHora: "2026-11-01T15:00",
      canal: "in_app"
    })
  });
  assert.equal(resPostTaskNotFound.status, 404);
});
