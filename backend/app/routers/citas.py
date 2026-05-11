from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.cita import Cita, CitaServicio, CitaObservacion
from app.models.empleada import Empleada
from app.models.servicio import Servicio  # noqa: F401 — needed for joinedload relationship
from app.schemas.cita import CitaCreate, CitaUpdate, CitaEstadoUpdate, CitaOut, ObservacionesRequest

router = APIRouter(prefix="/citas", tags=["citas"])


def _load_cita(db: Session, cita_id: int) -> Cita:
    cita = (
        db.query(Cita)
        .options(
            joinedload(Cita.cliente),
            joinedload(Cita.empleada),
            joinedload(Cita.servicios).joinedload(CitaServicio.servicio),
            joinedload(Cita.observaciones),
        )
        .filter(Cita.id == cita_id)
        .first()
    )
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return cita


@router.get("/mis-citas", response_model=list[CitaOut])
def mis_citas(
    fecha_inicio: date = Query(None),
    fecha_fin: date = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    empleada = db.query(Empleada).filter(Empleada.usuario_id == current_user.id).first()
    if not empleada:
        raise HTTPException(status_code=403, detail="No tienes un perfil de empleada asignado")

    q = (
        db.query(Cita)
        .options(
            joinedload(Cita.cliente),
            joinedload(Cita.empleada),
            joinedload(Cita.servicios).joinedload(CitaServicio.servicio),
            joinedload(Cita.observaciones),
        )
        .filter(Cita.empleada_id == empleada.id)
        .filter(Cita.estado.notin_(["cancelada"]))
    )
    if fecha_inicio:
        q = q.filter(Cita.fecha >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        q = q.filter(Cita.fecha <= datetime.combine(fecha_fin, datetime.max.time()))

    return q.order_by(Cita.fecha).all()


@router.post("/{cita_id}/iniciar", response_model=CitaOut)
def iniciar_cita(
    cita_id: int,
    data: ObservacionesRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if current_user.rol != "admin":
        empleada = db.query(Empleada).filter(Empleada.usuario_id == current_user.id).first()
        if not empleada or cita.empleada_id != empleada.id:
            raise HTTPException(status_code=403, detail="Sin permisos para esta cita")

    db.query(CitaObservacion).filter(
        CitaObservacion.cita_id == cita_id,
        CitaObservacion.tipo == "antes",
    ).delete()

    for obs in data.observaciones:
        db.add(CitaObservacion(
            cita_id=cita_id,
            tipo="antes",
            orden=obs.orden,
            foto_data=obs.foto_data,
            observacion=obs.observacion,
        ))

    cita.estado = "en_curso"
    db.commit()
    return _load_cita(db, cita_id)


@router.post("/{cita_id}/finalizar", response_model=CitaOut)
def finalizar_cita(
    cita_id: int,
    data: ObservacionesRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if current_user.rol != "admin":
        empleada = db.query(Empleada).filter(Empleada.usuario_id == current_user.id).first()
        if not empleada or cita.empleada_id != empleada.id:
            raise HTTPException(status_code=403, detail="Sin permisos para esta cita")

    db.query(CitaObservacion).filter(
        CitaObservacion.cita_id == cita_id,
        CitaObservacion.tipo == "despues",
    ).delete()

    for obs in data.observaciones:
        db.add(CitaObservacion(
            cita_id=cita_id,
            tipo="despues",
            orden=obs.orden,
            foto_data=obs.foto_data,
            observacion=obs.observacion,
        ))

    cita.estado = "completada"
    db.commit()
    return _load_cita(db, cita_id)


@router.get("", response_model=list[CitaOut])
def listar_citas(
    fecha_inicio: date = Query(None),
    fecha_fin: date = Query(None),
    empleada_id: int = Query(None),
    estado: str = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = (
        db.query(Cita)
        .options(
            joinedload(Cita.cliente),
            joinedload(Cita.empleada),
            joinedload(Cita.servicios).joinedload(CitaServicio.servicio),
            joinedload(Cita.observaciones),
        )
    )

    if fecha_inicio:
        q = q.filter(Cita.fecha >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        q = q.filter(Cita.fecha <= datetime.combine(fecha_fin, datetime.max.time()))
    if empleada_id:
        q = q.filter(Cita.empleada_id == empleada_id)
    if estado:
        q = q.filter(Cita.estado == estado)

    return q.order_by(Cita.fecha).all()


@router.post("", response_model=CitaOut, status_code=201)
def crear_cita(
    data: CitaCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cita = Cita(
        cliente_id=data.cliente_id,
        empleada_id=data.empleada_id,
        fecha=data.fecha,
        hora_fin=data.hora_fin,
        notas=data.notas,
    )
    db.add(cita)
    db.flush()

    for s in data.servicios:
        db.add(CitaServicio(
            cita_id=cita.id,
            servicio_id=s.servicio_id,
            precio_aplicado=s.precio_aplicado,
        ))

    db.commit()
    db.refresh(cita)
    return cita


@router.get("/{cita_id}", response_model=CitaOut)
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return _load_cita(db, cita_id)


@router.patch("/{cita_id}/estado", response_model=CitaOut)
def cambiar_estado(
    cita_id: int,
    data: CitaEstadoUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    cita.estado = data.estado
    db.commit()
    db.refresh(cita)
    return cita


@router.delete("/{cita_id}", status_code=204)
def cancelar_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    cita.estado = "cancelada"
    db.commit()
