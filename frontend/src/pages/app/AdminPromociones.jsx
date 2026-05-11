import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'

const MAX_PX = 1200
const JPEG_Q = 0.88

async function compressImage(file) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_Q))
    }
    img.src = URL.createObjectURL(file)
  })
}

function ModalPromo({ promo, onClose, onSaved }) {
  const [titulo, setTitulo] = useState(promo?.titulo || '')
  const [descripcion, setDescripcion] = useState(promo?.descripcion || '')
  const [vigencia, setVigencia] = useState(promo?.vigencia || '')
  const [fotoData, setFotoData] = useState(promo?.foto_data || null)
  const [activa, setActiva] = useState(promo?.activa ?? true)
  const [orden, setOrden] = useState(promo?.orden ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()
  const isEdit = !!promo

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setFotoData(compressed)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título requerido'); return }
    if (!fotoData) { setError('Foto requerida'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        vigencia: vigencia.trim() || null,
        foto_data: fotoData,
        activa,
        orden: Number(orden),
      }
      if (isEdit) {
        await api.updatePromocion(promo.id, payload)
      } else {
        await api.createPromocion(payload)
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-serif text-xl text-gray-800">{isEdit ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>}

          {/* Photo upload */}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Foto de la promoción *</label>
            {fotoData ? (
              <div className="relative rounded-2xl overflow-hidden border border-gold/30">
                <img src={fotoData} alt="Preview" className="w-full max-h-56 object-contain bg-gray-50" />
                <button type="button" onClick={() => setFotoData(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-gold hover:bg-gold/5 transition-colors">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="font-sans text-sm text-gray-400">Click para subir imagen</span>
                <span className="font-sans text-xs text-gray-300">JPG, PNG — se comprime automáticamente</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              className="input-field" placeholder="Ej: Promo Brow Pack — Lunes y Miércoles" autoFocus required />
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Vigencia</label>
            <input type="text" value={vigencia} onChange={e => setVigencia(e.target.value)}
              className="input-field" placeholder="Ej: Lunes y Miércoles · Hasta fin de mes" />
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Descripción / Detalles</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4}
              className="input-field resize-none"
              placeholder="Descripción de la promo, servicios incluidos, condiciones, etc." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Orden</label>
              <input type="number" min="0" value={orden} onChange={e => setOrden(e.target.value)}
                className="input-field" placeholder="0" />
              <p className="font-sans text-xs text-gray-400 mt-1">Menor número = aparece primero</p>
            </div>
            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <div className="relative">
                  <input type="checkbox" checked={activa} onChange={e => setActiva(e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-6 rounded-full transition-colors ${activa ? 'bg-gold' : 'bg-gray-300'}`} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${activa ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="font-sans text-sm text-gray-700">Activa</span>
              </label>
            </div>
          </div>
        </form>

        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPromociones() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPromo, setEditPromo] = useState(null)

  const fetchPromos = useCallback(async () => {
    setLoading(true)
    try { setPromos(await api.getPromocionesAdmin()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPromos() }, [fetchPromos])

  async function handleToggle(promo) {
    await api.updatePromocion(promo.id, { activa: !promo.activa })
    fetchPromos()
  }

  async function handleDelete(promo) {
    if (!window.confirm(`¿Eliminar la promoción "${promo.titulo}"? Esta acción no se puede deshacer.`)) return
    await api.deletePromocion(promo.id)
    fetchPromos()
  }

  async function moverOrden(promo, dir) {
    const target = promos.find(p =>
      dir === 'up' ? p.orden < promo.orden : p.orden > promo.orden
    )
    if (!target) return
    await Promise.all([
      api.updatePromocion(promo.id, { orden: target.orden }),
      api.updatePromocion(target.id, { orden: promo.orden }),
    ])
    fetchPromos()
  }

  const activas = promos.filter(p => p.activa)
  const inactivas = promos.filter(p => !p.activa)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Promociones</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">
            {activas.length} activa{activas.length !== 1 ? 's' : ''} · se muestran en el carrusel del sitio web
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Promoción
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center font-sans text-sm text-gray-400">Cargando...</div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="font-sans text-sm text-gray-500 mb-2">No hay promociones creadas</p>
          <button onClick={() => setShowModal(true)} className="font-sans text-sm text-gold hover:underline">
            Crear primera promoción
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {[{ label: 'Activas', items: activas }, { label: 'Inactivas', items: inactivas }]
            .filter(g => g.items.length > 0)
            .map(group => (
              <div key={group.label}>
                <h3 className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{group.label}</h3>
                <div className="space-y-3">
                  {group.items.map(promo => (
                    <div key={promo.id}
                      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start ${!promo.activa ? 'opacity-60' : ''}`}>
                      {/* Thumbnail */}
                      <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                        <img src={promo.foto_data} alt={promo.titulo} className="w-full h-full object-contain" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-gray-800 truncate">{promo.titulo}</p>
                        {promo.vigencia && (
                          <p className="font-sans text-xs text-gold mt-0.5">{promo.vigencia}</p>
                        )}
                        {promo.descripcion && (
                          <p className="font-sans text-xs text-gray-500 mt-1 line-clamp-2">{promo.descripcion}</p>
                        )}
                        <p className="font-sans text-xs text-gray-300 mt-1">Orden: {promo.orden}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <div className="flex gap-1.5">
                          <button onClick={() => moverOrden(promo, 'up')}
                            className="p-1.5 rounded-lg border border-gray-200 hover:border-gold text-gray-400 hover:text-gold transition-colors"
                            title="Mover arriba">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button onClick={() => moverOrden(promo, 'down')}
                            className="p-1.5 rounded-lg border border-gray-200 hover:border-gold text-gray-400 hover:text-gold transition-colors"
                            title="Mover abajo">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <button onClick={() => setEditPromo(promo)}
                          className="font-sans text-xs text-gray-500 hover:text-gold border border-gray-200 hover:border-gold px-2.5 py-1.5 rounded-lg transition-colors text-center">
                          Editar
                        </button>
                        <button onClick={() => handleToggle(promo)}
                          className={`font-sans text-xs px-2.5 py-1.5 rounded-lg border transition-colors text-center ${
                            promo.activa
                              ? 'border-orange-100 text-orange-400 hover:bg-orange-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}>
                          {promo.activa ? 'Ocultar' : 'Activar'}
                        </button>
                        <button onClick={() => handleDelete(promo)}
                          className="font-sans text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-colors text-center">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {showModal && (
        <ModalPromo onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchPromos() }} />
      )}
      {editPromo && (
        <ModalPromo promo={editPromo} onClose={() => setEditPromo(null)} onSaved={() => { setEditPromo(null); fetchPromos() }} />
      )}
    </div>
  )
}
