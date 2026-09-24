# StudentFlow - Programación

Repositorio del proyecto de clase.

- `studentFlow_back/`: API REST (Node.js + Express + MySQL) con el CRUD de **materias**.
- `BD y archivos/`: scripts SQL, diagramas y documentación.
- `Proyectos/`: ejercicios de clase y PRD.

## Endpoints de materias (`/api/v1/materias`)

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/` | listMaterias |
| GET | `/:id` | getMateriaById |
| POST | `/` | createMateria |
| PUT | `/:id` | replaceMateria |
| PATCH | `/:id` | updateMateria |
| DELETE | `/:id` | deleteMateria |

## Cómo correrlo

```bash
cd studentFlow_back
npm install
cp .env.example .env   # y completar DB_PASSWORD
npm run dev
```
