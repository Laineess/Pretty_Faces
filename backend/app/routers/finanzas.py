from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, select as sa_select
from datetime import datetime, date, timezone
from app.core.database import get_db
from app.core.security import get_current_user, require_admin, require_admin_or_recepcion
from app.models.finanzas import Pago, PagoServicio, PagoProducto, Gasto
from app.models.cita import Cita, CitaServicio
from app.models.cliente import Cliente
from app.models.empleada import Empleada
from app.models.servicio import Servicio
from app.models.producto import Producto
from app.schemas.finanzas import (
    PagoCreate, PagoOut, _LineaDetalle,
    GastoCreate, GastoOut,
    DashboardOut,
)

router = APIRouter(prefix="/finanzas", tags=["finanzas"])


def _load_pago(pago_id: int, db: Session) -> Pago:
    return (
        db.query(Pago)
        .options(
            joinedload(Pago.cita).joinedload(Cita.cliente),
            joinedload(Pago.cita).joinedload(Cita.empleada),
            joinedload(Pago.cliente),
            joinedload(Pago.empleada),
            joinedload(Pago.servicios).joinedload(PagoServicio.servicio),
            joinedload(Pago.productos).joinedload(PagoProducto.producto),
        )
        .filter(Pago.id == pago_id)
        .first()
    )


def _serialize_pago(pago: Pago) -> dict:
    cliente = pago.cita.cliente if pago.cita else pago.cliente
    empleada = pago.cita.empleada if pago.cita else pago.empleada

    servicios_detalle = [
        _LineaDetalle(nombre=ps.servicio.nombre, precio=ps.precio_aplicado)
        for ps in pago.servicios if ps.servicio
    ]
    productos_detalle = [
        _LineaDetalle(nombre=pp.producto.nombre, precio=pp.precio_aplicado, cantidad=pp.cantidad)
        for pp in pago.productos if pp.producto
    ]

    return PagoOut(
        id=pago.id,
        cita_id=pago.cita_id,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        propina=pago.propina,
        comision_calculada=pago.comision_calculada,
        fecha=pago.fecha,
        notas=pago.notas,
        cliente_nombre=cliente.nombre if cliente else None,
        empleada_nombre=empleada.nombre if empleada else None,
        servicios_detalle=servicios_detalle,
        productos_detalle=productos_detalle,
    )


# ── Pagos ─────────────────────────────────────────────────────────────────────

@router.post("/pagos", response_model=PagoOut, status_code=201)
def registrar_pago(
    data: PagoCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    if not data.cita_id and not data.cliente_id:
        raise HTTPException(status_code=400, detail="Debe indicar una cita o un cliente")

    cita = None
    empleada = None
    cliente = None

    if data.cita_id:
        cita = db.query(Cita).options(
            joinedload(Cita.cliente),
            joinedload(Cita.empleada),
            joinedload(Cita.servicios),
        ).filter(Cita.id == data.cita_id).first()
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        if cita.pago:
            raise HTTPException(status_code=400, detail="La cita ya tiene un pago registrado")
        empleada = cita.empleada
        cliente = cita.cliente
    else:
        cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        if data.empleada_id:
            empleada = db.query(Empleada).filter(Empleada.id == data.empleada_id).first()

    comision_pct = empleada.comision_porcentaje if empleada else 0
    comision = data.monto * (comision_pct / 100)

    pago = Pago(
        cita_id=data.cita_id,
        cliente_id=cliente.id if not data.cita_id else None,
        empleada_id=(empleada.id if empleada and not data.cita_id else None),
        monto=data.monto,
        metodo_pago=data.metodo_pago,
        propina=data.propina,
        notas=data.notas,
        comision_calculada=comision,
    )
    db.add(pago)
    db.flush()

    # Services: walk-in uses data.servicios, cita copies from cita_servicios
    if data.servicios:
        for s in data.servicios:
            db.add(PagoServicio(pago_id=pago.id, servicio_id=s.servicio_id, precio_aplicado=s.precio_aplicado))
    elif cita:
        for cs in cita.servicios:
            db.add(PagoServicio(pago_id=pago.id, servicio_id=cs.servicio_id, precio_aplicado=cs.precio_aplicado))

    # Products (optional for both paths)
    for p in data.productos:
        db.add(PagoProducto(
            pago_id=pago.id,
            producto_id=p.producto_id,
            cantidad=p.cantidad,
            precio_aplicado=p.precio_aplicado,
        ))

    if cita:
        cita.estado = "completada"

    db.commit()

    full_pago = _load_pago(pago.id, db)
    return _serialize_pago(full_pago)


@router.get("/pagos", response_model=list[PagoOut])
def listar_pagos(
    fecha_inicio: date = Query(None),
    fecha_fin: date = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_recepcion),
):
    q = db.query(Pago).options(
        joinedload(Pago.cita).joinedload(Cita.cliente),
        joinedload(Pago.cita).joinedload(Cita.empleada),
        joinedload(Pago.cliente),
        joinedload(Pago.empleada),
        joinedload(Pago.servicios).joinedload(PagoServicio.servicio),
        joinedload(Pago.productos).joinedload(PagoProducto.producto),
    )
    if fecha_inicio:
        q = q.filter(Pago.fecha >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        q = q.filter(Pago.fecha <= datetime.combine(fecha_fin, datetime.max.time()))
    pagos = q.order_by(Pago.fecha.desc()).all()
    return [_serialize_pago(p) for p in pagos]


# ── Gastos ───────────────────────────────────────────────────────────────────

@router.post("/gastos", response_model=GastoOut, status_code=201)
def registrar_gasto(
    data: GastoCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    gasto = Gasto(
        concepto=data.concepto,
        monto=data.monto,
        categoria=data.categoria,
        notas=data.notas,
        fecha=data.fecha or datetime.now(timezone.utc),
    )
    db.add(gasto)
    db.commit()
    db.refresh(gasto)
    return gasto


@router.get("/gastos", response_model=list[GastoOut])
def listar_gastos(
    fecha_inicio: date = Query(None),
    fecha_fin: date = Query(None),
    categoria: str = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(Gasto)
    if fecha_inicio:
        q = q.filter(Gasto.fecha >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        q = q.filter(Gasto.fecha <= datetime.combine(fecha_fin, datetime.max.time()))
    if categoria:
        q = q.filter(Gasto.categoria == categoria)
    return q.order_by(Gasto.fecha.desc()).all()


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    hoy = date.today()
    mes_inicio = hoy.replace(day=1)

    citas_hoy = db.query(func.count(Cita.id)).filter(
        func.date(Cita.fecha) == hoy
    ).scalar()

    citas_pendientes = db.query(func.count(Cita.id)).filter(
        Cita.estado.in_(["pendiente", "confirmada"]),
        func.date(Cita.fecha) == hoy,
    ).scalar()

    ingresos_hoy = db.query(func.coalesce(func.sum(Pago.monto + Pago.propina), 0)).filter(
        func.date(Pago.fecha) == hoy
    ).scalar()

    ingresos_mes = db.query(func.coalesce(func.sum(Pago.monto + Pago.propina), 0)).filter(
        Pago.fecha >= datetime.combine(mes_inicio, datetime.min.time())
    ).scalar()

    gastos_mes = db.query(func.coalesce(func.sum(Gasto.monto), 0)).filter(
        Gasto.fecha >= datetime.combine(mes_inicio, datetime.min.time())
    ).scalar()

    return DashboardOut(
        citas_hoy=citas_hoy,
        citas_pendientes=citas_pendientes,
        ingresos_hoy=float(ingresos_hoy),
        ingresos_mes=float(ingresos_mes),
        gastos_mes=float(gastos_mes),
        balance_mes=float(ingresos_mes) - float(gastos_mes),
    )


@router.get("/reportes")
def reporte_periodo(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    fi = datetime.combine(fecha_inicio, datetime.min.time())
    ff = datetime.combine(fecha_fin, datetime.max.time())

    pagos = db.query(Pago).filter(Pago.fecha >= fi, Pago.fecha <= ff).all()
    gastos = db.query(Gasto).filter(Gasto.fecha >= fi, Gasto.fecha <= ff).all()

    dias: dict = {}
    for p in pagos:
        k = p.fecha.date().isoformat()
        dias[k] = dias.get(k, 0) + p.monto + p.propina

    emp_result = db.execute(
        sa_select(
            Empleada.nombre,
            func.sum(Pago.monto + Pago.propina).label("total"),
        )
        .join(Cita, Cita.id == Pago.cita_id)
        .join(Empleada, Empleada.id == Cita.empleada_id)
        .where(Pago.cita_id != None, Pago.fecha >= fi, Pago.fecha <= ff)
        .group_by(Empleada.id, Empleada.nombre)
    ).all()

    cat_map: dict = {}
    for g in gastos:
        cat_map[g.categoria] = cat_map.get(g.categoria, 0) + g.monto

    total_ingresos = sum(p.monto + p.propina for p in pagos)
    total_gastos = sum(g.monto for g in gastos)

    return {
        "total_ingresos": total_ingresos,
        "total_gastos": total_gastos,
        "balance": total_ingresos - total_gastos,
        "num_pagos": len(pagos),
        "ingresos_por_dia": sorted(
            [{"fecha": k, "total": round(v, 2)} for k, v in dias.items()],
            key=lambda x: x["fecha"],
        ),
        "por_empleada": [
            {"empleada": r.nombre, "total": round(float(r.total), 2)}
            for r in emp_result
        ],
        "gastos_por_categoria": [
            {"categoria": k, "total": round(v, 2)} for k, v in cat_map.items()
        ],
    }


@router.get("/corte-caja")
def corte_caja(
    fecha: date = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_recepcion),
):
    target = fecha or date.today()
    fi = datetime.combine(target, datetime.min.time())
    ff = datetime.combine(target, datetime.max.time())

    pagos = db.query(Pago).filter(Pago.fecha >= fi, Pago.fecha <= ff).all()

    por_metodo: dict = {}
    total = 0.0
    total_propinas = 0.0
    for p in pagos:
        por_metodo[p.metodo_pago] = por_metodo.get(p.metodo_pago, 0.0) + p.monto + p.propina
        total += p.monto + p.propina
        total_propinas += p.propina

    return {
        "fecha": target.isoformat(),
        "total": round(total, 2),
        "total_propinas": round(total_propinas, 2),
        "num_pagos": len(pagos),
        "por_metodo": [{"metodo": k, "total": round(v, 2)} for k, v in por_metodo.items()],
    }


@router.get("/citas-sin-pago")
def citas_sin_pago(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload as jl
    citas = (
        db.query(Cita)
        .options(jl(Cita.cliente), jl(Cita.empleada), jl(Cita.servicios))
        .filter(
            Cita.estado.in_(["completada", "en_curso"]),
            ~Cita.pago.has(),
        )
        .order_by(Cita.fecha.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": c.id,
            "cliente": c.cliente.nombre,
            "cliente_id": c.cliente_id,
            "empleada": c.empleada.nombre,
            "empleada_id": c.empleada_id,
            "fecha": c.fecha,
            "total_servicios": sum(s.precio_aplicado for s in c.servicios),
        }
        for c in citas
    ]
