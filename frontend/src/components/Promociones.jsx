import { useState, useEffect, useRef, useCallback } from 'react'
// Note: useRef kept — still used inside Coverflow for timerRef
import { api } from '../lib/api'

const INTERVAL_MS = 3800

// Shortest circular offset — never wraps "the long way"
function circOffset(i, current, len) {
  let d = i - current
  if (d > len / 2) d -= len
  if (d < -len / 2) d += len
  return d
}

function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mob
}

// ── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ promo, onClose }) {
  return (
    <div className="w-full grid md:grid-cols-2 gap-0 md:gap-8 items-center animate-fadeDetail">
      {/* Left: image */}
      <div className="relative flex items-center justify-center py-8 md:py-0">
        <div className="relative max-w-sm w-full mx-auto"
          style={{ filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.18))' }}>
          <img
            src={promo.foto_data}
            alt={promo.titulo}
            className="w-full rounded-3xl object-contain max-h-[480px]"
            style={{ border: '2px solid rgba(201,168,76,0.35)' }}
          />
        </div>

        {/* close on mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Right: details */}
      <div className="px-6 md:px-0 pb-8 md:py-8 flex flex-col justify-center">
        {promo.vigencia && (
          <span className="inline-flex items-center gap-1.5 bg-gold/15 text-gold font-sans text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-5 w-fit">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {promo.vigencia}
          </span>
        )}

        <h3 className="font-serif text-3xl md:text-4xl text-gray-800 leading-tight mb-4">
          {promo.titulo}
        </h3>

        {promo.descripcion && (
          <p className="font-sans text-gray-500 text-base leading-relaxed mb-8 whitespace-pre-line">
            {promo.descripcion}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="#contacto"
            onClick={onClose}
            className="btn-gold text-center text-base px-8 py-3.5 flex items-center justify-center gap-2"
            style={{ borderRadius: '14px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ¡Haz tu cita ya!
          </a>
          <button
            onClick={onClose}
            className="btn-outline-gold text-center text-sm px-6 py-3"
            style={{ borderRadius: '14px' }}
          >
            Ver más promos
          </button>
        </div>

        <p className="font-sans text-xs text-gray-400 mt-4">* Aplican términos y condiciones.</p>
      </div>
    </div>
  )
}

// ── Coverflow carousel ───────────────────────────────────────────────────────
// Positioning uses vw units — independent of scrollbar/ResizeObserver jitter
const STEP_VW_DESKTOP = 26   // viewport-width percent between item centers
const STEP_VW_MOBILE  = 74
const ITEM_W_DESKTOP  = 'min(34vw, 440px)'
const ITEM_W_MOBILE   = 'min(80vw, 360px)'
const MAX_VISIBLE_DESKTOP = 2
const MAX_VISIBLE_MOBILE  = 1

function Coverflow({ promos, onSelect }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef()
  const len = promos.length
  const isMobile = useIsMobile()

  const stepVW    = isMobile ? STEP_VW_MOBILE  : STEP_VW_DESKTOP
  const maxVisible = isMobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE_DESKTOP

  const goTo = useCallback((idx) => {
    setCurrent(((idx % len) + len) % len)
  }, [len])

  const next = useCallback(() => goTo(current + 1), [current, goTo])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(next, INTERVAL_MS)
  }, [next])

  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [next])

  // Container height via CSS — no JS measurement
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: isMobile ? 'min(75vw, 360px)' : 'clamp(300px, 44vw, 520px)',
    overflow: 'hidden',
  }

  return (
    <div className="select-none" style={containerStyle}>
      {/* Render ALL promos with stable key=id → CSS transitions animate movement */}
      {promos.map((promo, i) => {
        const d = circOffset(i, current, len)
        const absD = Math.abs(d)
        const hidden = absD > maxVisible
        const opacity = hidden ? 0 : Math.max(0, 1 - absD * 0.42)
        const scale   = Math.max(0.52, 1 - absD * 0.16)
        const xVW     = d * stepVW
        const isCenter = d === 0
        const itemW   = isMobile ? ITEM_W_MOBILE : ITEM_W_DESKTOP

        return (
          <div
            key={promo.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: itemW,
              height: '100%',
              // -50% centres the item on the 50% left anchor; xVW shifts it
              transform: `translateX(calc(-50% + ${xVW}vw)) scale(${scale})`,
              transformOrigin: 'center center',
              opacity,
              // z-index max 39 — stays below navbar z-50
              zIndex: hidden ? 0 : 39 - absD * 8,
              pointerEvents: hidden ? 'none' : 'auto',
              willChange: 'transform, opacity',
              transition: 'transform 0.60s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.60s ease',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (isCenter) onSelect(promo)
              else { goTo(i); resetTimer() }
            }}
          >
            <div
              className="w-full h-full rounded-3xl overflow-hidden"
              style={{
                boxShadow: isCenter
                  ? '0 24px 60px rgba(0,0,0,0.22), 0 0 0 2px rgba(201,168,76,0.5)'
                  : '0 8px 24px rgba(0,0,0,0.10)',
                transition: 'box-shadow 0.60s ease',
              }}
            >
              <img
                src={promo.foto_data}
                alt={promo.titulo}
                className="w-full h-full object-contain bg-white"
                draggable={false}
              />
              {isCenter && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-5 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2 text-white">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-sans text-sm font-medium">Ver detalle</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Dots — z-index 40 (below nav 50, above items 39) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none" style={{ zIndex: 40 }}>
        {promos.map((_, i) => (
          <button key={i} className="pointer-events-auto transition-all duration-300"
            onClick={() => { goTo(i); resetTimer() }}
            style={{
              width: i === current ? 24 : 8, height: 8, borderRadius: 4,
              background: i === current ? '#C9A84C' : 'rgba(255,255,255,0.7)',
              border: i === current ? 'none' : '1px solid rgba(0,0,0,0.08)',
            }}
          />
        ))}
      </div>

      {/* Arrows — z-index 40 */}
      <button onClick={() => { goTo(current - 1); resetTimer() }}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:text-gold hover:bg-white transition-all duration-200"
        style={{ zIndex: 40, border: '1px solid rgba(201,168,76,0.2)' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button onClick={() => { goTo(current + 1); resetTimer() }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:text-gold hover:bg-white transition-all duration-200"
        style={{ zIndex: 40, border: '1px solid rgba(201,168,76,0.2)' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// ── Main section ─────────────────────────────────────────────────────────────
export default function Promociones() {
  const [promos, setPromos] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPromociones(true)
      .then(data => { if (Array.isArray(data)) setPromos(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && promos.length === 0) return null

  return (
    <section id="promociones" className="relative overflow-hidden bg-gradient-to-b from-[#f9f4f0] to-white" style={{ isolation: 'isolate' }}>

      {/* Decorative */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold/5 pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-brand-pink/8 pointer-events-none" />

      <div className={`transition-all duration-700 ${selected ? 'py-10' : 'pt-16 pb-4'}`}>
        {/* Header — hide when detail is open on mobile */}
        <div className={`text-center mb-8 px-6 transition-all duration-500 ${selected ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'}`}>
          <span
            className="inline-flex items-center gap-2 bg-gold text-white font-sans text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5 shadow-md"
            style={{ animation: 'promoBadgePulse 2.8s ease-in-out infinite' }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Ofertas Especiales
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-800 mb-3">Promociones</h2>
          <div className="w-16 h-0.5 bg-gold mx-auto mb-4" />
          <p className="font-sans text-gray-500 text-base max-w-md mx-auto">
            Lunes y Miércoles — aprovecha nuestras ofertas exclusivas
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : selected ? (
          /* ── DETAIL VIEW ── */
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Back btn */}
            <button
              onClick={() => setSelected(null)}
              className="hidden md:flex items-center gap-2 font-sans text-sm text-gray-400 hover:text-gold transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver al carrusel
            </button>
            <DetailPanel promo={selected} onClose={() => setSelected(null)} />
          </div>
        ) : (
          /* ── CAROUSEL VIEW ── */
          <Coverflow promos={promos} onSelect={setSelected} />
        )}

        {/* Bottom hint when carousel is shown */}
        {!selected && !loading && (
          <p className="font-sans text-xs text-gray-400 text-center mt-5 pb-8">
            Toca una promoción para ver los detalles
          </p>
        )}
      </div>

      <style>{`
        @keyframes promoBadgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.45); }
          50% { box-shadow: 0 0 0 10px rgba(201,168,76,0); }
        }
        @keyframes fadeDetail {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeDetail {
          animation: fadeDetail 0.45s ease forwards;
        }
      `}</style>
    </section>
  )
}
