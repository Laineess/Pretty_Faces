from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.dialects.mysql import LONGTEXT
from datetime import datetime, timezone
from app.core.database import Base


class Promocion(Base):
    __tablename__ = "promociones"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    vigencia = Column(String(150), nullable=True)
    foto_data = Column(LONGTEXT, nullable=False)
    activa = Column(Boolean, default=True, nullable=False)
    orden = Column(Integer, default=0, nullable=False)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))
