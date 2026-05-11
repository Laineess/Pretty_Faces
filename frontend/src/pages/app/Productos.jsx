import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import TicketRecibo from '../../components/app/TicketRecibo'

// ── Image compression ────────────────────────────────────────────────────────
async function compressImage(file, maxPx = 900, quality = 0.85) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = URL.createObjectURL(file)
  })
}

function PhotoPlaceholder({ className = '' }) {
  return (
    <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
      <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </div>
  )
}

// ── Add / Edit product form (inline panel) ───────────────────────────────────
function ProductoForm({ producto, onClose, onSaved }) {
  const [nombre, setNombre] = useState(producto?.nombre || '')
  const [precio, setPrecio] = useState(producto?.precio ?? '')
  const [categoria, setCategoria] = useState(producto?.categoria || '')
  const [fotoData, setFotoData] = useState(producto?.foto_data || null)
  const [activo, setActivo] = useState(producto?.activo ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()
  const isEdit = !!producto

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoData(await compressImage(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) { setError('Nombre requerido'); return }
    if (!precio || parseFloat(precio) <= 0) { setError('Precio inválido'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        categoria: categoria.trim() || null,
        foto_data: fotoData || null,
        ...(isEdit ? { activo } : {}),
      }
      if (isEdit) await api.updateProducto(producto.id, payload)
      else await api.createProducto(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl text-gray-800">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
        {/* Photo */}
        <div className="md:row-span-3">
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Foto del producto</label>
          {fotoData ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-square">
              <img src={fotoData} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setFotoData(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-gold hover:bg-gold/5 transition-colors">
              <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="font-sans text-sm text-gray-400">Subir foto</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            className="input-field" placeholder="Ej: Shampoo Argan 250ml" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Precio *</label>
            <input type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)}
              className="input-field" placeholder="0.00" required />
          </div>
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
            <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
              className="input-field" placeholder="Capilar" />
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} className="sr-only" />
                <div className={`w-10 h-6 rounded-full transition-colors ${activo ? 'bg-gold' : 'bg-gray-300'}`} />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${activo ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="font-sans text-sm text-gray-700">Producto activo</span>
            </label>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 btn-gold text-sm py-2.5 disabled:opacity-60">
            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Add-to-cart modal ────────────────────────────────────────────────────────
function AddToCartModal({ producto, cartQty, onAdd, onClose }) {
  const [qty, setQty] = useState(cartQty || 1)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="rounded-t-2xl overflow-hidden aspect-square bg-gray-50">
          {producto.foto_data
            ? <img src={producto.foto_data} alt={producto.nombre} className="w-full h-full object-cover" />
            : <PhotoPlaceholder className="w-full h-full" />
          }
        </div>

        <div className="p-5">
          <p className="font-sans font-semibold text-gray-800 text-base">{producto.nombre}</p>
          <p className="font-sans text-gold font-bold text-lg mt-0.5">${producto.precio.toLocaleString('es-MX')}</p>

          <div className="flex items-center justify-between mt-4 mb-4">
            <span className="font-sans text-sm text-gray-600">Cantidad</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gold hover:text-gold transition-colors text-xl font-light">
                −
              </button>
              <span className="font-sans font-bold text-gray-800 text-xl w-7 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gold hover:text-gold transition-colors text-xl font-light">
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
            <span className="font-sans text-sm text-gray-500">Subtotal</span>
            <span className="font-sans font-bold text-gray-800">${(producto.precio * qty).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
            <button onClick={() => onAdd(producto, qty)} className="flex-1 btn-gold text-sm py-2.5">
              {cartQty ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Checkout modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, onClose, onComplete }) {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [clienteId, setClienteId] = useState(null)
  const [metodo, setMetodo] = useState('efectivo')
  const [propina, setPropina] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef()

  const total = cart.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)

  function handleBusqueda(val) {
    setBusqueda(val)
    setClienteId(null)
    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setClientes([]); return }
    debounceRef.current = setTimeout(async () => {
      try { setClientes(await api.getClientes({ busqueda: val, limite: 8 })) }
      catch { setClientes([]) }
    }, 280)
  }

  function selectCliente(c) {
    setClienteId(c.id)
    setBusqueda(c.nombre)
    setClientes([])
  }

  async function handleConfirm() {
    setLoading(true); setError('')
    try {
      const pago = await api.registrarPago({
        cita_id: null,
        cliente_id: clienteId || null,
        empleada_id: null,
        monto: total,
        metodo_pago: metodo,
        propina: parseFloat(propina) || 0,
        servicios: [],
        productos: cart.map(i => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          precio_aplicado: i.producto.precio,
        })),
      })
      onComplete(pago)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-serif text-xl text-gray-800">Confirmar Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-sans">{error}</div>}

          {/* Order summary */}
          <div>
            <p className="font-sans text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumen</p>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.producto.id} className="flex items-center gap-3">
                  {item.producto.foto_data
                    ? <img src={item.producto.foto_data} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-gray-700 truncate">{item.producto.nombre}</p>
                    <p className="font-sans text-xs text-gray-400">×{item.cantidad} · ${item.producto.precio.toLocaleString('es-MX')}</p>
                  </div>
                  <span className="font-sans text-sm font-semibold text-gray-800 flex-shrink-0">
                    ${(item.producto.precio * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="font-sans text-sm font-semibold text-gray-600">Total</span>
              <span className="font-sans font-bold text-gold text-lg">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Client search */}
          <div className="relative">
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Cliente (opcional)</label>
            <input type="text" value={busqueda} onChange={e => handleBusqueda(e.target.value)}
              className="input-field" placeholder="Buscar nombre o teléfono..." />
            {clientes.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {clientes.map(c => (
                  <button key={c.id} onClick={() => selectCliente(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-brand-cream transition-colors border-b border-gray-50 last:border-0">
                    <p className="font-sans text-sm text-gray-800">{c.nombre}</p>
                    {c.telefono && <p className="font-sans text-xs text-gray-400">{c.telefono}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-2">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {['efectivo', 'tarjeta', 'transferencia', 'otro'].map(m => (
                <button key={m} type="button" onClick={() => setMetodo(m)}
                  className={`px-3 py-2.5 rounded-xl font-sans text-sm font-medium border capitalize transition-colors ${
                    metodo === m ? 'bg-gold text-white border-gold' : 'border-gray-200 text-gray-600 hover:border-gold/50'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div>
            <label className="block font-sans text-sm font-medium text-gray-700 mb-1.5">Propina (opcional)</label>
            <input type="number" min="0" step="1" value={propina} onChange={e => setPropina(e.target.value)}
              className="input-field" placeholder="0.00" />
          </div>

          {parseFloat(propina) > 0 && (
            <div className="flex justify-between py-3 border-t border-dashed border-gray-200">
              <span className="font-sans text-sm font-semibold text-gray-700">Total con propina</span>
              <span className="font-sans font-bold text-gray-800 text-lg">
                ${(total + parseFloat(propina)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-outline-gold text-sm py-2.5">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-sans text-sm font-medium py-2.5 transition-colors disabled:opacity-60">
            {loading ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ producto, cartQty, onSelect, onEdit }) {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${!producto.activo ? 'opacity-50' : ''}`}
      onClick={() => producto.activo && onSelect(producto)}
    >
      <div className="aspect-square overflow-hidden">
        {producto.foto_data
          ? <img src={producto.foto_data} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          : <PhotoPlaceholder className="w-full h-full" />
        }
      </div>

      {cartQty > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center font-sans text-xs font-bold shadow">
          {cartQty}
        </div>
      )}

      {!producto.activo && (
        <div className="absolute top-2 left-2 bg-gray-500 text-white font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Inactivo
        </div>
      )}

      <div className="p-3">
        <p className="font-sans text-xs font-semibold text-gray-700 leading-tight truncate">{producto.nombre}</p>
        {producto.categoria && (
          <p className="font-sans text-[10px] text-gray-400 truncate mt-0.5">{producto.categoria}</p>
        )}
        <p className="font-sans text-sm font-bold text-gold mt-1">${producto.precio.toLocaleString('es-MX')}</p>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onEdit(producto) }}
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-white/90 border border-gray-200 rounded-lg px-2 py-1 font-sans text-xs text-gray-500 hover:text-gold hover:border-gold transition-all duration-200 shadow-sm"
      >
        Editar
      </button>
    </div>
  )
}

// ── Cart bottom bar ──────────────────────────────────────────────────────────
function CartBar({ cart, onClear, onCheckout, onRemoveItem, onEditItem }) {
  const [expanded, setExpanded] = useState(false)
  const total = cart.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0)

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 z-40 shadow-2xl">
      {expanded && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.producto.id} className="flex items-center gap-3">
                {item.producto.foto_data
                  ? <img src={item.producto.foto_data} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                  : <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-gray-700 truncate">{item.producto.nombre}</p>
                  <p className="font-sans text-xs text-gray-400">×{item.cantidad}</p>
                </div>
                <span className="font-sans text-sm font-medium text-gray-800">
                  ${(item.producto.precio * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <button onClick={() => onEditItem(item.producto)} className="text-gray-300 hover:text-gold transition-colors ml-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button onClick={() => onRemoveItem(item.producto.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 px-6 py-3 flex items-center gap-4">
        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center font-sans text-xs font-bold text-white">
            {totalItems}
          </div>
          <span className="font-sans text-sm">{expanded ? 'Ocultar' : 'Ver carrito'}</span>
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <div className="flex-1 text-right">
          <span className="font-sans text-white/60 text-sm mr-2">Total:</span>
          <span className="font-sans font-bold text-white text-lg">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>

        <button onClick={onClear}
          className="font-sans text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 rounded-lg px-3 py-2">
          Vaciar
        </button>

        <button onClick={onCheckout}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-sans text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Confirmar compra
        </button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Productos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProducto, setEditProducto] = useState(null)
  const [addFor, setAddFor] = useState(null)
  const [cart, setCart] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [ticketPago, setTicketPago] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try { setProductos(await api.getProductos({ solo_activos: false })) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProductos() }, [fetchProductos])

  function handleAddToCart(producto, cantidad) {
    setCart(prev => {
      const existing = prev.find(i => i.producto.id === producto.id)
      if (existing) return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad } : i)
      return [...prev, { producto, cantidad }]
    })
    setAddFor(null)
  }

  function handleCheckoutComplete(pago) {
    setShowCheckout(false)
    setCart([])
    setTicketPago(pago)
  }

  const filtered = productos.filter(p => {
    const matchSearch = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchActivo = !soloActivos || p.activo
    return matchSearch && matchActivo
  })

  const grouped = filtered.reduce((acc, p) => {
    const cat = p.categoria || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const cartMap = Object.fromEntries(cart.map(i => [i.producto.id, i.cantidad]))

  return (
    <div className={cart.length > 0 ? 'pb-20' : ''}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-gray-800">Productos</h1>
          <p className="font-sans text-gray-400 text-sm mt-0.5">
            {productos.filter(p => p.activo).length} disponibles
            {cart.length > 0 && ` · ${cart.reduce((s, i) => s + i.cantidad, 0)} en carrito`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setEditProducto(null) }}
          className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {showForm ? 'Cancelar' : 'Nuevo Producto'}
        </button>
      </div>

      {/* Inline form panel */}
      {(showForm || editProducto) && (
        <ProductoForm
          producto={editProducto}
          onClose={() => { setShowForm(false); setEditProducto(null) }}
          onSaved={() => { setShowForm(false); setEditProducto(null); fetchProductos() }}
        />
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5 flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto o categoría..."
            className="w-full pl-9 pr-3 py-1.5 text-sm font-sans border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors" />
        </div>
        <button onClick={() => setSoloActivos(s => !s)}
          className={`px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-colors flex-shrink-0 ${soloActivos ? 'bg-gold text-white' : 'border border-gray-200 text-gray-500'}`}>
          {soloActivos ? 'Solo activos' : 'Ver todos'}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center font-sans text-sm text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="font-sans text-sm text-gray-400 mb-2">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos registrados'}
          </p>
          {!busqueda && (
            <button onClick={() => setShowForm(true)} className="font-sans text-sm text-gold hover:underline">
              Agregar primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, prods]) => (
            <div key={cat}>
              <h3 className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {prods.map(p => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    cartQty={cartMap[p.id] || 0}
                    onSelect={prod => setAddFor(prod)}
                    onEdit={prod => {
                      setEditProducto(prod)
                      setShowForm(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {addFor && (
        <AddToCartModal
          producto={addFor}
          cartQty={cartMap[addFor.id] || 0}
          onAdd={handleAddToCart}
          onClose={() => setAddFor(null)}
        />
      )}

      {cart.length > 0 && (
        <CartBar
          cart={cart}
          onClear={() => setCart([])}
          onCheckout={() => setShowCheckout(true)}
          onRemoveItem={id => setCart(prev => prev.filter(i => i.producto.id !== id))}
          onEditItem={prod => setAddFor(prod)}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {ticketPago && (
        <TicketRecibo pago={ticketPago} onClose={() => setTicketPago(null)} />
      )}
    </div>
  )
}
