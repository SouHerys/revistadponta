'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, storageBucket } from '@/lib/supabase';
import { slugify } from '@/lib/helpers';
import type { Magazine, TocItem } from '@/lib/types';

type Form = {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  issue_label: string;
  pdf_url: string;
  cover_url: string;
  published: boolean;
  featured: boolean;
};

const emptyForm: Form = { title:'', slug:'', subtitle:'', description:'', issue_label:'', pdf_url:'', cover_url:'', published:false, featured:false };

function toast(message: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

export default function RevistasAdminPage() {
  const router = useRouter();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [saving, setSaving] = useState(false);
  const editing = useMemo(() => Boolean(form.id), [form.id]);

  async function load() {
    const { data } = await supabase.from('magazines').select('*').order('created_at', { ascending: false });
    setMagazines((data || []) as Magazine[]);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/admin/login'); });
    load();
  }, [router]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'title' && !f.id ? { slug: slugify(String(value)) } : {}) }));
  }

  async function uploadFile(file: File, kind: 'pdf' | 'cover') {
    const ext = file.name.split('.').pop() || (kind === 'pdf' ? 'pdf' : 'jpg');
    const name = `${kind}/${Date.now()}-${slugify(file.name)}.${ext}`;
    const { error } = await supabase.storage.from(storageBucket).upload(name, file, { upsert: true });
    if (error) { toast('Erro ao enviar arquivo.'); return; }
    const { data } = supabase.storage.from(storageBucket).getPublicUrl(name);
    update(kind === 'pdf' ? 'pdf_url' : 'cover_url', data.publicUrl);
    toast('Arquivo enviado.');
  }

  async function editMagazine(m: Magazine) {
    setForm({ id:m.id, title:m.title, slug:m.slug, subtitle:m.subtitle || '', description:m.description || '', issue_label:m.issue_label || '', pdf_url:m.pdf_url, cover_url:m.cover_url || '', published:m.published, featured:m.featured });
    const { data } = await supabase.from('toc_items').select('*').eq('magazine_id', m.id).order('position', { ascending: true });
    setToc((data || []) as TocItem[]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.slug || !form.pdf_url) { toast('Preencha título, slug e PDF.'); return; }
    setSaving(true);
    const payload = { title: form.title, slug: form.slug, subtitle: form.subtitle || null, description: form.description || null, issue_label: form.issue_label || null, pdf_url: form.pdf_url, cover_url: form.cover_url || null, published: form.published, featured: form.featured };
    let magazineId = form.id;
    if (editing && form.id) {
      const { error } = await supabase.from('magazines').update(payload).eq('id', form.id);
      if (error) { setSaving(false); toast('Erro ao salvar.'); return; }
    } else {
      const { data, error } = await supabase.from('magazines').insert(payload).select('id').single();
      if (error) { setSaving(false); toast('Erro ao criar edição.'); return; }
      magazineId = data.id;
    }
    if (magazineId) {
      await supabase.from('toc_items').delete().eq('magazine_id', magazineId);
      const cleanToc = toc.filter(i => i.title.trim()).map((i, idx) => ({ magazine_id: magazineId, title: i.title, page: Number(i.page || 1), description: i.description || null, position: idx }));
      if (cleanToc.length) await supabase.from('toc_items').insert(cleanToc);
    }
    setSaving(false);
    setForm(emptyForm);
    setToc([]);
    await load();
    toast('Edição salva.');
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta edição?')) return;
    await supabase.from('magazines').delete().eq('id', id);
    await load();
  }

  return (
    <div>
      <div className="section-title"><h1>Revistas</h1><button className="pill" onClick={() => { setForm(emptyForm); setToc([]); }}>Nova</button></div>
      <form className="panel" onSubmit={save}>
        <h2>{editing ? 'Editar edição' : 'Nova edição'}</h2>
        <div className="form-grid">
          <label className="field">Título<input value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
          <label className="field">Slug<input value={form.slug} onChange={(e) => update('slug', slugify(e.target.value))} /></label>
          <label className="field">Subtítulo<input value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} /></label>
          <label className="field">Edição / número<input value={form.issue_label} onChange={(e) => update('issue_label', e.target.value)} placeholder="Ex: Edição 07" /></label>
          <label className="field full">Descrição<textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} /></label>
          <label className="field">PDF<input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'pdf')} /></label>
          <label className="field">Capa<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'cover')} /></label>
          <label className="field full">URL do PDF<input value={form.pdf_url} onChange={(e) => update('pdf_url', e.target.value)} /></label>
          <label className="field full">URL da capa<input value={form.cover_url} onChange={(e) => update('cover_url', e.target.value)} /></label>
          <label><input type="checkbox" checked={form.published} onChange={(e) => update('published', e.target.checked)} /> Publicada</label>
          <label><input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} /> Destaque</label>
        </div>
        <h3>Sumário</h3>
        {toc.map((item, idx) => <div className="form-grid" key={idx} style={{marginBottom:10}}><label className="field">Título<input value={item.title} onChange={(e) => setToc(t => t.map((x,i) => i===idx ? {...x,title:e.target.value} : x))} /></label><label className="field">Página<input type="number" value={item.page} onChange={(e) => setToc(t => t.map((x,i) => i===idx ? {...x,page:Number(e.target.value)} : x))} /></label><label className="field full">Descrição<input value={item.description || ''} onChange={(e) => setToc(t => t.map((x,i) => i===idx ? {...x,description:e.target.value} : x))} /></label></div>)}
        <div className="actions"><button type="button" className="pill" onClick={() => setToc(t => [...t, { title:'', page:1, description:'', position:t.length }])}>Adicionar item</button><button className="pill primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar edição'}</button></div>
      </form>
      <div className="panel" style={{marginTop:18}}>
        <h2>Edições cadastradas</h2>
        <table className="table"><thead><tr><th>Título</th><th>Status</th><th>Slug</th><th></th></tr></thead><tbody>{magazines.map(m => <tr key={m.id}><td>{m.title}</td><td>{m.published ? 'Publicada' : 'Rascunho'}</td><td>{m.slug}</td><td><button className="pill" onClick={() => editMagazine(m)}>Editar</button> <button className="pill" onClick={() => remove(m.id)}>Excluir</button></td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
