import { useState, useRef } from 'react'

const MAX_PX = 800
const JPEG_QUALITY = 0.8
const MAX_SLOTS = 3

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function ModalObservaciones({ tipo, citaNombre, onClose, onConfirm }) {
  const [slots, setSlots] = useState(
    Array(MAX_SLOTS).fill(null).map((_, i) => ({ orden: i + 1, foto_data: null, observacion: '' }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRefs = [useRef(), useRef(), useRef()]

  const esAntes = tipo === 'antes'
  const titulo = esAntes ? 'Iniciar Servicio — Fotos Antes' : 'Finalizar Servicio — Fotos Después'
  const accion = esAntes ? 'Iniciar Servicio' : 'Finalizar Servicio'
  const colorBtn = esAntes ? 'btn-gold' : 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-sans text-sm font-medium transition-colors px-4 py-2.5'

  async function handlePhoto(slotIndex, e) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, foto_data: compressed } : s))
  }

  function handleObservacion(slotIndex, value) {
    setSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, observacion: value } : s))
  }

  function removePhoto(slotIndex) {
    setSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, foto_data: null } : s))
    if (fileRefs[slotIndex].current) fileRefs[slotIndex].current.value = ''
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const observaciones = slots
        .filter(s => s.foto_data || s.observacion.trim())
        .map(s => ({ orden: s.orden, foto_data: s.foto_data || null, observacion: s.observacion.trim() || null }))
      await onConfirm(observaciones)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-serif text-xl text-gray-800">{titulo}</h2>
            {citaNombre && <p className="font-sans text-xs text-gray-400 mt-0.5">{citaNombre}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <p className="font-sans text-xs text-gray-400">
            Opcional: toma hasta {MAX_SLOTS} fotos y agrega observaciones previas al servicio.
          </p>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
          )}

          {slots.map((slot, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Foto {i + 1}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {slot.foto_data ? (
                  <div className="relative">
                    <img
                      src={slot.foto_data}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRefs[i].current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-gold hover:bg-gold/5 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="font-sans text-xs text-gray-400">Tomar foto</span>
                  </button>
                )}

                <input
                  ref={fileRefs[i]}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhoto(i, e)}
                />

                <textarea
                  value={slot.observacion}
                  onChange={e => handleObservacion(i, e.target.value)}
                  placeholder="Observación (opcional)..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 ${colorBtn} disabled:opacity-60`}
          >
            {loading ? 'Guardando...' : accion}
          </button>
        </div>
      </div>
    </div>
  )
}
