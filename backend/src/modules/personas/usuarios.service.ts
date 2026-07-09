import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/AppError";
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
} from "@/modules/personas/usuarios.validators";

const SALT_ROUNDS = 10;

function serializar(usuario: {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  ultimoLogin: Date | null;
  personaId: string | null;
  rol: { nombre: string };
}) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    activo: usuario.activo,
    ultimoLogin: usuario.ultimoLogin,
    personaId: usuario.personaId,
    rol: usuario.rol.nombre,
  };
}

export async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    where: { deletedAt: null },
    include: { rol: true },
    orderBy: { nombre: "asc" },
  });
  return usuarios.map(serializar);
}

export async function obtenerUsuario(id: string) {
  const usuario = await prisma.usuario.findFirst({
    where: { id, deletedAt: null },
    include: { rol: true },
  });
  if (!usuario) throw AppError.notFound("Usuario no encontrado");
  return serializar(usuario);
}

export async function crearUsuario(input: CrearUsuarioInput) {
  const existente = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (existente) throw AppError.conflict("Ya existe un usuario con ese email");

  const rol = await prisma.rol.findUnique({ where: { nombre: input.rol } });
  if (!rol) throw AppError.badRequest("Rol inválido");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      rolId: rol.id,
      personaId: input.personaId,
    },
    include: { rol: true },
  });

  return serializar(usuario);
}

export async function actualizarUsuario(id: string, input: ActualizarUsuarioInput) {
  await obtenerUsuario(id);

  let rolId: string | undefined;
  if (input.rol) {
    const rol = await prisma.rol.findUnique({ where: { nombre: input.rol } });
    if (!rol) throw AppError.badRequest("Rol inválido");
    rolId = rol.id;
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      nombre: input.nombre,
      personaId: input.personaId,
      activo: input.activo,
      ...(rolId ? { rolId } : {}),
      // Al desactivar un usuario se revocan de inmediato sus tokens ya emitidos.
      ...(input.activo === false ? { tokenVersion: { increment: 1 } } : {}),
    },
    include: { rol: true },
  });

  return serializar(usuario);
}

export async function cambiarPassword(id: string, password: string) {
  await obtenerUsuario(id);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // Cambiar la contraseña invalida cualquier sesión abierta con la anterior.
  await prisma.usuario.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
}

export async function eliminarUsuario(id: string) {
  await obtenerUsuario(id);
  await prisma.usuario.update({
    where: { id },
    data: { deletedAt: new Date(), activo: false, tokenVersion: { increment: 1 } },
  });
}
