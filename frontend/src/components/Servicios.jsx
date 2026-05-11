import { useEffect, useRef } from 'react'

const services = [
  {
    title: 'Tratamientos Capilares',
    description: 'Cortes, tintes, mechas, balayage, alaciado permanente, botox capilar y cirugía capilar. Salud y belleza para tu cabello.',
    image: '/images/Capilares.jpg',
    tags: ['Cortes', 'Coloración', 'Alaciado', 'Botox'],
  },
  {
    title: 'Tratamientos Faciales',
    description: 'Limpieza profunda, anti-edad, rejuvenecimiento, despigmentante, anti-acné, reafirmante y dermaplaning. Piel radiante y saludable.',
    image: '/images/Facial2.jpg',
    tags: ['Anti-Edad', 'Dermaplaning', 'Peeling', 'Reafirmante'],
  },
  {
    title: 'Depilación',
    description: 'Depilación profesional con vapor y mascarilla. Brazos, axilas, piernas, glúteos, brasilian bikini y full body.',
    image: '/images/Depilacion.jpg',
    tags: ['Full Body', 'Brazilian', 'Cera Fría', 'Vapor'],
  },
  {
    title: 'Diseño de Cejas',
    description: 'Servicio personalizado de cuidado y estilizado de cejas. 4 Brow Packs con diseño, depilación, henna y laminado.',
    image: '/images/Cejas.jpg',
    tags: ['Brow Pack', 'Henna', 'Laminado', 'Diseño'],
  },
  {
    title: 'Lash Lifting',
    description: 'Eleva y curva tus pestañas naturales desde la raíz. Larga duración de 2 a 3 meses. Disponible con y sin henna.',
    image: '/images/Lash_Lifting.jpg',
    tags: ['Lash Lifting', 'Henna', 'Pestañas', '2-3 meses'],
  },
  {
    title: 'Retiro de Verrugas & Estética Corporal',
    description: 'Retiro de verrugas (1-15 unidades) y aclaración corporal en axilas, codos, rodillas, entre piernas y full body.',
    image: '/images/Berrugas.jpg',
    tags: ['Verrugas', 'Aclaración', 'Corporal', 'Full Body'],
  },
]

function ServiceCard({ service, delay }) {
  return (
    <div
      className="reveal group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 hover:-translate-y-1"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-serif text-xl text-gray-800 mb-2 group-hover:text-gold transition-colors duration-200">
          {service.title}
        </h3>
        <p className="font-sans text-sm text-gray-500 font-light leading-relaxed mb-4">
          {service.description}
        </p>
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {service.tags.map(tag => (
            <span
              key={tag}
              className="text-xs font-sans font-medium px-3 py-1 bg-gold-pale text-gold-dark rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom gold line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  )
}

export default function Servicios() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    )
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="servicios" className="py-24 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="reveal text-center mb-16">
          <p className="font-sans text-gold tracking-[0.25em] text-xs uppercase mb-3">
            Lo que ofrecemos
          </p>
          <h2 className="section-title">Nuestros Servicios</h2>
          <div className="gold-divider" />
          <p className="section-subtitle">
            Tratamientos personalizados con profesionales expertos para que descubras tu mejor versión
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <ServiceCard key={s.title} service={s} delay={i * 100} />
          ))}
        </div>

        <div className="reveal text-center mt-14">
          <a href="#precios" className="btn-outline-gold">Ver Lista de Precios</a>
        </div>
      </div>
    </section>
  )
}
