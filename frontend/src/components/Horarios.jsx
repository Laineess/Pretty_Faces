import { useEffect, useRef } from 'react'

const schedule = [
  { days: 'Lunes — Viernes', hours: '10:00 AM – 1:00 PM', hours2: '4:00 PM – 7:00 PM', open: true },
  { days: 'Sábado', hours: '10:00 AM – 4:00 PM', hours2: null, open: true },
  { days: 'Domingo', hours: 'Cerrado', hours2: null, open: false },
]

export default function Horarios() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.15 }
    )
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24 bg-brand-cream" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Image */}
          <div className="reveal order-2 md:order-1">
            <div className="relative">
              <img
                src="/images/Rejuvenecer.jpg"
                alt="Ambiente Pretty Face's Beauty Center"
                className="w-full h-[420px] object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent rounded-2xl" />
            </div>
          </div>

          {/* Schedule */}
          <div className="order-1 md:order-2 space-y-8">
            <div className="reveal">
              <p className="font-sans text-gold tracking-[0.25em] text-xs uppercase mb-3">
                Visítanos
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-gray-800 mb-2">
                Nuestros Horarios
              </h2>
              <div className="w-16 h-0.5 bg-gold mt-4" />
            </div>

            <div className="reveal space-y-3">
              {schedule.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-5 rounded-xl transition-all duration-200 ${
                    s.open
                      ? 'bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      : 'bg-white/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.open ? 'bg-gold' : 'bg-gray-300'}`} />
                    <span className="font-sans font-medium text-gray-800 text-sm">{s.days}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-sans text-sm font-semibold ${s.open ? 'text-gold-dark' : 'text-gray-400'}`}>
                      {s.hours}
                    </p>
                    {s.hours2 && (
                      <p className="font-sans text-xs text-gold-dark mt-0.5">{s.hours2}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="reveal bg-gold/10 border border-gold/20 rounded-xl p-5">
              <p className="font-sans text-sm text-gray-600 leading-relaxed">
                <span className="font-semibold text-gold-dark">¿Tienes una ocasión especial?</span>{' '}
                Contáctanos para consultar disponibilidad en horarios especiales y citas a domicilio.
              </p>
            </div>

            <div className="reveal">
              <a href="#contacto" className="btn-gold">Reservar Ahora</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
