from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PromocionCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    vigencia: Optional[str] = None
    foto_data: str
    activa: bool = True
    orden: int = 0


class PromocionUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    vigencia: Optional[str] = None
    foto_data: Optional[str] = None
    activa: Optional[bool] = None
    orden: Optional[int] = None


class PromocionOut(BaseModel):
    id: int
    titulo: str
    descripcion: Optional[str]
    vigencia: Optional[str]
    foto_data: str
    activa: bool
    orden: int
    creado_en: datetime

    model_config = {"from_attributes": True}
