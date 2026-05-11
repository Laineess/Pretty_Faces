from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.cliente import Cliente
from app.models.cita import Cita
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteOut

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteOut])
def listar_clientes(
    busqueda: str = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Cliente)
    if busqueda:
        q = q.filter(
            Cliente.nombre.ilike(f"%{busqueda}%") |
            Cliente.telefono.ilike(f"%{busqueda}%")
        )
    return q.order_by(Cliente.nombre).offset(skip).limit(limit).all()


@router.post("", response_model=ClienteOut, status_code=201)
def crear_cliente(
    data: ClienteCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cliente = Cliente(**data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.patch("/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(
    cliente_id: int,
    data: ClienteUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    from app.models.finanzas import Pago
    citas = db.query(Cita).filter(Cita.cliente_id == cliente_id).all()
    for cita in citas:
        if cita.pago:
            cita.pago.cita_id = None
        db.delete(cita)
    db.query(Pago).filter(Pago.cliente_id == cliente_id).update({"cliente_id": None})
    db.flush()
    db.delete(cliente)
    db.commit()
    return None
