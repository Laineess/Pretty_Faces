from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    precio = Column(Float, nullable=False)
    categoria = Column(String(100), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    foto_data = Column(LONGTEXT, nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pago_productos = relationship("PagoProducto", back_populates="producto")
