# Revista Vercel Admin

Site completo para revista digital com Next.js + Vercel + Supabase.

## Recursos

- Página inicial pública
- Listagem de edições
- Página de leitura de revista PDF
- Leitor com zoom, modo texto, sumário e link direto por página
- Compartilhamento de página específica
- Área admin protegida por login Supabase
- Cadastro, edição e exclusão de revistas
- Upload de PDF e capa no Supabase Storage
- Sumário editável por edição
- Status publicado/rascunho

## Instalação local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase

1. Crie um projeto no Supabase.
2. Rode o SQL de `supabase/schema.sql` no SQL Editor.
3. Crie um usuário admin em Authentication > Users.
4. Crie um bucket chamado `revistas`, ou rode o SQL incluso.
5. Preencha as variáveis no Vercel.

## Deploy no Vercel

1. Suba este projeto para o GitHub.
2. Importe no Vercel.
3. Configure as variáveis de ambiente.
4. Deploy.

## Variáveis

- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
