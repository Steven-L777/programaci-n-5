import express from "express";
import healthRoutes from "./routes/health.routes.js";
import materiasRoutes from "./routes/materias.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { attachTemporaryUser } from "./middlewares/request-context.middleware.js";

const app = express();

app.use(express.json());
app.use(attachTemporaryUser);

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/materias", materiasRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;