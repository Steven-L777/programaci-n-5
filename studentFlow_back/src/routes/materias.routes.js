import { Router } from "express";

import {

    listMaterias,
    getMateriaById,
    createMateria,
    replaceMateria,
    updateMateria,
    deleteMateria

} from "../controllers/materias.controller.js";

const router = Router();

//http://localhost:3000/api/v1/materias

router.get("/", listMaterias);
router.get("/:id", getMateriaById);
router.post("/", createMateria);
router.put("/:id", replaceMateria);
router.patch("/:id", updateMateria);
router.delete("/:id", deleteMateria);

export default router;