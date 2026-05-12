from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class ClienteLealtad(Base):
    __tablename__ = "cliente_lealtad"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"), nullable=False)
    visitas_en_ciclo = Column(Integer, default=0, nullable=False)
    ultima_visita = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("cliente_id", "servicio_id", name="uq_cliente_servicio_lealtad"),
    )

    cliente = relationship("Cliente", back_populates="lealtad")
    servicio = relationship("Servicio", back_populates="lealtad")
