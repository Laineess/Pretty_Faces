from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user, require_admin, hash_password
from app.models.empleada import Empleada
from app.models.usuario import Usuario
from app.models.cita import Cita
from app.schemas.empleada import EmpleadaCreate, EmpleadaUpdate, EmpleadaOut


class CuentaEmpleadaRequest(BaseModel):
    email: str
    password: str
    rol: str = "empleada"

router = APIRouter(prefix="/empleadas", tags=["empleadas"])


@router.get("", response_model=list[EmpleadaOut])
def listar_empleadas(
    solo_activas: bool = True,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Empleada)
    if solo_activas:
        q = q.filter(Empleada.activa == True)
    return q.order_by(Empleada.nombre).all()


@router.post("", response_model=EmpleadaOut, status_code=201)
def crear_empleada(
    data: EmpleadaCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    empleada = Empleada(**data.model_dump())
    db.add(empleada)
    db.commit()
    db.refresh(empleada)
    return empleada


@router.patch("/{empleada_id}", response_model=EmpleadaOut)
def actualizar_empleada(
    empleada_id: int,
    data: EmpleadaUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    empleada = db.query(Empleada).filter(Empleada.id == empleada_id).first()
    if not empleada:
        raise HTTPException(status_code=404, detail="Empleada no encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(empleada, field, value)

    db.commit()
    db.refresh(empleada)
    return empleada


@router.post("/{empleada_id}/crear-cuenta", response_model=EmpleadaOut)
def crear_cuenta_empleada(
    empleada_id: int,
    data: CuentaEmpleadaRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    empleada = db.query(Empleada).filter(Empleada.id == empleada_id).first()
    if not empleada:
        raise HTTPException(status_code=404, detail="Empleada no encontrada")
    if empleada.usuario_id:
        raise HTTPException(status_code=400, detail="Esta empleada ya tiene cuenta")

    if data.rol not in ("admin", "recepcion", "empleada"):
        raise HTTPException(status_code=400, detail="Rol inválido")

    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está en uso")

    usuario = Usuario(
        nombre=empleada.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    db.add(usuario)
    db.flush()
    empleada.usuario_id = usuario.id
    db.commit()
    db.refresh(empleada)
    return empleada


@router.delete("/{empleada_id}", status_code=204)
def eliminar_empleada(
    empleada_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    empleada = db.query(Empleada).filter(Empleada.id == empleada_id).first()
    if not empleada:
        raise HTTPException(status_code=404, detail="Empleada no encontrada")

    # Nullify pagos/gastos FKs before deleting citas
    from app.models.finanzas import Pago, Gasto
    citas = db.query(Cita).filter(Cita.empleada_id == empleada_id).all()
    for cita in citas:
        if cita.pago:
            cita.pago.cita_id = None
        db.delete(cita)
    db.query(Pago).filter(Pago.empleada_id == empleada_id).update({"empleada_id": None})
    db.query(Gasto).filter(Gasto.empleada_id == empleada_id).update({"empleada_id": None})
    db.flush()

    # Delete login account if exists
    if empleada.usuario_id:
        usuario = db.query(Usuario).filter(Usuario.id == empleada.usuario_id).first()
        empleada.usuario_id = None
        db.flush()
        if usuario:
            db.delete(usuario)
    db.flush()
    db.delete(empleada)
    db.commit()
    return None


@router.get("/{empleada_id}/agenda")
def agenda_empleada(
    empleada_id: int,
    fecha: date = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    target = fecha or date.today()
    citas = (
        db.query(Cita)
        .filter(
            Cita.empleada_id == empleada_id,
            Cita.fecha >= datetime.combine(target, datetime.min.time()),
            Cita.fecha < datetime.combine(target, datetime.max.time()),
        )
        .order_by(Cita.fecha)
        .all()
    )
    return [
        {
            "id": c.id,
            "cliente": c.cliente.nombre,
            "fecha": c.fecha,
            "hora_fin": c.hora_fin,
            "estado": c.estado,
        }
        for c in citas
    ]
