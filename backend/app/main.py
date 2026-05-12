from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, clientes, empleadas, citas, finanzas, servicios, productos, promociones, lealtad

app = FastAPI(
    title="Pretty Face's Beauty Center — API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(empleadas.router)
app.include_router(citas.router)
app.include_router(finanzas.router)
app.include_router(servicios.router)
app.include_router(productos.router)
app.include_router(promociones.router)
app.include_router(lealtad.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "Pretty Face's API"}
