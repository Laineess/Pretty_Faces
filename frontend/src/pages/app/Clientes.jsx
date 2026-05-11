import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'

function ModalCliente({ cliente, onClose, onSaved }) {
  const [nombre, setNombre] = useState(cliente?.nombre || '')
  const [telefono, setTelefono] = useState(cliente?.telefono || '')
  const [email, setEmail] = useState(cliente?.email || '')
  const [notas, setNotas] = useState(cliente?.notas || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!cliente

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setLoading(true); setError('')
    try {
      if (isEdit) {
        await api.updateCliente(cliente.id, {
          nombre: nombre.trim(),
          telefono: telefono || null,
          email: email || null,
          notas: notas || null,
        })
      } else {
        await api.createCliente({
          nombre: nombre.trim(),
          telefono: telefono || null,
          email: email || null,
          notas: notas || null,
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
          <h2 className="font-serif text-xl text-gray-800">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              className="input-field" placeholder="Nombre completo" autoFocus required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input
                type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                className="input-field" placeholder="55 1234 5678"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea
              value={notas} onChange={e => setNotas(e.target.value)}
              rows={2} className="input-field resize-none"
              placeholder="Alergias, preferencias, notas importantes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalDetalle({ cliente, onClose, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-serif text-lg text-gray-800">{cliente.nombre}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {cliente.telefono && (
            <div className="flex items-center gap-2 font-sans text-sm text-gray-600">
              <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {cliente.telefono}
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-2 font-sans text-sm text-gray-600">
              <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {cliente.email}
            </div>
          )}
          {cliente.notas && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 font-sans text-sm text-gray-500">{cliente.notas}</div>
          )}
          <p className="font-sans text-xs text-gray-400">
            Cliente desde {new Date(cliente.creado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="px-6 pb-5 space-y-2">
          <button onClick={onEdit} className="w-full btn-outline-gold text-sm py-2.5">Editar</button>
          {confirming ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)}
                className="flex-1 border border-gray-200 text-gray-500 font-sans text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 text-white font-sans text-sm font-medium py-2.5 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors">
                {deleting ? '...' : 'Confirmar'}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)}
              className="w-full border border-red-100 text-red-400 hover:bg-red-50 font-sans text-sm py-2.5 rounded-xl transition-colors">
              Eliminar cliente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [editCliente, setEditCliente] = useState(null)
  const searchTimer = useRef(null)

  const fetchClientes = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (q) params.busqueda = q
      setClientes(await api.getClientes(params))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  function handleSearch(val) {
    setBusqueda(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchClientes(val), 300)
  }

  function initials(nombre) {
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const COLORS = ['bg-violet-100 text-violet-700','bg-sky-100 text-sky-700','bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700','bg-pink-100 text-pink-700']

  function colorFor(id) { return COLORS[id % COLORS.length] }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Clientes</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" value={busqueda} onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-sans text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            placeholder="Buscar por nombre o teléfono..."
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-full mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="font-sans text-sm text-gray-400">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay clientes registrados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {clientes.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCliente(c)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-sans font-semibold text-sm mb-3 ${colorFor(c.id)}`}>
                {initials(c.nombre)}
              </div>
              <p className="font-sans font-semibold text-sm text-gray-800 truncate">{c.nombre}</p>
              {c.telefono && <p className="font-sans text-xs text-gray-400 mt-0.5">{c.telefono}</p>}
              {c.email && !c.telefono && <p className="font-sans text-xs text-gray-400 mt-0.5 truncate">{c.email}</p>}
              {c.notas && (
                <p className="font-sans text-xs text-gray-400 mt-1.5 line-clamp-2 italic">{c.notas}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalCliente
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchClientes(busqueda) }}
        />
      )}

      {selectedCliente && !editCliente && (
        <ModalDetalle
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
          onEdit={() => { setEditCliente(selectedCliente); setSelectedCliente(null) }}
          onDelete={async () => {
            await api.deleteCliente(selectedCliente.id)
            setSelectedCliente(null)
            fetchClientes(busqueda)
          }}
        />
      )}

      {editCliente && (
        <ModalCliente
          cliente={editCliente}
          onClose={() => setEditCliente(null)}
          onSaved={() => { setEditCliente(null); fetchClientes(busqueda) }}
        />
      )}
    </div>
  )
}
