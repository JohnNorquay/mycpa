'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function signIn(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/', 'layout')
  return {
    success: true,
    data: { redirectTo: '/dashboard' },
  }
}

export async function signUp(formData: FormData): Promise<ActionResult<{ message: string }>> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match',
    }
  }

  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters',
    }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    data: { message: 'Check your email to confirm your account' },
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return {
      success: false,
      error: 'Email is required',
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    data: { message: 'Check your email for password reset instructions' },
  }
}
