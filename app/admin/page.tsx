'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Magazine } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/admin/login'); });
    supabase.from('magazines').select('*').order('created_at', { ascending: false }).then(({ data }) => { setMagazines((data || []) as Magazine[]); setLoading(false); });
  }, [router]);

  return (
    <div>
      <div className="section-title"><h1>Painel</h1><Link className="pill primary" href="/admin/revistas">Nova edição</Link></div>
      <div className="grid">
        <div className="panel"><h2>{magazines.length}</h2><p>Edições cadastradas</p></div>
        <div className="panel"><h2>{magazines.filter(m => m.published).length}</h2><p>Publicadas</p></div>
        <div className="panel"><h2>{magazines.filter(m => !m.published).length}</h2><p>Rascunhos</p></div>
      </div>
      <div className="panel" style={{marginTop:18}}>
        <h2>Últimas edições</h2>
        {loading ? <p>Carregando...</p> : <table className="table"><thead><tr><th>Título</th><th>Status</th><th>Slug</th></tr></thead><tbody>{magazines.slice(0,8).map(m => <tr key={m.id}><td>{m.title}</td><td>{m.published ? 'Publicada' : 'Rascunho'}</td><td>{m.slug}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
