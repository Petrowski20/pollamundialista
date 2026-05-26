import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';

export default async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  let nickname = '';
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, nickname, avatar_url')
      .eq('id', user.id)
      .single();

    isAdmin  = profile?.role === 'ADMIN';
    nickname = profile?.nickname ?? '';
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Lado Izquierdo: Logo y Enlaces Principales */}
          <div className="flex space-x-8">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-black text-blue-600 tracking-tight">
                POLLA<span className="text-gray-900 font-medium">MUNDIALISTA</span>
              </Link>
            </div>
            
            <div className="hidden md:flex space-x-4 items-center">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">
                Inicio
              </Link>
              <Link href="/predicciones" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">
                Predicciones
              </Link>
              <Link href="/clasificacion" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">
                Clasificación
              </Link>
              <Link href="/ligas" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">
                Ligas Privadas
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-md transition-colors">
                  🛡️ Admin
                </Link>
              )}
            </div>
          </div>

          {/* Lado Derecho: Perfil del Usuario */}
          <div className="flex items-center space-x-4">
            {user ? (
              <Link 
                href="/perfil" 
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all border border-gray-200"
              >
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={nickname} fill className="object-cover" />
                  ) : (
                    <span className="text-blue-600 font-bold text-xs">{nickname.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="max-w-[100px] truncate">{nickname}</span>
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                Iniciar Sesión
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}