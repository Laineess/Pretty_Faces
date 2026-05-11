import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'

const ROL_OPTIONS = [
  { value: 'empleada', label: 'Empleada', desc: 'Acceso solo a Mi Agenda' },
  { value: 'recepcion', label: 'Recepción', desc: 'Citas, clientes, ingresos, productos, corte de caja' },
  { value: 'admin', label: 'Admin', desc: 'Acceso completo al sistema' },
]

function ModalCrearCuenta({ empleada, onClose, onSaved }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('empleada')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Email requerido'); return }
    if (password.length < 6) { setError('Contraseña mínimo 6 caracteres'); return }
    setLoading(true); setError('')
    try {
      await api.crearCuentaEmpleada(empleada.id, email.trim(), password, rol)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-gray-800">Crear Cuenta</h2>
            <p className="font-sans text-xs text-gray-400 mt-0.5">{empleada.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Rol de acceso</label>
            <div className="space-y-2">
              {ROL_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                  ${rol === opt.value ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="rol" value={opt.value} checked={rol === opt.value}
                    onChange={() => setRol(opt.value)} className="accent-gold mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="font-sans text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="empleada@ejemplo.com" autoFocus required />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="Mínimo 6 caracteres" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EMP_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-pink-100 text-pink-700 border-pink-200',
]

function ModalEmpleada({ empleada, onClose, onSaved }) {
  const [nombre, setNombre] = useState(empleada?.nombre || '')
  const [telefono, setTelefono] = useState(empleada?.telefono || '')
  const [comision, setComision] = useState(empleada?.comision_porcentaje ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!empleada

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) { setError('Nombre requerido'); return }
    if (comision < 0 || comision > 100) { setError('Comisión debe ser entre 0 y 100'); return }
    setLoading(true); setError('')
    try {
      if (isEdit) {
        await api.updateEmpleada(empleada.id, {
          nombre: nombre.trim(),
          telefono: telefono || null,
          comision_porcentaje: parseFloat(comision),
        })
      } else {
        await api.createEmpleada({
          nombre: nombre.trim(),
          telefono: telefono || null,
          comision_porcentaje: parseFloat(comision),
        })
      }
      onSaved()
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
          <h2 className="font-serif text-xl text-gray-800">{isEdit ? 'Editar Empleada' : 'Nueva Empleada'}</h2>
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
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              className="input-field" placeholder="Ej: María González" autoFocus required
            />
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
            <input
              type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              className="input-field" placeholder="55 1234 5678"
            />
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">
              Comisión (%) — se aplica sobre el monto del servicio
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min="0" max="100" step="1"
                value={comision} onChange={e => setComision(e.target.value)}
                className="flex-1 accent-gold"
              />
              <div className="w-16 text-center">
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={comision} onChange={e => setComision(e.target.value)}
                  className="input-field text-center px-2 py-1.5 text-sm w-full"
                />
              </div>
              <span className="font-sans text-sm text-gray-500">%</span>
            </div>
            {parseFloat(comision) > 0 && (
              <p className="font-sans text-xs text-gray-400 mt-1">
                Por cada $1,000 en servicios → comisión de ${(1000 * parseFloat(comision) / 100).toLocaleString('es-MX')}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Empleada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Empleadas() {
  const [empleadas, setEmpleadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEmpleada, setEditEmpleada] = useState(null)
  const [cuentaEmpleada, setCuentaEmpleada] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchEmpleadas = useCallback(async () => {
    setLoading(true)
    try {
      setEmpleadas(await api.getEmpleadas({ solo_activas: false }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmpleadas() }, [fetchEmpleadas])

  async function eliminarEmpleada(emp) {
    setDeletingId(emp.id)
    try {
      await api.deleteEmpleada(emp.id)
      await fetchEmpleadas()
    } finally {
      setDeletingId(null)
    }
  }

  function initials(nombre) {
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const activas = empleadas.filter(e => e.activa)
  const inactivas = empleadas.filter(e => !e.activa)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Empleadas</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">
            {activas.length} activa{activas.length !== 1 ? 's' : ''}
            {inactivas.length > 0 && ` · ${inactivas.length} inactiva${inactivas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Empleada
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : empleadas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="font-sans text-sm text-gray-500 mb-1">No hay empleadas registradas</p>
          <button onClick={() => setShowModal(true)} className="font-sans text-sm text-gold hover:underline mt-1">
            Agregar primera empleada
          </button>
        </div>
      ) : (
        <>
          {/* Active employees */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {activas.map((emp, i) => (
              <EmpleadaCard
                key={emp.id}
                emp={emp}
                colorClass={EMP_COLORS[i % EMP_COLORS.length]}
                initials={initials(emp.nombre)}
                deleting={deletingId === emp.id}
                confirming={confirmDeleteId === emp.id}
                onConfirmDelete={() => { eliminarEmpleada(emp); setConfirmDeleteId(null) }}
                onRequestDelete={() => setConfirmDeleteId(emp.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onEdit={() => setEditEmpleada(emp)}
                onCrearCuenta={() => setCuentaEmpleada(emp)}
              />
            ))}
          </div>

          {/* Inactive employees */}
          {inactivas.length > 0 && (
            <>
              <h2 className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactivas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactivas.map((emp, i) => (
                  <EmpleadaCard
                    key={emp.id}
                    emp={emp}
                    colorClass="bg-gray-100 text-gray-400 border-gray-200"
                    initials={initials(emp.nombre)}
                    deleting={deletingId === emp.id}
                    confirming={confirmDeleteId === emp.id}
                    onConfirmDelete={() => { eliminarEmpleada(emp); setConfirmDeleteId(null) }}
                    onRequestDelete={() => setConfirmDeleteId(emp.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onEdit={() => setEditEmpleada(emp)}
                    onCrearCuenta={() => setCuentaEmpleada(emp)}
                    inactive
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showModal && (
        <ModalEmpleada
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchEmpleadas() }}
        />
      )}

      {editEmpleada && (
        <ModalEmpleada
          empleada={editEmpleada}
          onClose={() => setEditEmpleada(null)}
          onSaved={() => { setEditEmpleada(null); fetchEmpleadas() }}
        />
      )}

      {cuentaEmpleada && (
        <ModalCrearCuenta
          empleada={cuentaEmpleada}
          onClose={() => setCuentaEmpleada(null)}
          onSaved={() => { setCuentaEmpleada(null); fetchEmpleadas() }}
        />
      )}
    </div>
  )
}

function EmpleadaCard({ emp, colorClass, initials, deleting, confirming, onRequestDelete, onConfirmDelete, onCancelDelete, onEdit, onCrearCuenta, inactive }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-opacity ${inactive ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-sans font-bold text-base flex-shrink-0 border ${colorClass}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-gray-800 truncate">{emp.nombre}</p>
          {emp.telefono && (
            <p className="font-sans text-xs text-gray-400 mt-0.5">{emp.telefono}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-sans text-xs text-gray-500">
              Comisión: <span className={`font-semibold ${emp.comision_porcentaje > 0 ? 'text-gold' : 'text-gray-400'}`}>{emp.comision_porcentaje}%</span>
            </span>
            {emp.usuario_id ? (
              <span className="font-sans text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Con acceso
              </span>
            ) : (
              <span className="font-sans text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Sin cuenta
              </span>
            )}
          </div>
        </div>
      </div>

      {emp.comision_porcentaje > 0 && (
        <div className="mt-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${emp.comision_porcentaje}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={onEdit}
          className="border border-gray-200 text-gray-600 hover:border-gold hover:text-gold font-sans text-xs font-medium py-2 rounded-xl transition-colors">
          Editar
        </button>
        {confirming ? (
          <>
            <button onClick={onConfirmDelete} disabled={deleting}
              className="bg-red-500 text-white font-sans text-xs font-medium py-2 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors">
              {deleting ? '...' : 'Confirmar'}
            </button>
            <button onClick={onCancelDelete}
              className="col-span-2 border border-gray-200 text-gray-500 font-sans text-xs font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </>
        ) : (
          <button onClick={onRequestDelete}
            className="border border-red-100 text-red-400 hover:bg-red-50 font-sans text-xs font-medium py-2 rounded-xl transition-colors">
            Eliminar
          </button>
        )}
        {!emp.usuario_id && !confirming && (
          <button onClick={onCrearCuenta}
            className="col-span-2 border border-violet-200 text-violet-600 hover:bg-violet-50 font-sans text-xs font-medium py-2 rounded-xl transition-colors">
            Crear cuenta de acceso
          </button>
        )}
      </div>
    </div>
  )
}
