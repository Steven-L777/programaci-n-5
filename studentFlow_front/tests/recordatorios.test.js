import test from "node:test";
import assert from "node:assert/strict";
import {
  listarRecordatorios,
  listarTareasDisponibles,
  obtenerRecordatorio,
  crearRecordatorio,
  reemplazarRecordatorio,
  actualizarRecordatorio,
  eliminarRecordatorio
} from "../public/js/api/recordatorios.js";

test("recordatorios: los endpoints envían método, ruta y cuerpo correctos", async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, ...options });
    return options.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ success: true, data: { id: 1 } });
  });

  const ejemplo = {
    tareaId: 2,
    mensaje: "Entregar avance",
    fechaHora: "2026-11-05T14:00",
    canal: "in_app",
    leido: false
  };

  await listarRecordatorios();
  await listarTareasDisponibles();
  await obtenerRecordatorio(1);
  await crearRecordatorio(ejemplo);
  await reemplazarRecordatorio(1, ejemplo);
  await actualizarRecordatorio(1, { leido: true });
  assert.equal(await eliminarRecordatorio(1), null);

  assert.deepEqual(calls.map(({ url, method }) => [method, url]), [
    ["GET", "/api/v1/recordatorios"],
    ["GET", "/api/v1/recordatorios/tareas"],
    ["GET", "/api/v1/recordatorios/1"],
    ["POST", "/api/v1/recordatorios"],
    ["PUT", "/api/v1/recordatorios/1"],
    ["PATCH", "/api/v1/recordatorios/1"],
    ["DELETE", "/api/v1/recordatorios/1"]
  ]);

  assert.deepEqual(JSON.parse(calls[3].body), ejemplo);
  assert.deepEqual(JSON.parse(calls[4].body), ejemplo);
  assert.deepEqual(JSON.parse(calls[5].body), { leido: true });
});

test("recordatorios: IDs inválidos no envían solicitudes", t => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => {
    throw new Error("No debería llamarse");
  });

  for (const id of [0, -1, "abc", "", 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => obtenerRecordatorio(id), TypeError);
    assert.throws(() => reemplazarRecordatorio(id, {}), TypeError);
    assert.throws(() => actualizarRecordatorio(id, {}), TypeError);
    assert.throws(() => eliminarRecordatorio(id), TypeError);
  }

  assert.equal(fetchMock.mock.callCount(), 0);
});

