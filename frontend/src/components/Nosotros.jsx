import { useEffect, useRef } from 'react'

export default function Nosotros() {
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
    <section id="nosotros" className="py-24 bg-brand-cream" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Image side */}
          <div className="reveal relative">
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-gold/30 rounded-2xl" />
            <img
              src="/images/Logo.jpg"
              alt="Pretty Face's Beauty Center"
              className="relative z-10 w-full h-[300px] object-cover rounded-2xl shadow-2xl"
            />
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 z-20 bg-white rounded-2xl shadow-xl px-6 py-4 text-center">
              <p className="font-serif text-gold text-3xl font-bold">+5</p>
              <p className="font-sans text-gray-500 text-xs mt-0.5">años de experiencia</p>
            </div>
          </div>

          {/* Text side */}
          <div className="space-y-8">
            <div className="reveal">
              <p className="font-sans text-gold tracking-[0.25em] text-xs uppercase mb-3">Bienvenid@ a</p>
              <h2 className="section-title text-left text-4xl md:text-5xl mb-0">
                Pretty Face's<br />
                <span className="italic text-gold">Beauty Center</span>
              </h2>
            </div>

            <div className="gold-divider mx-0 reveal" />

            <div className="reveal space-y-4">
              <div>
                <h3 className="font-serif text-xl text-gray-800 mb-2">¿Quiénes Somos?</h3>
                <p className="font-sans text-gray-600 font-light leading-relaxed">
                  Somos un Centro de Estética donde nos centramos en la Salud Capilar,
                  cuidado de la piel y Mejoramiento Estético. Ponte en manos de nuestros
                  profesionales expertos en estética y belleza.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-gray-800 mb-2">Nuestro Objetivo</h3>
                <p className="font-sans text-gray-600 font-light leading-relaxed">
                  En Pretty Face's Beauty Center, la belleza es nuestra pasión y tu bienestar,
                  nuestro objetivo. Descubre tu mejor versión con nuestros tratamientos
                  personalizados.
                </p>
              </div>
            </div>

            <div className="reveal grid grid-cols-3 gap-4 pt-4">
              {[
                { label: 'Salud Capilar', icon: '✦' },
                { label: 'Cuidado de Piel', icon: '✦' },
                { label: 'Mejoramiento Estético', icon: '✦' },
              ].map(item => (
                <div key={item.label} className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <span className="text-gold text-lg">{item.icon}</span>
                  <p className="font-sans text-xs text-gray-600 mt-2 leading-tight">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="reveal">
              <a href="#servicios" className="btn-gold">Conoce Nuestros Tratamientos</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
