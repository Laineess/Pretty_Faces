import { useRef, useState } from 'react'
import { api } from '../../lib/api'

const NEGOCIO = {
  nombre: "Pretty Face's Beauty Center",
  tel: '',       // llenar cuando disponible
  direccion: '', // llenar cuando disponible
}

function fmtFecha(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function fmtMXN(n) {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pad(str, len) {
  const s = String(str)
  return s.length >= len ? s : s + ' '.repeat(len - s.length)
}

function buildWhatsAppText(pago) {
  const lineas = [
    `*${NEGOCIO.nombre}*`,
    `─────────────────────`,
    `Fecha: ${fmtFecha(pago.fecha)}`,
    `Cliente: ${pago.cliente_nombre || '—'}`,
    `Atendida por: ${pago.empleada_nombre || '—'}`,
    `─────────────────────`,
  ]

  if (pago.servicios_detalle?.length) {
    lineas.push('*SERVICIOS*')
    pago.servicios_detalle.forEach(s => {
      lineas.push(`• ${s.nombre}  ${fmtMXN(s.precio)}`)
    })
  }

  if (pago.productos_detalle?.length) {
    lineas.push('*PRODUCTOS*')
    pago.productos_detalle.forEach(p => {
      const cant = p.cantidad > 1 ? ` x${p.cantidad}` : ''
      lineas.push(`• ${p.nombre}${cant}  ${fmtMXN(p.precio * p.cantidad)}`)
    })
  }

  lineas.push(`─────────────────────`)
  lineas.push(`Subtotal: ${fmtMXN(pago.monto)}`)
  if (pago.propina > 0) lineas.push(`Propina:  ${fmtMXN(pago.propina)}`)
  lineas.push(`*TOTAL: ${fmtMXN(pago.monto + pago.propina)}*`)
  lineas.push(`Método: ${pago.metodo_pago}`)
  lineas.push(`─────────────────────`)
  lineas.push(`¡Gracias por tu visita! 💕`)

  return lineas.join('\n')
}

export default function TicketRecibo({ pago, onClose }) {
  const ticketRef = useRef(null)
  const [emailStatus, setEmailStatus] = useState(null) // null | 'sending' | 'sent' | 'error' | 'no-email'

  function handlePrint() {
    window.print()
  }

  function handleWhatsApp() {
    const text = buildWhatsAppText(pago)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function handleEmail() {
    if (emailStatus === 'sending') return
    setEmailStatus('sending')
    try {
      await api.enviarEmailTicket(pago.id)
      setEmailStatus('sent')
    } catch (err) {
      if (err.message?.includes('no tiene email')) {
        setEmailStatus('no-email')
      } else {
        setEmailStatus('error')
      }
    }
  }

  const subtotal = pago.monto
  const total = pago.monto + (pago.propina || 0)

  return (
    <>
      {/* Print styles */}
      <style>{`
        @page { size: 80mm auto; margin: 4mm 3mm; }
        @media print {
          body * { visibility: hidden; }
          #ticket-print-root,
          #ticket-print-root * { visibility: visible; }
          #ticket-print-root {
            position: fixed !important;
            top: 0; left: 0;
            width: 74mm;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #ticket-print-root * {
            color: #000 !important;
            background: transparent !important;
            border-color: #000 !important;
          }
          #ticket-print-root .ticket-divider {
            border-top: 1px dashed #000;
            margin: 4pt 0;
          }
          #ticket-print-root .ticket-total-line {
            border-top: 1px solid #000;
            margin-top: 3pt;
            padding-top: 3pt;
            font-weight: 900 !important;
            font-size: 12pt !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between no-print">
            <h2 className="font-serif text-xl text-gray-800">Recibo</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Ticket content */}
          <div id="ticket-print-root" className="overflow-y-auto flex-1 px-4 py-4">
            <div ref={ticketRef} style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', lineHeight: '1.5', color: '#111' }}>

              {/* Encabezado */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <p style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{NEGOCIO.nombre}</p>
                {NEGOCIO.tel && <p>{NEGOCIO.tel}</p>}
                {NEGOCIO.direccion && <p>{NEGOCIO.direccion}</p>}
              </div>

              <div className="ticket-divider" style={{ borderTop: '1px dashed #111', margin: '6px 0' }} />

              {/* Datos */}
              <div style={{ marginBottom: '4px' }}>
                {[
                  ['Fecha', fmtFecha(pago.fecha)],
                  ['Folio', `#${String(pago.id).padStart(5, '0')}`],
                  ['Cliente', pago.cliente_nombre || '—'],
                  ['Profesional', pago.empleada_nombre || '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: '600' }}>{lbl}:</span>
                    <span style={{ textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Servicios */}
              {pago.servicios_detalle?.length > 0 && (
                <>
                  <div className="ticket-divider" style={{ borderTop: '1px dashed #111', margin: '6px 0' }} />
                  <p style={{ fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: '4px' }}>Servicios</p>
                  {pago.servicios_detalle.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</span>
                      <span style={{ flexShrink: 0, fontWeight: '600' }}>{fmtMXN(s.precio)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Productos */}
              {pago.productos_detalle?.length > 0 && (
                <>
                  <div className="ticket-divider" style={{ borderTop: '1px dashed #111', margin: '6px 0' }} />
                  <p style={{ fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: '4px' }}>Productos</p>
                  {pago.productos_detalle.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nombre}{p.cantidad > 1 ? ` x${p.cantidad}` : ''}
                      </span>
                      <span style={{ flexShrink: 0, fontWeight: '600' }}>{fmtMXN(p.precio * p.cantidad)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Totales */}
              <div className="ticket-divider" style={{ borderTop: '1px dashed #111', margin: '6px 0' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>{fmtMXN(subtotal)}</span>
                </div>
                {pago.propina > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Propina</span>
                    <span>{fmtMXN(pago.propina)}</span>
                  </div>
                )}
                <div className="ticket-total-line" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', borderTop: '1px solid #111', marginTop: '4px', paddingTop: '4px' }}>
                  <span>TOTAL</span>
                  <span>{fmtMXN(total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Método</span>
                  <span style={{ textTransform: 'capitalize' }}>{pago.metodo_pago}</span>
                </div>
              </div>

              <div className="ticket-divider" style={{ borderTop: '1px dashed #111', margin: '8px 0' }} />
              <p style={{ textAlign: 'center', fontWeight: '600' }}>¡Gracias por tu visita!</p>
              <p style={{ textAlign: 'center', fontSize: '10px', marginTop: '2px' }}>prettyfaces.com.mx</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 no-print">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={handlePrint}
                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-gray-200 hover:border-gold hover:bg-gold/5 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                <span className="font-sans text-xs text-gray-600">Imprimir</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-sans text-xs text-gray-600">WhatsApp</span>
              </button>

              <button
                onClick={handleEmail}
                disabled={emailStatus === 'sending'}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors
                  ${emailStatus === 'sent'    ? 'border-green-400 bg-green-50' :
                    emailStatus === 'error' || emailStatus === 'no-email' ? 'border-red-300 bg-red-50' :
                    emailStatus === 'sending'  ? 'border-blue-300 bg-blue-50 opacity-60' :
                    'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}
              >
                {emailStatus === 'sending' ? (
                  <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : emailStatus === 'sent' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : emailStatus === 'error' || emailStatus === 'no-email' ? (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                )}
                <span className={`font-sans text-xs
                  ${emailStatus === 'sent' ? 'text-green-600' :
                    emailStatus === 'error' ? 'text-red-500' :
                    emailStatus === 'no-email' ? 'text-red-500' :
                    'text-gray-600'}`}>
                  {emailStatus === 'sending' ? 'Enviando…' :
                   emailStatus === 'sent'    ? 'Enviado ✓' :
                   emailStatus === 'error'   ? 'Error' :
                   emailStatus === 'no-email'? 'Sin email' :
                   'Email'}
                </span>
              </button>
            </div>

            <button onClick={onClose} className="w-full btn-outline-gold text-sm py-2.5">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
