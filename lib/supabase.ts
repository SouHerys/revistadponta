import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'revistas';
export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Revista D'Ponta";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
