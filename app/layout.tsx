import './globals.css';
import type { Metadata } from 'next';
import { siteName } from '@/lib/supabase';

export const metadata: Metadata = {
  title: siteName,
  description: 'Revista digital com leitura moderna, sumário e gestão completa.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
