import Link from 'next/link';
import { siteName } from '@/lib/supabase';

export function Header() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">{siteName}</Link>
        <nav className="nav">
          <Link className="pill" href="/#edicoes">Edições</Link>
          <Link className="pill" href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
