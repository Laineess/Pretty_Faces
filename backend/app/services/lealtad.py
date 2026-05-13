from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.lealtad import ClienteLealtad
from app.models.servicio import Servicio

# Ciclo: 1-4 normal, 5=15%, 6 normal, 7=20%, 8-9 normal, 10=30%, luego reset a 1
DESCUENTOS_CICLO = {5: 0.15, 7: 0.20, 10: 0.30}
CICLO_MAX = 10

# Expiry por categoría (días) — mín 90 (3 meses), máx 270 (9 meses)
EXPIRY_POR_CATEGORIA = {
    "depilacion": 90,
    "cejas": 90,
    "lash": 90,
    "facial": 120,
    "corporal": 180,
    "capilar": 270,
    "otro": 90,
}


def descuento_para_visita(n: int) -> float:
    return DESCUENTOS_CICLO.get(n, 0.0)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_tz(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def obtener_estado_lealtad(db: Session, cliente_id: int, servicio_id: int) -> dict | None:
    """Estado actual de lealtad sin modificar. Usado antes de cobrar para mostrar descuento."""
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        return None

    lealtad = db.query(ClienteLealtad).filter(
        ClienteLealtad.cliente_id == cliente_id,
        ClienteLealtad.servicio_id == servicio_id,
    ).first()

    now = _now_utc()

    if not lealtad or not lealtad.ultima_visita:
        visitas = 0
        dias_restantes = None
    else:
        expiry = _ensure_tz(lealtad.ultima_visita) + timedelta(days=servicio.loyalty_expiry_dias)
        if now > expiry:
            visitas = 0
            dias_restantes = 0
        else:
            visitas = lealtad.visitas_en_ciclo
            dias_restantes = (expiry - now).days

    # Qué visita sería la próxima
    next_n = 1 if visitas >= CICLO_MAX else visitas + 1
    descuento_siguiente = descuento_para_visita(next_n)

    # Próximo hito (5, 7 o 10)
    if visitas < 5:
        proximo_hito = 5
        visitas_para_hito = 5 - visitas
    elif visitas < 7:
        proximo_hito = 7
        visitas_para_hito = 7 - visitas
    elif visitas < 10:
        proximo_hito = 10
        visitas_para_hito = 10 - visitas
    else:
        proximo_hito = 5  # nuevo ciclo
        visitas_para_hito = 4  # necesita 4 visitas para llegar al hito 5

    return {
        "servicio_id": servicio_id,
        "servicio_nombre": servicio.nombre,
        "visitas_en_ciclo": visitas,
        "visita_siguiente_numero": next_n,
        "descuento_siguiente_visita": descuento_siguiente,
        "dias_para_expirar": dias_restantes,
        "expiry_dias": servicio.loyalty_expiry_dias,
        "proximo_hito": proximo_hito,
        "visitas_para_hito": visitas_para_hito,
    }


def registrar_visita(db: Session, cliente_id: int, servicio_id: int) -> tuple[int, float, datetime | None]:
    """
    Incrementa el contador de visitas para cliente+servicio.
    Retorna (visita_numero, descuento_aplicado, fecha_expiry_siguiente).
    Llama a db.add() si es nueva fila — el caller debe hacer commit.
    """
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        return 0, 0.0, None

    now = _now_utc()

    lealtad = db.query(ClienteLealtad).filter(
        ClienteLealtad.cliente_id == cliente_id,
        ClienteLealtad.servicio_id == servicio_id,
    ).first()

    if not lealtad:
        lealtad = ClienteLealtad(
            cliente_id=cliente_id,
            servicio_id=servicio_id,
            visitas_en_ciclo=0,
        )
        db.add(lealtad)

    # Verificar caducidad
    if lealtad.ultima_visita:
        ultima = _ensure_tz(lealtad.ultima_visita)
        expiry = ultima + timedelta(days=servicio.loyalty_expiry_dias)
        if now > expiry:
            lealtad.visitas_en_ciclo = 0  # caducó, resetea

    # Incrementar con reset de ciclo en 10
    prev = lealtad.visitas_en_ciclo
    new_count = 1 if prev >= CICLO_MAX else prev + 1
    lealtad.visitas_en_ciclo = new_count
    lealtad.ultima_visita = now

    next_expiry = now + timedelta(days=servicio.loyalty_expiry_dias)
    descuento = descuento_para_visita(new_count)

    return new_count, descuento, next_expiry
