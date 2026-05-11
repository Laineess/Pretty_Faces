import { useState, useCallback } from 'react'
import { api } from '../../lib/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GOLD = '#C9A84C'
const PIE_COLORS = ['#C9A84C', '#E8A0AF', '#7c3aed', '#0369a1', '#be123c', '#065f46', '#b45309', '#9d174d']

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="font-sans text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-serif text-2xl ${accent || 'text-gray-800'}`}>
        ${typeof value === 'number' ? value.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : '—'}
      </p>
      {sub && <p className="font-sans text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 font-sans text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: ${Number(p.value).toLocaleString('es-MX')}
        </p>
      ))}
    </div>
  )
}

export default function Reportes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])

  const fetchReporte = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await api.getReportes({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-gray-800">Reportes</h1>
        <p className="font-sans text-gray-400 text-sm mt-0.5">Análisis de ingresos, gastos y rendimiento</p>
      </div>

      {/* Date range picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="font-sans text-sm text-gray-500 font-medium">Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30" />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-sans text-sm text-gray-500 font-medium">Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="font-sans text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30" />
        </div>
        <button onClick={fetchReporte} disabled={loading}
          className="btn-gold text-sm px-6 py-2 disabled:opacity-60 flex items-center gap-2">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
          Generar Reporte
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="font-sans text-sm text-gray-500">Selecciona un período y genera el reporte</p>
        </div>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total ingresos" value={data.total_ingresos} sub={`${data.num_pagos} pagos`} accent="text-green-600" />
            <StatCard label="Total gastos" value={data.total_gastos} accent="text-red-500" />
            <StatCard label="Balance neto" value={data.balance}
              accent={data.balance >= 0 ? 'text-green-600' : 'text-red-500'}
              sub={data.balance >= 0 ? 'Ganancia' : 'Pérdida'} />
            <StatCard
              label="Margen"
              value={null}
              sub={data.total_ingresos > 0
                ? `${((data.balance / data.total_ingresos) * 100).toFixed(1)}%`
                : '—'}
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ingresos por día */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-serif text-base text-gray-700 mb-4">Ingresos por día</h3>
              {data.ingresos_por_dia.length === 0 ? (
                <p className="font-sans text-xs text-gray-400 text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.ingresos_por_dia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fontFamily: 'Poppins' }}
                      tickFormatter={v => {
                        const d = new Date(v + 'T12:00:00')
                        return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                      }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Poppins' }}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="total" name="Ingresos" stroke={GOLD}
                      strokeWidth={2} dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Por empleada */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-serif text-base text-gray-700 mb-4">Ingresos por empleada</h3>
              {data.por_empleada.length === 0 ? (
                <p className="font-sans text-xs text-gray-400 text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.por_empleada} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Poppins' }}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="empleada" tick={{ fontSize: 11, fontFamily: 'Poppins' }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Total" fill={GOLD} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gastos por categoría — pie */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-serif text-base text-gray-700 mb-4">Gastos por categoría</h3>
              {data.gastos_por_categoria.length === 0 ? (
                <p className="font-sans text-xs text-gray-400 text-center py-8">Sin datos</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.gastos_por_categoria}
                        dataKey="total" nameKey="categoria"
                        cx="50%" cy="50%" outerRadius={70}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.gastos_por_categoria.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {data.gastos_por_categoria.map((g, i) => (
                      <span key={g.categoria} className="flex items-center gap-1 font-sans text-xs text-gray-600">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {g.categoria}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Resumen tabla */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-serif text-base text-gray-700 mb-4">Detalle de gastos</h3>
              {data.gastos_por_categoria.length === 0 ? (
                <p className="font-sans text-xs text-gray-400">Sin gastos registrados</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-sans text-xs font-semibold text-gray-400 uppercase pb-2">Categoría</th>
                      <th className="text-right font-sans text-xs font-semibold text-gray-400 uppercase pb-2">Monto</th>
                      <th className="text-right font-sans text-xs font-semibold text-gray-400 uppercase pb-2">% del total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.gastos_por_categoria].sort((a, b) => b.total - a.total).map((g, i) => (
                      <tr key={g.categoria} className="border-b border-gray-50">
                        <td className="py-2 font-sans text-sm text-gray-700 capitalize flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {g.categoria}
                        </td>
                        <td className="py-2 font-sans text-sm text-red-500 font-medium text-right">
                          ${g.total.toLocaleString('es-MX')}
                        </td>
                        <td className="py-2 font-sans text-xs text-gray-400 text-right">
                          {data.total_gastos > 0 ? ((g.total / data.total_gastos) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
