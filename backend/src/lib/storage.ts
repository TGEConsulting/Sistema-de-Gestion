import path from "path";
import crypto from "crypto";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Almacenamiento en Google Cloud Storage (funciona igual en servidor
 * tradicional y en funciones serverless de Vercel, que no tienen disco
 * persistente). El bucket se configura con acceso uniforme a nivel de bucket
 * + IAM allUsers:objectViewer (ver README) — mismo modelo de confianza que
 * el disco local que reemplaza: cualquiera con el link puede ver el archivo,
 * pero no se puede listar ni adivinar nombres (son UUID).
 */

let storageClient: Storage | null = null;

function obtenerStorageClient(): Storage {
  if (!env.gcsProjectId || !env.gcsCredentialsJson) {
    throw AppError.badRequest(
      "La subida de archivos no está configurada en este servidor (falta Google Cloud Storage)"
    );
  }
  if (!storageClient) {
    storageClient = new Storage({
      projectId: env.gcsProjectId,
      credentials: JSON.parse(env.gcsCredentialsJson),
    });
  }
  return storageClient;
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      cb(AppError.badRequest(`Tipo de archivo no permitido: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
}).single("file");

export async function subirArchivo(file: Express.Multer.File): Promise<string> {
  if (!env.gcsBucket) {
    throw AppError.badRequest(
      "La subida de archivos no está configurada en este servidor (falta GCS_BUCKET)"
    );
  }

  const storage = obtenerStorageClient();
  const bucket = storage.bucket(env.gcsBucket);
  const nombreObjeto = `${crypto.randomUUID()}${path.extname(file.originalname)}`;

  await bucket.file(nombreObjeto).save(file.buffer, {
    contentType: file.mimetype,
    resumable: false,
  });

  return `https://storage.googleapis.com/${env.gcsBucket}/${nombreObjeto}`;
}
