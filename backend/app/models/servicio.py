from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio_base = Column(Float, nullable=False)
    duracion_min = Column(Integer, default=60)
    categoria = Column(
        Enum("capilar", "facial", "depilacion", "cejas", "lash", "corporal", "otro"),
        nullable=False,
    )
    activo = Column(Boolean, default=True)

    cita_servicios = relationship("CitaServicio", back_populates="servicio")
