from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal, List
from app.schemas.cliente import ClienteOut
from app.schemas.empleada import EmpleadaOut


class ObservacionCreate(BaseModel):
    orden: int
    foto_data: Optional[str] = None
    observacion: Optional[str] = None


class ObservacionesRequest(BaseModel):
    observaciones: List[ObservacionCreate] = []


class ObservacionOut(BaseModel):
    id: int
    tipo: str
    orden: int
    foto_data: Optional[str]
    observacion: Optional[str]

    model_config = {"from_attributes": True}


class CitaServicioCreate(BaseModel):
    servicio_id: int
    precio_aplicado: float


class CitaCreate(BaseModel):
    cliente_id: int
    empleada_id: int
    fecha: datetime
    hora_fin: Optional[datetime] = None
    servicios: list[CitaServicioCreate]
    notas: Optional[str] = None


class CitaUpdate(BaseModel):
    empleada_id: Optional[int] = None
    fecha: Optional[datetime] = None
    hora_fin: Optional[datetime] = None
    notas: Optional[str] = None


class CitaEstadoUpdate(BaseModel):
    estado: Literal["pendiente", "confirmada", "en_curso", "completada", "cancelada"]


class _ServicioInfo(BaseModel):
    id: int
    nombre: str
    model_config = {"from_attributes": True}


class CitaServicioOut(BaseModel):
    id: int
    servicio_id: int
    precio_aplicado: float
    servicio: Optional[_ServicioInfo] = None

    model_config = {"from_attributes": True}


class CitaOut(BaseModel):
    id: int
    cliente: ClienteOut
    empleada: EmpleadaOut
    fecha: datetime
    hora_fin: Optional[datetime]
    estado: str
    notas: Optional[str]
    servicios: list[CitaServicioOut]
    observaciones: list[ObservacionOut] = []
    creado_en: datetime

    model_config = {"from_attributes": True}


class CitaListOut(BaseModel):
    id: int
    cliente_nombre: str
    empleada_nombre: str
    fecha: datetime
    estado: str
    total: float

    model_config = {"from_attributes": True}
