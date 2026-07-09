import type { ModuloSistema, NivelPermiso, NombreRol } from "@prisma/client";
import { prisma } from "./prisma";

const ORDEN_NIVEL: Record<NivelPermiso, number> = {
  NINGUNO: 0,
  VER: 1,
  EDITAR: 2,
  APROBAR: 3,
};

export async function obtenerNivel(rolNombre: NombreRol, modulo: ModuloSistema): Promise<NivelPermiso> {
  if (rolNombre === "ADMIN") return "APROBAR";

  const permiso = await prisma.permisoModulo.findFirst({
    where: { modulo, rol: { nombre: rolNombre } },
  });
  return permiso?.nivel ?? "NINGUNO";
}

export function cumpleNivel(nivelActual: NivelPermiso, nivelMinimo: NivelPermiso): boolean {
  return ORDEN_NIVEL[nivelActual] >= ORDEN_NIVEL[nivelMinimo];
}
