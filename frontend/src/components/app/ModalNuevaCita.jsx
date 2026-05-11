import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'

const CATEGORIAS = {
  capilar: 'Capilares', facial: 'Faciales', depilacion: 'Depilación',
  cejas: 'Cejas', lash: 'Lash Lifting', corporal: 'Corporal',
}

export default function ModalNuevaCita({ onClose, onCreated, defaultFecha }) {
  const [clientes, setClientes] = useState([])
  const [empleadas, setEmpleadas] = useState([])
  const [servicios, setServicios] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [empleadaId, setEmpleadaId] = useState('')
  const [fecha, setFecha] = useState(defaultFecha || new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('10:00')
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showClienteDrop, setShowClienteDrop] = useState(false)
  const clienteRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.getEmpleadas(),
      api.getServicios(),
    ]).then(([emps, svcs]) => {
      setEmpleadas(emps)
      setServicios(svcs)
    })
  }, [])

  useEffect(() => {
    if (!busquedaCliente.trim()) { setClientes([]); return }
    const t = setTimeout(async () => {
      const data = await api.getClientes({ busqueda: busquedaCliente, limit: 8 })
      setClientes(data)
    }, 300)
    return () => clearTimeout(t)
  }, [busquedaCliente])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (!clienteRef.current?.contains(e.target)) setShowClienteDrop(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function toggleServicio(svc) {
    setServiciosSeleccionados(prev =>
      prev.find(s => s.id === svc.id)
        ? prev.filter(s => s.id !== svc.id)
        : [...prev, svc]
    )
  }

  const total = serviciosSeleccionados.reduce((s, x) => s + x.precio_base, 0)
  const duracionTotal = serviciosSeleccionados.reduce((s, x) => s + (x.duracion_min || 0), 0)

  function calcHoraFin() {
    if (!hora || !duracionTotal) return null
    const [h, m] = hora.split(':').map(Number)
    const totalMin = h * 60 + m + duracionTotal
    const hf = Math.floor(totalMin / 60).toString().padStart(2, '0')
    const mf = (totalMin % 60).toString().padStart(2, '0')
    return `${fecha}T${hf}:${mf}:00`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clienteId) { setError('Selecciona un cliente'); return }
    if (!empleadaId) { setError('Selecciona una empleada'); return }
    if (!serviciosSeleccionados.length) { setError('Selecciona al menos un servicio'); return }

    setLoading(true); setError('')
    try {
      await api.createCita({
        cliente_id: parseInt(clienteId),
        empleada_id: parseInt(empleadaId),
        fecha: `${fecha}T${hora}:00`,
        hora_fin: calcHoraFin(),
        servicios: serviciosSeleccionados.map(s => ({
          servicio_id: s.id,
          precio_aplicado: s.precio_base,
        })),
        notas: notas || null,
      })
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Group services by category
  const grouped = servicios.reduce((acc, s) => {
    if (!acc[s.categoria]) acc[s.categoria] = []
    acc[s.categoria].push(s)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-xl text-gray-800">Nueva Cita</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div ref={clienteRef} className="relative">
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={busquedaCliente}
              onChange={e => { setBusquedaCliente(e.target.value); setShowClienteDrop(true); setClienteId('') }}
              onFocus={() => setShowClienteDrop(true)}
              className="input-field"
            />
            {showClienteDrop && clientes.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                {clientes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-brand-cream transition-colors"
                    onClick={() => {
                      setClienteId(c.id)
                      setBusquedaCliente(c.nombre)
                      setShowClienteDrop(false)
                    }}
                  >
                    <p className="font-sans text-sm font-medium text-gray-800">{c.nombre}</p>
                    {c.telefono && <p className="font-sans text-xs text-gray-400">{c.telefono}</p>}
                  </button>
                ))}
              </div>
            )}
            {busquedaCliente && !clienteId && clientes.length === 0 && (
              <p className="font-sans text-xs text-gray-400 mt-1">
                No encontrado — <button type="button" className="text-gold hover:underline" onClick={async () => {
                  const c = await api.createCliente({ nombre: busquedaCliente })
                  setClienteId(c.id)
                  setShowClienteDrop(false)
                }}>Crear "{busquedaCliente}"</button>
              </p>
            )}
          </div>

          {/* Empleada + Fecha + Hora */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Empleada *</label>
              <select value={empleadaId} onChange={e => setEmpleadaId(e.target.value)} className="input-field">
                <option value="">Seleccionar...</option>
                {empleadas.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Hora *</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="input-field" required min="10:00" max="19:00" />
            </div>
          </div>

          {/* Servicios */}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-2">
              Servicios * {serviciosSeleccionados.length > 0 && (
                <span className="text-gold ml-2">{serviciosSeleccionados.length} sel. · {duracionTotal}min</span>
              )}
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {Object.entries(grouped).map(([cat, svcs]) => (
                <div key={cat}>
                  <div className="bg-gray-50 px-4 py-2 font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                    {CATEGORIAS[cat] || cat}
                  </div>
                  {svcs.map(svc => {
                    const sel = !!serviciosSeleccionados.find(s => s.id === svc.id)
                    return (
                      <label key={svc.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-brand-cream transition-colors ${sel ? 'bg-gold/5' : ''}`}>
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => toggleServicio(svc)}
                          className="accent-gold w-4 h-4"
                        />
                        <span className="font-sans text-sm text-gray-700 flex-1">{svc.nombre}</span>
                        <span className="font-sans text-sm font-semibold text-gold">
                          ${svc.precio_base.toLocaleString('es-MX')}
                        </span>
                        <span className="font-sans text-xs text-gray-400 w-10 text-right">{svc.duracion_min}min</span>
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              className="input-field resize-none"
              placeholder="Instrucciones especiales, alergias, preferencias..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {total > 0 && (
                <p className="font-sans text-sm text-gray-600">
                  Total estimado: <span className="font-semibold text-gold text-base">${total.toLocaleString('es-MX')}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-outline-gold text-sm px-6 py-2.5">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-gold text-sm px-6 py-2.5 disabled:opacity-60">
                {loading ? 'Agendando...' : 'Agendar Cita'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
