import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import type { LoginInput } from "@/modules/auth/auth.validators";
import type { NombreRol } from "@prisma/client";

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

type UsuarioConRol = {
  id: string;
  nombre: string;
  email: string;
  tokenVersion: number;
  rol: { nombre: NombreRol };
};

function emitirSesion(usuario: UsuarioConRol) {
  const token = jwt.sign(
    {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol.nombre,
      tokenVersion: usuario.tokenVersion,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
    },
  };
}

export async function login(input: LoginInput) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email },
    include: { rol: true },
  });

  if (!usuario || usuario.deletedAt || !usuario.activo) {
    throw AppError.unauthorized("Credenciales inválidas");
  }

  const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash);
  if (!passwordValida) {
    throw AppError.unauthorized("Credenciales inválidas");
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLogin: new Date() } });

  return emitirSesion(usuario);
}

/**
 * Login con Google: verifica el ID token emitido por Google Identity Services
 * y busca una cuenta ya existente por email. No se auto-registran cuentas
 * nuevas por esta vía — un ADMIN debe dar de alta al usuario primero (mismo
 * modelo de acceso que con contraseña), Google solo reemplaza cómo se
 * demuestra la identidad.
 */
export async function loginConGoogle(credential: string) {
  if (!googleClient || !env.googleClientId) {
    throw AppError.badRequest("El login con Google no está configurado en este servidor");
  }

  let email: string | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    email = payload?.email;
    if (!payload?.email_verified) {
      throw new Error("email no verificado");
    }
  } catch {
    throw AppError.unauthorized("Token de Google inválido");
  }

  if (!email) {
    throw AppError.unauthorized("Token de Google inválido");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
    include: { rol: true },
  });

  if (!usuario || !usuario.activo) {
    throw AppError.unauthorized(
      "No existe una cuenta activa con este correo. Pide a un administrador que te dé de alta primero."
    );
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLogin: new Date() } });

  return emitirSesion(usuario);
}

export async function obtenerPerfil(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { rol: true, persona: { include: { area: true, puesto: true } } },
  });

  if (!usuario || usuario.deletedAt) {
    throw AppError.notFound("Usuario no encontrado");
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol.nombre,
    persona: usuario.persona,
  };
}

/** Invalida todos los tokens emitidos previamente para este usuario. */
export async function cerrarSesionesActivas(usuarioId: string) {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { tokenVersion: { increment: 1 } },
  });
}
