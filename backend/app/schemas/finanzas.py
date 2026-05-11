from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


# ── Nested helpers ─────────────────────────────────────────────────────────────

class _InfoBase(BaseModel):
    id: int
    nombre: str
    model_config = {"from_attributes": True}

class _CitaInfo(BaseModel):
    id: int
    cliente: Optional[_InfoBase]
    empleada: Optional[_InfoBase]
    model_config = {"from_attributes": True}

class _LineaDetalle(BaseModel):
    nombre: str
    precio: float
    cantidad: int = 1


# ── Pagos ─────────────────────────────────────────────────────────────────────

class PagoServicioCreate(BaseModel):
    servicio_id: int
    precio_aplicado: float


class PagoProductoCreate(BaseModel):
    producto_id: int
    cantidad: int = 1
    precio_aplicado: float


class PagoCreate(BaseModel):
    # Con cita
    cita_id: Optional[int] = None
    # Walk-in (sin cita previa)
    cliente_id: Optional[int] = None
    empleada_id: Optional[int] = None
    servicios: list[PagoServicioCreate] = []
    productos: list[PagoProductoCreate] = []
    # Siempre requerido
    monto: float
    metodo_pago: Literal["efectivo", "tarjeta", "transferencia", "otro"] = "efectivo"
    propina: float = 0.0
    notas: Optional[str] = None


class PagoOut(BaseModel):
    id: int
    cita_id: Optional[int]
    monto: float
    metodo_pago: str
    propina: float
    comision_calculada: float
    fecha: datetime
    notas: Optional[str]
    # Para recibo/ticket
    cliente_nombre: Optional[str] = None
    empleada_nombre: Optional[str] = None
    servicios_detalle: list[_LineaDetalle] = []
    productos_detalle: list[_LineaDetalle] = []

    model_config = {"from_attributes": False}


# ── Gastos ────────────────────────────────────────────────────────────────────

class GastoCreate(BaseModel):
    concepto: str
    monto: float
    categoria: Literal["productos", "equipos", "renta", "servicios", "nomina", "marketing", "limpieza", "otro"] = "otro"
    fecha: Optional[datetime] = None
    notas: Optional[str] = None


class GastoOut(BaseModel):
    id: int
    concepto: str
    categoria: str
    monto: float
    notas: Optional[str]
    fecha: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class ReporteIngresosOut(BaseModel):
    total_ingresos: float
    total_propinas: float
    total_comisiones: float
    num_pagos: int
    por_metodo: dict[str, float]
    por_dia: list[dict]


class ReporteGastosOut(BaseModel):
    total_gastos: float
    por_categoria: dict[str, float]
    por_dia: list[dict]


class DashboardOut(BaseModel):
    citas_hoy: int
    citas_pendientes: int
    ingresos_hoy: float
    ingresos_mes: float
    gastos_mes: float
    balance_mes: float
