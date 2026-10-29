import { Router } from "express";
import {
  createRecordatorio,
  deleteRecordatorio,
  getRecordatorioById,
  getTareas,
  listRecordatorios,
  replaceRecordatorio,
  updateRecordatorio
} from "../controllers/recordatorios.controller.js";

const router = Router();

// Base: /api/v1/recordatorios

router.get("/", listRecordatorios);
router.get("/tareas", getTareas);
router.get("/:id", getRecordatorioById);
router.post("/", createRecordatorio);
router.put("/:id", replaceRecordatorio);
router.patch("/:id", updateRecordatorio);
router.delete("/:id", deleteRecordatorio);

export default router;

