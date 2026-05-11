from sqlalchemy import Column, Integer, Float, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    # Nullable: either linked to a cita OR walk-in with cliente/empleada direct
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    empleada_id = Column(Integer, ForeignKey("empleadas.id"), nullable=True)

    monto = Column(Float, nullable=False)
    metodo_pago = Column(
        Enum("efectivo", "tarjeta", "transferencia", "otro"),
        nullable=False,
        default="efectivo",
    )
    propina = Column(Float, default=0.0)
    comision_calculada = Column(Float, default=0.0)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    notas = Column(Text, nullable=True)

    cita = relationship("Cita", back_populates="pago")
    cliente = relationship("Cliente", foreign_keys=[cliente_id])
    empleada = relationship("Empleada", foreign_keys=[empleada_id])
    servicios = relationship("PagoServicio", back_populates="pago", cascade="all, delete-orphan")
    productos = relationship("PagoProducto", back_populates="pago", cascade="all, delete-orphan")


class PagoServicio(Base):
    __tablename__ = "pago_servicios"

    id = Column(Integer, primary_key=True, index=True)
    pago_id = Column(Integer, ForeignKey("pagos.id"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)
    precio_aplicado = Column(Float, nullable=False)

    pago = relationship("Pago", back_populates="servicios")
    servicio = relationship("Servicio")


class PagoProducto(Base):
    __tablename__ = "pago_productos"

    id = Column(Integer, primary_key=True, index=True)
    pago_id = Column(Integer, ForeignKey("pagos.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, default=1, nullable=False)
    precio_aplicado = Column(Float, nullable=False)

    pago = relationship("Pago", back_populates="productos")
    producto = relationship("Producto", back_populates="pago_productos")


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(
        Enum("productos", "equipos", "renta", "servicios", "nomina", "marketing", "limpieza", "otro"),
        nullable=False,
    )
    concepto = Column(String(255), nullable=False)
    monto = Column(Float, nullable=False)
    notas = Column(Text, nullable=True)
    empleada_id = Column(Integer, ForeignKey("empleadas.id"), nullable=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    empleada = relationship("Empleada", back_populates="gastos")
