from pydantic import BaseModel
from typing import Optional


class LealtadServicioOut(BaseModel):
    servicio_id: int
    servicio_nombre: str
    visitas_en_ciclo: int
    visita_siguiente_numero: int
    descuento_siguiente_visita: float
    dias_para_expirar: Optional[int]
    expiry_dias: int
    proximo_hito: int
    visitas_para_hito: int
