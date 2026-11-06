# ActiGest API — Gestión de Activos Fijos

API REST del sistema **ActiGest**, para administrar los activos fijos de una organización: registro de bienes, ubicación, depreciación y revalorización, mantenimientos, reservas y garantías, con bitácora de acciones y copias de seguridad de la base de datos.

> Proyecto académico — Sistemas de Información II, UAGRM (2023).

## Funcionalidades

- **Activos**: alta, edición, baja, búsqueda por ID o número de serie, imagen del activo y filtro por rango de fechas.
- **Depreciación y revalorización** de activos.
- **Ubicaciones**: dónde se encuentra cada activo.
- **Mantenimientos**: programación y seguimiento, con filtro por fechas.
- **Reservas** y **garantías** de activos.
- **Estados** del activo.
- **Usuarios, empleados y clientes**: registro, edición, cambio de contraseña y asignación de roles.
- **Bitácora** de inicio y cierre de sesión y de acciones del sistema.
- **Backup y restauración** de la base de datos (`pg_dump` / `pg_restore`).
- **Notificaciones push** con OneSignal.

## Tecnologías

- Node.js + Express (ES Modules)
- PostgreSQL (`pg`)
- bcryptjs, Multer, dotenv
- OneSignal (`onesignal-node`)

## Estructura

```
src/
├── index.js
├── config.js / db.js
├── routes/
│   ├── activo.routes.js
│   ├── estado.routes.js
│   ├── mantenimiento.routes.js
│   ├── persona.routes.js       # usuarios, empleados, bitácora, backups
│   └── ubicacion.routes.js
├── controllers/                # lógica de cada módulo (*.CO.js)
├── lib/helpers.js
└── public/img/                 # imágenes de activos
```

## Requisitos

- Node.js 18 o superior
- PostgreSQL 12 o superior, con `pg_dump` y `pg_restore` disponibles en la terminal (para backups)
- Una cuenta de OneSignal (opcional, para las notificaciones push)

## Instalación

```bash
npm install
```

### Configuración

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `5000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | Conexión a PostgreSQL |
| `ONESIGNAL_APP_ID` | ID de la app en OneSignal (Settings → Keys & IDs) |
| `ONESIGNAL_API_KEY` | REST API Key de OneSignal |

El archivo `.env` y los backups (`*.tar`) están en `.gitignore`. **No los subas al repositorio.**

### Base de datos

El script [`database/schema.sql`](database/schema.sql) crea todas las tablas y carga los datos iniciales. Necesitas PostgreSQL:

```bash
createdb -U postgres ActiGest
```
```bash
psql -U postgres -d ActiGest -f database/schema.sql
```

El script se puede volver a ejecutar: borra las tablas y las crea de nuevo, **así que también borra los datos**.

Usa el nombre `ActiGest` tal cual: la función de backup llama a `pg_dump` sobre esa base.

Incluye los roles, los estados de mantenimiento, una ubicación y el usuario inicial **`admin` / `admin123`**. Cambia esa contraseña después de entrar.

### Ejecutar

```bash
npm run dev
```

Puerto por defecto: `5000`. Para usar backup / restore, `pg_dump` y `pg_restore` deben estar instalados en el servidor.

## Endpoints principales

| Módulo | Rutas |
|---|---|
| Activos | `GET/POST /api/acti`, `GET/POST/DELETE /api/acti/:id`, `GET /api/acti/:Inicio/:Fin`, `GET /api/actiI/:id` (imagen) |
| Depreciación | `GET /api/actiDep/:id`, `POST /api/acti/depre`, `POST /api/acti/rev` |
| Reservas | `GET /api/res`, `POST /api/acti/res`, `PUT/DELETE /api/res/:id` |
| Garantías | `GET /api/Gacti/:id`, `POST /api/acti/gar`, `DELETE /api/acti/gar/:id` |
| Mantenimiento | `GET/POST /api/mant`, `PUT/DELETE /api/mant/:id`, `GET /api/mant/:Inicio/:Fin` |
| Ubicaciones | `GET/POST /api/ubi`, `GET/PUT/DELETE /api/ubi/:id` |
| Estados | `POST /api/estado` |
| Usuarios | `GET/POST /api/user`, `PUT/DELETE /api/user/:ci`, `POST /api/I` (login), `POST /api/C` (logout) |
| Empleados | `GET /api/emp`, `POST /api/userE`, `PUT /api/emp/:ci` |
| Bitácora | `GET /api/bitac`, `GET /api/bitac/:Inicio/:Fin`, `POST /bita/A` |
| Backups | `GET /backup/:ci`, `GET /backupV/:ci`, `GET /restore/:id` |
