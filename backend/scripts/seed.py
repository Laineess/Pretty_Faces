"""
Ejecutar: python -m scripts.seed [--reset]

Crea DB, tablas y datos de prueba completos:
usuarios, empleadas, clientes, servicios, citas, pagos, lealtad, gastos, productos.
"""
import sys
import os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pymysql
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine
from app.core.security import hash_password
from app.models import *  # noqa — registra todos los modelos

# ── Constantes ────────────────────────────────────────────────────────────────

ADMIN_EMAIL    = "admin@prettyfaces.com"
ADMIN_PASSWORD = "PrettyAdmin2024!"

USUARIOS_SEED = [
    # (nombre, email, password, rol)
    ("Administrador",       "admin@prettyfaces.com",      "PrettyAdmin2024!",  "admin"),
    ("Recepción",           "recepcion@prettyfaces.com",  "PrettyRecep2024!",  "recepcion"),
    ("Sofía García",        "sofia@prettyfaces.com",      "PrettySofia2024!",  "empleada"),
    ("Valentina Torres",    "valentina@prettyfaces.com",  "PrettyVale2024!",   "empleada"),
    ("Mónica Ruiz",         "monica@prettyfaces.com",     "PrettyMoni2024!",   "empleada"),
]

EMPLEADAS_SEED = [
    # (usuario_email, nombre, telefono, comision_pct)
    ("sofia@prettyfaces.com",     "Sofía García",     "5511223344", 20.0),
    ("valentina@prettyfaces.com", "Valentina Torres", "5522334455", 15.0),
    ("monica@prettyfaces.com",    "Mónica Ruiz",      "5533445566", 15.0),
]

CLIENTES_SEED = [
    # (nombre, telefono, email, notas)
    ("María López",       "5500000001", "maria.lopez@gmail.com",     None),
    ("Ana Martínez",      "5500000002", "ana.martinez@gmail.com",    None),
    ("Claudia Hernández", "5500000003", None,                        "Sensible a la cera fría"),
    ("Jessica Ramírez",   "5500000004", "jessica.r@gmail.com",       None),
    ("Sofía Valdez",      "5500000005", "sofia.valdez@hotmail.com",  "Alérgica a la henna"),
    ("Carmen Flores",     "5500000006", "carmen.flores@gmail.com",   None),
    ("Paola Jiménez",     "5500000007", "paola.j@gmail.com",         None),
    ("Laura Morales",     "5500000008", None,                        None),
    ("Diana Vargas",      "5500000009", "diana.vargas@gmail.com",    None),
    ("Gabriela Reyes",    "5500000010", "gaby.reyes@gmail.com",      None),
]

SERVICIOS_SEED = [
    # (nombre, precio_base, duracion_min, categoria)
    ("Corte Mujer",                          180,   45, "capilar"),
    ("Corte Niños",                          150,   30, "capilar"),
    ("Corte Hombre",                         150,   30, "capilar"),
    ("Fade",                                  50,   20, "capilar"),
    ("Tinte Aplicación Completa",            450,  120, "capilar"),
    ("Retoque de Tinte en Raíz",             250,   60, "capilar"),
    ("Mechas / Babylights / Luces",         1600,  180, "capilar"),
    ("Balayage",                            2000,  180, "capilar"),
    ("Alaciado Express",                     550,   90, "capilar"),
    ("Botox Capilar",                       1500,  120, "capilar"),
    ("Alaciado Permanente",                 1500,  180, "capilar"),
    ("Mascarilla Hidratante",                500,   45, "capilar"),
    ("Mascarilla Reestructurante",           750,   60, "capilar"),
    ("Peinado",                              850,   60, "capilar"),
    ("Facial Limpieza Profunda",             500,   60, "facial"),
    ("Facial Anti-Acné",                     800,   60, "facial"),
    ("Facial Anti-Cicatrices",              1000,   75, "facial"),
    ("Facial Despigmentante / Peeling",     1300,   75, "facial"),
    ("Facial Anti-Edad",                    1350,   75, "facial"),
    ("Facial Rejuvenecimiento",             1700,   90, "facial"),
    ("+ Sérum Activo",                       350,    0, "facial"),
    ("Depilación Axilas",                    300,   20, "depilacion"),
    ("Depilación Brazos",                    450,   30, "depilacion"),
    ("Depilación Medias Piernas",            600,   35, "depilacion"),
    ("Depilación Piernas Completas",         850,   45, "depilacion"),
    ("Depilación Glúteos",                   550,   30, "depilacion"),
    ("Brasilian Bikini",                     650,   35, "depilacion"),
    ("Full Body (sin bikini)",              1850,   90, "depilacion"),
    ("Full Body Súmer (con bikini)",        2500,  100, "depilacion"),
    ("Brow Pack 1 — Diseño + Cera Fría",    150,   30, "cejas"),
    ("Brow Pack 2 — Diseño + Laminado",     250,   45, "cejas"),
    ("Brow Pack 3 — Diseño + Henna",        200,   40, "cejas"),
    ("Brow Pack 4 — Completo",              350,   60, "cejas"),
    ("Lash Lifting",                         400,   60, "lash"),
    ("Lash Lifting + Henna",                500,   75, "lash"),
    ("Retiro de Verrugas 1-3",              550,   30, "corporal"),
    ("Retiro de Verrugas 4-7",             1700,   45, "corporal"),
    ("Aclaración Corporal Axilas",          350,   20, "corporal"),
    ("Aclaración Corporal Codos",           450,   25, "corporal"),
    ("Aclaración Corporal Rodillas",        550,   25, "corporal"),
    ("Aclaración Corporal Full Body",      2500,   90, "corporal"),
]

EXPIRY_POR_CATEGORIA = {
    "depilacion": 90,
    "cejas":      90,
    "lash":       90,
    "facial":    120,
    "corporal":  180,
    "capilar":   270,
    "otro":       90,
}

PRODUCTOS_SEED = [
    # (nombre, precio, categoria)
    ("Shampoo Keratina 500ml",      450, "Capilar"),
    ("Mascarilla Reparadora 300g",  650, "Capilar"),
    ("Aceite Capilar 100ml",        350, "Capilar"),
    ("Sérum Vitamina C 30ml",       800, "Facial"),
    ("Crema Despigmentante 50g",    750, "Facial"),
    ("Tónico Anti-Edad 120ml",      900, "Facial"),
]

# ── Setup DB ──────────────────────────────────────────────────────────────────

def create_database():
    conn = pymysql.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        user=settings.DB_USER, password=settings.DB_PASSWORD,
        charset="utf8mb4",
    )
    with conn.cursor() as cur:
        cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
    conn.close()
    print(f"✓ DB '{settings.DB_NAME}' lista")


def create_tables(reset=False):
    if reset:
        Base.metadata.drop_all(bind=engine)
        print("✓ Tablas eliminadas")
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas creadas")


def migrate_tables():
    """ALTER TABLE para instancias existentes sin --reset."""
    with engine.connect() as conn:
        stmts = [
            "ALTER TABLE pagos MODIFY COLUMN cita_id INT NULL",
            "ALTER TABLE pagos DROP INDEX cita_id",
            "ALTER TABLE pagos ADD COLUMN cliente_id INT NULL",
            "ALTER TABLE pagos ADD COLUMN empleada_id INT NULL",
            "ALTER TABLE productos ADD COLUMN foto_data LONGTEXT NULL",
            """CREATE TABLE IF NOT EXISTS promociones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(200) NOT NULL,
                descripcion TEXT,
                vigencia VARCHAR(150),
                foto_data LONGTEXT NOT NULL,
                activa TINYINT(1) NOT NULL DEFAULT 1,
                orden INT NOT NULL DEFAULT 0,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
            """CREATE TABLE IF NOT EXISTS cita_observaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cita_id INT NOT NULL,
                tipo ENUM('antes','despues') NOT NULL,
                orden INT NOT NULL,
                foto_data LONGTEXT,
                observacion TEXT,
                FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
            # Lealtad (si no existe)
            "ALTER TABLE servicios ADD COLUMN loyalty_expiry_dias INT NOT NULL DEFAULT 90",
            """CREATE TABLE IF NOT EXISTS cliente_lealtad (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                servicio_id INT NOT NULL,
                visitas_en_ciclo INT NOT NULL DEFAULT 0,
                ultima_visita DATETIME NULL,
                UNIQUE KEY uq_cliente_servicio_lealtad (cliente_id, servicio_id),
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
        ]
        for sql in stmts:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass
    print("✓ Migraciones aplicadas")


# ── Seeders ───────────────────────────────────────────────────────────────────

def seed_usuarios(db: Session) -> dict:
    """Retorna {email: usuario}"""
    from app.models.usuario import Usuario
    usuarios = {}
    for nombre, email, password, rol in USUARIOS_SEED:
        u = db.query(Usuario).filter(Usuario.email == email).first()
        if not u:
            u = Usuario(nombre=nombre, email=email,
                        password_hash=hash_password(password), rol=rol)
            db.add(u)
            db.flush()
            print(f"  + Usuario {rol}: {email}")
        usuarios[email] = u
    db.commit()
    print(f"✓ Usuarios listos ({len(usuarios)})")
    return usuarios


def seed_empleadas(db: Session, usuarios: dict) -> dict:
    """Retorna {nombre: empleada}"""
    from app.models.empleada import Empleada
    empleadas = {}
    for email, nombre, telefono, comision in EMPLEADAS_SEED:
        e = db.query(Empleada).filter(Empleada.nombre == nombre).first()
        if not e:
            u = usuarios.get(email)
            e = Empleada(nombre=nombre, telefono=telefono,
                         comision_porcentaje=comision,
                         usuario_id=u.id if u else None)
            db.add(e)
            db.flush()
            print(f"  + Empleada: {nombre} ({comision}% comisión)")
        empleadas[nombre] = e
    db.commit()
    print(f"✓ Empleadas listas ({len(empleadas)})")
    return empleadas


def seed_clientes(db: Session) -> dict:
    """Retorna {nombre: cliente}"""
    from app.models.cliente import Cliente
    clientes = {}
    for nombre, tel, email, notas in CLIENTES_SEED:
        c = db.query(Cliente).filter(Cliente.nombre == nombre).first()
        if not c:
            c = Cliente(nombre=nombre, telefono=tel, email=email, notas=notas)
            db.add(c)
            db.flush()
        clientes[nombre] = c
    db.commit()
    print(f"✓ Clientes listos ({len(clientes)})")
    return clientes


def seed_servicios(db: Session) -> dict:
    """Retorna {nombre: servicio}"""
    from app.models.servicio import Servicio
    servicios = {}
    existing = db.query(Servicio).count()
    if existing == 0:
        for nombre, precio, duracion, cat in SERVICIOS_SEED:
            s = Servicio(
                nombre=nombre, precio_base=precio,
                duracion_min=duracion, categoria=cat,
                loyalty_expiry_dias=EXPIRY_POR_CATEGORIA.get(cat, 90),
            )
            db.add(s)
            db.flush()
            servicios[nombre] = s
        db.commit()
        print(f"✓ Servicios creados ({len(servicios)})")
    else:
        # Actualizar loyalty_expiry_dias si ya existen
        for s in db.query(Servicio).all():
            expiry = EXPIRY_POR_CATEGORIA.get(s.categoria, 90)
            if s.loyalty_expiry_dias != expiry:
                s.loyalty_expiry_dias = expiry
            servicios[s.nombre] = s
        db.commit()
        print(f"✓ Servicios ya existían ({existing}), expiry actualizado")
    return servicios


def seed_productos(db: Session):
    from app.models.producto import Producto
    if db.query(Producto).count() > 0:
        print("  Productos ya existen")
        return
    for nombre, precio, cat in PRODUCTOS_SEED:
        db.add(Producto(nombre=nombre, precio=precio, categoria=cat))
    db.commit()
    print(f"✓ Productos creados ({len(PRODUCTOS_SEED)})")


def seed_citas_y_pagos(db: Session, clientes: dict, empleadas: dict, servicios: dict):
    from app.models.cita import Cita, CitaServicio
    from app.models.finanzas import Pago, PagoServicio

    if db.query(Cita).count() > 0:
        print("  Citas ya existen")
        return

    now = datetime.now(timezone.utc)
    sofia = empleadas["Sofía García"]
    valentina = empleadas["Valentina Torres"]
    monica = empleadas["Mónica Ruiz"]

    # Atajos a servicios frecuentes
    balayage    = servicios["Balayage"]
    facial_limp = servicios["Facial Limpieza Profunda"]
    depi_axilas = servicios["Depilación Axilas"]
    brow1       = servicios["Brow Pack 1 — Diseño + Cera Fría"]
    lash        = servicios["Lash Lifting"]
    tinte       = servicios["Tinte Aplicación Completa"]
    corte_m     = servicios["Corte Mujer"]
    botox       = servicios["Botox Capilar"]
    depi_piernas= servicios["Depilación Piernas Completas"]

    # ── Citas pasadas completadas (con pago) ─────────────────────────────────
    pasadas = [
        # (dias_atras, cliente, empleada, [(servicio, precio)], metodo, propina)
        (7,  "María López",       sofia,     [(balayage, 2000)],                         "efectivo",      200),
        (6,  "Ana Martínez",      monica,    [(facial_limp, 500), (depi_axilas, 300)],   "transferencia",   0),
        (5,  "Jessica Ramírez",   valentina, [(lash, 400)],                               "tarjeta",         0),
        (5,  "Carmen Flores",     sofia,     [(brow1, 150)],                              "efectivo",       50),
        (4,  "María López",       sofia,     [(tinte, 450), (corte_m, 180)],             "efectivo",        0),
        (3,  "Gabriela Reyes",    valentina, [(lash, 400)],                               "tarjeta",         0),
        (3,  "Ana Martínez",      monica,    [(facial_limp, 500)],                        "transferencia",   0),
        (2,  "Paola Jiménez",     monica,    [(depi_piernas, 850)],                       "efectivo",       80),
        (2,  "Diana Vargas",      sofia,     [(balayage, 2000)],                          "transferencia", 150),
        (1,  "Jessica Ramírez",   monica,    [(depi_axilas, 300), (brow1, 150)],          "efectivo",       50),
    ]

    citas_completadas = []
    for dias_atras, nombre_cliente, empleada, items, metodo, propina in pasadas:
        cliente = clientes[nombre_cliente]
        fecha = now - timedelta(days=dias_atras, hours=2)

        cita = Cita(
            cliente_id=cliente.id,
            empleada_id=empleada.id,
            fecha=fecha,
            hora_fin=fecha + timedelta(hours=1, minutes=30),
            estado="completada",
        )
        db.add(cita)
        db.flush()

        total = 0
        for srv, precio in items:
            db.add(CitaServicio(cita_id=cita.id, servicio_id=srv.id, precio_aplicado=precio))
            total += precio

        comision = total * (empleada.comision_porcentaje / 100)
        pago = Pago(
            cita_id=cita.id,
            monto=total,
            metodo_pago=metodo,
            propina=propina,
            comision_calculada=comision,
            fecha=fecha + timedelta(hours=1, minutes=30),
        )
        db.add(pago)
        db.flush()
        for srv, precio in items:
            db.add(PagoServicio(pago_id=pago.id, servicio_id=srv.id, precio_aplicado=precio))

        citas_completadas.append(cita)

    # ── Citas de hoy ─────────────────────────────────────────────────────────
    hoy_pendientes = [
        # (hora_offset_horas, cliente, empleada, [(servicio, precio)], estado)
        (2,  "Claudia Hernández", sofia,     [(balayage, 2000)],         "confirmada"),
        (4,  "Sofía Valdez",      valentina, [(brow1, 150), (lash, 400)], "pendiente"),
        (5,  "Laura Morales",     monica,    [(facial_limp, 500)],        "confirmada"),
    ]
    for horas, nombre_cliente, empleada, items, estado in hoy_pendientes:
        cliente = clientes[nombre_cliente]
        fecha = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(hours=horas)
        cita = Cita(
            cliente_id=cliente.id,
            empleada_id=empleada.id,
            fecha=fecha,
            hora_fin=fecha + timedelta(hours=1, minutes=30),
            estado=estado,
        )
        db.add(cita)
        db.flush()
        for srv, precio in items:
            db.add(CitaServicio(cita_id=cita.id, servicio_id=srv.id, precio_aplicado=precio))

    # ── Citas futuras ─────────────────────────────────────────────────────────
    futuras = [
        (1, 10, "María López",     sofia,     [(botox, 1500)],            "pendiente"),
        (1, 14, "Ana Martínez",    monica,    [(depi_axilas, 300)],        "pendiente"),
        (2, 11, "Carmen Flores",   valentina, [(lash, 400)],               "pendiente"),
        (3, 15, "Diana Vargas",    sofia,     [(tinte, 450), (corte_m, 180)], "pendiente"),
        (5, 10, "Gabriela Reyes",  valentina, [(brow1, 150)],              "pendiente"),
    ]
    for dias, hora, nombre_cliente, empleada, items, estado in futuras:
        cliente = clientes[nombre_cliente]
        fecha = now.replace(hour=hora, minute=0, second=0, microsecond=0) + timedelta(days=dias)
        cita = Cita(
            cliente_id=cliente.id,
            empleada_id=empleada.id,
            fecha=fecha,
            hora_fin=fecha + timedelta(hours=1, minutes=30),
            estado=estado,
        )
        db.add(cita)
        db.flush()
        for srv, precio in items:
            db.add(CitaServicio(cita_id=cita.id, servicio_id=srv.id, precio_aplicado=precio))

    # ── Cita cancelada ────────────────────────────────────────────────────────
    cliente_cancel = clientes["Paola Jiménez"]
    cita_cancel = Cita(
        cliente_id=cliente_cancel.id,
        empleada_id=sofia.id,
        fecha=now - timedelta(days=1),
        estado="cancelada",
        notas="Cliente canceló por enfermedad",
    )
    db.add(cita_cancel)
    db.flush()
    db.add(CitaServicio(cita_id=cita_cancel.id, servicio_id=balayage.id, precio_aplicado=2000))

    db.commit()
    print(f"✓ Citas y pagos creados")


def seed_gastos(db: Session):
    from app.models.finanzas import Gasto

    if db.query(Gasto).count() > 0:
        print("  Gastos ya existen")
        return

    now = datetime.now(timezone.utc)
    gastos = [
        # (concepto, monto, categoria, dias_atras)
        ("Compra de productos capilares (keratina, mascarillas)", 3500, "productos",  5),
        ("Renta del local — mayo 2026",                          8000, "renta",       1),
        ("Luz y agua — abril 2026",                              1200, "servicios",   3),
        ("Material de limpieza",                                  450, "limpieza",    2),
        ("Publicidad en Instagram — boost de publicaciones",      800, "marketing",   4),
        ("Consumibles (guantes, papel encerado, etc.)",           650, "productos",   6),
    ]
    for concepto, monto, cat, dias_atras in gastos:
        db.add(Gasto(
            concepto=concepto,
            monto=monto,
            categoria=cat,
            fecha=now - timedelta(days=dias_atras),
        ))
    db.commit()
    print(f"✓ Gastos creados ({len(gastos)})")


def seed_lealtad(db: Session, clientes: dict, servicios: dict):
    """Inserta registros de lealtad en distintos estados del ciclo para pruebas visuales."""
    from app.models.lealtad import ClienteLealtad

    if db.query(ClienteLealtad).count() > 0:
        print("  Lealtad ya existe")
        return

    now = datetime.now(timezone.utc)

    records = [
        # (cliente, servicio, visitas_en_ciclo, dias_desde_ultima)
        # María: 4 visitas a Balayage → próxima (5ª) = 15% off
        ("María López",       "Balayage",                          4, 30),
        # Ana: 6 visitas a Facial Limpieza → próxima (7ª) = 20% off
        ("Ana Martínez",      "Facial Limpieza Profunda",          6, 15),
        # Jessica: 9 visitas a Depilación Axilas → próxima (10ª) = 30% off
        ("Jessica Ramírez",   "Depilación Axilas",                 9, 20),
        # Carmen: en visita 5 (ya obtuvo 15%), siguiente es normal
        ("Carmen Flores",     "Brow Pack 1 — Diseño + Cera Fría", 5, 45),
        # Gabriela: 3 visitas a Lash Lifting, avanzando
        ("Gabriela Reyes",    "Lash Lifting",                      3, 25),
        # Diana: inicio del ciclo en Balayage
        ("Diana Vargas",      "Balayage",                          2, 60),
        # Paola: en visita 7 (ya obtuvo 20%), siguientes normales hasta la 10
        ("Paola Jiménez",     "Depilación Piernas Completas",      7, 10),
    ]

    for nombre_cliente, nombre_servicio, visitas, dias_desde in records:
        c = clientes.get(nombre_cliente)
        s = servicios.get(nombre_servicio)
        if not c or not s:
            print(f"  ! No encontrado: {nombre_cliente} / {nombre_servicio}")
            continue
        ultima = now - timedelta(days=dias_desde)
        db.add(ClienteLealtad(
            cliente_id=c.id,
            servicio_id=s.id,
            visitas_en_ciclo=visitas,
            ultima_visita=ultima,
        ))

    db.commit()
    print(f"✓ Lealtad creada ({len(records)} registros)")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true",
                        help="Elimina y recrea todas las tablas antes del seed")
    args = parser.parse_args()

    print("\n── Pretty Face's Beauty Center — Seed ──")
    create_database()
    create_tables(reset=args.reset)
    if not args.reset:
        migrate_tables()

    with Session(engine) as db:
        usuarios  = seed_usuarios(db)
        empleadas = seed_empleadas(db, usuarios)
        clientes  = seed_clientes(db)
        servicios = seed_servicios(db)
        seed_productos(db)
        seed_citas_y_pagos(db, clientes, empleadas, servicios)
        seed_gastos(db)
        seed_lealtad(db, clientes, servicios)

    print("""
✓ Seed completo. Credenciales:

  Rol         Email                        Password
  ─────────── ──────────────────────────── ────────────────────
  admin       admin@prettyfaces.com        PrettyAdmin2024!
  recepcion   recepcion@prettyfaces.com    PrettyRecep2024!
  empleada    sofia@prettyfaces.com        PrettySofia2024!
  empleada    valentina@prettyfaces.com    PrettyVale2024!
  empleada    monica@prettyfaces.com       PrettyMoni2024!
""")


if __name__ == "__main__":
    main()
