'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import es from '@/locales/es.json'
import en from '@/locales/en.json'
import ro from '@/locales/ro.json'

export type Lang = 'es' | 'en' | 'ro'
type Vars = Record<string, string | number>

const dicts: Record<Lang, typeof es> = { es, en: en as typeof es, ro: ro as typeof es }

function resolve(dict: typeof es, key: string): string {
  const val = key.split('.').reduce((o: unknown, k: string) => {
    if (o && typeof o === 'object') return (o as Record<string, unknown>)[k]
    return undefined
  }, dict as unknown)
  return typeof val === 'string' ? val : key
}

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Vars) => string
}

const LangContext = createContext<LangCtx | null>(null)

export function LangProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode
  initialLang: Lang
}) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l)
      document.cookie = `pm_lang=${l};path=/;max-age=31536000;SameSite=Lax`
      router.refresh()
    },
    [router],
  )

  const t = useCallback(
    (key: string, vars?: Vars): string => {
      const raw = resolve(dicts[lang], key)
      if (!vars) return raw
      return Object.entries(vars).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, String(v)),
        raw,
      )
    },
    [lang],
  )

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang(): LangCtx {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
