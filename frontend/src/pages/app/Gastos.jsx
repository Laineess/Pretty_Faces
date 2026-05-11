import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'

const CATEGORIAS_GASTO = [
  'productos', 'equipos', 'renta', 'servicios', 'nomina', 'marketing', 'limpieza', 'otro'
]

function ModalGasto({ onClose, onCreated }) {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('otro')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!concepto.trim()) { setError('Ingresa un concepto'); return }
    if (!monto || parseFloat(monto) <= 0) { setError('Monto inválido'); return }
    setLoading(true); setError('')
    try {
      await api.registrarGasto({
        concepto: concepto.trim(),
        monto: parseFloat(monto),
        categoria,
        fecha: `${fecha}T12:00:00`,
        notas: notas || null,
      })
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-xl text-gray-800">Registrar Gasto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
          )}

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Concepto *</label>
            <input
              type="text" value={concepto} onChange={e => setConcepto(e.target.value)}
              className="input-field" placeholder="Ej: Tinte Schwarzkopf, Renta local..." required
            />
          </div>

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
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_GASTO.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setCategoria(c)}
                  className={`px-3 py-1.5 rounded-xl font-sans text-xs font-medium capitalize transition-colors
                    ${categoria === c ? 'bg-gold text-white' : 'border border-gray-200 text-gray-600 hover:border-gold hover:text-gold'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
            <textarea
              value={notas} onChange={e => setNotas(e.target.value)}
              rows={2} className="input-field resize-none" placeholder="Detalles adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
              {loading ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CAT_COLORS = {
  productos:   'bg-blue-50 text-blue-700',
  equipos:     'bg-purple-50 text-purple-700',
  renta:       'bg-orange-50 text-orange-700',
  servicios:   'bg-cyan-50 text-cyan-700',
  nomina:      'bg-rose-50 text-rose-700',
  marketing:   'bg-pink-50 text-pink-700',
  limpieza:    'bg-emerald-50 text-emerald-700',
  otro:        'bg-gray-50 text-gray-600',
}

export default function Gastos() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])

  const fetchGastos = useCallback(async () => {
    setLoading(true)
    try {
      const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      if (filtroCategoria) params.categoria = filtroCategoria
      setGastos(await api.getGastos(params))
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin, filtroCategoria])

  useEffect(() => { fetchGastos() }, [fetchGastos])

  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)

  const porCategoria = gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Gastos</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">Control de egresos del negocio</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Gasto
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-1">
          <p className="font-sans text-xs text-gray-400 mb-1">Total gastos</p>
          <p className="font-serif text-2xl text-gray-800">${totalGastos.toLocaleString('es-MX')}</p>
          <p className="font-sans text-xs text-gray-400 mt-1">{gastos.length} registros</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-3">
          <p className="font-sans text-xs text-gray-400 mb-3">Por categoría</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
              <span key={cat} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium ${CAT_COLORS[cat] || CAT_COLORS.otro}`}>
                {cat} · ${total.toLocaleString('es-MX')}
              </span>
            ))}
            {Object.keys(porCategoria).length === 0 && <span className="font-sans text-xs text-gray-400">Sin datos</span>}
          </div>
        </div>
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
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30 text-gray-700">
          <option value="">Todas las categorías</option>
          {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-sans text-sm text-gray-400">Cargando...</div>
        ) : gastos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-sans text-sm text-gray-400">No hay gastos registrados en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Fecha', 'Concepto', 'Categoría', 'Monto', 'Notas'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gastos.map(g => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-brand-cream transition-colors">
                  <td className="px-4 py-3 font-sans text-sm text-gray-600">
                    {new Date(g.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-sans text-sm font-medium text-gray-800">{g.concepto}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full font-sans text-xs font-medium capitalize ${CAT_COLORS[g.categoria] || CAT_COLORS.otro}`}>
                      {g.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm font-semibold text-red-500">${g.monto.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 font-sans text-xs text-gray-400">{g.notas || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalGasto
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchGastos() }}
        />
      )}
    </div>
  )
}
