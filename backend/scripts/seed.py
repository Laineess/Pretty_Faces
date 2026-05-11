"""
Ejecutar: python -m scripts.seed
Crea DB, tablas, usuario admin y servicios iniciales.
"""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pymysql
from sqlalchemy import text
from app.core.config import settings
from app.core.database import Base, engine
from app.core.security import hash_password
from app.models import *  # noqa — registra todos los modelos

ADMIN_EMAIL    = "admin@prettyfaces.com"
ADMIN_PASSWORD = "PrettyAdmin2024!"
ADMIN_NOMBRE   = "Administrador"

SERVICIOS_SEED = [
    # (nombre, precio_base, duracion_min, categoria)
    # Capilares
    ("Corte Mujer",                        180,   45,  "capilar"),
    ("Corte Niños",                        150,   30,  "capilar"),
    ("Corte Hombre",                       150,   30,  "capilar"),
    ("Fade",                                50,   20,  "capilar"),
    ("Tinte Aplicación Completa",          450,  120,  "capilar"),
    ("Retoque de Tinte en Raíz",           250,   60,  "capilar"),
    ("Mechas / Babylights / Luces",       1600,  180,  "capilar"),
    ("Balayage",                          2000,  180,  "capilar"),
    ("Alaciado Express",                   550,   90,  "capilar"),
    ("Botox Capilar",                     1500,  120,  "capilar"),
    ("Alaciado Permanente",               1500,  180,  "capilar"),
    ("Mascarilla Hidratante",              500,   45,  "capilar"),
    ("Mascarilla Reestructurante",         750,   60,  "capilar"),
    ("Peinado",                            850,   60,  "capilar"),
    # Faciales
    ("Facial Limpieza Profunda",           500,   60,  "facial"),
    ("Facial Anti-Acné",                   800,   60,  "facial"),
    ("Facial Anti-Cicatrices",            1000,   75,  "facial"),
    ("Facial Despigmentante / Peeling",   1300,   75,  "facial"),
    ("Facial Anti-Edad",                  1350,   75,  "facial"),
    ("Facial Rejuvenecimiento",           1700,   90,  "facial"),
    ("+ Sérum Activo",                     350,    0,  "facial"),
    # Depilación
    ("Depilación Axilas",                  300,   20,  "depilacion"),
    ("Depilación Brazos",                  450,   30,  "depilacion"),
    ("Depilación Medias Piernas",          600,   35,  "depilacion"),
    ("Depilación Piernas Completas",       850,   45,  "depilacion"),
    ("Depilación Glúteos",                 550,   30,  "depilacion"),
    ("Brasilian Bikini",                   650,   35,  "depilacion"),
    ("Full Body (sin bikini)",            1850,   90,  "depilacion"),
    ("Full Body Súmer (con bikini)",      2500,  100,  "depilacion"),
    # Cejas
    ("Brow Pack 1 — Diseño + Cera Fría",  150,   30,  "cejas"),
    ("Brow Pack 2 — Diseño + Laminado",   250,   45,  "cejas"),
    ("Brow Pack 3 — Diseño + Henna",      200,   40,  "cejas"),
    ("Brow Pack 4 — Completo",            350,   60,  "cejas"),
    # Lash
    ("Lash Lifting",                       400,   60,  "lash"),
    ("Lash Lifting + Henna",              500,   75,  "lash"),
    # Corporal
    ("Retiro de Verrugas 1-3",            550,   30,  "corporal"),
    ("Retiro de Verrugas 4-7",           1700,   45,  "corporal"),
    ("Aclaración Corporal Axilas",        350,   20,  "corporal"),
    ("Aclaración Corporal Codos",         450,   25,  "corporal"),
    ("Aclaración Corporal Rodillas",      550,   25,  "corporal"),
    ("Aclaración Corporal Full Body",    2500,   90,  "corporal"),
]


def create_database():
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset="utf8mb4",
    )
    with conn.cursor() as cur:
        cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
    conn.close()
    print(f"✓ Base de datos '{settings.DB_NAME}' lista")


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
            # productos: add foto_data column
            "ALTER TABLE productos ADD COLUMN foto_data LONGTEXT NULL",
            # promociones (landing carousel)
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
            # cita_observaciones (new table for employee workflow)
            """CREATE TABLE IF NOT EXISTS cita_observaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cita_id INT NOT NULL,
                tipo ENUM('antes','despues') NOT NULL,
                orden INT NOT NULL,
                foto_data LONGTEXT,
                observacion TEXT,
                FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
        ]
        for sql in stmts:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass
    print("✓ Migraciones aplicadas")


def seed_admin(db):
    from app.models.usuario import Usuario
    existing = db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first()
    if existing:
        print(f"  Admin ya existe: {ADMIN_EMAIL}")
        return

    admin = Usuario(
        nombre=ADMIN_NOMBRE,
        email=ADMIN_EMAIL,
        password_hash=hash_password(ADMIN_PASSWORD),
        rol="admin",
    )
    db.add(admin)
    db.commit()
    print(f"✓ Admin creado: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


def seed_servicios(db):
    from app.models.servicio import Servicio
    existing = db.query(Servicio).count()
    if existing > 0:
        print(f"  Servicios ya existen ({existing} registros)")
        return

    for nombre, precio, duracion, cat in SERVICIOS_SEED:
        db.add(Servicio(
            nombre=nombre,
            precio_base=precio,
            duracion_min=duracion,
            categoria=cat,
        ))
    db.commit()
    print(f"✓ {len(SERVICIOS_SEED)} servicios creados")


def main():
    import argparse
    from sqlalchemy.orm import Session

    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Elimina y recrea todas las tablas")
    args = parser.parse_args()

    print("\n── Pretty Face's Beauty Center — Seed ──")
    create_database()
    create_tables(reset=args.reset)
    if not args.reset:
        migrate_tables()

    with Session(engine) as db:
        seed_admin(db)
        seed_servicios(db)

    print("\n✓ Listo. Credenciales admin:")
    print(f"  Email:    {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}\n")


if __name__ == "__main__":
    main()
