import { cookies } from 'next/headers'
import es from '@/locales/es.json'
import en from '@/locales/en.json'
import ro from '@/locales/ro.json'
import type { Lang } from '@/contexts/LangContext'

type Vars = Record<string, string | number>

const dicts: Record<Lang, typeof es> = { es, en: en as typeof es, ro: ro as typeof es }

export async function getServerLang(): Promise<Lang> {
  const store = await cookies()
  const val = store.get('pm_lang')?.value
  if (val === 'en' || val === 'ro') return val
  return 'es'
}

export function tServer(lang: Lang, key: string, vars?: Vars): string {
  const dict = dicts[lang]
  const val = key.split('.').reduce((o: unknown, k: string) => {
    if (o && typeof o === 'object') return (o as Record<string, unknown>)[k]
    return undefined
  }, dict as unknown)
  const raw = typeof val === 'string' ? val : key
  if (!vars) return raw
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    raw,
  )
}
