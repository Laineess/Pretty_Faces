import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import ModalObservaciones from '../../components/app/ModalObservaciones'

const ESTADO_STYLES = {
  pendiente:  { bg: 'bg-gray-100',    text: 'text-gray-600',   label: 'Pendiente' },
  confirmada: { bg: 'bg-blue-100',    text: 'text-blue-700',   label: 'Confirmada' },
  en_curso:   { bg: 'bg-amber-100',   text: 'text-amber-700',  label: 'En curso' },
  completada: { bg: 'bg-emerald-100', text: 'text-emerald-700',label: 'Completada' },
  cancelada:  { bg: 'bg-red-100',     text: 'text-red-500',    label: 'Cancelada' },
}

function fmtHora(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtFechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

function startOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const HOUR_START = 8
const HOUR_END = 20
const PX_PER_MIN = 1.5
const CONTAINER_H = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN

function citaStyle(cita) {
  const start = new Date(cita.fecha)
  const end = cita.hora_fin ? new Date(cita.hora_fin) : new Date(start.getTime() + 60 * 60000)
  const topMin = (start.getHours() - HOUR_START) * 60 + start.getMinutes()
  const durMin = (end - start) / 60000
  return {
    top: Math.max(0, topMin * PX_PER_MIN),
    height: Math.max(24, durMin * PX_PER_MIN),
  }
}

function ModalDetalle({ cita, onClose, onUpdated }) {
  const [modal, setModal] = useState(null) // 'antes' | 'despues'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const est = ESTADO_STYLES[cita.estado] || ESTADO_STYLES.pendiente
  const canIniciar = ['pendiente', 'confirmada'].includes(cita.estado)
  const canFinalizar = cita.estado === 'en_curso'

  async function handleObservaciones(observaciones) {
    setLoading(true)
    setError('')
    try {
      let updated
      if (modal === 'antes') {
        updated = await api.iniciarCita(cita.id, observaciones)
      } else {
        updated = await api.finalizarCita(cita.id, observaciones)
      }
      setModal(null)
      onUpdated(updated)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const antesFotos = cita.observaciones?.filter(o => o.tipo === 'antes') || []
  const despuesFotos = cita.observaciones?.filter(o => o.tipo === 'despues') || []

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl text-gray-800">{cita.cliente?.nombre}</h2>
              <p className="font-sans text-xs text-gray-400 mt-0.5">
                {fmtFechaCorta(cita.fecha)} · {fmtHora(cita.fecha)}
                {cita.hora_fin && ` – ${fmtHora(cita.hora_fin)}`}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
            )}

            {/* Estado badge */}
            <span className={`inline-block font-sans text-xs font-semibold px-3 py-1 rounded-full ${est.bg} ${est.text}`}>
              {est.label}
            </span>

            {/* Servicios */}
            {cita.servicios?.length > 0 && (
              <div>
                <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Servicios</p>
                <div className="space-y-1">
                  {cita.servicios.map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="font-sans text-sm text-gray-700">{s.servicio?.nombre}</span>
                      <span className="font-sans text-sm font-semibold text-gold">${s.precio_aplicado.toLocaleString('es-MX')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            {cita.notas && (
              <div>
                <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notas</p>
                <p className="font-sans text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{cita.notas}</p>
              </div>
            )}

            {/* Fotos antes */}
            {antesFotos.length > 0 && (
              <div>
                <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fotos Antes</p>
                <div className="grid grid-cols-3 gap-2">
                  {antesFotos.map(obs => obs.foto_data && (
                    <img key={obs.id} src={obs.foto_data} className="w-full h-20 object-cover rounded-xl" alt="" />
                  ))}
                </div>
                {antesFotos.some(o => o.observacion) && (
                  <div className="mt-2 space-y-1">
                    {antesFotos.filter(o => o.observacion).map(obs => (
                      <p key={obs.id} className="font-sans text-xs text-gray-500">• {obs.observacion}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fotos después */}
            {despuesFotos.length > 0 && (
              <div>
                <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fotos Después</p>
                <div className="grid grid-cols-3 gap-2">
                  {despuesFotos.map(obs => obs.foto_data && (
                    <img key={obs.id} src={obs.foto_data} className="w-full h-20 object-cover rounded-xl" alt="" />
                  ))}
                </div>
                {despuesFotos.some(o => o.observacion) && (
                  <div className="mt-2 space-y-1">
                    {despuesFotos.filter(o => o.observacion).map(obs => (
                      <p key={obs.id} className="font-sans text-xs text-gray-500">• {obs.observacion}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 space-y-2">
            {canIniciar && (
              <button
                onClick={() => setModal('antes')}
                disabled={loading}
                className="w-full btn-gold text-sm py-2.5 disabled:opacity-60"
              >
                Iniciar Servicio →
              </button>
            )}
            {canFinalizar && (
              <button
                onClick={() => setModal('despues')}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-sans text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
              >
                Finalizar Servicio ✓
              </button>
            )}
            <button onClick={onClose} className="w-full btn-outline-gold text-sm py-2.5">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <ModalObservaciones
          tipo={modal}
          citaNombre={cita.cliente?.nombre}
          onClose={() => setModal(null)}
          onConfirm={handleObservaciones}
        />
      )}
    </>
  )
}

export default function MiAgenda() {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedCita, setSelectedCita] = useState(null)
  const [view, setView] = useState(() => window.innerWidth < 768 ? 'lista' : 'semana')

  const weekEnd = addDays(weekStart, 6)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getMisCitas({
        fecha_inicio: toLocalDateStr(weekStart),
        fecha_fin: toLocalDateStr(weekEnd),
      })
      setCitas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  function handleUpdated(updated) {
    setCitas(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedCita(updated)
  }

  const prevWeek = () => setWeekStart(w => addDays(w, -7))
  const nextWeek = () => setWeekStart(w => addDays(w, 7))
  const goToday = () => setWeekStart(startOfWeek(new Date()))

  const citasByDay = days.map(day => ({
    day,
    citas: citas.filter(c => {
      const d = new Date(c.fecha)
      return d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
    }),
  }))

  const today = new Date()

  const pendientes = citas.filter(c => ['pendiente', 'confirmada'].includes(c.estado)).length
  const enCurso = citas.filter(c => c.estado === 'en_curso').length
  const completadas = citas.filter(c => c.estado === 'completada').length

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Mi Agenda</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">
            {citas.length} cita{citas.length !== 1 ? 's' : ''} esta semana
            {pendientes > 0 && ` · ${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`}
            {enCurso > 0 && ` · ${enCurso} en curso`}
            {completadas > 0 && ` · ${completadas} completada${completadas !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(v => v === 'semana' ? 'lista' : 'semana')}
            className="border border-gray-200 text-gray-500 hover:text-gold hover:border-gold font-sans text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            {view === 'semana' ? 'Lista' : 'Calendario'}
          </button>
        </div>
      </div>

      {/* Week nav */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goToday} className="font-sans text-xs font-medium text-gray-600 hover:text-gold px-2 py-1 rounded-lg transition-colors">
            Hoy
          </button>
          <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="font-sans text-sm text-gray-700 font-medium">
          {weekStart.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
          {' – '}
          {weekEnd.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center font-sans text-sm text-gray-400">
          Cargando...
        </div>
      ) : view === 'lista' ? (
        /* ── LIST VIEW ── */
        <div className="space-y-3">
          {citas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="font-sans text-sm text-gray-400">No tienes citas esta semana</p>
            </div>
          ) : (
            citasByDay.map(({ day, citas: dayCitas }) => dayCitas.length > 0 && (
              <div key={toLocalDateStr(day)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {day.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {dayCitas.map(cita => {
                    const est = ESTADO_STYLES[cita.estado] || ESTADO_STYLES.pendiente
                    return (
                      <button
                        key={cita.id}
                        onClick={() => setSelectedCita(cita)}
                        className="w-full text-left px-5 py-3 hover:bg-brand-cream transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-sans text-sm font-semibold text-gray-800">{cita.cliente?.nombre}</p>
                            <p className="font-sans text-xs text-gray-400 mt-0.5">
                              {fmtHora(cita.fecha)}{cita.hora_fin && ` – ${fmtHora(cita.hora_fin)}`}
                              {cita.servicios?.length > 0 && ` · ${cita.servicios.map(s => s.servicio?.nombre).join(', ')}`}
                            </p>
                          </div>
                          <span className={`font-sans text-xs font-semibold px-2.5 py-1 rounded-full ${est.bg} ${est.text}`}>
                            {est.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── CALENDAR VIEW ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div className="border-r border-gray-100" />
            {days.map(day => {
              const isToday = toLocalDateStr(day) === toLocalDateStr(today)
              return (
                <div key={toLocalDateStr(day)} className="px-2 py-3 text-center border-r border-gray-100 last:border-0">
                  <p className={`font-sans text-xs uppercase tracking-wider ${isToday ? 'text-gold font-semibold' : 'text-gray-400'}`}>
                    {day.toLocaleDateString('es-MX', { weekday: 'short' })}
                  </p>
                  <p className={`font-sans text-lg font-semibold mt-0.5 leading-none ${isToday ? 'text-gold' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="relative overflow-y-auto" style={{ maxHeight: '600px' }}>
            <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', height: CONTAINER_H }}>
              {/* Hour labels */}
              <div className="relative border-r border-gray-100">
                {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full flex items-start justify-end pr-2"
                    style={{ top: i * 60 * PX_PER_MIN, height: 60 * PX_PER_MIN }}
                  >
                    <span className="font-sans text-[10px] text-gray-300 leading-none pt-0.5">
                      {String(HOUR_START + i).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => {
                const dayCitas = citas.filter(c => {
                  const d = new Date(c.fecha)
                  return d.getFullYear() === day.getFullYear() &&
                    d.getMonth() === day.getMonth() &&
                    d.getDate() === day.getDate()
                })
                const isToday = toLocalDateStr(day) === toLocalDateStr(today)
                return (
                  <div key={toLocalDateStr(day)} className={`relative border-r border-gray-100 last:border-0 ${isToday ? 'bg-gold/5' : ''}`}
                    style={{ height: CONTAINER_H }}>
                    {/* Hour lines */}
                    {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                      <div key={i} className="absolute w-full border-t border-gray-100"
                        style={{ top: i * 60 * PX_PER_MIN }} />
                    ))}
                    {/* Citas */}
                    {dayCitas.map(cita => {
                      const { top, height } = citaStyle(cita)
                      const est = ESTADO_STYLES[cita.estado] || ESTADO_STYLES.pendiente
                      return (
                        <button
                          key={cita.id}
                          onClick={() => setSelectedCita(cita)}
                          className={`absolute inset-x-0.5 rounded-lg px-1.5 py-1 text-left overflow-hidden hover:opacity-90 transition-opacity ${est.bg}`}
                          style={{ top, height }}
                        >
                          <p className={`font-sans text-[10px] font-semibold leading-tight truncate ${est.text}`}>
                            {cita.cliente?.nombre}
                          </p>
                          <p className={`font-sans text-[9px] leading-tight truncate ${est.text} opacity-70`}>
                            {fmtHora(cita.fecha)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {selectedCita && (
        <ModalDetalle
          cita={selectedCita}
          onClose={() => setSelectedCita(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
