# Gestión SGC

Plataforma SaaS para gestión de sistemas de gestión, cumplimiento normativo, riesgos y mejora
organizacional (documentación, riesgos, no conformidades, auditorías, indicadores, personas,
proveedores y comunicaciones). Pensada para reemplazar Excel y carpetas compartidas.

Estado actual:

- **Fase 1** (completa): arquitectura, modelo de datos completo, autenticación con roles, y el
  esqueleto funcional (login + dashboard).
- **Fase 2** (completa): CRUD funcional de extremo a extremo para **Documentos** (versiones,
  evidencias de lectura, flujo borrador → revisión → aprobado → obsoleto), **Objetivos y Planes**
  (con actividades y seguimiento de avance), **Riesgos** (matriz editable con nivel calculado en
  vivo y planes de tratamiento) y **No Conformidades** (análisis de causa raíz, acciones
  correctivas/preventivas y cierre controlado).
- **Fase 3** (completa): **Auditorías** (programa, checklist, hallazgos que generan NC
  automáticamente, informe final), **Indicadores** (captura periódica con gráfica y semáforo),
  **Proveedores** (evaluación que actualiza su estado automáticamente) y el tablero de
  **Comunicaciones** (tareas y notificaciones, incluidas las generadas por el cron de alertas).
- **Fase 4** (completa): robustez de producción — paginación server-side, rate limiting,
  revocación de sesión, subida real de archivos, request-id en logs/errores, y tests de
  servicios críticos con Prisma mockeado. Ver sección 8.
- **Fase 5** (completa): UX avanzada — notificaciones (con polling, ver Fase 6), exportación a
  Excel y PDF, búsqueda global, calendario de vencimientos, modo oscuro y sidebar responsive en
  móvil. Ver sección 9.
- **Fase 6** (completa): login con Google, Google Cloud Storage para archivos, y empaquetado
  para desplegar en Vercel (frontend estático + backend como función serverless). Ver sección 10.

Los 8 módulos del MVP están completos de extremo a extremo (modelo de datos, API REST con
autenticación y roles, y pantallas funcionales).

## 1. Arquitectura

```
gestion-sgc/
├── docker-compose.yml       # Postgres + backend + frontend para desarrollo local
├── backend/                 # API REST (Node + Express + TypeScript + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo de datos completo (los 8 módulos)
│   │   └── seed.ts          # Datos iniciales (roles, admin, catálogos, ejemplos)
│   ├── src/
│   │   ├── config/          # Variables de entorno
│   │   ├── lib/             # Cliente Prisma
│   │   ├── middleware/      # auth (JWT), rbac (roles), validate (zod), errores
│   │   ├── modules/         # Un folder por dominio: auth, personas, riesgos,
│   │   │                    # indicadores, alertas, dashboard (rutas+controlador+
│   │   │                    # servicio+validadores por módulo)
│   │   ├── jobs/            # Cron de generación de alertas/tareas automáticas
│   │   └── utils/           # AppError, asyncHandler
│   └── tests/                # Tests unitarios (vitest) de la lógica de negocio
└── frontend/                 # SPA (React + TypeScript + Vite + Tailwind)
    └── src/
        ├── api/              # Cliente axios con interceptor JWT
        ├── context/          # AuthContext (sesión)
        ├── routes/           # ProtectedRoute
        ├── layout/           # Sidebar, Topbar, DashboardLayout
        ├── components/common # DataTable, Badge, StatCard, EmptyModulePage
        └── pages/            # Login, Dashboard, y una carpeta por módulo
```

**Por qué esta arquitectura:** backend y frontend separados (según lo solicitado) para poder
desplegarlos y escalarlos de forma independiente. Express + Prisma da control explícito de cada
endpoint y migraciones versionadas en SQL; React + Vite da un SPA ligero y rápido de iterar.
Cada módulo de negocio (`src/modules/<dominio>`) sigue siempre el mismo patrón de capas:

```
<dominio>.routes.ts       → define las rutas HTTP y aplica middlewares (auth, rol, validación)
<dominio>.controller.ts   → adapta req/res, sin lógica de negocio
<dominio>.service.ts      → lógica de negocio y acceso a datos (Prisma)
<dominio>.validators.ts   → esquemas zod de entrada
```

Esto hace que agregar los módulos de las Fases 2/3 (Documentos, Riesgos, NC, Auditorías,
Indicadores, Proveedores) sea repetir este mismo patrón contra las tablas que **ya existen** en
`schema.prisma`.

## 2. Modelo de datos

El esquema completo vive en [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) y
cubre los 8 módulos:

- **Personas y roles**: `Area`, `Puesto`, `Persona`, `Rol`, `Permiso`, `Usuario`
- **Gestión documental**: `TipoDocumento`, `Documento`, `VersionDocumento`, `EvidenciaLectura`
- **Objetivos y planes**: `Objetivo`, `Plan`, `Actividad`
- **Riesgos**: `Proceso`, `CategoriaRiesgo`, `Riesgo`, `PlanTratamientoRiesgo`
- **No conformidades**: `NoConformidad`, `AccionNC`
- **Auditorías**: `ProgramaAuditoria`, `Auditoria`, `Checklist`, `PreguntaChecklist`, `Hallazgo`, `InformeAuditoria`
- **Indicadores**: `Indicador`, `RegistroIndicador`
- **Proveedores**: `Proveedor`, `EvaluacionProveedor`, `DocumentoProveedor`
- **Comunicaciones/alertas/tareas**: `Notificacion`, `Tarea`

Todas las entidades principales usan **borrado lógico** (`deletedAt`) en vez de borrado físico.
Las migraciones se generan con Prisma (`prisma migrate dev`), que produce SQL versionado en
`backend/prisma/migrations/`.

## 3. Lógica de negocio automatizada

- **Nivel de riesgo** ([`riesgo.utils.ts`](backend/src/modules/riesgos/riesgo.utils.ts)): matriz
  5×5, `puntaje = probabilidad × impacto`, clasificado en BAJO/MODERADO/ALTO/CRITICO.
- **Semáforo de indicadores** ([`indicador.utils.ts`](backend/src/modules/indicadores/indicador.utils.ts)):
  compara el último valor capturado contra la meta, según si el indicador es "mayor es mejor" o
  "menor es mejor".
- **Generación automática de alertas y tareas** ([`alertas.service.ts`](backend/src/modules/alertas/alertas.service.ts)):
  un cron diario (`src/jobs/alertas.cron.ts`) revisa documentos por vencer, NC sin atender,
  indicadores sin captura, auditorías próximas y acciones vencidas, y crea una `Notificacion` +
  una `Tarea` para el responsable de cada caso (con deduplicación para no repetir avisos).

Estas tres piezas tienen **tests unitarios** en `backend/tests/` (26 tests, corren sin base de
datos porque la lógica está separada del acceso a datos).

## 4. Cómo ejecutar localmente

### Opción A: Docker Compose (recomendado)

Requiere Docker y Docker Compose instalados.

```bash
cd gestion-sgc
docker compose up --build
```

Esto levanta Postgres, aplica las migraciones automáticamente y arranca backend (puerto 4000) y
frontend (puerto 5173). La primera vez, en otra terminal, siembra los datos iniciales:

```bash
docker compose exec backend npm run db:seed
```

Abre http://localhost:5173 e ingresa con `admin@gestion-sgc.local` / `Admin123!`.

### Opción B: sin Docker

Necesitas una instancia de PostgreSQL accesible (local o en la nube, p. ej. Neon/Railway).

**Backend:**

```bash
cd backend
cp .env.example .env      # edita DATABASE_URL con tu conexión a Postgres
npm install
npm run prisma:migrate    # crea las tablas
npm run db:seed           # crea roles, usuario admin y datos de ejemplo
npm run dev                # http://localhost:4000
```

**Frontend** (en otra terminal):

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:5173
```

### Correr los tests del backend

```bash
cd backend
npm test
```

## 5. Despliegue

Desde la Fase 6, el despliegue "oficial" es **Vercel** (frontend estático + backend como función
serverless) — ver la guía completa en la sección 10. El backend también sigue funcionando como
servidor tradicional (`npm run build && npm start`) para quien prefiera Railway, Render o Docker
en vez de serverless; en ese caso:

**Base de datos**: Postgres administrado (Neon, Supabase, Railway Postgres...) y copia su
`DATABASE_URL`.

**Backend (Railway o Render, servidor tradicional):**
1. Crea un servicio "Web Service" apuntando a la carpeta `backend/`.
2. Variables de entorno: todas las de `.env.example` (`DATABASE_URL`, `JWT_SECRET`,
   `CORS_ORIGIN`, y si quieres login con Google / subida de archivos también `GOOGLE_CLIENT_ID`,
   `GCS_PROJECT_ID`, `GCS_BUCKET`, `GCS_CREDENTIALS_JSON`).
3. Build command: `npm install && npm run prisma:generate && npm run build`.
4. Start command: `npm run prisma:deploy && npm start` (aplica migraciones y arranca; esta
   variante SÍ mantiene el cron de alertas corriendo en el proceso, vía `node-cron`).
5. Corre el seed una sola vez desde la consola/shell del servicio: `npm run db:seed`.

Con esto el flujo local (`docker compose up`) y el de despliegue usan exactamente el mismo
código e imágenes, solo cambian las variables de entorno.

## 6. Módulos de la Fase 2

| Módulo | Endpoints principales | Pantalla |
|---|---|---|
| Documentos | `GET/POST /api/documentos`, `POST /:id/enviar-revision`, `/aprobar`, `/obsoleto`, `/versiones`, `/evidencias-lectura` | [DocumentosPage.tsx](frontend/src/pages/documentos/DocumentosPage.tsx) |
| Objetivos y Planes | `/api/objetivos`, `/api/planes`, `/api/actividades` | [ObjetivosPage.tsx](frontend/src/pages/objetivos/ObjetivosPage.tsx) |
| Riesgos | `/api/riesgos` (nivel calculado automáticamente), `/:id/tratamientos` | [RiesgosPage.tsx](frontend/src/pages/riesgos/RiesgosPage.tsx) |
| No Conformidades | `/api/no-conformidades`, `/:id/acciones`, `/:id/cerrar` (bloqueado hasta que todas las acciones estén completadas) | [NoConformidadesPage.tsx](frontend/src/pages/noconformidades/NoConformidadesPage.tsx) |

Catálogos de apoyo agregados: `/api/tipos-documento`, `/api/procesos`, `/api/categorias-riesgo`.
El endpoint `GET /api/usuarios` ahora es de lectura abierta a cualquier usuario autenticado (antes
solo ADMIN) porque se necesita para poblar los selectores de "responsable" en estos formularios;
crear/editar/borrar usuarios sigue restringido a ADMIN.

Reglas de negocio implementadas en esta fase:
- Un documento nuevo crea automáticamente su versión 1 en `BORRADOR`; solo se puede aprobar una
  versión `EN_REVISION`, y solo se puede crear una versión nueva de un documento `APROBADO`.
- Agregar una acción a una NC la mueve a `ACCION_DEFINIDA`; cerrar una NC exige evidencia de cierre
  y que todas sus acciones estén `COMPLETADA`.
- Verificar todos los planes de tratamiento de un riesgo lo mueve automáticamente a `MITIGADO`.

## 7. Módulos de la Fase 3

| Módulo | Endpoints principales | Pantalla |
|---|---|---|
| Auditorías | `/api/auditorias`, `/:id/iniciar`, `/cancelar`, `/checklists`, `/hallazgos`, `/informe` | [AuditoriasPage.tsx](frontend/src/pages/auditorias/AuditoriasPage.tsx) |
| Indicadores | `/api/indicadores`, `/:id/registros` (captura periódica) | [IndicadoresPage.tsx](frontend/src/pages/indicadores/IndicadoresPage.tsx) |
| Proveedores | `/api/proveedores`, `/:id/evaluaciones`, `/:id/documentos` | [ProveedoresPage.tsx](frontend/src/pages/proveedores/ProveedoresPage.tsx) |
| Comunicaciones | `/api/tareas`, `/api/notificaciones`, `/:id/leida`, `/marcar-todas-leidas` | [ComunicacionesPage.tsx](frontend/src/pages/comunicaciones/ComunicacionesPage.tsx) |

Catálogo de apoyo agregado: `/api/programas-auditoria`.

Reglas de negocio implementadas en esta fase:
- Un hallazgo de auditoría de tipo `NO_CONFORMIDAD` crea automáticamente una `NoConformidad`
  (origen `AUDITORIA`) enlazada al hallazgo, para no perder trazabilidad entre auditoría y NC.
- Emitir el informe de una auditoría la mueve automáticamente a `FINALIZADA`.
- Evaluar un proveedor actualiza su estado según la puntuación: ≥70 → `ACTIVO`, 50-69 →
  `EN_EVALUACION`, &lt;50 → `SUSPENDIDO`.
- La captura de un indicador es única por fecha (`indicadorId + fecha`); el semáforo se calcula
  con la lógica ya probada en `indicador.utils.ts` de la Fase 1.
- Notificaciones y tareas del tablero de Comunicaciones son las mismas que genera el cron diario
  de alertas (Fase 1) más las que se crean manualmente desde cada módulo.

Con esto los 8 módulos del MVP quedan completos de extremo a extremo.

## 8. Fase 4 — robustez de producción

Cambios transversales que no agregan módulos de negocio, pero hacen la plataforma apta para uso
real (más allá de una demo):

| Mejora | Dónde | Detalle |
|---|---|---|
| Paginación server-side | `src/utils/pagination.ts` + 7 módulos | `GET` de listados ahora acepta `?page=&pageSize=` (máx. 100) y responde `{ data, pagination }`. Aplicado a documentos, riesgos, NC, auditorías, indicadores, proveedores y personas — los de mayor volumen esperado. El frontend usa el hook [usePaginatedList](frontend/src/hooks/usePaginatedList.ts) + el componente [Pagination](frontend/src/components/common/Pagination.tsx) en esas mismas pantallas. |
| Rate limiting | `src/middleware/rateLimit.middleware.ts` | 10 intentos/15min en `/api/auth/login`; límite general de 300 req/min por IP en toda `/api`. |
| Revocación de sesión | `Usuario.tokenVersion` + `auth.middleware.ts` | El JWT incluye `tokenVersion`; cada request lo valida contra la BD. Cambiar contraseña, desactivar/eliminar un usuario, o llamar `POST /api/auth/logout-all` invalida de inmediato todos los tokens ya emitidos (antes quedaban válidos hasta expirar). Botón "Cerrar todas las sesiones" en el Topbar. |
| Subida real de archivos | `src/lib/storage.ts`, `POST /api/uploads` | Antes los campos `archivoUrl`/`evidenciaUrl` eran texto libre. Ahora hay un endpoint de subida (multer, disco local, 10MB máx., PDF/imagen/Word/Excel) y un componente [FileUpload](frontend/src/components/common/FileUpload.tsx) reutilizable, cableado como ejemplo en: documento de proveedor, evidencia de acción de NC, e informe de auditoría. El almacenamiento está aislado en un solo módulo para poder cambiar a S3/GCS sin tocar el resto de la app. |
| Trazabilidad de errores | `requestId.middleware.ts`, `error.middleware.ts` | Cada request obtiene un `X-Request-Id` (o respeta el que venga del cliente) que aparece en la respuesta de error y en el log del servidor, para poder correlacionar un error reportado por un usuario con la línea exacta del log. |
| Tests de servicios | `backend/tests/{nc,documentos,riesgos}.service.test.ts` | 15 tests nuevos que mockean `@/lib/prisma` para probar las reglas de negocio con estado (transiciones de NC, flujo de aprobación de documentos, recálculo de nivel de riesgo) sin depender de una base de datos real. Total: 41 tests. |

**Deliberadamente fuera de esta fase:** permisos granulares por acción (`Permiso`/`RolPermiso`,
ya definidos en `schema.prisma` pero sin activar) — es un cambio que toca las 8 módulos y merece
su propia fase — y observabilidad con terceros (Sentry, APM), que requiere una cuenta/DSN externo.

## 9. Fase 5 — UX avanzada

| Mejora | Dónde | Detalle |
|---|---|---|
| Notificaciones | [NotificationBell.tsx](frontend/src/layout/NotificationBell.tsx) | La campanita del Topbar consulta `GET /api/notificaciones?leida=false` cada 30s. En la Fase 5 esto era en tiempo real con Server-Sent Events, pero se revirtió a polling en la Fase 6 al mudar el backend a funciones serverless de Vercel (sin conexiones persistentes) — ver sección 10. |
| Exportar a Excel | `src/utils/excel.ts` + `GET /:recurso/export` | Documentos, Riesgos, No Conformidades, Auditorías y el historial completo de capturas de Indicadores se pueden descargar en `.xlsx` respetando los filtros activos de la pantalla (tope de 5000 filas). Botón "Exportar a Excel" en cada una de las 5 páginas. |
| Informe de auditoría en PDF | `src/utils/pdf.ts` + `GET /api/auditorias/:id/informe/pdf` | Genera un PDF formal (alcance, líder, resumen, conclusiones, hallazgos) con `pdfkit` una vez que la auditoría tiene informe emitido. |
| Búsqueda global | `GET /api/busqueda` | Un solo query busca en Documentos, Riesgos, No Conformidades, Auditorías y Proveedores por su texto principal (título/código/descripción/nombre), tope de 5 resultados por tipo. Barra de búsqueda con dropdown en el Topbar ([GlobalSearch](frontend/src/layout/GlobalSearch.tsx)); al elegir un resultado navega al módulo correspondiente (no abre el registro exacto todavía — ver limitaciones abajo). |
| Calendario de vencimientos | [MonthCalendar](frontend/src/components/common/MonthCalendar.tsx) | Grid mensual reutilizable (sin dependencias externas) que se usa en Comunicaciones para mostrar las fechas de vencimiento de las tareas del usuario, con navegación mes a mes y detalle al hacer clic en un día. |
| Modo oscuro | `tailwind.config.js` (`darkMode: "class"`), [useDarkMode](frontend/src/hooks/useDarkMode.ts) | Toggle en el Topbar, persistido en `localStorage` y con detección de preferencia del sistema. Aplicado al layout principal (Sidebar, Topbar, fondo); las pantallas de cada módulo heredan los mismos tokens de color pero no se retocaron una por una. |
| Sidebar responsive | `Sidebar.tsx`, `DashboardLayout.tsx` | En pantallas `< md` el sidebar pasa a ser un drawer que se abre con el botón ☰ del Topbar, en vez de desaparecer sin forma de acceder a la navegación (como antes). |

**Limitaciones conocidas de esta fase** (documentadas para no sorprender en producción):
- La búsqueda global navega al listado del módulo, no abre directamente el registro encontrado —
  las páginas usan modales sobre el listado en vez de rutas por `id`, así que un deep link real
  requeriría sincronizar el filtro/selección con la URL.
- El modo oscuro cubre el armazón (sidebar/topbar/fondo) pero no se aplicó exhaustivamente a cada
  tabla, formulario y modal de los 8 módulos.
- Igual que en fases anteriores, **envío de correo** sigue fuera de alcance: no hay credenciales
  SMTP en este entorno. El modelo `Notificacion` ya está listo para agregar un transporte de
  email el día que haya un proveedor real configurado.

## 10. Fase 6 — Login con Google, Google Cloud Storage y despliegue en Vercel

Esta fase reemplaza el almacenamiento local de archivos y agrega inicio de sesión con Google,
sin usar Supabase: la base de datos sigue siendo Neon y la sesión sigue siendo el JWT propio de
la app (ver sección 1). Se eligió esta ruta porque el plan gratuito de Supabase limita a 2
proyectos, y ya había un proyecto en uso.

| Mejora | Dónde | Detalle |
|---|---|---|
| Login con Google | [auth.service.ts](backend/src/modules/auth/auth.service.ts), [Login.tsx](frontend/src/pages/Login.tsx) | El frontend usa `@react-oauth/google` para obtener un ID token de Google; el backend lo verifica con `google-auth-library` (`OAuth2Client.verifyIdToken`) y busca un `Usuario` **existente** con ese email (sin registrar cuentas nuevas automáticamente). Si el email no está dado de alta, se rechaza el login. Si es válido, se emite el mismo JWT de siempre — el resto del sistema (roles, `tokenVersion`, rate limiting) no cambia. El botón de Google solo se muestra si `VITE_GOOGLE_CLIENT_ID` está configurado. |
| Almacenamiento de archivos | [storage.ts](backend/src/lib/storage.ts) | Reemplaza el disco local (incompatible con el filesystem efímero/solo-lectura de las funciones serverless de Vercel) por Google Cloud Storage. `multer` sube el archivo a memoria y `subirArchivo()` lo escribe directo al bucket; la URL pública devuelta es `https://storage.googleapis.com/<bucket>/<archivo>`, servida por acceso de lectura pública a nivel de bucket (no por ACL de objeto, porque Uniform Bucket-Level Access lo bloquea). |
| Cron de alertas en Vercel | [cron.routes.ts](backend/src/modules/cron/cron.routes.ts), `backend/vercel.json` | `node-cron` no puede vivir en una función serverless (no hay proceso persistente), así que se reemplazó por un endpoint `GET /api/cron/alertas` protegido por un secreto compartido (`CRON_SECRET`), invocado automáticamente todos los días por un [Vercel Cron Job](https://vercel.com/docs/cron-jobs) declarado en `vercel.json`. Vercel inyecta `Authorization: Bearer $CRON_SECRET` en cada invocación; el endpoint compara ese header contra `env.cronSecret`. Si desplegás el backend como servidor tradicional (Railway/Render), seguís usando `node-cron` normalmente — este endpoint es exclusivo del modo Vercel. |
| Empaquetado serverless | [backend/api/index.ts](backend/api/index.ts), `backend/vercel.json`, `backend/tsconfig.api.json` | Un `express()` es un handler válido de Vercel, así que `api/index.ts` simplemente exporta `createApp()`. `vercel.json` reescribe todas las rutas hacia esa función. `tsconfig.api.json` es un tsconfig separado (`rootDir: "."`, incluye `src` + `api`) sólo para chequear tipos de `api/index.ts` sin tocar el build tradicional (`tsc -p tsconfig.json`, usado por `npm run build`/`npm start`). |

**Variables de entorno nuevas** (todas opcionales — si faltan, el resto de la app sigue
funcionando y sólo falla la funcionalidad puntual que las necesita):

| Variable | Dónde se usa | Cómo se obtiene |
|---|---|---|
| `GOOGLE_CLIENT_ID` (backend) / `VITE_GOOGLE_CLIENT_ID` (frontend) | Verificar el ID token de Google en el backend / mostrar el botón de Google en el frontend | Mismo valor en ambos lados. Se crea en Google Cloud Console. |
| `GCS_PROJECT_ID`, `GCS_BUCKET`, `GCS_CREDENTIALS_JSON` | Subida de archivos a Google Cloud Storage | Se crean en Google Cloud Console. |
| `CRON_SECRET` | Autenticar las invocaciones del Vercel Cron Job | Cualquier string aleatorio largo (ya hay uno generado en `backend/.env`). |

### 10.1 Google Cloud Console — credenciales OAuth (login con Google)

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/) y creá un proyecto nuevo (o
   reusá uno existente).
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo "Externo" (o "Interno" si es
   Google Workspace), completá nombre de la app, email de soporte y de contacto. No hace falta
   agregar scopes extra (con el scope básico de `email`/`profile` alcanza).
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - "Orígenes de JavaScript autorizados": la URL del frontend, por ejemplo
     `http://localhost:5173` (desarrollo) y `https://<tu-proyecto>.vercel.app` (producción).
   - No hace falta configurar "URI de redirección" (el flujo usado es *Google Identity Services*,
     sin redirect).
4. Copiá el **Client ID** generado y pegalo como `GOOGLE_CLIENT_ID` en `backend/.env` (o en las
   variables de entorno de Vercel) y como `VITE_GOOGLE_CLIENT_ID` en `frontend/.env.local` (o en
   Vercel).
5. Los usuarios que inicien sesión con Google deben existir previamente en la tabla `Usuario`
   (mismo email) — este flujo no da de alta cuentas nuevas automáticamente, solo autentica
   cuentas ya creadas por un admin desde el módulo de Personas.

### 10.2 Google Cloud Storage — bucket para archivos adjuntos

1. En el mismo proyecto de Google Cloud, andá a **Cloud Storage → Buckets → Crear**.
   - Nombre único globalmente (por ejemplo `gestion-sgc-archivos`).
   - Tipo de acceso: **Uniform** (acceso uniforme a nivel de bucket).
   - Prevención de acceso público: **desactivada** (el bucket necesita servir archivos públicos
     por URL directa).
2. Una vez creado, andá a la pestaña **Permisos** del bucket → **Otorgar acceso** → principal
   `allUsers`, rol **Storage Object Viewer**. Esto hace público el *read* de todos los objetos del
   bucket (necesario porque Uniform Bucket-Level Access no permite hacer público un objeto
   individual con `.makePublic()`).
3. **IAM y administración → Cuentas de servicio → Crear cuenta de servicio**: nombre descriptivo
   (ej. `gestion-sgc-storage`), rol **Storage Object Admin** (para poder escribir objetos en el
   bucket). No hace falta darle más permisos que ese.
4. Generá una clave para esa cuenta de servicio: **Claves → Agregar clave → Crear clave nueva →
   JSON**. Se descarga un archivo `.json`.
5. En las variables de entorno del backend, configurá:
   - `GCS_PROJECT_ID`: el ID del proyecto de Google Cloud.
   - `GCS_BUCKET`: el nombre del bucket creado en el paso 1.
   - `GCS_CREDENTIALS_JSON`: el **contenido completo** del archivo `.json` de la cuenta de
     servicio, como un solo string (minificado). En Vercel, pegalo tal cual en el valor de la
     variable de entorno.

### 10.3 Despliegue en Vercel (dos proyectos)

Se usan **dos proyectos de Vercel separados** — uno para el frontend estático y otro para el
backend como función serverless — porque tienen build/runtime distintos y así cada uno puede
redeployarse de forma independiente.

**Proyecto 1 — Backend (`backend/`):**
1. En Vercel, "Add New... → Project", importá el repo y elegí `backend` como *Root Directory*.
2. Framework preset: "Other" (Vercel detecta `api/index.ts` como función serverless
   automáticamente gracias a `backend/vercel.json`).
3. Variables de entorno del proyecto: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
   `CORS_ORIGIN` (la URL del proyecto frontend, ver abajo), `GOOGLE_CLIENT_ID`, `GCS_PROJECT_ID`,
   `GCS_BUCKET`, `GCS_CREDENTIALS_JSON`, `CRON_SECRET`.
4. Antes del primer deploy (o desde tu máquina, apuntando al `DATABASE_URL` de producción), corré
   `npm run prisma:deploy` y `npm run db:seed` una vez para preparar el esquema y el usuario admin
   inicial — Vercel no corre migraciones automáticamente en cada deploy.
5. Deploy. Anotá la URL pública (ej. `https://gestion-sgc-api.vercel.app`) — es el `VITE_API_URL`
   del frontend.
6. El Cron Job de `vercel.json` (`/api/cron/alertas`, todos los días 06:00 UTC) se activa solo con
   el deploy; no requiere configuración manual adicional siempre que `CRON_SECRET` esté seteado.

**Proyecto 2 — Frontend (`frontend/`):**
1. "Add New... → Project", mismo repo, *Root Directory* = `frontend`.
2. Framework preset: **Vite** (Vercel lo detecta solo). Build command `npm run build`, output
   `dist/`.
3. Variables de entorno: `VITE_API_URL` = URL del backend del paso anterior + `/api` (ej.
   `https://gestion-sgc-api.vercel.app/api`), `VITE_GOOGLE_CLIENT_ID`.
4. Deploy. Una vez que tengas la URL final del frontend, volvé al proyecto del backend y
   actualizá `CORS_ORIGIN` con esa URL (y agregala también como origen autorizado en las
   credenciales OAuth de Google Cloud, paso 10.1.3).

**Limitaciones conocidas de esta fase:**
- Las notificaciones dejaron de ser en tiempo real (SSE) y volvieron a polling cada 30s, porque
  las funciones serverless de Vercel no sostienen conexiones HTTP abiertas — ver la tabla de la
  Fase 5.
- El login con Google no crea usuarios nuevos: sigue siendo responsabilidad de un `ADMIN` dar de
  alta a la persona primero (con su email real) desde el módulo de Personas.
- No se probó todavía end-to-end con credenciales reales de Google Cloud (Client ID ni bucket de
  GCS) — el código está listo pero pendiente de las credenciales del proyecto real.
