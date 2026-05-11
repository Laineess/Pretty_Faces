import { useState, useEffect, useRef } from 'react'

const tabs = ['Capilares', 'Faciales', 'Depilación', 'Cejas & Lash']

const precios = {
  Capilares: [
    { servicio: 'Corte Mujer', precio: '$180' },
    { servicio: 'Corte Niños', precio: '$150' },
    { servicio: 'Corte Hombre', precio: '$150' },
    { servicio: 'Fade', precio: '$50' },
    { servicio: 'Diseño de Barba', precio: '$100' },
    { servicio: 'Tinte Barba', precio: '$350' },
    { servicio: 'Peinados', precio: '$850' },
    { servicio: 'Mascarilla Intensiva Hidratante', precio: '$500' },
    { servicio: 'Mascarilla Reestructurante', precio: '$750' },
    { servicio: 'Alaciado Express + Protector Térmico', precio: '$550' },
    { servicio: 'Retoque Diadema Raíz', precio: 'Desde $250' },
    { servicio: 'Cubridor de Canas', precio: '$200' },
    { servicio: 'Botox Capilar (No Alisante)', precio: '$1,500' },
    { servicio: 'Limpieza de Puntas', precio: 'desde $130' },
    { servicio: 'Tinte Aplicación Completa', precio: 'desde $450' },
    { servicio: 'Relleno de Color', precio: 'desde $100' },
    { servicio: 'Retoque de Tinte en Raíz', precio: 'desde $250' },
    { servicio: 'Baño de Color', precio: '$700' },
    { servicio: 'Aclaración con Tinte (Negros)', precio: 'desde $850' },
    { servicio: 'Aclaración con Tinte (Claros)', precio: 'desde $650' },
    { servicio: 'Mechas / Babylights / Luces', precio: 'desde $1,600' },
    { servicio: 'Corrección de Técnica', precio: 'desde $500' },
    { servicio: 'Decoloración Completa', precio: 'desde $1,800' },
    { servicio: 'Balayage', precio: 'desde $2,000' },
    { servicio: 'Extracción de Color', precio: 'desde $2,000' },
    { servicio: 'Base Chinos Permanente', precio: 'desde $500' },
    { servicio: 'Alaciado Permanente', precio: 'desde $1,500' },
    { servicio: 'Cirugía Capilar (Botox + Keratina + Alisante)', precio: 'desde $2,500' },
    { servicio: 'Nanobotox — Cabellos Quemados (por sesión)', precio: '$1,100' },
    { servicio: 'Alta Frecuencia Capilar — sesión única', precio: '$300' },
    { servicio: 'Alta Frecuencia Capilar — paquete 5 sesiones', precio: '$1,250' },
    { servicio: 'Alta Frecuencia Capilar — paquete 10 sesiones', precio: '$2,000' },
  ],
  Faciales: [
    { servicio: 'Facial Limpieza Profunda', precio: '$500' },
    { servicio: 'Facial Anti-Acné', precio: '$800' },
    { servicio: 'Facial Anti-Cicatrices', precio: '$1,000' },
    { servicio: 'Facial Despigmentante / Peeling', precio: '$1,300' },
    { servicio: 'Facial Anti-Edad', precio: '$1,350' },
    { servicio: 'Facial Rejuvenecimiento', precio: '$1,700' },
    { servicio: '+Sérum Activo (add-on)', precio: '$350' },
    { servicio: 'Retiro de Verrugas (1-3)', precio: '$550' },
    { servicio: 'Retiro de Verrugas (4-7)', precio: '$1,700' },
    { servicio: 'Retiro de Verrugas (8-11)', precio: '$2,500' },
    { servicio: 'Retiro de Verrugas (12-15)', precio: '$3,500' },
    { servicio: 'Aclaración Corporal — Axilas', precio: '$350' },
    { servicio: 'Aclaración Corporal — Codos', precio: '$450' },
    { servicio: 'Aclaración Corporal — Rodillas', precio: '$550' },
    { servicio: 'Aclaración Corporal — Entre Piernas', precio: '$650' },
    { servicio: 'Aclaración Corporal — Full Body', precio: '$2,500' },
  ],
  'Depilación': [
    { servicio: 'Depilación Axilas', precio: '$300' },
    { servicio: 'Depilación Brazos', precio: '$450' },
    { servicio: 'Depilación Glúteos', precio: '$550' },
    { servicio: 'Depilación Medias Piernas', precio: '$600' },
    { servicio: 'Depilación Brasilian Bikini (vapor + mascarilla)', precio: '$650' },
    { servicio: 'Depilación Piernas Completas', precio: '$850' },
    { servicio: 'Full Body (sin bikini)', precio: '$1,850' },
    { servicio: 'Full Body Súmer (con bikini)', precio: '$2,500' },
  ],
  'Cejas & Lash': [
    { servicio: 'Brow Pack 1 — Diseño + Depilación cera fría (pieles sensibles)', precio: 'Consultar' },
    { servicio: 'Brow Pack 2 — Diseño + Depilación + Laminado / Planchado', precio: 'Consultar' },
    { servicio: 'Brow Pack 3 — Diseño + Depilación + Henna', precio: 'Consultar' },
    { servicio: 'Brow Pack 4 — Diseño + Depilación + Laminado + Henna (dura 8-15 días)', precio: 'Consultar' },
    { servicio: 'Lash Lifting (duración 2-3 meses)', precio: 'Consultar' },
    { servicio: 'Lash Lifting + Henna', precio: 'Consultar' },
  ],
}

export default function Precios() {
  const [activeTab, setActiveTab] = useState('Capilares')
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.1 }
    )
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const rows = precios[activeTab]

  return (
    <section id="precios" className="py-24 bg-white" ref={ref}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="reveal text-center mb-12">
          <p className="font-sans text-gold tracking-[0.25em] text-xs uppercase mb-3">
            Transparencia total
          </p>
          <h2 className="section-title">Lista de Precios</h2>
          <div className="gold-divider" />
          <p className="section-subtitle">
            Precios variables según largo y volumen del cabello. Consulta para un presupuesto personalizado.
          </p>
        </div>

        {/* Tabs */}
        <div className="reveal flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-sans text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-250 ${
                activeTab === tab
                  ? 'bg-gold text-white shadow-md'
                  : 'bg-brand-cream text-gray-600 hover:bg-gold-pale hover:text-gold-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="reveal bg-brand-cream rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gold/10 border-b border-gold/20">
                <th className="font-serif text-left px-6 py-4 text-gray-700 font-semibold text-sm">Servicio</th>
                <th className="font-serif text-right px-6 py-4 text-gray-700 font-semibold text-sm whitespace-nowrap">Precio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-gold/10 hover:bg-gold/5 transition-colors duration-150 ${
                    i % 2 === 0 ? 'bg-white/60' : 'bg-transparent'
                  }`}
                >
                  <td className="font-sans text-sm text-gray-700 px-6 py-3.5">{row.servicio}</td>
                  <td className="font-sans text-sm font-semibold text-gold text-right px-6 py-3.5 whitespace-nowrap">
                    {row.precio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="reveal text-center mt-10">
          <p className="font-sans text-gray-400 text-xs mb-6">
            * Precios en pesos mexicanos. Sujetos a cambio sin previo aviso.
          </p>
          <a href="#contacto" className="btn-gold">Agenda tu Consulta</a>
        </div>
      </div>
    </section>
  )
}
