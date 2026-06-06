import { getServerLang, tServer } from '@/utils/i18n-server'

export default async function Footer() {
  const lang = await getServerLang()
  const t = (key: string) => tServer(lang, key)

  return (
    <footer className="w-full py-6 mt-10 border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div>
          <p>{t('footer.copyright')}</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-4">
          <a
            href="https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=ES&wtw-filter=ALL"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
          >
            <span>🗓️</span> {t('footer.calendario')}
          </a>
          <a
            href="https://www.dataredonda.com/simulador-mundial"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
          >
            <span>📊</span> {t('footer.simulador')}
          </a>
          <a
            href="https://www.rtve.es/play/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
          >
            <span>📺</span> {t('footer.rtve')}
          </a>
          <a
            href="https://www.fctv33hd.hair/es/football.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
          >
            <span>🏴‍☠️</span> {t('footer.alternativa')}
          </a>
        </nav>
      </div>
    </footer>
  )
}
