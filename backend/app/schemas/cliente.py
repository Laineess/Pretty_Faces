from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class ClienteCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    notas: Optional[str] = None


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    notas: Optional[str] = None


class ClienteOut(BaseModel):
    id: int
    nombre: str
    telefono: Optional[str]
    email: Optional[str]
    notas: Optional[str]
    creado_en: datetime

    model_config = {"from_attributes": True}
