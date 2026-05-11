import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, sub, color = 'gold', icon }) {
  const colors = {
    gold: 'bg-gold/10 text-gold',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-500',
    pink: 'bg-brand-pink-light text-brand-pink-dark',
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="font-sans text-2xl font-semibold text-gray-800">{value}</p>
      <p className="font-sans text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="font-sans text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
      <div className="h-7 bg-gray-100 rounded w-24 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-32" />
    </div>
  )
}

const ESTADO_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  en_curso: 'bg-purple-100 text-purple-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-600',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const [dashData, citasData] = await Promise.all([
          api.getDashboard(),
          api.getCitas({ fecha_inicio: today, fecha_fin: today }),
        ])
        setStats(dashData)
        setCitas(citasData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gray-800">
          Buen día, {user?.nombre?.split(' ')[0]} 👋
        </h1>
        <p className="font-sans text-gray-400 text-sm mt-1">
          Resumen del día de hoy
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="font-sans text-sm text-red-600">{error} — Verifica que el backend esté corriendo.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatCard
              label="Citas hoy"
              value={stats.citas_hoy}
              color="blue"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <StatCard
              label="Pendientes"
              value={stats.citas_pendientes}
              color="pink"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Ingresos hoy"
              value={fmt(stats.ingresos_hoy)}
              color="green"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Ingresos mes"
              value={fmt(stats.ingresos_mes)}
              color="gold"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <StatCard
              label="Gastos mes"
              value={fmt(stats.gastos_mes)}
              color="red"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
            />
            <StatCard
              label="Balance mes"
              value={fmt(stats.balance_mes)}
              color={stats.balance_mes >= 0 ? 'green' : 'red'}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
            />
          </>
        ) : null}
      </div>

      {/* Citas de hoy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-lg text-gray-800">Citas de Hoy</h2>
          <a href="/admin/citas" className="font-sans text-sm text-gold hover:text-gold-dark transition-colors">
            Ver todas →
          </a>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : citas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-sans text-gray-400 text-sm">No hay citas programadas para hoy</p>
            <a href="/admin/citas" className="btn-gold text-sm mt-4 inline-block">
              Agendar Cita
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {citas.map(cita => (
              <div key={cita.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-gray-800 truncate">
                    {cita.cliente?.nombre}
                  </p>
                  <p className="font-sans text-xs text-gray-400">
                    {cita.empleada?.nombre} · {new Date(cita.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`font-sans text-xs font-medium px-3 py-1 rounded-full ${ESTADO_COLORS[cita.estado]}`}>
                  {cita.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
