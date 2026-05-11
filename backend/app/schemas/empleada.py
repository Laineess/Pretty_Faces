from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EmpleadaCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    comision_porcentaje: float = 0.0
    usuario_id: Optional[int] = None


class EmpleadaUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    comision_porcentaje: Optional[float] = None
    activa: Optional[bool] = None


class EmpleadaOut(BaseModel):
    id: int
    nombre: str
    telefono: Optional[str]
    comision_porcentaje: float
    activa: bool
    usuario_id: Optional[int] = None
    creado_en: datetime

    model_config = {"from_attributes": True}
