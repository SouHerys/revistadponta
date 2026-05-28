'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError('Login inválido.'); return; }
    router.push('/admin');
  }

  return (
    <div className="container" style={{padding:'50px 0'}}>
      <form className="panel" onSubmit={submit} style={{maxWidth:460,margin:'0 auto'}}>
        <h1>Entrar no admin</h1>
        <label className="field">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="field" style={{marginTop:12}}>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p style={{color:'#b91c1c',fontWeight:800}}>{error}</p>}
        <button className="pill primary" style={{marginTop:16,width:'100%'}} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  );
}
