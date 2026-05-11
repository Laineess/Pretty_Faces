import { useEffect, useRef } from 'react'

// Replace with actual WhatsApp number
const WHATSAPP_NUMBER = '523348279540'
const INSTAGRAM = 'PrettyFacesBeautyCenter'

export default function Contacto() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.15 }
    )
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Me%20gustar%C3%ADa%20agendar%20una%20cita%20en%20Pretty%20Face%27s%20Beauty%20Center`

  return (
    <section id="contacto" className="py-24 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Left: CTA */}
          <div className="space-y-8">
            <div className="reveal">
              <p className="font-sans text-gold tracking-[0.25em] text-xs uppercase mb-3">
                Haz tu cuidado una prioridad
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-gray-800 leading-tight">
                Agenda tu Cita<br />
                <span className="italic text-gold">Hoy Mismo</span>
              </h2>
              <div className="w-16 h-0.5 bg-gold mt-6" />
            </div>

            <div className="reveal space-y-4">
              <p className="font-sans text-gray-600 font-light leading-relaxed">
                Estamos listas para atenderte. Escríbenos por WhatsApp o Instagram
                para agendar tu cita o resolver cualquier duda sobre nuestros tratamientos.
              </p>

              {/* Contact options */}
              <div className="space-y-3 pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-[#25D366]/10 border border-[#25D366]/30
                             rounded-xl hover:bg-[#25D366]/20 transition-colors duration-200 group"
                >
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-gray-800 text-sm group-hover:text-[#25D366] transition-colors">
                      WhatsApp
                    </p>
                    <p className="font-sans text-gray-500 text-xs mt-0.5">
                      Respuesta rápida — escríbenos ahora
                    </p>
                  </div>
                  <span className="ml-auto text-[#25D366] text-xl">→</span>
                </a>

                <a
                  href={`https://www.instagram.com/prettyfaces_beauty_center_/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-pink-50 border border-pink-100
                             rounded-xl hover:bg-pink-100 transition-colors duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-gray-800 text-sm group-hover:text-pink-500 transition-colors">
                      Instagram
                    </p>
                    <p className="font-sans text-gray-500 text-xs mt-0.5">
                      @{INSTAGRAM}
                    </p>
                  </div>
                  <span className="ml-auto text-pink-400 text-xl">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="reveal rounded-2xl overflow-hidden shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2439.1339310705926!2d-99.58596277458744!3d19.36856062487051!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d27578973bbc03%3A0xdfc8ba9d7be0391d!2sPrettyface%20Studio!5e0!3m2!1ses-419!2smx!4v1778391162666!5m2!1ses-419!2smx"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Prettyface Studio"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
