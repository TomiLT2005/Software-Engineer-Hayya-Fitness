# Contexto General del Proyecto · VortexManager (Hayya Fitness Club)

Este documento reúne **toda la arquitectura, módulos, reglas de negocio, base de datos, endpoints, flujos de autenticación y configuración de despliegue (Vercel + Render + Supabase)** del proyecto para compartir con otros desarrolladores o pasar como contexto a una IA.

---

## 1. Descripción General

**VortexManager** es la plataforma web de administración y control de acceso por DNI en tiempo real para **Hayya Fitness Club**.

Permite:
1. **Panel de Administración (`/admin/*`):**
   - **Dashboard en vivo (`/admin/inicio`):** métricas de ingresos del día, gráfico de afluencia por hora, desglose de rechazos y tabla de últimos accesos con auto-refresco.
   - **Gestión de Socios (`/admin/socios`):** CRUD completo, control de ficha médica, estado de membresía (`Activo` / `Inactivo`), sistema de gamificación (**Puntos Hayya** con niveles Bronce, Plata y Oro) e historial individual de ingresos.
   - **Control de Pagos (`/admin/pagos`):** estado de cuenta de cada socio (`Pagado` / `Vencido` según `fecha_vencimiento`), registro de cobros en Efectivo o Transferencia, cálculo automático en servidor de **recargo por mora del 10% después del día 10 del mes**, renovación automática de vencimiento e historial de comprobantes.
   - **Gestión de Planes (`/admin/planes`):** CRUD de membresías (Mensual, Quincenal, 1 Día, Mujeres, Kids, Infanto, etc.) con precio, descripción, lista de beneficios en JSONB, imagen de portada (URL o carga en base64/data URL) y activación/desactivación.
   - **Tours Interactivos (`driver.js`):** sistema de guía paso a paso integrado en cada página y modal (abre automáticamente modales de demostración mediante un bus de eventos `tourBus.js`).
2. **Tótem / Terminal Kiosco de Acceso (`/terminal`):**
   - Pantalla pensada para tablet o monitor táctil en la recepción del gimnasio.
   - El socio ingresa su DNI (con teclado numérico en pantalla o teclado físico) y el sistema valida en tiempo real si puede ingresar, sumándole **+10 puntos** por cada ingreso permitido.
3. **Presentaciones estáticas (`/presentacion` y `/presentacion-v2`):**
   - Archivos HTML en `client/public/` servidos mediante rewrites de Vercel.

---

## 2. Stack Tecnológico

### Frontend (`/client`)
- **Framework:** React 18 + Vite (JavaScript plano, ESM).
- **Estilos:** Tailwind CSS 3 con paleta oscura personalizada fiel al diseño de Figma (`#0F1117`, `#161922`, naranja `#FF5500`).
- **Enrutamiento:** `react-router-dom` v7.
- **Cliente HTTP:** `axios` con `withCredentials: true` + interceptor que adjunta `Authorization: Bearer <token>` desde `localStorage` (`vortex_token`) e interceptor de respuesta que cierra sesión ante un `401`.
- **Iconos:** `lucide-react`.
- **Tours guiados:** `driver.js`.

### Backend (`/server`)
- **Runtime y Framework:** Node.js (>= 18.18) + Express 4 (CommonJS).
- **Base de Datos:** PostgreSQL en **Supabase**, conectada mediante `pg` (`Pool`) con SQL puro parametrizado (sin ORM) y SSL tolerante (`rejectUnauthorized: false`).
- **Autenticación y Seguridad:**
  - `jsonwebtoken` (JWT HS256 con TTL de 8 horas).
  - Doble transporte de sesión: **Cookie HTTP-Only** (`vortex_token`) + **Header `Authorization: Bearer <token>`** (para evitar bloqueos de third-party cookies en móviles/incógnito entre Vercel y Render).
  - `bcryptjs` para hash de contraseñas y mitigación de timing attacks (`DUMMY_HASH` cuando el correo no existe).
  - `helmet` para cabeceras de seguridad.
  - `express-rate-limit` en login (10 intentos / 15 min) y en el tótem de acceso (60 req / min).
  - `cors` dinámico compatible con previews de Vercel y comodines.

### Infraestructura y Despliegue
- **Frontend:** **Vercel** (proyecto `software-engineer-hayya-fitness`).
- **Backend:** **Render** (`https://software-engineer-hayya-fitness.onrender.com`).
- **Base de Datos:** **Supabase** (PostgreSQL Session Pooler puerto `5432`).

---

## 3. Estructura de Carpetas

```text
demo-hayya/
├── vercel.json                        # Rewrites de Vercel (proxy /api/* -> Render + rutas SPA)
├── README.md                          # Guía de instalación local
├── CORS-VERCEL-RENDER.md              # Este documento de contexto
│
├── server/                            # Backend Node.js + Express
│   ├── index.js                       # Entry point, CORS, Helmet, montaje de rutas, error handler
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── db.js                      # Pool de PostgreSQL (Supabase SSL)
│   ├── database/
│   │   ├── schema.sql                 # Tablas base (usuarios, socios, registro_accesos, planes) + seed
│   │   └── migrations/
│   │       └── 001_pagos.sql          # Agrega fecha_vencimiento a socios y crea tabla pagos
│   ├── middleware/
│   │   └── authMiddleware.js          # Verifica JWT en Authorization Bearer o cookie vortex_token
│   ├── routes/
│   │   ├── auth.js                    # POST /login, POST /logout, GET /me
│   │   ├── socios.js                  # CRUD de socios + stats + ficha con últimos accesos
│   │   ├── planes.js                  # CRUD de planes + toggle de estado
│   │   ├── pagos.js                   # KPIs, estado de cuenta, cotización con mora, cobro transaccional, historial
│   │   └── acceso.js                  # POST /api/acceso/validar (Tótem) y GET /api/admin/accesos/* (Dashboard)
│   ├── scripts/
│   │   ├── setup-db.js                # Ejecuta schema.sql y crea el usuario admin con hash bcrypt real
│   │   └── migrate.js                 # Ejecuta database/migrations/*.sql en orden
│   └── utils/
│       └── helpers.js                 # asyncHandler, escapeLike, isUuid, validateSocio, normalizeDni
│
└── client/                            # Frontend React + Vite
    ├── vercel.json                    # Rewrites de Vercel cuando el Root Directory es /client
    ├── vite.config.js                 # Proxy local /api -> http://127.0.0.1:4000
    ├── tailwind.config.js
    ├── package.json
    ├── public/
    │   ├── favicon.svg
    │   ├── presentacion.html
    │   └── presentacion-v2.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    # Rutas de la aplicación
        ├── index.css
        ├── api/
        │   └── axios.js               # Cliente Axios + interceptores Bearer y 401
        ├── context/
        │   ├── AuthContext.jsx        # Estado global de autenticación (user, login, logout)
        │   └── ToastContext.jsx       # Sistema de notificaciones toast
        ├── tour/
        │   ├── TourContext.jsx        # Controlador de driver.js
        │   ├── tourBus.js             # Eventos para abrir/cerrar modales automáticamente durante el tour
        │   └── tours.js               # Definición de pasos para Inicio, Socios, Pagos, Planes y Modales
        ├── components/
        │   ├── AdminLayout.jsx        # Layout principal con Sidebar, Navbar y TourProvider
        │   ├── Sidebar.jsx            # Navegación lateral + switch de encendido del Tótem + botón Guía
        │   ├── Navbar.jsx             # Barra superior con datos del admin logueado
        │   ├── ProtectedRoute.jsx     # Guardia de rutas autenticadas
        │   ├── Logo.jsx               # Emblema Hayya
        │   ├── Modal.jsx              # Componente modal base (soporta botón "?" de ayuda contextual)
        │   ├── ModalSocio.jsx         # Alta y edición de socio
        │   ├── ModalFicha.jsx         # Ficha detallada del socio, nivel de Puntos Hayya y últimos ingresos
        │   ├── ModalPlan.jsx          # Alta y edición de plan con beneficios y vista previa de portada
        │   ├── ModalRegistrarPago.jsx # Formulario de cobro con buscador de socio y desglose de mora en vivo
        │   └── ModalHistorialPagos.jsx# Historial de comprobantes de un socio
        ├── pages/
        │   ├── Login.jsx              # Login de administradores
        │   ├── DashboardInicio.jsx    # Resumen diario, gráfico horario, motivos de rechazo y accesos en vivo
        │   ├── GestionSocios.jsx      # Tabla paginada, filtros, KPIs y acciones de socios
        │   ├── GestionPagos.jsx       # Estado de cuentas, filtros (Al día / Vencido) y cobros
        │   ├── GestionPlanes.jsx      # Grilla de tarjetas de planes y filtros
        │   └── TotemAcceso.jsx        # Terminal kiosco de ingreso por DNI
        └── utils/
            └── format.js              # Formateadores de DNI, moneda ARS ($10.000,00), porcentajes y fechas (es-AR)
```

---

## 4. Esquema de Base de Datos (PostgreSQL / Supabase)

El esquema se compone de `server/database/schema.sql` más la migración `server/database/migrations/001_pagos.sql`. Se inicializa todo con `cd server && npm run db:setup`.

### Tabla `usuarios`
Administradores con acceso al panel y al tótem.
- `id` (`UUID`, PK)
- `correo` (`VARCHAR(255)`, UNIQUE, NOT NULL)
- `password_hash` (`VARCHAR(255)`, NOT NULL)
- `nombre` (`VARCHAR(100)`, NOT NULL)
- `rol` (`VARCHAR(50)`, default `'admin'`)
- `created_at` (`TIMESTAMPTZ`)

### Tabla `socios`
Miembros del gimnasio.
- `id` (`UUID`, PK)
- `dni` (`VARCHAR(20)`, UNIQUE, NOT NULL)
- `nombre` (`VARCHAR(100)`, NOT NULL)
- `apellido` (`VARCHAR(100)`, NOT NULL)
- `correo` (`VARCHAR(255)`)
- `telefono` (`VARCHAR(50)`)
- `plan` (`VARCHAR(50)`, NOT NULL, default `'Mensual'`)
- `ficha_medica_entregada` (`BOOLEAN`, default `FALSE`)
- `estado` (`VARCHAR(20)`, default `'Activo'`) — `'Activo'` o `'Inactivo'`
- `puntos` (`INTEGER`, default `0`) — suma +10 por cada acceso permitido en el tótem
- `fecha_vencimiento` (`DATE`, nullable) — agregada en `001_pagos.sql`; `NULL` significa que nunca registró un pago
- `created_at` (`TIMESTAMPTZ`)

### Tabla `planes`
Catálogo de membresías del club.
- `id` (`UUID`, PK)
- `nombre` (`VARCHAR(100)`, UNIQUE, NOT NULL)
- `descripcion` (`TEXT`)
- `precio` (`NUMERIC(10,2)`, NOT NULL)
- `beneficios` (`JSONB`, default `'[]'`) — array de strings, ej. `["Musculación", "Hayya Cross"]`
- `imagen_url` (`TEXT`) — soporta URLs externas o data URLs en base64 (el body parser de Express está configurado en `10mb`)
- `estado` (`VARCHAR(20)`, default `'Activo'`) — `'Activo'` o `'Inactivo'`
- `orden` (`INTEGER`, default `0`)
- `created_at`, `updated_at` (`TIMESTAMPTZ`)

### Tabla `registro_accesos`
Historial de cada intento de ingreso por el Tótem.
- `id` (`UUID`, PK)
- `socio_id` (`UUID`, FK a `socios(id) ON DELETE SET NULL`)
- `dni_ingresado` (`VARCHAR(20)`, NOT NULL)
- `nombre_socio` (`VARCHAR(200)`)
- `estado_acceso` (`VARCHAR(20)`, NOT NULL) — `'PERMITIDO'` o `'DENEGADO'`
- `motivo` (`VARCHAR(255)`) — `'Acceso Correcto'`, `'DNI No Registrado'`, `'Membresía Inactiva'` o `'Ficha Médica Pendiente'`
- `fecha_hora` (`TIMESTAMPTZ`, default `CURRENT_TIMESTAMP`)

### Tabla `pagos`
Comprobantes de cobro de cuotas (`001_pagos.sql`).
- `id` (`UUID`, PK)
- `socio_id` (`UUID`, FK a `socios(id) ON DELETE SET NULL`) — conserva el registro contable aunque se borre el socio
- `plan_abonado` (`VARCHAR(100)`, NOT NULL)
- `monto_base` (`NUMERIC(10,2)`, NOT NULL)
- `recargo_mora` (`NUMERIC(10,2)`, NOT NULL, default `0`)
- `monto_total` (`NUMERIC(10,2)`, NOT NULL)
- `metodo_pago` (`VARCHAR(20)`, CHECK `'Efectivo'` | `'Transferencia'`)
- `comprobante_ref` (`VARCHAR(100)`) — obligatorio cuando `metodo_pago = 'Transferencia'`
- `vencimiento_anterior` (`DATE`)
- `vencimiento_nuevo` (`DATE`)
- `fecha_pago` (`TIMESTAMPTZ`, default `CURRENT_TIMESTAMP`)

---

## 5. Reglas de Negocio Clave

1. **Validación en el Tótem (`POST /api/acceso/validar`):**
   - El DNI se normaliza quitando puntos o espacios (debe tener entre 6 y 8 dígitos numéricos).
   - Se evalúa en orden:
     1. Si el DNI no existe en `socios` → **`DENEGADO`** (`"DNI No Registrado"`).
     2. Si `socio.estado !== 'Activo'` → **`DENEGADO`** (`"Membresía Inactiva"`).
     3. Si `socio.ficha_medica_entregada !== true` → **`DENEGADO`** (`"Ficha Médica Pendiente"`).
     4. Si cumple todo → **`PERMITIDO`** (`"Acceso Correcto"`), se le suman **+10 puntos** en la misma transacción SQL y se guarda el intento en `registro_accesos`.
   - **Nota de seguridad:** Actualmente la ruta `/api/acceso` en `server/index.js` requiere `authMiddleware` (es decir, el administrador debe haber iniciado sesión en ese navegador para abrir `/terminal`). Además, el Sidebar tiene un switch de encendido de terminal sincronizado en `localStorage`.

2. **Cálculo de Pagos, Mora y Renovación (`/api/admin/pagos`):**
   - **Fuente única de verdad en el servidor:** El cliente nunca envía el monto a cobrar; el backend busca el precio actual del plan activo en la tabla `planes`.
   - **Regla de Mora (10%):** Si el día del mes actual (según la zona horaria `APP_TIMEZONE`, por defecto `America/Argentina/Buenos_Aires`) es **mayor a 10** (`dia_mes > 10`), se aplica automáticamente un **10% de recargo por mora** sobre el `monto_base`.
   - **Extensión de Vencimiento:**
     - Plan `Quincenal` → suma `15 days`.
     - Plan `1 Día` / `Diario` → suma `1 day`.
     - Cualquier otro plan (`Mensual`, `Mujeres`, `Kids`, `Infanto`, etc.) → suma `1 month`.
     - Si el socio todavía tenía su cuota al día (`fecha_vencimiento >= hoy`), el intervalo se suma a partir de su `fecha_vencimiento` actual; si estaba vencido o no tenía fecha, se suma a partir de `hoy`.
     - Al registrar un pago, el estado del socio pasa automáticamente a `'Activo'` y su `plan` se actualiza al plan abonado (todo dentro de una transacción con `FOR UPDATE` para evitar dobles cobros concurrentes).

---

## 6. Resumen de Endpoints de la API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | No | Verifica estado del servidor y conexión a PostgreSQL |
| `POST` | `/api/auth/login` | No | Inicia sesión (`{ correo, password }`), setea cookie y devuelve `{ token, user }` |
| `POST` | `/api/auth/logout` | No | Limpia la cookie `vortex_token` |
| `GET` | `/api/auth/me` | Sí | Devuelve los datos del usuario autenticado |
| `POST` | `/api/acceso/validar` | Sí | Valida un DNI en el Tótem, suma puntos y registra el acceso |
| `GET` | `/api/admin/accesos/resumen` | Sí | Totales del día, distribución por hora y motivos de rechazo |
| `GET` | `/api/admin/accesos/recientes`| Sí | Últimos 10 intentos de acceso |
| `GET` | `/api/admin/socios/stats` | Sí | KPIs: total, activos, inactivos, fichas pendientes |
| `GET` | `/api/admin/socios` | Sí | Lista paginada con filtro por `search`, `estado` y `plan` |
| `GET` | `/api/admin/socios/:id` | Sí | Ficha completa del socio + últimos 5 accesos + total de visitas |
| `POST` | `/api/admin/socios` | Sí | Crea un socio nuevo |
| `PUT` | `/api/admin/socios/:id` | Sí | Edita un socio existente |
| `PATCH` | `/api/admin/socios/:id/estado`| Sí | Alterna el estado del socio entre `Activo` e `Inactivo` |
| `DELETE`| `/api/admin/socios/:id` | Sí | Elimina al socio (conserva sus accesos y pagos con `socio_id = NULL`) |
| `GET` | `/api/admin/planes` | Sí | Lista todos los planes con filtros `search` y `estado` + contadores |
| `GET` | `/api/admin/planes/:id` | Sí | Detalle de un plan |
| `POST` | `/api/admin/planes` | Sí | Crea un plan nuevo |
| `PUT` | `/api/admin/planes/:id` | Sí | Actualiza un plan |
| `PATCH` | `/api/admin/planes/:id/estado`| Sí | Activa o desactiva un plan |
| `DELETE`| `/api/admin/planes/:id` | Sí | Elimina un plan |
| `GET` | `/api/admin/pagos/kpis` | Sí | KPIs de cuentas: total de socios, al día y vencidos |
| `GET` | `/api/admin/pagos` | Sí | Lista paginada del estado de cuenta de cada socio |
| `GET` | `/api/admin/pagos/cotizacion` | Sí | Previsualiza `monto_base`, `recargo_mora`, `monto_total` e intervalo (`?socioId=&plan=`) |
| `GET` | `/api/admin/pagos/historial/:socioId` | Sí | Historial de comprobantes de pago de un socio |
| `POST` | `/api/admin/pagos` | Sí | Registra un pago y actualiza el vencimiento y estado del socio |

---

## 7. Configuración de Despliegue: Vercel + Render + CORS

### El Problema de las Previews de Vercel
- **Frontend en Vercel:** Cada vez que se despliega una rama (`main`, `dev`, un PR o un commit), Vercel genera una URL dinámica del estilo `https://software-engineer-hayya-fitness-q1jwl8rwn-tomi-lt.vercel.app`.
- **Backend en Render:** `https://software-engineer-hayya-fitness.onrender.com`.
- Si el backend solo acepta una lista fija en `CLIENT_URL`, cualquier preview nueva de Vercel falla con `403 Forbidden ("Origen no permitido por CORS")`.

### Cómo está resuelto en el código
1. **Rewrite / Proxy en `vercel.json` y `client/vercel.json`:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://software-engineer-hayya-fitness.onrender.com/api/:path*"
       },
       {
         "source": "/presentacion",
         "destination": "/presentacion.html"
       },
       {
         "source": "/presentacion-v2",
         "destination": "/presentacion-v2.html"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   Si en Vercel `VITE_API_URL` se deja vacía (o en `/api`), el frontend le pega a `/api` en su propio dominio de Vercel y Vercel hace proxy hacia Render.

2. **Validación dinámica de CORS en `server/index.js`:**
   - Acepta automáticamente cualquier URL de producción o preview del proyecto en Vercel mediante la expresión regular:
     ```js
     const VERCEL_PREVIEW_RE = /^https:\/\/software-engineer-hayya-fitness(?:-[a-z0-9-]+)?\.vercel\.app$/i;
     ```
   - Normaliza las URLs de `CLIENT_URL` quitando barras finales (`/`).
   - Soporta comodines con `*` en `CLIENT_URL` (por ejemplo: `https://*.vercel.app`).

---

## 8. Variables de Entorno y Credenciales de Prueba

### Variables del Backend (`server/.env` / Render)
| Variable | Ejemplo / Valor | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.xxxx:PASS@aws-0-us-east-2.pooler.supabase.com:5432/postgres` | URI de conexión a Supabase |
| `JWT_SECRET` | String aleatorio de +32 caracteres | Secreto para firmar tokens JWT |
| `PORT` | `4000` | Puerto del servidor Express |
| `CLIENT_URL` | `http://localhost:5173,https://software-engineer-hayya-fitness.vercel.app` | Orígenes adicionales permitidos por CORS |
| `APP_TIMEZONE` | `America/Argentina/Buenos_Aires` | Zona horaria para métricas del día y cálculo de mora |
| `NODE_ENV` | `production` (en Render) / `development` (local) | Entorno de ejecución |
| `TRUST_PROXY` | `1` (recomendado en Render) | Para que `express-rate-limit` lea bien la IP detrás del proxy de Render |

### Credenciales por Defecto (creadas por `npm run db:setup`)
- **Correo Admin:** `admin@hayya.com`
- **Contraseña Admin:** `admin123`

### DNIs de Prueba para el Tótem (`/terminal`)
- `40123456` (Juan Pérez) → **PERMITIDO** (Activo + Ficha médica entregada, suma +10 puntos).
- `38987654` (María Gómez) → **PERMITIDO** (Activo + Ficha médica entregada, suma +10 puntos).
- `42111222` (Lucas Rodríguez) → **DENEGADO** (`Ficha Médica Pendiente`).
- `39444555` (Ana Martínez) → **DENEGADO** (`Membresía Inactiva`).
- `99999999` (No existe) → **DENEGADO** (`DNI No Registrado`).
