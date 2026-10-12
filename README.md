# VortexManager · Hayya Fitness Club 🏋️‍♂️

Plataforma de gestión de gimnasios y control de acceso por DNI en tiempo real para **Hayya Fitness Club**.

---

## 🛠️ Stack Tecnológico

- **Backend (`/server`):**
  - Node.js + Express.js (`index.js` en JavaScript plano).
  - PostgreSQL alojado en Supabase conectado con el driver oficial `pg` (`Pool`).
  - Consultas SQL puras explícitas (sin ORMs).
  - Autenticación con `bcryptjs` y `jsonwebtoken` almacenado en **Cookies HTTP-Only** seguras.
  - Protección de rutas `/api/admin/*` con middleware.
  - Rate limiting y CORS configurado con `credentials: true`.
- **Frontend (`/client`):**
  - React 18 + Vite (JavaScript plano, sin TypeScript).
  - Tailwind CSS con tema oscuro estricto idéntico a Figma (`#0F1117`, `#161922`, `#FF5500`).
  - Iconos oficiales con `lucide-react`.
  - Enrutamiento con `react-router-dom`.
  - Peticiones HTTP con `axios` (`withCredentials: true`).

---

## 🚀 Guía de Inicio Rápido

### 1. Configurar variables de entorno del Backend

Copia el archivo de ejemplo en `/server`:

```bash
cd server
copy .env.example .env
```

Edita `server/.env` y coloca tu cadena de conexión de Supabase y un secreto para JWT:

```env
DATABASE_URL=postgresql://postgres.xxxxxxxx:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=super_secreto_aleatorio_de_al_menos_32_caracteres_12345
PORT=4000
CLIENT_URL=http://localhost:5173
APP_TIMEZONE=America/Argentina/Buenos_Aires
```

> **Nota sobre Supabase:** El archivo `config/db.js` ya está preparado para manejar SSL con Supabase y evitar errores de certificados autofirmados (`rejectUnauthorized: false`).

### 2. Inicializar la Base de Datos y Datos de Prueba

Desde la carpeta `server`, ejecuta el script de inicialización:

```bash
npm run db:setup
```

Este script:
1. Aplica el esquema SQL completo (`usuarios`, `socios`, `registro_accesos`, índices).
2. Genera un hash real con `bcrypt` para la contraseña `admin123`.
3. Inserta/actualiza el usuario admin `admin@hayya.com` y los socios de prueba.

### 3. Iniciar el Backend

```bash
# Dentro de /server:
npm run dev
```

El servidor escuchará en `http://localhost:4000`.

### 4. Iniciar el Frontend

En una terminal separada:

```bash
cd client
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## 🔑 Credenciales y Pruebas

### Panel de Administración
- **URL:** [http://localhost:5173/login](http://localhost:5173/login)
- **Correo:** `admin@hayya.com`
- **Contraseña:** `admin123`

### Tótem de Acceso Kiosco
- **URL:** [http://localhost:5173/terminal](http://localhost:5173/terminal) (también accesible desde el menú *Ajustes > Abrir Tótem de Acceso* del panel).
- Compatible con pantalla táctil, teclado en pantalla y teclado físico numérico / Enter / Retroceso.

#### Casos de prueba para el Tótem:
| DNI | Socio | Estado | Ficha Médica | Resultado esperado |
|---|---|---|---|---|
| `40123456` | Juan Pérez | Activo | Sí | ✅ **PERMITIDO** (+10 puntos asignados) |
| `38987654` | María Gómez | Activo | Sí | ✅ **PERMITIDO** (+10 puntos asignados) |
| `42111222` | Lucas Rodríguez | Activo | No | ⚠️ **DENEGADO** (Ficha Médica Pendiente) |
| `39444555` | Ana Martínez | Inactivo | No | ❌ **DENEGADO** (Membresía Inactiva) |
| `99999999` | No registrado | - | - | ❌ **DENEGADO** (DNI No Registrado) |

---

## 📁 Estructura del Proyecto

```text
/demo-hayya
├── server/
│   ├── config/
│   │   └── db.js                 # Pool pg con SSL tolerante para Supabase
│   ├── database/
│   │   └── schema.sql            # Tablas, índices y seed SQL puro
│   ├── middleware/
│   │   └── authMiddleware.js     # Validador de JWT en Cookie HTTP-Only
│   ├── routes/
│   │   ├── auth.js               # /api/auth (login, logout, me) con bcrypt y cookies
│   │   ├── socios.js             # /api/admin/socios (CRUD completo, KPIs COUNT, ILIKE)
│   │   └── acceso.js             # /api/acceso/validar (Tótem) y /api/admin/accesos (Dashboard)
│   ├── scripts/
│   │   └── setup-db.js           # Runner de schema con hash bcrypt real de admin123
│   ├── utils/
│   │   └── helpers.js            # Validaciones, escape de comodines LIKE, formateo
│   ├── .env.example
│   ├── index.js                  # Entry point Express, CORS con credentials, helmet, cookies
│   └── package.json
│
├── client/
│   ├── public/
│   │   └── favicon.svg           # Logo corredor Hayya
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # Instancia Axios con withCredentials: true
│   │   ├── components/
│   │   │   ├── AdminLayout.jsx   # Layout con Sidebar fija y contenedor
│   │   │   ├── Logo.jsx          # Emblema vectorizado de Hayya Club
│   │   │   ├── Modal.jsx         # Modal base accesible
│   │   │   ├── ModalFicha.jsx    # Modal detalle de socio, puntos y accesos
│   │   │   ├── ModalSocio.jsx    # Modal alta y edición de socio
│   │   │   ├── Navbar.jsx        # Cabecera con datos de usuario y badge
│   │   │   ├── ProtectedRoute.jsx# Guardia de rutas protegidas
│   │   │   └── Sidebar.jsx       # Barra lateral fiel a Figma
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Estado de sesión con HTTP-Only cookies
│   │   │   └── ToastContext.jsx  # Notificaciones toast
│   │   ├── pages/
│   │   │   ├── DashboardInicio.jsx# Métricas del día, gráfico por hora y últimos accesos
│   │   │   ├── GestionSocios.jsx # CRUD socios, KPIs, filtros en vivo y paginación
│   │   │   ├── Login.jsx         # Pantalla de acceso con split-panel y logo Hayya
│   │   │   └── TotemAcceso.jsx   # Terminal Kiosco de acceso con teclado interactivo
│   │   ├── utils/
│   │   │   └── format.js         # Formato de DNI con puntos y fechas argentinas
│   │   ├── App.jsx               # Definición de rutas
│   │   ├── index.css             # Tokens de diseño y clases utilitarias
│   │   └── main.jsx
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.js        # Paleta Figma, modo oscuro, fuentes
│   ├── vite.config.js            # Proxy a http://localhost:4000
│   └── package.json
└── README.md
```
