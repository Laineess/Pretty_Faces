import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import TicketRecibo from '../../components/app/TicketRecibo'

const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'otro']
const CATEGORIAS_SVC = { capilar: 'Capilares', facial: 'Faciales', depilacion: 'Depilación', cejas: 'Cejas', lash: 'Lash Lifting', corporal: 'Corporal' }

// ── ModalPago ─────────────────────────────────────────────────────────────────

function ModalPago({ citasSinPago, onClose, onCreated }) {
  const [modo, setModo] = useState('cita') // 'cita' | 'walkin'

  // Modo cita
  const [citaId, setCitaId] = useState('')

  // Modo walk-in
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])
  const [showClienteDrop, setShowClienteDrop] = useState(false)
  const [empleadaId, setEmpleadaId] = useState('')
  const [empleadas, setEmpleadas] = useState([])
  const [servicios, setServicios] = useState([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const clienteRef = useRef(null)

  // Productos (ambos modos)
  const [productos, setProductos] = useState([])
  const [productosSeleccionados, setProductosSeleccionados] = useState([]) // [{...producto, cantidad}]

  // Promociones (walk-in)
  const [promos, setPromos] = useState([])
  const [promoId, setPromoId] = useState('')

  // Comunes
  const [monto, setMonto] = useState('')
  const [propina, setPropina] = useState('0')
  const [metodo, setMetodo] = useState('efectivo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load empleadas, servicios, productos, promos on mount
  useEffect(() => {
    Promise.all([
      api.getEmpleadas(),
      api.getServicios(),
      api.getProductos(),
      api.getPromocionesAdmin(),
    ]).then(([emps, svcs, prods, prms]) => {
      setEmpleadas(emps)
      setServicios(svcs)
      setProductos(prods)
      setPromos(prms.filter(p => p.activa))
    })
  }, [])

  // Client search debounce
  useEffect(() => {
    if (!busquedaCliente.trim()) { setClientes([]); return }
    const t = setTimeout(async () => {
      setClientes(await api.getClientes({ busqueda: busquedaCliente, limit: 8 }))
    }, 300)
    return () => clearTimeout(t)
  }, [busquedaCliente])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (!clienteRef.current?.contains(e.target)) setShowClienteDrop(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Auto-fill monto from cita total
  const citaSel = citasSinPago.find(c => c.id === parseInt(citaId))
  useEffect(() => {
    if (citaSel) {
      const totalSvcs = citaSel.total_servicios || 0
      const totalProds = productosSeleccionados.reduce((s, p) => s + p.precio * p.cantidad, 0)
      setMonto(String(totalSvcs + totalProds))
    }
  }, [citaId, productosSeleccionados])

  // Auto-recalc monto in walk-in mode
  useEffect(() => {
    if (modo === 'walkin') {
      const totalSvcs = serviciosSeleccionados.reduce((s, x) => s + x.precio_base, 0)
      const totalProds = productosSeleccionados.reduce((s, p) => s + p.precio * p.cantidad, 0)
      setMonto(String(totalSvcs + totalProds))
    }
  }, [serviciosSeleccionados, productosSeleccionados, modo])

  function toggleServicio(svc) {
    setServiciosSeleccionados(prev =>
      prev.find(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
    )
  }

  function addProducto(prod) {
    setProductosSeleccionados(prev => {
      const ex = prev.find(p => p.id === prod.id)
      if (ex) return prev.map(p => p.id === prod.id ? { ...p, cantidad: p.cantidad + 1 } : p)
      return [...prev, { ...prod, cantidad: 1 }]
    })
  }

  function removeProducto(id) {
    setProductosSeleccionados(prev => prev.filter(p => p.id !== id))
  }

  function updateCantidad(id, delta) {
    setProductosSeleccionados(prev =>
      prev.map(p => p.id === id ? { ...p, cantidad: Math.max(1, p.cantidad + delta) } : p)
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (modo === 'cita' && !citaId) { setError('Selecciona una cita'); return }
    if (modo === 'walkin' && !clienteId) { setError('Selecciona un cliente'); return }
    if (!monto || parseFloat(monto) <= 0) { setError('Monto inválido'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        monto: parseFloat(monto),
        propina: parseFloat(propina) || 0,
        metodo_pago: metodo,
        productos: productosSeleccionados.map(p => ({
          producto_id: p.id,
          cantidad: p.cantidad,
          precio_aplicado: p.precio,
        })),
      }

      if (modo === 'cita') {
        payload.cita_id = parseInt(citaId)
      } else {
        payload.cliente_id = clienteId
        if (empleadaId) payload.empleada_id = parseInt(empleadaId)
        payload.servicios = serviciosSeleccionados.map(s => ({
          servicio_id: s.id,
          precio_aplicado: s.precio_base,
        }))
        if (promoId) {
          const promo = promos.find(p => p.id === parseInt(promoId))
          if (promo) payload.notas = `Promoción: ${promo.nombre}`
        }
      }

      const pago = await api.registrarPago(payload)
      onCreated(pago)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupedSvcs = servicios.reduce((acc, s) => {
    if (!acc[s.categoria]) acc[s.categoria] = []
    acc[s.categoria].push(s)
    return acc
  }, {})

  const groupedProds = productos.reduce((acc, p) => {
    const cat = p.categoria || 'Otros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const totalProductos = productosSeleccionados.reduce((s, p) => s + p.precio * p.cantidad, 0)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="font-serif text-xl text-gray-800">Registrar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
          )}

          {/* Modo toggle */}
          <div className="flex gap-2">
            {[['cita', 'Con cita previa'], ['walkin', 'Cliente sin cita']].map(([val, label]) => (
              <button
                key={val} type="button"
                onClick={() => { setModo(val); setError('') }}
                className={`flex-1 py-2.5 rounded-xl font-sans text-sm font-medium transition-colors
                  ${modo === val ? 'bg-gold text-white' : 'border border-gray-200 text-gray-600 hover:border-gold hover:text-gold'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Modo cita ── */}
          {modo === 'cita' && (
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Cita *</label>
              {citasSinPago.length === 0 ? (
                <p className="font-sans text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                  No hay citas pendientes de cobro
                </p>
              ) : (
                <select value={citaId} onChange={e => setCitaId(e.target.value)} className="input-field">
                  <option value="">Seleccionar cita...</option>
                  {citasSinPago.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.cliente} · {new Date(c.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · ${c.total_servicios.toLocaleString('es-MX')}
                    </option>
                  ))}
                </select>
              )}
              {citaSel && (
                <p className="font-sans text-xs text-gray-400 mt-1">Atendida por: {citaSel.empleada}</p>
              )}
            </div>
          )}

          {/* ── Modo walk-in ── */}
          {modo === 'walkin' && (
            <>
              {/* Client search */}
              <div ref={clienteRef} className="relative">
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
                <input
                  type="text"
                  value={busquedaCliente}
                  onChange={e => { setBusquedaCliente(e.target.value); setShowClienteDrop(true); setClienteId('') }}
                  onFocus={() => setShowClienteDrop(true)}
                  className="input-field"
                  placeholder="Buscar por nombre o teléfono..."
                />
                {showClienteDrop && clientes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto mt-1">
                    {clientes.map(c => (
                      <button key={c.id} type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-brand-cream"
                        onClick={() => { setClienteId(c.id); setBusquedaCliente(c.nombre); setShowClienteDrop(false) }}
                      >
                        <p className="font-sans text-sm font-medium text-gray-800">{c.nombre}</p>
                        {c.telefono && <p className="font-sans text-xs text-gray-400">{c.telefono}</p>}
                      </button>
                    ))}
                  </div>
                )}
                {busquedaCliente && !clienteId && clientes.length === 0 && (
                  <p className="font-sans text-xs text-gray-400 mt-1">
                    No encontrado —{' '}
                    <button type="button" className="text-gold hover:underline" onClick={async () => {
                      const c = await api.createCliente({ nombre: busquedaCliente })
                      setClienteId(c.id)
                      setShowClienteDrop(false)
                    }}>
                      Registrar "{busquedaCliente}"
                    </button>
                  </p>
                )}
              </div>

              {/* Employee */}
              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Profesional</label>
                <select value={empleadaId} onChange={e => setEmpleadaId(e.target.value)} className="input-field">
                  <option value="">Seleccionar...</option>
                  {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              {/* Promo */}
              {promos.length > 0 && (
                <div>
                  <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Promoción aplicada</label>
                  <select value={promoId} onChange={e => setPromoId(e.target.value)} className="input-field">
                    <option value="">Sin promoción</option>
                    {promos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Services */}
              <div>
                <label className="block font-sans text-sm font-medium text-gray-700 mb-2">
                  Servicios
                  {serviciosSeleccionados.length > 0 && (
                    <span className="text-gold ml-2 font-normal">{serviciosSeleccionados.length} sel.</span>
                  )}
                </label>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {Object.entries(groupedSvcs).map(([cat, svcs]) => (
                    <div key={cat}>
                      <div className="bg-gray-50 px-3 py-1.5 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                        {CATEGORIAS_SVC[cat] || cat}
                      </div>
                      {svcs.map(svc => {
                        const sel = !!serviciosSeleccionados.find(s => s.id === svc.id)
                        return (
                          <label key={svc.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-cream ${sel ? 'bg-gold/5' : ''}`}>
                            <input type="checkbox" checked={sel} onChange={() => toggleServicio(svc)} className="accent-gold w-4 h-4" />
                            <span className="font-sans text-sm text-gray-700 flex-1">{svc.nombre}</span>
                            <span className="font-sans text-sm font-semibold text-gold">${svc.precio_base.toLocaleString('es-MX')}</span>
                          </label>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Productos (ambos modos) ── */}
          {productos.length > 0 && (
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-2">
                Productos vendidos
                {productosSeleccionados.length > 0 && (
                  <span className="text-gold ml-2 font-normal">{productosSeleccionados.length} sel. · ${totalProductos.toLocaleString('es-MX')}</span>
                )}
              </label>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {Object.entries(groupedProds).map(([cat, prods]) => (
                  <div key={cat}>
                    {Object.keys(groupedProds).length > 1 && (
                      <div className="bg-gray-50 px-3 py-1.5 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                        {cat}
                      </div>
                    )}
                    {prods.map(prod => {
                      const sel = productosSeleccionados.find(p => p.id === prod.id)
                      return (
                        <div key={prod.id} className={`flex items-center gap-3 px-3 py-2 hover:bg-brand-cream transition-colors ${sel ? 'bg-gold/5' : ''}`}>
                          <input
                            type="checkbox" checked={!!sel}
                            onChange={() => sel ? removeProducto(prod.id) : addProducto(prod)}
                            className="accent-gold w-4 h-4"
                          />
                          <span className="font-sans text-sm text-gray-700 flex-1">{prod.nombre}</span>
                          {sel && (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => updateCantidad(prod.id, -1)}
                                className="w-5 h-5 rounded text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold">−</button>
                              <span className="font-sans text-xs w-5 text-center font-medium">{sel.cantidad}</span>
                              <button type="button" onClick={() => updateCantidad(prod.id, 1)}
                                className="w-5 h-5 rounded text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold">+</button>
                            </div>
                          )}
                          <span className="font-sans text-sm font-semibold text-gold">${prod.precio.toLocaleString('es-MX')}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monto + Propina */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Monto *</label>
              <input
                type="number" min="0" step="0.01"
                value={monto} onChange={e => setMonto(e.target.value)}
                className="input-field" placeholder="0.00" required
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Propina</label>
              <input
                type="number" min="0" step="0.01"
                value={propina} onChange={e => setPropina(e.target.value)}
                className="input-field" placeholder="0.00"
              />
            </div>
          </div>

          {/* Método */}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Método de pago</label>
            <div className="flex gap-2">
              {METODOS.map(m => (
                <button key={m} type="button" onClick={() => setMetodo(m)}
                  className={`flex-1 py-2 rounded-xl font-sans text-xs font-medium capitalize transition-colors
                    ${metodo === m ? 'bg-gold text-white' : 'border border-gray-200 text-gray-600 hover:border-gold hover:text-gold'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Total preview */}
          {monto && (
            <div className="bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 font-sans text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${parseFloat(monto || 0).toLocaleString('es-MX')}</span></div>
              {parseFloat(propina) > 0 && (
                <div className="flex justify-between text-gray-500 mt-1"><span>Propina</span><span>${parseFloat(propina).toLocaleString('es-MX')}</span></div>
              )}
              <div className="flex justify-between font-semibold text-gold mt-2 pt-2 border-t border-gold/20">
                <span>Total</span>
                <span>${(parseFloat(monto || 0) + parseFloat(propina || 0)).toLocaleString('es-MX')}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
              {loading ? 'Registrando...' : 'Registrar y Ver Recibo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const METODO_ICONS = { efectivo: '💵', tarjeta: '💳', transferencia: '🏦', otro: '📋' }

export default function Ingresos() {
  const [pagos, setPagos] = useState([])
  const [citasSinPago, setCitasSinPago] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ticketPago, setTicketPago] = useState(null)
  const [fechaInicio, setFechaInicio] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        api.getPagos({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
        api.getCitasSinPago(),
      ])
      setPagos(p)
      setCitasSinPago(c)
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => { fetchData() }, [fetchData])

  const totalIngresos = pagos.reduce((s, p) => s + p.monto + p.propina, 0)
  const totalPropinas = pagos.reduce((s, p) => s + p.propina, 0)

  function handlePagoCreado(pago) {
    setShowModal(false)
    setTicketPago(pago)
    fetchData()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Ingresos</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">
            {citasSinPago.length > 0 && (
              <span className="text-amber-500 font-medium">{citasSinPago.length} cita{citasSinPago.length !== 1 ? 's' : ''} pendiente{citasSinPago.length !== 1 ? 's' : ''} · </span>
            )}
            Historial de pagos
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Pago
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total ingresos', value: totalIngresos, sub: `${pagos.length} pagos` },
          { label: 'Total propinas', value: totalPropinas, sub: 'del período' },
          { label: 'Promedio por pago', value: pagos.length ? totalIngresos / pagos.length : 0, sub: 'incluye propina' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-sans text-xs text-gray-400 mb-1">{card.label}</p>
            <p className="font-serif text-2xl text-gray-800">${card.value.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</p>
            <p className="font-sans text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="font-sans text-sm text-gray-500">Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30" />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-sans text-sm text-gray-500">Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-sans text-sm text-gray-400">Cargando...</div>
        ) : pagos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-sans text-sm text-gray-400">No hay pagos registrados en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Fecha', 'Cliente', 'Profesional', 'Monto', 'Propina', 'Total', 'Método', 'Recibo'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-brand-cream transition-colors">
                  <td className="px-4 py-3 font-sans text-sm text-gray-600">
                    {new Date(p.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-sans text-sm font-medium text-gray-800">{p.cliente_nombre || '—'}</td>
                  <td className="px-4 py-3 font-sans text-sm text-gray-600">{p.empleada_nombre || '—'}</td>
                  <td className="px-4 py-3 font-sans text-sm text-gray-700">${p.monto.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 font-sans text-sm text-gray-500">{p.propina > 0 ? `$${p.propina.toLocaleString('es-MX')}` : '—'}</td>
                  <td className="px-4 py-3 font-sans text-sm font-semibold text-gold">${(p.monto + p.propina).toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 font-sans text-sm text-gray-600 capitalize">
                    {METODO_ICONS[p.metodo_pago] || ''} {p.metodo_pago}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setTicketPago(p)}
                      className="font-sans text-xs text-gold hover:underline">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalPago
          citasSinPago={citasSinPago}
          onClose={() => setShowModal(false)}
          onCreated={handlePagoCreado}
        />
      )}

      {ticketPago && (
        <TicketRecibo
          pago={ticketPago}
          onClose={() => setTicketPago(null)}
        />
      )}
    </div>
  )
}
