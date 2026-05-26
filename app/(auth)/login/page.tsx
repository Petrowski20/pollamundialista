import { login, signup } from './actions'
import { SELECCIONES } from '@/utils/data/selecciones'

// Mock temporal de selecciones. En el futuro mapearemos tu archivo JSON real
const SELECCIONES_MOCK = [
  { id: 1, name: 'España', emoji: '🇪🇸' },
  { id: 2, name: 'Argentina', emoji: '🇦🇷' },
  { id: 3, name: 'Brasil', emoji: '🇧🇷' },
  { id: 4, name: 'Francia', emoji: '🇫🇷' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; view?: string }>
}) {
  const { message, error, view } = await searchParams
  const isRegister = view === 'register'

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-10 mb-20">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
          <span className="text-white text-3xl">⚽</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">PollaMundialista</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRegister ? 'Crea tu cuenta de jugador' : 'Inicia sesión para predecir'}
        </p>
      </div>

      <form className="flex flex-col w-full gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        
        {/* CAMPOS COMUNES */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600" htmlFor="email">Correo Electrónico</label>
          <input
            className="rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
            name="email"
            placeholder="tu@email.com"
            required
            type="email"
          />
        </div>

        {/* CAMPOS EXCLUSIVOS DE REGISTRO */}
        {isRegister && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="nickname">Nickname (Único)</label>
              <input
                className="rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                name="nickname"
                placeholder="Ej: Petrowski"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="birthDate">Fecha de Nacimiento</label>
              <input
                className="rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                name="birthDate"
                type="date"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600" htmlFor="favoriteTeamId">Selección Favorita</label>
                <select
                className="rounded-lg px-3 py-2 border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                name="favoriteTeamId"
                required
                >
                <option value="">Selecciona tu país...</option>
                {SELECCIONES.map((team) => (
                    <option key={team.id} value={team.id}>
      {team.emoji} {team.name}
    </option>
  ))}
</select>
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600" htmlFor="password">Contraseña</label>
          <input
            className="rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        {isRegister && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              className="rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
            />
          </div>
        )}

        {/* BOTONES PRINCIPALES */}
        {!isRegister ? (
          <button
            formAction={login}
            className="bg-blue-600 rounded-lg px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors text-sm mt-2 shadow-sm"
          >
            Iniciar Sesión
          </button>
        ) : (
          <button
            formAction={signup}
            className="bg-blue-600 rounded-lg px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors text-sm mt-2 shadow-sm"
          >
            Crear Cuenta
          </button>
        )}

        {/* INTERRUPTOR DE VISTA */}
        <div className="text-center mt-2">
          <a
            href={isRegister ? '/login' : '/login?view=register'}
            className="text-xs text-blue-600 hover:underline"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </a>
        </div>

        {/* FEEDBACK */}
        {error && (
          <p className="p-3 bg-red-50 text-red-600 text-center text-xs rounded-lg border border-red-100 mt-2 font-medium">
            ⚠️ {error}
          </p>
        )}
        {message && (
          <p className="p-3 bg-green-50 text-green-600 text-center text-xs rounded-lg border border-green-100 mt-2 font-medium">
            📩 {message}
          </p>
        )}
      </form>
    </div>
  )
}