# Endpoint GET de eventos por materia

## Objetivo

Agregar el endpoint `GET /api/v1/materias/:id/eventos` al backend de `studentFlow_back` para consultar los eventos de una materia que pertenece al usuario de la solicitud.

- `id`: identificador de materia recibido en `request.params.id`.
- `userId`: identificador del usuario obtenido de `request.user.id`.
- Respuesta: HTTP 200 con `{ "success": true, "data": [...] }`.
- Si la consulta no encuentra coincidencias, `data` será `[]`. Esto incluye materias sin eventos, inexistentes o pertenecientes a otro usuario.

Se modifican cuatro archivos. Los fragmentos siguientes se adicionan al código existente; no reemplazan las funciones actuales.

El repositorio de este backend se llama `materias.repositorio.js`. Para el `SELECT` se toma como referencia el estilo de `findByIdAndUserId` de `studentFlow_back/src/repositories/materias.repositorio.js`: campos explícitos, alias en camelCase y parámetros mediante `?`.

## 1. `src/routes/materias.routes.js`

**Funciones a adicionar o modificar:** ninguna función propia. Se modifica la importación del controlador y el registro de rutas.

Adicionar `listEventosByMateria` a la importación existente:

```js
import {
  listMaterias,
  getMateriaById,
  createMateria,
  replaceMateria,
  updateMateria,
  deleteMateria,
  getTareasByMateriaId,
  listEventosByMateria
} from "../controllers/materias.controller.js";
```

Registrar la nueva ruta después de crear `router` y antes de `export default router`:

```js
router.get("/:id/eventos", listEventosByMateria);
```

`app.js` ya monta este router bajo `/api/v1/materias`.

## 2. `src/controllers/materias.controller.js`

**Función a adicionar:** `listEventosByMateria(request, response, next)`.

Responsabilidades:

- Validar el identificador de materia con `validateMateriaId`.
- Obtener el identificador del usuario desde `request.user.id`.
- Invocar el servicio y enviar los eventos con `sendSuccess`.
- Propagar los errores mediante `next(error)`.

```js
export async function listEventosByMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const eventos = await materiasService.listEventosByMateria(
      id,
      request.user.id
    );

    return sendSuccess(response, eventos);
  } catch (error) {
    return next(error);
  }
}
```

Las importaciones actuales de `materiasService`, `validateMateriaId` y `sendSuccess` ya permiten implementar esta función.

## 3. `src/services/materias.service.js`

**Función a adicionar:** `listEventosByMateria(id, userId)`.

Responsabilidad: solicitar al repositorio los eventos filtrados por materia y usuario, y devolver el arreglo obtenido.

```js
export async function listEventosByMateria(id, userId) {
  return materiasRepository.findEventosByMateriaAndUserId(id, userId);
}
```

Se reutiliza la importación existente de `materiasRepository`.

Esta implementación conserva el comportamiento del SQL solicitado: retorna una lista vacía si no hay coincidencias. Si se decide devolver HTTP 404 cuando la materia no existe o pertenece a otro usuario, se puede agregar `await getMateriaById(id, userId)` antes de consultar los eventos. Esa variante requiere una consulta adicional.

## 4. `src/repositories/materias.repositorio.js`

**Función a adicionar:** `findEventosByMateriaAndUserId(id, userId)`.

Responsabilidades:

- Seleccionar explícitamente los campos de `evento`.
- Usar alias para devolver identificadores y campos compuestos en camelCase.
- Relacionar `evento` con `materia` para filtrar por el propietario.
- Ejecutar la consulta parametrizada con `[id, userId]`.
- Devolver todas las filas encontradas.

```js
export async function findEventosByMateriaAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       e.id_evento AS id,
       e.id_materia AS materiaId,
       e.titulo,
       e.descripcion,
       e.fecha,
       e.hora_inicio AS horaInicio,
       e.hora_fin AS horaFin,
       e.tipo,
       e.created_at AS createdAt,
       e.updated_at AS updatedAt
     FROM evento e
     INNER JOIN materia m ON m.id_materia = e.id_materia
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows;
}
```

La importación de `pool` ya existe. Se retorna `rows`, porque la consulta puede encontrar varios eventos. No debe utilizarse `mapMateria`, pues ese mapeador corresponde a campos de materias.

## Componentes existentes que se reutilizan

| Archivo | Función o configuración reutilizada | Cambio requerido |
| --- | --- | --- |
| `src/validators/materias.validator.js` | `validateMateriaId(id)` | Ninguno; valida que el id sea un entero mayor que cero. |
| `src/utils/api-response.js` | `sendSuccess(response, data)` | Ninguno; devuelve HTTP 200 y el arreglo dentro de `data`. |
| `src/config/database.js` | `pool` | Ninguno; se reutiliza la conexión a MySQL. |
| `src/app.js` | Registro de `/api/v1/materias` | Ninguno; la nueva ruta pertenece al router existente. |
| `src/middlewares/request-context.middleware.js` | `attachTemporaryUser` | Ninguno para este endpoint; actualmente asigna `request.user.id = 1`. |
| `src/middlewares/error.middleware.js` | Manejo centralizado de errores | Ninguno; recibe los errores enviados por `next(error)`. |

El usuario no se recibe como parámetro de consulta en este diseño. Mientras se mantenga el middleware temporal, el endpoint consultará únicamente datos del usuario con id `1`.

## Flujo del endpoint

```text
GET /api/v1/materias/:id/eventos
  → materias.routes.js
  → listEventosByMateria (controlador)
  → validateMateriaId
  → listEventosByMateria (servicio)
  → findEventosByMateriaAndUserId (repositorio)
  → MySQL
  → sendSuccess: { success: true, data: eventos }
```

## Verificación al implementar

- Materia del usuario con eventos: HTTP 200 y los eventos de esa materia.
- Materia del usuario sin eventos: HTTP 200 con `data: []`.
- Materia de otro usuario o inexistente: HTTP 200 con `data: []`, según el comportamiento elegido para esta guía.
- Identificador inválido, como `abc`, `0` o `-1`: HTTP 400 mediante `validateMateriaId`.
- Los campos retornados usan los alias definidos, como `materiaId`, `horaInicio`, `horaFin` y `createdAt`.

Este documento describe los cambios; no aplica modificaciones al código del backend.
