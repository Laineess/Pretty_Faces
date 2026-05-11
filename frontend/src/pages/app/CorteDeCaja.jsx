import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'

const ADMIN_EMAIL = 'cgonzalezlaines@gmail.com'
const ADMIN_WHATSAPP = '523348279540'

const METODO_LABEL = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', otro: 'Otro' }

function fmt(n) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildTicketText(corte) {
  if (!corte) return ''
  const fecha = new Date(corte.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const lineas = [
    `CORTE DE CAJA`,
    `Pretty Face's Beauty Center`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Fecha: ${fecha}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ...corte.por_metodo.map(m => `${(METODO_LABEL[m.metodo] || m.metodo).padEnd(16)} $${fmt(m.total)}`),
    `──────────────────────────`,
    `Propinas            $${fmt(corte.total_propinas)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `TOTAL               $${fmt(corte.total)}`,
    `Pagos registrados: ${corte.num_pagos}`,
  ]
  return lineas.join('\n')
}

export default function CorteDeCaja() {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [corte, setCorte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const printRef = useRef(null)

  const fetchCorte = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setCorte(await api.getCorteDeCaja(fecha))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => { fetchCorte() }, [fetchCorte])

  function handlePrint() {
    window.print()
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(buildTicketText(corte))
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${text}`, '_blank')
  }

  function handleEmail() {
    const fechaLabel = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    const subject = encodeURIComponent(`Corte de Caja — ${fechaLabel}`)
    const body = encodeURIComponent(buildTicketText(corte))
    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank')
  }

  const fechaLabel = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div>
      {/* Print styles */}
      <style>{`
        @media screen { #corte-print-root { display: none; } }
        @page { size: 80mm auto; margin: 4mm 3mm; }
        @media print {
          body * { visibility: hidden; }
          #corte-print-root, #corte-print-root * { visibility: visible; }
          #corte-print-root {
            position: fixed !important; top: 0 !important; left: 0 !important; width: 74mm;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 10pt !important; color: #000 !important;
            print-color-adjust: exact;
          }
          #corte-print-root * { color: #000 !important; background: transparent !important; }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Corte de Caja</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5 capitalize">{fechaLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
          />
          <button onClick={fetchCorte} className="btn-outline-gold text-sm px-4 py-2">
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="font-sans text-sm text-gray-400">Calculando corte...</p>
        </div>
      ) : corte ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-sans text-xs text-gray-400 mb-1">Total del día</p>
              <p className="font-serif text-2xl text-gold">${fmt(corte.total)}</p>
              <p className="font-sans text-xs text-gray-400 mt-1">{corte.num_pagos} pago{corte.num_pagos !== 1 ? 's' : ''} registrado{corte.num_pagos !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-sans text-xs text-gray-400 mb-1">Total propinas</p>
              <p className="font-serif text-2xl text-gray-800">${fmt(corte.total_propinas)}</p>
              <p className="font-sans text-xs text-gray-400 mt-1">del día</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-sans text-xs text-gray-400 mb-1">Sin propinas</p>
              <p className="font-serif text-2xl text-gray-800">${fmt(corte.total - corte.total_propinas)}</p>
              <p className="font-sans text-xs text-gray-400 mt-1">servicios y productos</p>
            </div>
          </div>

          {/* By payment method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-sans text-sm font-semibold text-gray-700 mb-4">Por método de pago</h2>
            {corte.por_metodo.length === 0 ? (
              <p className="font-sans text-sm text-gray-400">Sin pagos en este día</p>
            ) : (
              <div className="space-y-3">
                {corte.por_metodo.map(m => (
                  <div key={m.metodo} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                      <span className="font-sans text-sm text-gray-700 capitalize">
                        {METODO_LABEL[m.metodo] || m.metodo}
                      </span>
                    </div>
                    <span className="font-sans text-sm font-semibold text-gray-800">${fmt(m.total)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className="font-sans text-sm font-semibold text-gray-700">Total</span>
                  <span className="font-sans text-sm font-bold text-gold">${fmt(corte.total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={handlePrint}
              className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            <button onClick={handleWhatsApp}
              className="btn-outline-gold text-sm px-5 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar por WhatsApp
            </button>
            <button onClick={handleEmail}
              className="btn-outline-gold text-sm px-5 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Enviar por Email
            </button>
          </div>

          {/* Print ticket — hidden on screen via CSS, shown on print */}
          <div id="corte-print-root">
            <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '11pt', color: '#000', width: '74mm', padding: '2mm 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <div style={{ fontWeight: '900', fontSize: '13pt', letterSpacing: '1px' }}>CORTE DE CAJA</div>
                <div style={{ fontWeight: '700', fontSize: '10pt' }}>Pretty Face's Beauty Center</div>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ marginBottom: '4px', fontSize: '9pt' }}>
                {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              {corte.por_metodo.map(m => (
                <div key={m.metodo} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>{METODO_LABEL[m.metodo] || m.metodo}</span>
                  <span style={{ fontWeight: '700' }}>${fmt(m.total)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #000', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Propinas</span>
                <span>${fmt(corte.total_propinas)}</span>
              </div>
              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '13pt' }}>
                <span>TOTAL</span>
                <span>${fmt(corte.total)}</span>
              </div>
              <div style={{ fontSize: '9pt', marginTop: '4px' }}>
                Pagos: {corte.num_pagos}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0', textAlign: 'center', fontSize: '9pt' }}>
                Pretty Face's Beauty Center
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
