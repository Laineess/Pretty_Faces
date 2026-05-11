from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Empleada(Base):
    __tablename__ = "empleadas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)
    comision_porcentaje = Column(Float, default=0.0)
    activa = Column(Boolean, default=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, unique=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    usuario = relationship("Usuario", back_populates="empleada")
    citas = relationship("Cita", back_populates="empleada")
    gastos = relationship("Gasto", back_populates="empleada")
