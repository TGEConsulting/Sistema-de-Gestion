import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/AppError";
import { subirArchivo, uploadMiddleware } from "../../lib/storage";
import { asyncHandler } from "../../utils/asyncHandler";

export const uploadsRouter = Router();

uploadsRouter.use(authMiddleware);

uploadsRouter.post(
  "/",
  (req, res, next) => {
    uploadMiddleware(req, res, (err: unknown) => (err ? next(err) : next()));
  },
  asyncHandler(async (req, res) => {
    if (!req.file) throw AppError.badRequest("No se recibió ningún archivo");

    const url = await subirArchivo(req.file);
    res.status(201).json({ url, nombre: req.file.originalname, tamano: req.file.size });
  })
);
