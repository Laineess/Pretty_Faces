from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import LONGTEXT
from datetime import datetime, timezone
from app.core.database import Base


class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    empleada_id = Column(Integer, ForeignKey("empleadas.id"), nullable=False)
    fecha = Column(DateTime, nullable=False, index=True)
    hora_fin = Column(DateTime, nullable=True)
    estado = Column(
        Enum("pendiente", "confirmada", "en_curso", "completada", "cancelada"),
        default="pendiente",
        nullable=False,
    )
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cliente = relationship("Cliente", back_populates="citas")
    empleada = relationship("Empleada", back_populates="citas")
    servicios = relationship("CitaServicio", back_populates="cita", cascade="all, delete-orphan")
    observaciones = relationship("CitaObservacion", back_populates="cita", cascade="all, delete-orphan", order_by="CitaObservacion.tipo, CitaObservacion.orden")
    pago = relationship("Pago", back_populates="cita", uselist=False)


class CitaServicio(Base):
    __tablename__ = "cita_servicios"

    id = Column(Integer, primary_key=True, index=True)
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)
    precio_aplicado = Column(Float, nullable=False)

    cita = relationship("Cita", back_populates="servicios")
    servicio = relationship("Servicio", back_populates="cita_servicios")


class CitaObservacion(Base):
    __tablename__ = "cita_observaciones"

    id = Column(Integer, primary_key=True, index=True)
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=False)
    tipo = Column(Enum("antes", "despues"), nullable=False)
    orden = Column(Integer, nullable=False)
    foto_data = Column(LONGTEXT, nullable=True)
    observacion = Column(Text, nullable=True)

    cita = relationship("Cita", back_populates="observaciones")
