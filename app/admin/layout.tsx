'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, siteName } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  async function logout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }
  return (
    <>
      <header className="topbar"><div className="container topbar-inner"><Link href="/" className="brand">{siteName}</Link><span className="tag">Admin</span></div></header>
      <div className="admin-layout">
        <aside className="admin-side"><Link href="/admin">Painel</Link><Link href="/admin/revistas">Revistas</Link><button onClick={logout}>Sair</button></aside>
        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
