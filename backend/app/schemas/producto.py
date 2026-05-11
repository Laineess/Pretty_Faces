from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProductoCreate(BaseModel):
    nombre: str
    precio: float
    categoria: Optional[str] = None
    foto_data: Optional[str] = None


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None
    activo: Optional[bool] = None
    foto_data: Optional[str] = None


class ProductoOut(BaseModel):
    id: int
    nombre: str
    precio: float
    categoria: Optional[str]
    activo: bool
    foto_data: Optional[str] = None
    creado_en: datetime

    model_config = {"from_attributes": True}
