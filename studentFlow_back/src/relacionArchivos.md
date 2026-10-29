# Relación de Archivos del Backend — StudentFlow

Este documento describe la arquitectura modular del backend y el flujo de responsabilidades entre capas.

```
studentFlow_back/
├── src/
│   ├── config/
│   │   └── database.js               # Conexión al pool de MySQL (mysql2/promise)
│   ├── controllers/
│   │   ├── health.controller.js       # Comprobación de salud y conexión a BD
│   │   ├── materias.controller.js     # Endpoints CRUD de materias
│   │   └── recordatorios.controller.js# Endpoints CRUD de recordatorios y tareas
│   ├── middlewares/
│   │   ├── error.middleware.js        # Manejador global de errores y 404
│   │   └── request-context.middleware.js # Inyección del usuario autenticado (ID: 1)
│   ├── repositories/
│   │   ├── materias.repositorio.js    # Consultas SQL para materias y sus tareas
│   │   └── recordatorios.repositorio.js# Consultas SQL para recordatorios con validación relacional
│   ├── routes/
│   │   ├── health.routes.js           # Rutas para /api/v1/health
│   │   ├── materias.routes.js         # Rutas para /api/v1/materias
│   │   └── recordatorios.routes.js    # Rutas para /api/v1/recordatorios
│   ├── services/
│   │   ├── materias.service.js        # Lógica de negocio y unicidad de materias
│   │   └── recordatorios.service.js   # Lógica de negocio y verificación de pertenencia de tareas
│   ├── utils/
│   │   ├── api-response.js            # Formato estándar de respuestas JSON (sendSuccess, sendNoContent)
│   │   └── http-error.js              # Clase personalizada para errores con código HTTP y clave
│   ├── validators/
│   │   ├── materias.validator.js      # Validación de esquemas y queries de materias
│   │   └── recordatorios.validator.js # Validación de esquemas y queries de recordatorios
│   ├── app.js                         # Configuración de Express y montaje de rutas base
│   ├── server.js                      # Inicialización del servidor HTTP en el puerto 3000
│   └── recordatorio.md                # Especificación técnica del módulo de recordatorios
├── tests/
│   └── recordatorios.test.js          # Pruebas unitarias de validación y de integración Express
└── package.json                       # Dependencias y scripts (start, dev, test)
```

## Flujo de una Petición Típica

1. **Cliente / Frontend** envía una solicitud a `/api/v1/recordatorios`.
2. **`app.js`** procesa JSON y ejecuta `attachTemporaryUser` (`request.user.id = 1`).
3. **`recordatorios.routes.js`** enruta según el método HTTP al controlador correspondiente.
4. **`recordatorios.controller.js`** valida la entrada con `recordatorios.validator.js`.
5. **`recordatorios.service.js`** aplica las reglas de negocio (asegurando que la tarea referenciada pertenezca al usuario).
6. **`recordatorios.repositorio.js`** ejecuta consultas parametrizadas en MySQL contra `recordatorio`, `tarea` y `materia`.
7. **`api-response.js`** devuelve la respuesta estructurada con `{ success: true, data: ..., meta: ... }`.

