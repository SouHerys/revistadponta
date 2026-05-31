'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TocItem } from '@/lib/types';
import { BookOpen, Copy, Maximize2, Share2, Star, Type } from 'lucide-react';

type PDFDocumentProxy = any;
type PDFPageProxy = any;

type ReaderProps = {
  title: string;
  pdfUrl: string;
  toc: TocItem[];
};

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const PDFJS_VERSION = '3.11.174';
const PDFJS_SCRIPT = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

function readInitialPage() {
  if (typeof window === 'undefined') return 1;
  const url = new URL(window.location.href);
  const page = Number(url.searchParams.get('p') || url.searchParams.get('page') || '1');
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function toast(message: string) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-pdfjs="true"]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (!window.pdfjsLib) return reject(new Error('PDF.js não carregou'));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      });
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_SCRIPT;
    script.async = true;
    script.dataset.pdfjs = 'true';
    script.onload = () => {
      if (!window.pdfjsLib) return reject(new Error('PDF.js não carregou'));
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function Reader({ title, pdfUrl, toc }: ReaderProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textCache = useRef<Record<number, string>>({});
  const pinch = useRef<{ startDistance: number; startScale: number; previewScale: number } | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(readInitialPage);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.05);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [marked, setMarked] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const progress = useMemo(() => (pageCount ? Math.round((page / pageCount) * 100) : 0), [page, pageCount]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    loadPdfJs()
      .then((pdfjs) => pdfjs.getDocument({ url: pdfUrl }).promise)
      .then((doc: PDFDocumentProxy) => {
        if (!mounted) return;
        setPdf(doc);
        setPageCount(doc.numPages);
        setPage((current) => Math.min(Math.max(1, current), doc.numPages));
      })
      .catch(() => toast('Não foi possível abrir o PDF.'))
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [pdfUrl]);

  const renderPage = useCallback(async () => {
    if (!pdf || textMode) return;
    setLoading(true);
    try {
      const pageObj: PDFPageProxy = await pdf.getPage(page);
      const viewport = pageObj.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      await pageObj.render({ canvasContext: ctx, viewport }).promise;
    } finally {
      setLoading(false);
    }
  }, [pdf, page, scale, textMode]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  useEffect(() => {
    if (!pdf) return;
    const url = new URL(window.location.href);
    url.searchParams.set('p', String(page));
    window.history.replaceState(null, '', url.toString());
    localStorage.setItem(`revista:last:${pdfUrl}`, String(page));
  }, [page, pdf, pdfUrl]);

  useEffect(() => {
    if (!pdf || !textMode) return;
    async function loadText() {
      if (textCache.current[page]) {
        setText(textCache.current[page]);
        return;
      }
      const pageObj = await pdf.getPage(page);
      const content = await pageObj.getTextContent();
      const raw = content.items.map((item: any) => item.str).join(' ').trim();
      const finalText = raw || 'Esta página não possui texto extraível. Isso costuma acontecer em PDFs escaneados.';
      textCache.current[page] = finalText;
      setText(finalText);
    }
    loadText();
  }, [pdf, page, textMode]);

  function go(next: number) {
    if (!pdf) return;
    setPage(Math.max(1, Math.min(next, pdf.numPages)));
    setSidebarOpen(false);
  }

  function fitWidth() {
    if (!stageRef.current || !canvasRef.current) return;
    const currentWidth = canvasRef.current.getBoundingClientRect().width || 800;
    const target = Math.max(0.55, Math.min(2.2, ((stageRef.current.clientWidth - 24) / currentWidth) * scale));
    setScale(target);
  }

  async function sharePage() {
    const url = new URL(window.location.href);
    url.searchParams.set('p', String(page));
    const shareText = `${title} — página ${page}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareText, text: shareText, url: url.toString() });
      } else {
        await navigator.clipboard.writeText(url.toString());
        toast('Link da página copiado.');
      }
    } catch {
      await navigator.clipboard.writeText(url.toString());
      toast('Link da página copiado.');
    }
  }

  function toggleMark() {
    setMarked((items) => (items.includes(page) ? items.filter((p) => p !== page) : [...items, page].sort((a, b) => a - b)));
  }

  function distance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (textMode || e.touches.length !== 2) return;
    const startDistance = distance(e.touches[0], e.touches[1]);
    pinch.current = { startDistance, startScale: scale, previewScale: 1 };
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!pinch.current || e.touches.length !== 2 || !wrapRef.current) return;
    e.preventDefault();
    const next = distance(e.touches[0], e.touches[1]);
    const preview = Math.max(0.55, Math.min(2.2, next / Math.max(1, pinch.current.startDistance)));
    pinch.current.previewScale = preview;
    wrapRef.current.style.transform = `scale(${preview})`;
    wrapRef.current.style.transformOrigin = 'center top';
  }

  function onTouchEnd() {
    if (!pinch.current || !wrapRef.current) return;
    const finalScale = Math.max(0.55, Math.min(3.2, pinch.current.startScale * pinch.current.previewScale));
    wrapRef.current.style.transform = '';
    wrapRef.current.style.transformOrigin = '';
    pinch.current = null;
    setScale(finalScale);
  }

  return (
    <div className={`reader-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="reader-toolbar">
        <button className="reader-btn primary toc-open" onClick={() => setSidebarOpen((v) => !v)}>
          <BookOpen size={18} /> Sumário
        </button>
        <button className="reader-btn icon prev" onClick={() => go(page - 1)}>‹</button>
        <div className="reader-page-box pagebox">
          <input value={page} onChange={(e) => go(Number(e.target.value || 1))} /> <span>/</span> <span>{pageCount || '?'}</span>
        </div>
        <button className="reader-btn icon next" onClick={() => go(page + 1)}>›</button>
        <button className="reader-btn share" onClick={sharePage}><Share2 size={17} /> Compartilhar</button>
        <button className="reader-btn fit" onClick={fitWidth}><Maximize2 size={17} /> Ajustar</button>
        <button className="reader-btn text" onClick={() => setTextMode((v) => !v)}>{textMode ? <Copy size={17} /> : <Type size={17} />}</button>
      </div>
      <div className="reader-main">
        <aside className="reader-sidebar">
          <button className="toc-item" onClick={toggleMark}>
            <strong><Star size={15} /> {marked.includes(page) ? 'Página marcada' : 'Marcar página atual'}</strong>
            <small>Página {page}</small>
          </button>
          {marked.map((p) => (
            <button className="toc-item" key={p} onClick={() => go(p)}>
              <strong>Página marcada</strong><small>Ir para página {p}</small>
            </button>
          ))}
          {toc.length ? toc.map((item) => (
            <button className="toc-item" key={`${item.position}-${item.page}-${item.title}`} onClick={() => go(item.page)}>
              <strong>{item.title}</strong>
              <small>Página {item.page}{item.description ? ` — ${item.description}` : ''}</small>
            </button>
          )) : <div className="empty">Esta edição ainda não tem sumário.</div>}
        </aside>
        <main className="pdf-stage" ref={stageRef} onClick={() => setSidebarOpen(false)} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {textMode ? (
            <article className="text-reader">{text.split(/(?<=\.)\s+/).map((p, i) => <p key={i}>{p}</p>)}</article>
          ) : (
            <div className="pdf-wrap" ref={wrapRef}>
              <div className="pdf-card"><canvas ref={canvasRef} />{loading && <div className="toast">Carregando página...</div>}</div>
            </div>
          )}
        </main>
      </div>
      <div style={{ padding: '10px 16px', color: '#71717a', fontWeight: 800, fontSize: 13 }}>{progress}% lido • Página {page}</div>
    </div>
  );
}
