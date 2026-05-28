import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Reader } from '@/components/Reader';
import { supabase, siteName } from '@/lib/supabase';
import type { Magazine, TocItem } from '@/lib/types';

export const revalidate = 60;

type Props = { params: { slug: string } };

async function getMagazine(slug: string) {
  const { data: magazine } = await supabase.from('magazines').select('*').eq('slug', slug).eq('published', true).single();
  if (!magazine) return null;
  const { data: toc } = await supabase.from('toc_items').select('*').eq('magazine_id', magazine.id).order('position', { ascending: true });
  return { magazine: magazine as Magazine, toc: (toc || []) as TocItem[] };
}

export async function generateMetadata({ params }: Props) {
  const data = await getMagazine(params.slug);
  if (!data) return { title: siteName };
  return { title: `${data.magazine.title} | ${siteName}`, description: data.magazine.subtitle || data.magazine.description || undefined };
}

export default async function MagazinePage({ params }: Props) {
  const data = await getMagazine(params.slug);
  if (!data) notFound();
  const { magazine, toc } = data;
  return (
    <>
      <Header />
      <main className="container">
        <div className="section-title" style={{paddingTop:24}}>
          <div><span className="eyebrow">{magazine.issue_label || 'Edição'}</span><h1 style={{fontSize:42,letterSpacing:'-.05em',margin:'10px 0'}}>{magazine.title}</h1>{magazine.subtitle && <p className="lead">{magazine.subtitle}</p>}</div>
        </div>
        <Reader title={magazine.title} pdfUrl={magazine.pdf_url} toc={toc} />
      </main>
    </>
  );
}
