import {
  actualizarRecordatorio,
  crearRecordatorio,
  eliminarRecordatorio,
  listarRecordatorios,
  listarTareasDisponibles,
  obtenerRecordatorio,
  reemplazarRecordatorio
} from "../api/recordatorios.js";

// Elementos de navegación
const navButtons = document.querySelectorAll(".navegacion button[data-seccion]");
const secciones = {
  listar: document.querySelector("#seccion-listar"),
  crear: document.querySelector("#seccion-crear"),
  consultar: document.querySelector("#seccion-consultar"),
  tareas: document.querySelector("#seccion-tareas")
};

// Elementos de la sección de Listado y Buscador
const btnRecargarListado = document.querySelector("#btn-recargar-listado");
const estadoListado = document.querySelector("#estado-listado");
const paginacionListado = document.querySelector("#paginacion-listado");
const buscadorTexto = document.querySelector("#buscador-texto");
const btnLimpiarBusqueda = document.querySelector("#btn-limpiar-busqueda");
const filtroChips = document.querySelectorAll(".filtro-chip[data-filtro-leido]");
const filtroCanal = document.querySelector("#filtro-canal");
const filtroOrden = document.querySelector("#filtro-orden");
const recordatoriosTbody = document.querySelector("#recordatorios-tbody");

// Elementos de la sección Crear
const formularioCrear = document.querySelector("#formulario-crear");
const crearTareaSelect = document.querySelector("#crear-tarea-id");
const crearMensajeInput = document.querySelector("#crear-mensaje");
const crearFechaHoraInput = document.querySelector("#crear-fecha-hora");
const crearCanalSelect = document.querySelector("#crear-canal");
const crearLeidoCheckbox = document.querySelector("#crear-leido");
const estadoCrear = document.querySelector("#estado-crear");

// Elementos de la sección Consultar / Editar
const formularioBuscarId = document.querySelector("#formulario-buscar-id");
const consultarIdInput = document.querySelector("#consultar-id-input");
const estadoConsultar = document.querySelector("#estado-consultar");
const formularioEditar = document.querySelector("#formulario-editar");
const editarIdInput = document.querySelector("#editar-id");
const editarTareaSelect = document.querySelector("#editar-tarea-id");
const editarMensajeInput = document.querySelector("#editar-mensaje");
const editarFechaHoraInput = document.querySelector("#editar-fecha-hora");
const editarCanalSelect = document.querySelector("#editar-canal");
const editarLeidoCheckbox = document.querySelector("#editar-leido");
const btnPatch = document.querySelector("#btn-patch");
const btnPut = document.querySelector("#btn-put");
const btnDelete = document.querySelector("#btn-delete");

// Elementos de la sección Tareas
const btnRecargarTareas = document.querySelector("#btn-recargar-tareas");
const estadoTareas = document.querySelector("#estado-tareas");
const tareasTbody = document.querySelector("#tareas-tbody");

// Visor JSON
const resultadoJson = document.querySelector("#resultado-json");

// Estado local de la aplicación
let listaRecordatoriosGlobal = [];
let listaTareasGlobal = [];
let filtroLeidoActual = "";
let debounceTimer = null;

// ============================================================
// GESTIÓN DEL MENÚ Y NAVEGACIÓN
// ============================================================
function cambiarSeccion(nombreSeccion) {
  navButtons.forEach(btn => {
    btn.classList.toggle("activa", btn.dataset.seccion === nombreSeccion);
  });

  Object.entries(secciones).forEach(([key, seccionEl]) => {
    if (seccionEl) {
      seccionEl.hidden = key !== nombreSeccion;
    }
  });

  if (nombreSeccion === "listar") {
    cargarListadoRecordatorios();
  } else if (nombreSeccion === "tareas") {
    cargarListadoTareas();
  }
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => cambiarSeccion(btn.dataset.seccion));
});

// ============================================================
// FORMATEO VISUAL Y AYUDAS
// ============================================================
function formatearFechaHora(fechaHoraStr) {
  if (!fechaHoraStr) return "Sin fecha";
  try {
    const d = new Date(fechaHoraStr);
    if (isNaN(d.getTime())) return String(fechaHoraStr);
    return d.toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return String(fechaHoraStr);
  }
}

function convertirParaInputDatetime(fechaHoraStr) {
  if (!fechaHoraStr) return "";
  try {
    const d = new Date(fechaHoraStr);
    if (isNaN(d.getTime())) return fechaHoraStr.slice(0, 16);
    // Formato local YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  } catch {
    return "";
  }
}

function mostrarRespuestaJson(datos, codigo = 200) {
  resultadoJson.textContent = datos === null
    ? `HTTP ${codigo} · Sin contenido en el cuerpo de la respuesta.`
    : JSON.stringify(datos, null, 2);
  console.log(`[StudentFlow API ${codigo}]`, datos);
}

// ============================================================
// CARGA Y GESTIÓN DE TAREAS DISPONIBLES
// ============================================================
async function cargarListadoTareas() {
  estadoTareas.textContent = "Consultando tareas disponibles al backend…";
  estadoTareas.dataset.type = "loading";

  try {
    const res = await listarTareasDisponibles();
    listaTareasGlobal = res.data || [];
    poblarSelectsDeTareas(listaTareasGlobal);
    renderizarTablaTareas(listaTareasGlobal);

    estadoTareas.textContent = `Se encontraron ${listaTareasGlobal.length} tareas pertenecientes a tus materias.`;
    estadoTareas.dataset.type = "success";
    mostrarRespuestaJson(res, 200);
  } catch (err) {
    estadoTareas.textContent = `Error al consultar tareas: ${err.message}`;
    estadoTareas.dataset.type = "error";
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 500);
  }
}

function poblarSelectsDeTareas(tareas) {
  const selects = [crearTareaSelect, editarTareaSelect];
  selects.forEach(sel => {
    if (!sel) return;
    const valorPrevio = sel.value;
    sel.innerHTML = "";

    if (tareas.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No tienes tareas registradas actualmente";
      sel.append(opt);
      return;
    }

    tareas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `[ID ${t.id}] ${t.materiaNombre} - ${t.titulo}`;
      sel.append(opt);
    });

    if (valorPrevio && tareas.some(t => String(t.id) === String(valorPrevio))) {
      sel.value = valorPrevio;
    }
  });
}

function renderizarTablaTareas(tareas) {
  tareasTbody.innerHTML = "";

  if (tareas.length === 0) {
    tareasTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
          No hay tareas disponibles registradas para el usuario.
        </td>
      </tr>`;
    return;
  }

  tareas.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${t.id}</strong></td>
      <td><span class="badge-materia">${t.materiaNombre || "Materia"}</span></td>
      <td><strong>${t.titulo}</strong></td>
      <td>${t.fechaEntrega ? `${t.fechaEntrega} ${t.horaEntrega || ""}` : "Sin fecha"}</td>
      <td><span class="badge">${t.prioridad || "normal"}</span></td>
      <td><span class="badge">${t.estado || "pendiente"}</span></td>
      <td style="text-align: center;">
        <button type="button" class="btn-sm editar" data-tarea-id="${t.id}">
          + Crear recordatorio
        </button>
      </td>
    `;

    tr.querySelector("button").addEventListener("click", () => {
      cambiarSeccion("crear");
      crearTareaSelect.value = t.id;
      crearMensajeInput.focus();
    });

    tareasTbody.append(tr);
  });
}

// ============================================================
// CARGA Y RENDERIZADO DE RECORDATORIOS (LISTADO)
// ============================================================
async function cargarListadoRecordatorios() {
  estadoListado.textContent = "Consultando recordatorios en el backend…";
  estadoListado.dataset.type = "loading";

  const [sortField, sortOrder] = filtroOrden.value.split("-");
  const params = {
    sort: sortField,
    order: sortOrder,
    page: 1,
    limit: 50
  };

  const textoBusqueda = buscadorTexto.value.trim();
  if (textoBusqueda) {
    params.search = textoBusqueda;
  }

  if (filtroLeidoActual !== "") {
    params.leido = filtroLeidoActual;
  }

  try {
    const res = await listarRecordatorios(params);
    listaRecordatoriosGlobal = res.data || [];

    // Aplicar filtro de canal en cliente si está seleccionado
    let filtrados = listaRecordatoriosGlobal;
    if (filtroCanal.value) {
      filtrados = filtrados.filter(r => r.canal === filtroCanal.value);
    }

    renderizarTablaRecordatorios(filtrados);

    estadoListado.textContent = "Recordatorios consultados correctamente.";
    estadoListado.dataset.type = "success";
    paginacionListado.textContent = `Mostrando ${filtrados.length} de ${res.meta?.total ?? filtrados.length} recordatorios encontrados. Página ${res.meta?.page || 1} de ${res.meta?.pages || 1}.`;
    mostrarRespuestaJson(res, 200);
  } catch (err) {
    estadoListado.textContent = `Error al consultar recordatorios: ${err.message}`;
    estadoListado.dataset.type = "error";
    recordatoriosTbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #b32632; padding: 24px;">
          Ocurrió un error al cargar los datos: ${err.message}
        </td>
      </tr>`;
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 500);
  }
}

function renderizarTablaRecordatorios(recordatorios) {
  recordatoriosTbody.innerHTML = "";

  if (recordatorios.length === 0) {
    recordatoriosTbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #64748b; padding: 32px 16px;">
          No se encontraron recordatorios con los criterios seleccionados.
        </td>
      </tr>`;
    return;
  }

  recordatorios.forEach(r => {
    const tr = document.createElement("tr");

    const canalBadgeClass = r.canal === "email" ? "badge-canal-email" : "badge-canal-app";
    const canalIcono = r.canal === "email" ? "✉️ Email" : "📱 In-app";

    const leidoBadgeClass = r.leido ? "badge-leido" : "badge-pendiente";
    const leidoTexto = r.leido ? "✓ Leído" : "⏳ Pendiente";
    const toggleTexto = r.leido ? "Marcar pendiente" : "Marcar leído";

    tr.innerHTML = `
      <td><strong>${r.id}</strong></td>
      <td><span class="badge-materia">${r.materiaNombre || "Materia"}</span></td>
      <td><strong>${r.tareaTitulo || "Tarea #" + r.tareaId}</strong></td>
      <td style="max-width: 280px;">${r.mensaje}</td>
      <td style="white-space: nowrap;">📅 ${formatearFechaHora(r.fechaHora)}</td>
      <td><span class="badge ${canalBadgeClass}">${canalIcono}</span></td>
      <td><span class="badge ${leidoBadgeClass}">${leidoTexto}</span></td>
      <td style="text-align: center;">
        <div class="acciones-fila" style="justify-content: center;">
          <button type="button" class="btn-sm editar" data-accion="editar" title="Ver y editar en detalle">
            ✏️ Editar
          </button>
          <button type="button" class="btn-sm toggle-leido" data-accion="toggle" title="${toggleTexto}">
            ${r.leido ? "↩ Pendiente" : "✓ Leído"}
          </button>
          <button type="button" class="btn-sm eliminar" data-accion="eliminar" title="Eliminar recordatorio">
            🗑️
          </button>
        </div>
      </td>
    `;

    // Botón Editar
    tr.querySelector('[data-accion="editar"]').addEventListener("click", () => {
      cargarParaEdicion(r);
    });

    // Botón Toggle Leído (PATCH rápido)
    tr.querySelector('[data-accion="toggle"]').addEventListener("click", async () => {
      try {
        const nuevoEstado = !r.leido;
        await actualizarRecordatorio(r.id, { leido: nuevoEstado });
        r.leido = nuevoEstado;
        cargarListadoRecordatorios();
      } catch (err) {
        alert(`No se pudo actualizar el estado: ${err.message}`);
      }
    });

    // Botón Eliminar rápido
    tr.querySelector('[data-accion="eliminar"]').addEventListener("click", async () => {
      if (!window.confirm(`¿Seguro que deseas eliminar el recordatorio #${r.id} ("${r.mensaje}")?`)) {
        return;
      }
      try {
        await eliminarRecordatorio(r.id);
        cargarListadoRecordatorios();
      } catch (err) {
        alert(`Error al eliminar recordatorio: ${err.message}`);
      }
    });

    recordatoriosTbody.append(tr);
  });
}

// ============================================================
// BUSCADOR EN VIVO Y FILTROS
// ============================================================
buscadorTexto.addEventListener("input", () => {
  btnLimpiarBusqueda.hidden = !buscadorTexto.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    cargarListadoRecordatorios();
  }, 300);
});

btnLimpiarBusqueda.addEventListener("click", () => {
  buscadorTexto.value = "";
  btnLimpiarBusqueda.hidden = true;
  cargarListadoRecordatorios();
});

filtroChips.forEach(chip => {
  chip.addEventListener("click", () => {
    filtroChips.forEach(c => c.classList.remove("activo"));
    chip.classList.add("activo");
    filtroLeidoActual = chip.dataset.filtroLeido;
    cargarListadoRecordatorios();
  });
});

filtroCanal.addEventListener("change", () => {
  cargarListadoRecordatorios();
});

filtroOrden.addEventListener("change", () => {
  cargarListadoRecordatorios();
});

btnRecargarListado.addEventListener("click", cargarListadoRecordatorios);

// ============================================================
// CREAR RECORDATORIO (POST)
// ============================================================
formularioCrear.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    tareaId: Number(crearTareaSelect.value),
    mensaje: crearMensajeInput.value.trim(),
    fechaHora: crearFechaHoraInput.value,
    canal: crearCanalSelect.value,
    leido: crearLeidoCheckbox.checked
  };

  const submitBtn = document.querySelector("#btn-enviar-crear");
  submitBtn.disabled = true;
  estadoCrear.textContent = "Guardando recordatorio en el servidor…";
  estadoCrear.dataset.type = "loading";

  try {
    const res = await crearRecordatorio(payload);
    estadoCrear.textContent = `HTTP 201 · Recordatorio #${res.data?.id} creado con éxito.`;
    estadoCrear.dataset.type = "success";
    mostrarRespuestaJson(res, 201);

    formularioCrear.reset();
    prepararFechaHoraPorDefecto();

    // Redirigir a listado después de un breve momento
    setTimeout(() => {
      cambiarSeccion("listar");
    }, 900);
  } catch (err) {
    estadoCrear.textContent = `Error al crear: ${err.message}`;
    estadoCrear.dataset.type = "error";
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 422);
  } finally {
    submitBtn.disabled = false;
  }
});

function prepararFechaHoraPorDefecto() {
  const ahora = new Date();
  ahora.setDate(ahora.getDate() + 1); // Mañana a esta hora
  const localIso = convertirParaInputDatetime(ahora.toISOString());
  if (crearFechaHoraInput) crearFechaHoraInput.value = localIso;
}

// ============================================================
// CONSULTAR Y EDITAR POR ID (GET, PUT, PATCH, DELETE)
// ============================================================
formularioBuscarId.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = consultarIdInput.value;
  if (!id) return;

  estadoConsultar.textContent = `Buscando recordatorio #${id}…`;
  estadoConsultar.dataset.type = "loading";

  try {
    const res = await obtenerRecordatorio(id);
    cargarParaEdicion(res.data);
    estadoConsultar.textContent = `HTTP 200 · Recordatorio #${id} cargado con éxito.`;
    estadoConsultar.dataset.type = "success";
    mostrarRespuestaJson(res, 200);
  } catch (err) {
    formularioEditar.hidden = true;
    estadoConsultar.textContent = `Error: ${err.message}`;
    estadoConsultar.dataset.type = "error";
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 404);
  }
});

function cargarParaEdicion(recordatorio) {
  cambiarSeccion("consultar");
  consultarIdInput.value = recordatorio.id;
  editarIdInput.value = recordatorio.id;
  editarTareaSelect.value = recordatorio.tareaId;
  editarMensajeInput.value = recordatorio.mensaje;
  editarFechaHoraInput.value = convertirParaInputDatetime(recordatorio.fechaHora);
  editarCanalSelect.value = recordatorio.canal;
  editarLeidoCheckbox.checked = Boolean(recordatorio.leido);

  formularioEditar.hidden = false;
  estadoConsultar.textContent = `Editando recordatorio #${recordatorio.id}.`;
  estadoConsultar.dataset.type = "success";
  formularioEditar.scrollIntoView({ behavior: "smooth" });
}

// Acción: PATCH (Modificación parcial)
btnPatch.addEventListener("click", async () => {
  const id = editarIdInput.value;
  if (!id) return;

  const payload = {
    tareaId: Number(editarTareaSelect.value),
    mensaje: editarMensajeInput.value.trim(),
    fechaHora: editarFechaHoraInput.value,
    canal: editarCanalSelect.value,
    leido: editarLeidoCheckbox.checked
  };

  btnPatch.disabled = true;
  estadoConsultar.textContent = "Actualizando recordatorio con PATCH…";
  estadoConsultar.dataset.type = "loading";

  try {
    const res = await actualizarRecordatorio(id, payload);
    estadoConsultar.textContent = `HTTP 200 · Recordatorio #${id} actualizado mediante PATCH.`;
    estadoConsultar.dataset.type = "success";
    mostrarRespuestaJson(res, 200);
  } catch (err) {
    estadoConsultar.textContent = `Error en PATCH: ${err.message}`;
    estadoConsultar.dataset.type = "error";
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 422);
  } finally {
    btnPatch.disabled = false;
  }
});

// Acción: PUT (Reemplazo total)
btnPut.addEventListener("click", async () => {
  const id = editarIdInput.value;
  if (!id) return;

  const payload = {
    tareaId: Number(editarTareaSelect.value),
    mensaje: editarMensajeInput.value.trim(),
    fechaHora: editarFechaHoraInput.value,
    canal: editarCanalSelect.value,
    leido: editarLeidoCheckbox.checked
  };

  btnPut.disabled = true;
  estadoConsultar.textContent = "Reemplazando recordatorio con PUT…";
  estadoConsultar.dataset.type = "loading";

  try {
    const res = await reemplazarRecordatorio(id, payload);
    estadoConsultar.textContent = `HTTP 200 · Recordatorio #${id} reemplazado mediante PUT.`;
    estadoConsultar.dataset.type = "success";
    mostrarRespuestaJson(res, 200);
  } catch (err) {
    estadoConsultar.textContent = `Error en PUT: ${err.message}`;
    estadoConsultar.dataset.type = "error";
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 422);
  } finally {
    btnPut.disabled = false;
  }
});

// Acción: DELETE
btnDelete.addEventListener("click", async () => {
  const id = editarIdInput.value;
  if (!id) return;

  if (!window.confirm(`¿Confirmas que deseas eliminar de forma definitiva el recordatorio #${id}?`)) {
    return;
  }

  btnDelete.disabled = true;
  estadoConsultar.textContent = "Eliminando recordatorio con DELETE…";
  estadoConsultar.dataset.type = "loading";

  try {
    await eliminarRecordatorio(id);
    estadoConsultar.textContent = `HTTP 204 No Content · Recordatorio #${id} eliminado correctamente.`;
    estadoConsultar.dataset.type = "success";
    formularioEditar.hidden = true;
    consultarIdInput.value = "";
    mostrarRespuestaJson(null, 204);
  } catch (err) {
    estadoConsultar.textContent = `Error al eliminar: ${err.message}`;
    estadoConsultar.dataset.type = "error";
    mostrarRespuestaJson({ error: err.message, status: err.status }, err.status || 500);
  } finally {
    btnDelete.disabled = false;
  }
});

btnRecargarTareas.addEventListener("click", cargarListadoTareas);

// ============================================================
// INICIALIZACIÓN
// ============================================================
(async function init() {
  prepararFechaHoraPorDefecto();
  await cargarListadoTareas();
  await cargarListadoRecordatorios();
})();
