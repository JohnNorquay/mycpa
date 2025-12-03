import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthProvider } from '@/components/providers/auth-provider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <div className="min-h-screen dark:bg-gray-950">
        <Sidebar />
        <div className="lg:pl-64">
          <Header userEmail={user.email} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
