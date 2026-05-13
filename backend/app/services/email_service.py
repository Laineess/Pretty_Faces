import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_visit_email(
    cliente_nombre: str,
    cliente_email: str,
    fecha_pago: datetime,
    servicios_detalle: list[dict],
    productos_detalle: list[dict],
    monto_total: float,
    propina: float,
    metodo_pago: str,
    lealtad_info: list[dict],
) -> None:
    """Envía email de agradecimiento con ticket y tarjeta de lealtad."""
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        logger.warning("MAIL_USERNAME / MAIL_PASSWORD no configurados — email omitido")
        return

    html = _build_html(
        cliente_nombre=cliente_nombre,
        fecha_pago=fecha_pago,
        servicios_detalle=servicios_detalle,
        productos_detalle=productos_detalle,
        monto_total=monto_total,
        propina=propina,
        metodo_pago=metodo_pago,
        lealtad_info=lealtad_info,
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"¡Gracias por tu visita, {cliente_nombre}! ✨ Pretty Face's Beauty Center"
    msg["From"] = f"Pretty Face's Beauty Center <{settings.MAIL_FROM}>"
    msg["To"] = cliente_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, [cliente_email], msg.as_string())
        logger.info(f"Email enviado a {cliente_email}")
    except Exception as e:
        logger.error(f"Error enviando email a {cliente_email}: {e}")


# ── HTML builders ─────────────────────────────────────────────────────────────

def _fmt_currency(amount: float) -> str:
    return f"${amount:,.2f}"


def _metodo_label(metodo: str) -> str:
    labels = {
        "efectivo": "Efectivo",
        "tarjeta": "Tarjeta",
        "transferencia": "Transferencia",
        "otro": "Otro",
    }
    return labels.get(metodo, metodo.capitalize())


def _build_ticket_rows(servicios: list[dict], productos: list[dict]) -> str:
    rows = ""
    for s in servicios:
        rows += f"""
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;">{s['nombre']}</td>
          <td style="padding:6px 0;color:#374151;font-size:14px;text-align:right;">{_fmt_currency(s['precio'])}</td>
        </tr>"""
    for p in productos:
        qty = p.get("cantidad", 1)
        label = f"{p['nombre']}" + (f" x{qty}" if qty > 1 else "")
        rows += f"""
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;">{label}</td>
          <td style="padding:6px 0;color:#374151;font-size:14px;text-align:right;">{_fmt_currency(p['precio'] * qty)}</td>
        </tr>"""
    return rows


def _build_loyalty_card(info: dict) -> str:
    nombre = info["servicio_nombre"]
    visita_n = info["visita_n"]
    next_expiry: datetime | None = info.get("next_expiry")
    descuento = info.get("descuento", 0.0)
    dias_restantes = info.get("dias_restantes")

    # Construir 10 círculos (hitos en 5=15%, 7=20%, 10=30%)
    MILESTONE_STYLES = {
        5:  ("#f59e0b", "#d97706", "15%"),
        7:  ("#a855f7", "#7c3aed", "20%"),
        10: ("#ec4899", "#be185d", "30%"),
    }
    circles_html = ""
    for i in range(1, 11):
        filled = i <= visita_n
        is_current = i == visita_n
        is_milestone = i in MILESTONE_STYLES

        if filled:
            if is_milestone:
                bg, border, _ = MILESTONE_STYLES[i]
            else:
                bg, border = "#6366f1", "#4338ca"
            emoji = "★" if is_milestone else "✓"
            text_color = "#ffffff"
        else:
            bg, border = "#f3f4f6", "#d1d5db"
            emoji = str(i)
            text_color = "#9ca3af"

        pulse = "animation:pulse 1.5s infinite;" if is_current else ""
        circles_html += f"""
        <div style="display:inline-block;width:32px;height:32px;line-height:32px;
                    text-align:center;border-radius:50%;background:{bg};
                    border:2px solid {border};color:{text_color};
                    font-size:11px;font-weight:bold;margin:2px;{pulse}">
          {emoji}
        </div>"""

    # Mensaje de descuento aplicado
    if descuento > 0:
        desc_pct = int(descuento * 100)
        desc_badge = f"""
        <div style="display:inline-block;background:#fef3c7;border:1px solid #f59e0b;
                    color:#92400e;padding:4px 12px;border-radius:20px;
                    font-size:12px;font-weight:bold;margin-top:4px;">
          🎉 ¡{desc_pct}% de descuento aplicado en esta visita!
        </div>"""
    else:
        next_n = info.get("visita_siguiente_numero", visita_n + 1)
        if next_n == 5:
            desc_badge = '<div style="font-size:12px;color:#6b7280;margin-top:4px;">Próxima visita: <b style="color:#f59e0b;">15% de descuento ✨</b></div>'
        elif next_n == 7:
            desc_badge = '<div style="font-size:12px;color:#6b7280;margin-top:4px;">Próxima visita: <b style="color:#a855f7;">20% de descuento 💜</b></div>'
        elif next_n == 10:
            desc_badge = '<div style="font-size:12px;color:#6b7280;margin-top:4px;">Próxima visita: <b style="color:#ec4899;">30% de descuento 🎉</b></div>'
        else:
            proximo_hito = info.get("proximo_hito", 5)
            faltante = proximo_hito - visita_n
            desc_badge = f'<div style="font-size:12px;color:#6b7280;margin-top:4px;">Faltan <b>{faltante}</b> visita{"s" if faltante != 1 else ""} para tu próximo descuento</div>'

    # Mensaje de caducidad
    if next_expiry and dias_restantes is not None:
        expiry_str = next_expiry.strftime("%d/%m/%Y")
        if dias_restantes <= 15:
            expiry_color = "#dc2626"
            expiry_icon = "⚠️"
        elif dias_restantes <= 30:
            expiry_color = "#d97706"
            expiry_icon = "⏰"
        else:
            expiry_color = "#059669"
            expiry_icon = "✅"
        expiry_msg = f"""
        <div style="font-size:12px;color:{expiry_color};margin-top:6px;">
          {expiry_icon} Tu próxima visita debe ser antes del <b>{expiry_str}</b>
          ({dias_restantes} día{"s" if dias_restantes != 1 else ""} restante{"s" if dias_restantes != 1 else ""})
        </div>"""
    else:
        expiry_msg = ""

    return f"""
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;
                padding:16px;margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">
        {nombre}
      </div>
      <div style="margin-bottom:6px;">
        {circles_html}
      </div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">
        Visita <b>{visita_n}</b> de 10 en el ciclo actual
      </div>
      {desc_badge}
      {expiry_msg}
    </div>"""


def _build_html(
    cliente_nombre: str,
    fecha_pago: datetime,
    servicios_detalle: list[dict],
    productos_detalle: list[dict],
    monto_total: float,
    propina: float,
    metodo_pago: str,
    lealtad_info: list[dict],
) -> str:
    fecha_str = fecha_pago.strftime("%d de %B de %Y") if fecha_pago else ""
    ticket_rows = _build_ticket_rows(servicios_detalle, productos_detalle)
    loyalty_cards = "".join(_build_loyalty_card(info) for info in lealtad_info)

    propina_row = ""
    if propina and propina > 0:
        propina_row = f"""
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">Propina</td>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;text-align:right;">{_fmt_currency(propina)}</td>
        </tr>"""

    loyalty_section = ""
    if lealtad_info:
        loyalty_section = f"""
      <div style="margin-top:28px;">
        <h2 style="font-size:16px;font-weight:700;color:#111827;
                   border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:16px;">
          🏆 Tu Tarjeta de Lealtad
        </h2>
        <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">
          Visita 5 = <b style="color:#f59e0b;">15% off</b> &nbsp;|&nbsp;
          Visita 7 = <b style="color:#a855f7;">20% off</b> &nbsp;|&nbsp;
          Visita 10 = <b style="color:#ec4899;">30% off</b>
          &nbsp;· por servicio · ciclo reinicia luego de la visita 10
        </p>
        {loyalty_cards}
      </div>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }}
    @keyframes pulse {{ 0%,100%{{opacity:1}} 50%{{opacity:.6}} }}
  </style>
</head>
<body>
  <div style="max-width:560px;margin:32px auto;background:#ffffff;
              border-radius:16px;overflow:hidden;
              box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#ec4899);
                padding:32px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
        Pretty Face's Beauty Center
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">
        ✨ ¡Gracias por tu visita, <b>{cliente_nombre}</b>!
      </p>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px;">

      <!-- Ticket -->
      <h2 style="font-size:16px;font-weight:700;color:#111827;
                 border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:16px;">
        🧾 Ticket — {fecha_str}
      </h2>

      <table style="width:100%;border-collapse:collapse;">
        {ticket_rows}
        <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:8px;"></td></tr>
        {propina_row}
        <tr>
          <td style="padding:6px 0;font-size:15px;font-weight:700;color:#111827;">Total</td>
          <td style="padding:6px 0;font-size:15px;font-weight:700;color:#111827;text-align:right;">
            {_fmt_currency(monto_total + propina)}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 0;font-size:12px;color:#9ca3af;">
            Método de pago: {_metodo_label(metodo_pago)}
          </td>
        </tr>
      </table>

      {loyalty_section}

      <!-- Footer message -->
      <div style="margin-top:28px;text-align:center;padding:20px;
                  background:#fdf4ff;border-radius:12px;">
        <p style="margin:0;font-size:15px;color:#7c3aed;font-weight:600;">
          ¡Nos vemos pronto! 💕
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
          @PrettyFacesBeautyCenter
        </p>
      </div>

    </div>

    <!-- Email footer -->
    <div style="background:#f3f4f6;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Este correo se generó automáticamente tras tu visita.
      </p>
    </div>

  </div>
</body>
</html>"""
