import Navbar from "@/components/NavBar";
import { Toaster } from 'sonner';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. ESCUDO DE SEGURIDAD (Sustituye al Middleware)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario activo, lo expulsamos al instante al login
  if (!user) {
    redirect('/login');
  }

  // 2. Si hay usuario, renderizamos la aplicación normal
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster position="bottom-center" richColors />
    </>
  );
}
