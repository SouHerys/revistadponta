import { Header } from '@/components/Header';
import { MagazineCard } from '@/components/MagazineCard';
import { supabase, siteName } from '@/lib/supabase';
import type { Magazine } from '@/lib/types';

export const revalidate = 60;

async function getMagazines() {
  const { data } = await supabase
    .from('magazines')
    .select('*')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });
  return (data || []) as Magazine[];
}

export default async function HomePage() {
  const magazines = await getMagazines();
  const featured = magazines[0];
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Revista digital</span>
              <h1 className="h1">Leia a revista no celular, no computador e compartilhe páginas.</h1>
              <p className="lead">Uma experiência de leitura moderna para {siteName}, com edições digitais, sumário, links diretos por página e modo texto.</p>
              <div className="actions"><a className="pill primary" href="#edicoes">Ver edições</a><a className="pill" href="/admin">Entrar no admin</a></div>
            </div>
            <div className="hero-card">
              {featured?.cover_url ? <img className="cover" src={featured.cover_url} alt={featured.title} /> : <div className="cover placeholder">{siteName}</div>}
              <h2>{featured?.title || 'Sua próxima edição aparece aqui'}</h2>
              <p>{featured?.subtitle || 'Cadastre uma revista no painel administrativo para publicar no site.'}</p>
            </div>
          </div>
        </section>
        <section className="section" id="edicoes">
          <div className="container">
            <div className="section-title"><h2>Edições</h2><span className="tag">{magazines.length} publicadas</span></div>
            {magazines.length ? <div className="grid">{magazines.map((m) => <MagazineCard key={m.id} magazine={m} />)}</div> : <div className="empty">Nenhuma edição publicada ainda.</div>}
          </div>
        </section>
      </main>
    </>
  );
}
