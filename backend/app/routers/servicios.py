from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.servicio import Servicio

router = APIRouter(prefix="/servicios", tags=["servicios"])


@router.get("")
def listar_servicios(
    categoria: str = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Servicio).filter(Servicio.activo == True)
    if categoria:
        q = q.filter(Servicio.categoria == categoria)
    return [
        {
            "id": s.id,
            "nombre": s.nombre,
            "precio_base": s.precio_base,
            "duracion_min": s.duracion_min,
            "categoria": s.categoria,
        }
        for s in q.order_by(Servicio.categoria, Servicio.nombre).all()
    ]
