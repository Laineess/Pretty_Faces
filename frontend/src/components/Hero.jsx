import { useEffect, useState } from 'react'

export default function Hero() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/Portada1.jpg')" }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Decorative gold lines */}
      <div className="absolute top-1/4 left-0 w-24 h-px bg-gradient-to-r from-transparent to-gold/60" />
      <div className="absolute top-1/4 right-0 w-24 h-px bg-gradient-to-l from-transparent to-gold/60" />

      {/* Content */}
      <div className={`relative z-10 text-center px-6 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Tagline */}
        <p className="font-sans text-gold-light tracking-[0.3em] text-xs md:text-sm uppercase mb-4">
          Beauty Center
        </p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
          Tu Bienestar,<br />
          <span className="italic text-gold-light">Nuestra Pasión</span>
        </h1>
        <p className="font-sans text-white/80 font-light text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Especialistas en Salud Capilar, Cuidado de la Piel y Mejoramiento Estético
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="#contacto" className="btn-gold text-sm px-10 py-4">
            Agendar Cita
          </a>
          <a href="#servicios" className="btn-outline-gold text-sm px-10 py-4 border-white text-white hover:bg-white hover:text-gold-dark">
            Ver Servicios
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="font-sans text-white/50 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent animate-bounce" />
      </div>
    </section>
  )
}
