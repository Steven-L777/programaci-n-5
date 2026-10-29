# Módulo de Gestión de Recordatorios — StudentFlow

## 1. Propósito y Descripción General

El módulo de recordatorios permite a los estudiantes programar alertas y notificaciones asociadas directamente a sus actividades académicas pendientes. Cada recordatorio está vinculado de manera obligatoria a una tarea específica, la cual a su vez pertenece a una materia del usuario.

Los atributos administrados en la entidad `recordatorio` son:
- **`id_recordatorio`**: Identificador único autoincremental de la alerta.
- **`id_tarea`**: Clave foránea que referencia la tarea a notificar.
- **`mensaje`**: Contenido textual de la notificación (máximo 255 caracteres).
- **`fecha_hora`**: Marca temporal programada para el aviso (`datetime`).
- **`canal`**: Medio de distribución configurado (`in_app` o `email`).
- **`leido`**: Indicador booleano que señala si el estudiante ya revisó la alerta (por defecto `0` / `false`).
- **`created_at`**: Registro cronológico de creación generado automáticamente por la base de datos.

---

## 2. Aislamiento de Datos y Políticas de Autorización

La arquitectura implementa un control de acceso basado en pertenencia relacional:
1. Un recordatorio pertenece a una **tarea**.
2. Cada tarea está subordinada a una **materia**.
3. Cada materia está asignada exclusivamente a un **usuario** (`materia.id_usuario`).

Por consiguiente, toda operación de lectura o mutación valida de forma estricta que:
$$\text{materia.id\_usuario} = \text{request.user.id}$$

### Principio de Inmutabilidad de Entidades Superiores
- Las operaciones de escritura (`INSERT`, `UPDATE`, `DELETE`) operan **únicamente** sobre la tabla `recordatorio`.
- Las tablas vinculadas (`tarea` y `materia`) intervienen exclusivamente bajo cláusulas `INNER JOIN` en operaciones de lectura para verificar derechos de acceso e incluir metadatos descriptivos (`tareaTitulo`, `materiaNombre`).
- Si un usuario intenta asociar un recordatorio a una tarea que no existe o que pertenece a otro usuario, el sistema rechaza la operación con código **HTTP 404 Not Found**.

---

## 3. Catálogo de Endpoints de la API

La ruta base del módulo es `/api/v1/recordatorios`.

| Verbo | Ruta | Estado HTTP | Propósito |
| :--- | :--- | :---: | :--- |
| **GET** | `/` | `200 OK` | Recupera el listado paginado de recordatorios propios con opciones de búsqueda y filtro. |
| **GET** | `/tareas` | `200 OK` | Lista las tareas activas pertenecientes al usuario para su selección en formularios. |
| **GET** | `/:id` | `200 OK` | Consulta el detalle completo de un recordatorio específico por su ID. |
| **POST** | `/` | `201 Created` | Registra una nueva alerta asociada a una tarea del estudiante. |
| **PUT** | `/:id` | `200 OK` | Sobrescribe la totalidad de los datos de un recordatorio existente. |
| **PATCH** | `/:id` | `200 OK` | Aplica modificaciones parciales a uno o más campos del recordatorio. |
| **DELETE**| `/:id` | `204 No Content` | Suprime permanentemente el recordatorio indicado. |

---

## 4. Parámetros de Consulta y Validación de Carga Útil

### 4.1. Parámetros Query en `GET /`
- **`search`** *(opcional)*: Cadena para coincidencia parcial en el mensaje, título de la tarea o nombre de la materia.
- **`leido`** *(opcional)*: Valor booleano (`true` o `false`) para discriminar alertas revisadas o pendientes.
- **`page`** *(opcional)*: Índice de página mayor o igual a 1 (valor predeterminado: `1`).
- **`limit`** *(opcional)*: Cantidad de registros por página, entre 1 y 100 (valor predeterminado: `20`).
- **`sort`** *(opcional)*: Columna de ordenación (`id`, `mensaje`, `fechaHora`, `canal`, `leido`). Predeterminado: `fechaHora`.
- **`order`** *(opcional)*: Dirección de orden (`asc` o `desc`). Predeterminado: `asc`.

### 4.2. Especificación de Campos en `POST` y `PUT`
- **`tareaId`** *(obligatorio)*: Número entero positivo correspondiente a una tarea del usuario autenticado.
- **`mensaje`** *(obligatorio)*: Cadena no vacía con longitud entre 1 y 255 caracteres.
- **`fechaHora`** *(obligatorio)*: Formato temporal ISO estándar `YYYY-MM-DDTHH:mm` o `YYYY-MM-DDTHH:mm:ss`.
- **`canal`** *(obligatorio)*: Valor restringido a `"in_app"` o `"email"`.
- **`leido`** *(opcional)*: Booleano (`true` o `false`), asignado a `false` si no se envía.

### 4.3. Modificación Parcial con `PATCH`
Acepta cualquier subconjunto de los campos descritos en el punto anterior. Es obligatorio remitir al menos un campo con valor admisible.

### 4.4. Manejo de Errores
- Parámetros mal formados, formatos de fecha inválidos, tipos incorrectos o textos vacíos generan **HTTP 422 Unprocessable Entity**.
- Identificadores de URL que no cumplan el formato entero positivo retornan **HTTP 400 Bad Request**.
- Solicitudes sobre recordatorios inexistentes o ajenos devuelven **HTTP 404 Not Found**.

---

## 5. Ejemplos de Petición y Respuesta

### 5.1. Registro de Recordatorio (`POST /api/v1/recordatorios`)
**Cuerpo de la Solicitud:**
```json
{
  "tareaId": 4,
  "mensaje": "Finalizar la entrega del proyecto de interfaces web",
  "fechaHora": "2026-11-15T09:00",
  "canal": "in_app",
  "leido": false
}
```

**Respuesta (`HTTP 201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "tareaId": 4,
    "tareaTitulo": "Proyecto final - Entrega 1",
    "materiaNombre": "Desarrollo Web",
    "mensaje": "Finalizar la entrega del proyecto de interfaces web",
    "fechaHora": "2026-11-15T09:00:00.000Z",
    "canal": "in_app",
    "leido": false,
    "createdAt": "2026-10-29T21:55:00.000Z"
  }
}
```

### 5.2. Listado Paginado (`GET /api/v1/recordatorios?page=1&limit=20`)
**Respuesta (`HTTP 200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tareaId": 1,
      "tareaTitulo": "Tarea 2 - Estructuras de datos",
      "materiaNombre": "Algoritmos",
      "mensaje": "La tarea de Estructuras de datos vence mañana.",
      "fechaHora": "2026-08-19T23:00:00.000Z",
      "canal": "in_app",
      "leido": true,
      "createdAt": "2026-09-11T01:10:57.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## 6. Integración y Comprobación del Sistema

1. **Servidor Backend (`studentFlow_back`):**
   ```powershell
   npm run dev    # Ejecución con recarga automática (--watch)
   npm test       # Ejecuta la suite de pruebas unitarias y de integración
   ```
2. **Interfaz de Usuario (`studentFlow_front`):**
   Con el servidor frontend activo en el puerto `5501`, accede a:
   👉 **`http://127.0.0.1:5501/recordatorios.html`**
   Permite listar, filtrar por texto o estado, elegir tareas vinculadas dinámicamente, y realizar operaciones de alta, edición y baja directamente contra la base de datos MySQL.

