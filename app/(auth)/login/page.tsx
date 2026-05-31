import Image from 'next/image'
import AuthForm from '@/components/AuthForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string }>
}) {
  const { error, view } = await searchParams
  const isRegister = view === 'register'

  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate())
  const maxBirthDate = maxDate.toISOString().split('T')[0]

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-10 mb-20">
      <div className="text-center mb-6">
        <Image
          src="/titulo.svg"
          alt="PollaMundialista"
          width={280}
          height={82}
          className="mx-auto mb-4 dark:brightness-0 dark:invert"
          style={{ width: 'auto', height: 'auto' }}
          unoptimized
          priority
        />
        <p className="text-sm text-gray-500">
          {isRegister ? 'Crea tu cuenta de jugador' : 'Inicia sesión para predecir'}
        </p>
      </div>

      <AuthForm
        isRegister={isRegister}
        maxBirthDate={maxBirthDate}
        errorInicial={error}
      />
    </div>
  )
}
