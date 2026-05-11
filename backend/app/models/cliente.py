from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(150), nullable=True)
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    citas = relationship("Cita", back_populates="cliente")
