import { useState, useEffect, useRef } from 'react'

const images = [
  { src: '/images/Muestra2.jpg', alt: 'Muestra 2' },
  { src: '/images/Muestra3.jpg', alt: 'Muestra 3' },
  { src: '/images/Muestra6.jpg', alt: 'Muestra 6' },
  { src: '/images/Muestra8.jpg', alt: 'Muestra 8' },
  { src: '/images/Muestra10.jpg', alt: 'Muestra 10' },
  { src: '/images/Muestra11.jpg', alt: 'Muestra 11' },
  { src: '/images/Muestra13.jpg', alt: 'Muestra 13' },
]

export default function Galeria() {
  const [lightbox, setLightbox] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.05 }
    )
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox(i => i !== null ? (i + 1) % images.length : null)
      if (e.key === 'ArrowLeft') setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section id="galeria" className="py-24 bg-brand-cream-dark" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="reveal text-center mb-16">
          <p className="font-sans text-gold tracking-[0.25em] text-xs uppercase mb-3">
            Nuestro trabajo
          </p>
          <h2 className="section-title">Resultados Reales</h2>
          <div className="gold-divider" />
          <p className="section-subtitle">
            Cada cliente es única. Estos son algunos de nuestros resultados — haz clic para ampliar
          </p>
        </div>

        {/* Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="reveal break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl shadow-md"
              style={{ transitionDelay: `${(i % 4) * 80}ms` }}
              onClick={() => setLightbox(i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-2xl">
                  ⊕
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Instagram CTA */}
        <div className="reveal text-center mt-14">
          <p className="font-sans text-gray-500 text-sm mb-4">
            ¿Quieres ver más? Síguenos en Instagram
          </p>
          <a
            href="https://www.instagram.com/prettyfaces_beauty_center_/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            @PrettyFacesBeautyCenter
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button
            className="absolute top-6 right-6 text-white text-4xl font-light hover:text-gold transition-colors"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <button
            className="absolute left-4 text-white text-5xl font-thin hover:text-gold transition-colors px-4 py-2"
            onClick={e => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length) }}
          >
            ‹
          </button>
          <img
            src={images[lightbox].src}
            alt={images[lightbox].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white text-5xl font-thin hover:text-gold transition-colors px-4 py-2"
            onClick={e => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length) }}
          >
            ›
          </button>
          <p className="absolute bottom-6 text-white/60 font-sans text-sm">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </section>
  )
}
