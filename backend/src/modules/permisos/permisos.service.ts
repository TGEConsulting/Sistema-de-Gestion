import type { ModuloSistema, NivelPermiso } from "@prisma/client";
import { prisma } from "../../lib/prisma";

const MODULOS: ModuloSistema[] = [
  "DOCUMENTOS",
  "OBJETIVOS",
  "RIESGOS",
  "NO_CONFORMIDADES",
  "AUDITORIAS",
  "INDICADORES",
  "PERSONAS",
  "PROVEEDORES",
  "COMUNICACIONES",
  "GESTION_CAMBIOS",
];

export async function obtenerMatriz() {
  const roles = await prisma.rol.findMany({
    include: { permisosModulo: true },
    orderBy: { nombre: "asc" },
  });

  return roles.map((rol) => ({
    rolId: rol.id,
    rol: rol.nombre,
    permisos: MODULOS.map((modulo) => {
      const existente = rol.permisosModulo.find((p) => p.modulo === modulo);
      return { modulo, nivel: existente?.nivel ?? ("NINGUNO" as NivelPermiso) };
    }),
  }));
}

export async function actualizarMatriz(
  permisos: Array<{ rolId: string; modulo: ModuloSistema; nivel: NivelPermiso }>
) {
  await prisma.$transaction(
    permisos.map((permiso) =>
      prisma.permisoModulo.upsert({
        where: { rolId_modulo: { rolId: permiso.rolId, modulo: permiso.modulo } },
        update: { nivel: permiso.nivel },
        create: permiso,
      })
    )
  );
  return obtenerMatriz();
}
