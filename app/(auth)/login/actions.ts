'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData): Promise<{ error: string } | undefined> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData): Promise<{ error: string } | { message: string } | undefined> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const nickname = formData.get('nickname') as string
  const birthDate = formData.get('birthDate') as string
  const favoriteTeamId = formData.get('favoriteTeamId') as string

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  if (birthDate) {
    const today = new Date()
    const limitDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate())
    if (new Date(birthDate) > limitDate) {
      return { error: 'Debes tener al menos 16 años para participar' }
    }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
        birth_date: birthDate,
        favorite_team_id: favoriteTeamId ? parseInt(favoriteTeamId) : null,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Revisa tu correo para confirmar tu cuenta' }
}
