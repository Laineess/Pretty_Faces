from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lealtad import ClienteLealtad
from app.models.servicio import Servicio
from app.services.lealtad import obtener_estado_lealtad
from app.schemas.lealtad import LealtadServicioOut

router = APIRouter(prefix="/lealtad", tags=["lealtad"])


@router.get("/cliente/{cliente_id}", response_model=list[LealtadServicioOut])
def estado_lealtad_cliente(
    cliente_id: int,
    servicios: str = Query(
        default=None,
        description="IDs de servicios separados por coma. Sin filtro: retorna todos los servicios con historial.",
    ),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Estado de lealtad del cliente por servicio.
    - Sin `servicios`: retorna todos los servicios que el cliente ha visitado alguna vez.
    - Con `servicios=1,2,3`: retorna estado para esos servicios específicos
      (útil al armar un pago para ver descuentos aplicables).
    """
    if servicios:
        servicio_ids = [int(s.strip()) for s in servicios.split(",") if s.strip().isdigit()]
    else:
        # Todos los servicios con historial para este cliente
        rows = db.query(ClienteLealtad.servicio_id).filter(
            ClienteLealtad.cliente_id == cliente_id
        ).all()
        servicio_ids = [r.servicio_id for r in rows]

    resultado = []
    for sid in servicio_ids:
        estado = obtener_estado_lealtad(db, cliente_id, sid)
        if estado:
            resultado.append(LealtadServicioOut(**estado))

    return resultado
