'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  isAdmin: boolean
}

const NAV_LINKS = [
  { href: '/',              label: 'Inicio',          icon: '🏠' },
  { href: '/clasificacion', label: 'Clasificación',   icon: '🏆' },
  { href: '/supuestos',     label: 'Mi Mundial',      icon: '⚽' },
  { href: '/ligas',         label: 'Ligas Privadas',  icon: '🔒' },
  { href: '/reglas',        label: 'Cómo jugar',      icon: '📋' },
]

export default function MobileMenu({ isAdmin }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón hamburguesa — solo en móvil */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay oscuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer lateral desde la derecha */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Navegación</span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links de navegación */}
        <nav className="flex flex-col p-4 gap-1">
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-brand-blue transition-colors"
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="text-base">🛡️</span>
              Admin
            </Link>
          )}
        </nav>
      </div>
    </>
  )
}
