import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import ModalNuevaCita from '../../components/app/ModalNuevaCita'

const HOUR_START = 10
const HOUR_END = 19
const PX_PER_MIN = 1.5
const CONTAINER_H = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN

const EMP_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', hex: '#7c3aed' },
  { bg: 'bg-sky-100',    text: 'text-sky-700',    border: 'border-sky-300',    hex: '#0369a1' },
  { bg: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-300',   hex: '#be123c' },
  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  hex: '#b45309' },
  { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-300',hex: '#065f46' },
  { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-300',   hex: '#9d174d' },
]

const ESTADO_STYLES = {
  pendiente:  { dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50',  label: 'Pendiente'  },
  confirmada: { dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',    label: 'Confirmada' },
  en_curso:   { dot: 'bg-purple-400', text: 'text-purple-700', bg: 'bg-purple-50',  label: 'En curso'   },
  completada: { dot: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50',   label: 'Completada' },
  cancelada:  { dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-50',    label: 'Cancelada'  },
}

const ESTADO_TRANSITIONS = {
  pendiente:  ['confirmada', 'cancelada'],
  confirmada: ['en_curso', 'cancelada'],
  en_curso:   ['completada', 'cancelada'],
  completada: [],
  cancelada:  [],
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function getMonday(d) {
  const dt = new Date(d)
  const day = dt.getDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  dt.setHours(0, 0, 0, 0)
  return dt
}

function addDays(d, n) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt
}

function toISODate(d) {
  return d.toISOString().split('T')[0]
}

function fmtShort(d) {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function fmtHora(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function citaStyle(cita) {
  const d = new Date(cita.fecha)
  const mins = (d.getHours() - HOUR_START) * 60 + d.getMinutes()
  const top = mins * PX_PER_MIN

  let duracion = 0
  if (cita.hora_fin) {
    const df = new Date(cita.hora_fin)
    duracion = (df - d) / 60000
  }
  const height = Math.max(duracion * PX_PER_MIN, 24)

  return { top, height }
}

function EstadoBadge({ estado, small }) {
  const s = ESTADO_STYLES[estado] || ESTADO_STYLES.pendiente
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans font-medium
      ${small ? 'text-xs' : 'text-xs'} ${s.text} ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function ModalDetalleCita({ cita, empColor, onClose, onEstadoChanged }) {
  const [loading, setLoading] = useState(false)
  const transitions = ESTADO_TRANSITIONS[cita.estado] || []

  async function cambiarEstado(nuevoEstado) {
    setLoading(true)
    try {
      await api.updateCitaEstado(cita.id, nuevoEstado)
      onEstadoChanged()
    } finally {
      setLoading(false)
    }
  }

  const totalServicios = cita.servicios?.reduce((s, x) => s + x.precio_aplicado, 0) ?? 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header with color bar */}
        <div className={`h-1.5 rounded-t-2xl`} style={{ background: empColor?.hex || '#C9A84C' }} />
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-gray-800">{cita.cliente?.nombre}</h3>
            <p className="font-sans text-xs text-gray-400 mt-0.5">{cita.empleada?.nombre}</p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={cita.estado} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Fecha/hora */}
          <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            {new Date(cita.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            {fmtHora(cita.fecha)}
            {cita.hora_fin && ` — ${fmtHora(cita.hora_fin)}`}
          </div>

          {/* Servicios */}
          {cita.servicios?.length > 0 && (
            <div className="space-y-1">
              {cita.servicios.map((s, i) => (
                <div key={i} className="flex justify-between font-sans text-sm">
                  <span className="text-gray-700">{s.servicio?.nombre ?? `Servicio #${s.servicio_id}`}</span>
                  <span className="text-gold font-medium">${s.precio_aplicado.toLocaleString('es-MX')}</span>
                </div>
              ))}
              <div className="flex justify-between font-sans text-sm font-semibold pt-1 border-t border-gray-100">
                <span className="text-gray-600">Total</span>
                <span className="text-gold">${totalServicios.toLocaleString('es-MX')}</span>
              </div>
            </div>
          )}

          {cita.notas && (
            <p className="font-sans text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{cita.notas}</p>
          )}

          {/* Estado transitions */}
          {transitions.length > 0 && (
            <div className="flex gap-2 pt-2">
              {transitions.map(t => (
                <button
                  key={t}
                  disabled={loading}
                  onClick={() => cambiarEstado(t)}
                  className={`flex-1 py-2 rounded-xl font-sans text-sm font-medium transition-colors
                    ${t === 'cancelada'
                      ? 'border border-red-200 text-red-500 hover:bg-red-50'
                      : 'bg-gold text-white hover:bg-gold/90'
                    } disabled:opacity-60`}
                >
                  {ESTADO_STYLES[t]?.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Citas() {
  const [view, setView] = useState(() => window.innerWidth < 768 ? 'lista' : 'semana')
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [citas, setCitas] = useState([])
  const [empleadas, setEmpleadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNuevaCita, setShowNuevaCita] = useState(false)
  const [defaultFecha, setDefaultFecha] = useState(null)
  const [selectedCita, setSelectedCita] = useState(null)
  const [filtroEmpleada, setFiltroEmpleada] = useState('')

  const weekEnd = addDays(weekStart, 6)

  const empColorMap = empleadas.reduce((acc, e, i) => {
    acc[e.id] = EMP_COLORS[i % EMP_COLORS.length]
    return acc
  }, {})

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        fecha_inicio: toISODate(weekStart),
        fecha_fin: toISODate(weekEnd),
      }
      if (filtroEmpleada) params.empleada_id = filtroEmpleada
      const data = await api.getCitas(params)
      setCitas(data)
    } finally {
      setLoading(false)
    }
  }, [weekStart, filtroEmpleada])

  useEffect(() => {
    api.getEmpleadas().then(setEmpleadas)
  }, [])

  useEffect(() => {
    fetchCitas()
  }, [fetchCitas])

  function prevWeek() { setWeekStart(d => addDays(d, -7)) }
  function nextWeek() { setWeekStart(d => addDays(d, 7)) }
  function goToday() { setWeekStart(getMonday(new Date())) }

  function getCitasForDay(dayIndex) {
    const dayDate = toISODate(addDays(weekStart, dayIndex))
    return citas.filter(c => c.fecha?.startsWith(dayDate))
  }

  function handleSlotClick(dateStr) {
    setDefaultFecha(dateStr)
    setShowNuevaCita(true)
  }

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Citas</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">
            {fmtShort(weekStart)} — {fmtShort(weekEnd)}
          </p>
        </div>
        <button
          onClick={() => { setDefaultFecha(null); setShowNuevaCita(true) }}
          className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cita
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
        {/* Week nav */}
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goToday} className="px-3 py-1 text-xs font-sans font-medium text-gold border border-gold rounded-lg hover:bg-gold hover:text-white transition-colors">
            Hoy
          </button>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Empleada filter */}
        <select
          value={filtroEmpleada}
          onChange={e => setFiltroEmpleada(e.target.value)}
          className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30 text-gray-700"
        >
          <option value="">Todas las empleadas</option>
          {empleadas.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setView('semana')}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-colors
              ${view === 'semana' ? 'bg-gold text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Semana
          </button>
          <button
            onClick={() => setView('lista')}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-colors
              ${view === 'lista' ? 'bg-gold text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Employee color legend */}
      {empleadas.length > 0 && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {empleadas.map((e, i) => {
            const col = EMP_COLORS[i % EMP_COLORS.length]
            return (
              <span key={e.id} className="flex items-center gap-1.5 font-sans text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: col.hex }} />
                {e.nombre}
              </span>
            )
          })}
        </div>
      )}

      {view === 'semana' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="py-3" /> {/* time gutter */}
            {DIAS.map((d, i) => {
              const dayDate = addDays(weekStart, i)
              const isToday = toISODate(dayDate) === toISODate(new Date())
              return (
                <div key={i} className={`py-3 text-center border-l border-gray-100 ${isToday ? 'bg-gold/5' : ''}`}>
                  <p className={`font-sans text-xs font-medium ${isToday ? 'text-gold' : 'text-gray-400'}`}>{d}</p>
                  <p className={`font-sans text-sm font-semibold mt-0.5 ${isToday ? 'text-gold' : 'text-gray-700'}`}>
                    {dayDate.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Calendar body */}
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-8" style={{ height: CONTAINER_H }}>
              {/* Time gutter */}
              <div className="relative border-r border-gray-100">
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-gray-100 flex items-start"
                    style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }}
                  >
                    <span className="font-sans text-xs text-gray-400 pl-2 pt-1 leading-none">{h}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DIAS.map((_, dayIndex) => {
                const dayDate = addDays(weekStart, dayIndex)
                const dayDateStr = toISODate(dayDate)
                const isToday = dayDateStr === toISODate(new Date())
                const dayCitas = getCitasForDay(dayIndex)

                return (
                  <div
                    key={dayIndex}
                    className={`relative border-l border-gray-100 cursor-pointer ${isToday ? 'bg-gold/5' : ''}`}
                    onClick={() => handleSlotClick(dayDateStr)}
                  >
                    {/* Hour lines */}
                    {hours.map(h => (
                      <div
                        key={h}
                        className="absolute w-full border-t border-gray-100 pointer-events-none"
                        style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }}
                      />
                    ))}
                    {/* Half-hour lines */}
                    {hours.map(h => (
                      <div
                        key={`h${h}`}
                        className="absolute w-full border-t border-dashed border-gray-50 pointer-events-none"
                        style={{ top: ((h - HOUR_START) * 60 + 30) * PX_PER_MIN }}
                      />
                    ))}

                    {/* Appointments */}
                    {dayCitas.map(cita => {
                      const { top, height } = citaStyle(cita)
                      const col = empColorMap[cita.empleada_id] || EMP_COLORS[0]
                      const isCancelled = cita.estado === 'cancelada'
                      return (
                        <div
                          key={cita.id}
                          onClick={e => { e.stopPropagation(); setSelectedCita(cita) }}
                          className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 cursor-pointer
                            border-l-2 overflow-hidden hover:opacity-90 transition-opacity
                            ${col.bg} ${col.border} ${isCancelled ? 'opacity-40' : ''}`}
                          style={{ top, height, minHeight: 24 }}
                        >
                          <p className={`font-sans text-xs font-semibold leading-tight truncate ${col.text}`}>
                            {cita.cliente?.nombre}
                          </p>
                          {height > 30 && (
                            <p className={`font-sans text-xs leading-tight truncate ${col.text} opacity-75`}>
                              {fmtHora(cita.fecha)}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Lista view */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center font-sans text-sm text-gray-400">Cargando...</div>
          ) : citas.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-sans text-sm text-gray-400">No hay citas para esta semana</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
          <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha', 'Hora', 'Cliente', 'Empleada', 'Servicios', 'Total', 'Estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...citas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map(cita => {
                  const col = empColorMap[cita.empleada_id] || EMP_COLORS[0]
                  const total = cita.servicios?.reduce((s, x) => s + x.precio_aplicado, 0) ?? 0
                  return (
                    <tr
                      key={cita.id}
                      onClick={() => setSelectedCita(cita)}
                      className="border-b border-gray-50 hover:bg-brand-cream cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-sans text-sm text-gray-700">
                        {new Date(cita.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-sans text-sm text-gray-600">{fmtHora(cita.fecha)}</td>
                      <td className="px-4 py-3 font-sans text-sm font-medium text-gray-800">{cita.cliente?.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-sans text-xs font-medium ${col.bg} ${col.text}`}>
                          {cita.empleada?.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-gray-500">
                        {cita.servicios?.map(s => s.servicio?.nombre).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 font-sans text-sm font-semibold text-gold">
                        ${total.toLocaleString('es-MX')}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={cita.estado} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {showNuevaCita && (
        <ModalNuevaCita
          onClose={() => setShowNuevaCita(false)}
          onCreated={() => { setShowNuevaCita(false); fetchCitas() }}
          defaultFecha={defaultFecha}
        />
      )}

      {selectedCita && (
        <ModalDetalleCita
          cita={selectedCita}
          empColor={empColorMap[selectedCita.empleada_id]}
          onClose={() => setSelectedCita(null)}
          onEstadoChanged={() => { setSelectedCita(null); fetchCitas() }}
        />
      )}
    </div>
  )
}
