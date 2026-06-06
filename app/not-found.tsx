import Link from 'next/link';
import { getServerLang, tServer } from '@/utils/i18n-server';

export default async function NotFound() {
  const lang = await getServerLang();
  const t = (key: string) => tServer(lang, key);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#FFD6D1] dark:border-slate-800 rounded-2xl shadow-xl p-10 text-center">

        <div className="text-8xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
          404
        </div>

        <div className="mt-3 text-4xl">⛳</div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {t('notFound.title')}
        </h1>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {t('notFound.desc')}
        </p>

        <Link
          href="/"
          className="mt-8 inline-block w-full py-3 px-6 rounded-xl bg-[#FFD6D1] dark:bg-slate-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-[#ffbdb5] dark:hover:bg-slate-700 transition-colors border border-[#ffbdb5] dark:border-slate-700"
        >
          {t('notFound.volver')}
        </Link>

      </div>
    </div>
  );
}
