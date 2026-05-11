# Pretty Face's Beauty Center

Sistema web para **Pretty Face's Beauty Center** — centro de estética especializado en salud capilar, cuidado de la piel y mejoramiento estético.

📸 Instagram: [@PrettyFacesBeautyCenter](https://instagram.com/PrettyFacesBeautyCenter)

---

## Estructura del proyecto

```
pretty faces/
├── frontend/          # Landing page (Vite + React + Tailwind CSS)
└── backend/           # API REST (FastAPI — en desarrollo)
```

---

## Frontend

Landing page con las secciones:

- **Navbar** — navegación con links a secciones
- **Hero** — portada principal
- **Nosotros** — información del centro
- **Servicios** — catálogo de servicios
- **Galería** — fotos del lugar y trabajos
- **Precios** — tabla de precios por categoría
- **Horarios** — días y horarios de atención
- **Contacto** — WhatsApp y redes sociales
- **Footer**

### Tecnologías

| Tecnología | Versión |
|---|---|
| React | 18 |
| Vite | 5 |
| Tailwind CSS | 3 |
| Recharts | 3 |

### Instalación y desarrollo

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # genera dist/
npm run preview    # previsualiza el build
```

---

## Backend

API REST con FastAPI (Python) — **en desarrollo**.

Funcionalidades planificadas:
- Sistema de turnos / citas online
- Panel de administración
- Gestión de servicios y precios

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

---

## Horarios

| Día | Horario |
|---|---|
| Lunes a Viernes | 10:00 – 13:00 y 16:00 – 19:00 |
| Sábado | 10:00 – 16:00 |
| Domingo | Cerrado |
