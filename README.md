# Pretty Face's Beauty Center

Sistema de gestión completo para **Pretty Face's Beauty Center** — centro de estética en salud capilar, cuidado de la piel y mejoramiento estético.

📸 Instagram: [@PrettyFacesBeautyCenter](https://instagram.com/PrettyFacesBeautyCenter)

---

## Estructura del repositorio

```
pretty-faces/
├── frontend/          # SPA (Vite + React 18 + Tailwind CSS 3)
│   └── src/
│       ├── components/        # Landing page sections + componentes admin
│       │   └── app/           # AppLayout, Sidebar, Modales, TicketRecibo
│       ├── pages/app/         # Páginas del panel admin
│       ├── context/           # AuthContext (JWT state)
│       └── lib/               # api.js (cliente HTTP)
└── backend/           # API REST (FastAPI + SQLAlchemy + MySQL)
    └── app/
        ├── core/              # config, database, security
        ├── models/            # SQLAlchemy ORM models
        ├── routers/           # Endpoints por dominio
        ├── schemas/           # Pydantic schemas
        └── scripts/           # seed.py
```

---

## Frontend

### Landing page pública (`/`)

| Sección | Descripción |
|---|---|
| Navbar | Navegación con scroll a secciones |
| Hero | Portada principal |
| Promociones | Promociones activas |
| Nosotros | Historia y valores del centro |
| Servicios | Catálogo visual de servicios |
| Galería | Fotos de trabajos realizados |
| Precios | Tabla de precios por categoría con tabs |
| Horarios | Días y horarios de atención |
| Contacto | WhatsApp + redes sociales |
| Footer | Links e información de contacto |

### Panel admin (`/admin/*`)

Acceso protegido por JWT. Rutas con control de roles:

| Ruta | Página | Rol mínimo |
|---|---|---|
| `/admin/dashboard` | Métricas del día (citas, ingresos, gastos, balance) | todos |
| `/admin/mi-agenda` | Citas propias de la empleada logueada | todos |
| `/admin/citas` | Gestión de todas las citas | todos |
| `/admin/clientes` | ABM de clientes | todos |
| `/admin/ingresos` | Registro y listado de pagos | todos |
| `/admin/empleadas` | ABM de empleadas | admin |
| `/admin/gastos` | Registro de gastos por categoría | admin |
| `/admin/reportes` | Reportes por período (gráficos con Recharts) | admin |
| `/admin/productos` | Stock de productos | recepcion |
| `/admin/promociones` | Gestión de promociones | recepcion |
| `/admin/corte-caja` | Corte de caja diario por método de pago | recepcion |

**Roles:** `admin` > `recepcion` > `empleada`

### Características técnicas

- React Router v6 con rutas anidadas y `ProtectedRoute` por rol
- `AuthContext` con `access_token` (30 min) y `refresh_token` (7 días) en estado
- `ModalNuevaCita` — crear cita con selección de cliente, empleada y servicios
- `ModalObservaciones` — registrar fotos antes/después del servicio (base64)
- `TicketRecibo` — generación de ticket de pago imprimible
- Gráficos con **Recharts** en Reportes y Dashboard

### Stack

| Tecnología | Versión |
|---|---|
| React | 18 |
| Vite | 5 |
| Tailwind CSS | 3 |
| React Router | 6 |
| Recharts | 3 |

### Correr en desarrollo

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

---

## Backend

API REST con autenticación JWT, control de roles y acceso a MySQL vía SQLAlchemy.

### Autenticación

- `POST /auth/login` — devuelve `access_token` (HS256, 30 min) + `refresh_token` (7 días)
- `POST /auth/refresh` — renueva ambos tokens con el refresh token
- `GET /auth/me` — datos del usuario autenticado
- Contraseñas hasheadas con **bcrypt** (passlib)
- Tres roles: `admin`, `recepcion`, `empleada`

### Modelos de base de datos

| Tabla | Descripción |
|---|---|
| `usuarios` | Cuentas del sistema con rol y email único |
| `empleadas` | Perfil de empleada, vinculado a usuario, con `comision_porcentaje` |
| `clientes` | Clientes del centro |
| `servicios` | Catálogo de servicios con precio |
| `citas` | Turnos (estados: `pendiente → confirmada → en_curso → completada / cancelada`) |
| `cita_servicios` | Servicios asociados a una cita con precio aplicado |
| `cita_observaciones` | Fotos y notas `antes`/`después` del servicio (LONGTEXT base64) |
| `pagos` | Pago de una cita o walk-in, con método, propina y comisión calculada |
| `pago_servicios` | Detalle de servicios cobrados en el pago |
| `pago_productos` | Productos vendidos en el pago con cantidad |
| `gastos` | Gastos operativos categorizados |
| `productos` | Inventario de productos |
| `promociones` | Promociones activas del centro |

### Endpoints destacados

```
GET  /citas/mis-citas              # citas propias de la empleada logueada (filtro por fecha)
POST /citas/{id}/iniciar           # cambia estado a en_curso, guarda fotos "antes"
POST /citas/{id}/finalizar         # cambia estado a completada, guarda fotos "después"

POST /finanzas/pagos               # registrar pago (cita o walk-in)
GET  /finanzas/pagos               # listar pagos con filtro por fecha
GET  /finanzas/dashboard           # métricas del día: citas, ingresos, gastos, balance
GET  /finanzas/reportes            # reporte por período: desglose por día, empleada y categoría de gasto
GET  /finanzas/corte-caja          # totales del día agrupados por método de pago
GET  /finanzas/citas-sin-pago      # citas completadas sin pago registrado

GET  /docs                         # Swagger UI
GET  /redoc                        # ReDoc
GET  /health                       # health check
```

### Stack

| Tecnología | Uso |
|---|---|
| FastAPI | Framework web |
| SQLAlchemy 2 | ORM |
| Alembic | Migraciones |
| MySQL + PyMySQL | Base de datos |
| python-jose | JWT |
| passlib[bcrypt] | Hash de contraseñas |
| pydantic-settings | Config desde `.env` |
| uvicorn | ASGI server |

### Configuración

Crear `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=pretty_faces

SECRET_KEY=cambia-esto-en-produccion
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Correr en desarrollo

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Crear base de datos en MySQL y correr migraciones
alembic upgrade head

# Seed inicial (usuarios, servicios, etc.)
python scripts/seed.py

# Levantar servidor
uvicorn app.main:app --reload  # http://localhost:8000
```

### Pool de conexiones

Configurado con `pool_size=10`, `max_overflow=20`, `pool_recycle=3600` y `pool_pre_ping=True`.

---

## Servicios ofrecidos

| Categoría | Servicios |
|---|---|
| Capilares | Cortes, tintes, balayage, mechas, alaciado, botox capilar |
| Faciales | Limpieza, anti-edad, rejuvenecimiento, dermaplaning, reafirmante |
| Depilación | Cera, vapor, full body, brasilian |
| Cejas | 4 Brow Packs (diseño, depilación, laminado, henna) |
| Lash Lifting | Con y sin henna, duración 2-3 meses |
| Otros | Retiro de verrugas, aclaración corporal |

## Horarios

| Día | Horario |
|---|---|
| Lunes a Viernes | 10:00 – 13:00 y 16:00 – 19:00 |
| Sábado | 10:00 – 16:00 |
| Domingo | Cerrado |
