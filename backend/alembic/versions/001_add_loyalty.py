"""add loyalty program

Revision ID: 001
Revises:
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Columna loyalty_expiry_dias en servicios
    op.add_column(
        "servicios",
        sa.Column("loyalty_expiry_dias", sa.Integer(), nullable=False, server_default="90"),
    )

    # Actualizar defaults por categoría (mín 90 días = 3 meses, máx 270 = 9 meses)
    op.execute("""
        UPDATE servicios SET loyalty_expiry_dias = CASE categoria
            WHEN 'depilacion' THEN 90
            WHEN 'cejas'      THEN 90
            WHEN 'lash'       THEN 90
            WHEN 'facial'     THEN 120
            WHEN 'corporal'   THEN 180
            WHEN 'capilar'    THEN 270
            ELSE 90
        END
    """)

    # Tabla cliente_lealtad
    op.create_table(
        "cliente_lealtad",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "cliente_id",
            sa.Integer(),
            sa.ForeignKey("clientes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "servicio_id",
            sa.Integer(),
            sa.ForeignKey("servicios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("visitas_en_ciclo", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ultima_visita", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("cliente_id", "servicio_id", name="uq_cliente_servicio_lealtad"),
    )


def downgrade() -> None:
    op.drop_table("cliente_lealtad")
    op.drop_column("servicios", "loyalty_expiry_dias")
