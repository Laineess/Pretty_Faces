import { useState, useEffect } from 'react'

const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Precios', href: '#precios' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
      scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#inicio">
          <img
            src="/images/Logo.jpg"
            alt="Pretty Face's Beauty Center"
            className="h-12 w-auto object-contain"
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`font-sans text-sm font-medium tracking-wide transition-colors duration-200
                  ${scrolled ? 'text-gray-700 hover:text-gold' : 'text-white hover:text-gold-light'}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a href="#contacto" className="hidden md:inline-block btn-gold text-sm">
          Agendar Cita
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menú"
        >
          <div className={`w-6 h-0.5 mb-1.5 transition-all ${scrolled ? 'bg-gray-800' : 'bg-white'}`} />
          <div className={`w-6 h-0.5 mb-1.5 transition-all ${scrolled ? 'bg-gray-800' : 'bg-white'}`} />
          <div className={`w-6 h-0.5 transition-all ${scrolled ? 'bg-gray-800' : 'bg-white'}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg px-6 py-4">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 font-sans text-sm text-gray-700 hover:text-gold border-b border-gray-100"
            >
              {l.label}
            </a>
          ))}
          <a href="#contacto" className="btn-gold text-sm mt-4 text-center w-full block">
            Agendar Cita
          </a>
        </div>
      )}
    </nav>
  )
}
