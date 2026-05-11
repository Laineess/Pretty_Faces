from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.models.promocion import Promocion
from app.schemas.promocion import PromocionCreate, PromocionUpdate, PromocionOut

router = APIRouter(prefix="/promociones", tags=["promociones"])


@router.get("", response_model=list[PromocionOut])
def listar_promociones(
    solo_activas: bool = True,
    db: Session = Depends(get_db),
):
    q = db.query(Promocion)
    if solo_activas:
        q = q.filter(Promocion.activa == True)
    return q.order_by(Promocion.orden, Promocion.creado_en).all()


@router.post("", response_model=PromocionOut, status_code=201)
def crear_promocion(
    data: PromocionCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    promo = Promocion(**data.model_dump())
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.patch("/{promo_id}", response_model=PromocionOut)
def actualizar_promocion(
    promo_id: int,
    data: PromocionUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    promo = db.query(Promocion).filter(Promocion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(promo, field, value)
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/{promo_id}", status_code=204)
def eliminar_promocion(
    promo_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    promo = db.query(Promocion).filter(Promocion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    db.delete(promo)
    db.commit()
