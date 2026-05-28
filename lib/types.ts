export type Magazine = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  pdf_url: string;
  cover_url: string | null;
  issue_label: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type TocItem = {
  id?: string;
  magazine_id?: string;
  title: string;
  page: number;
  description?: string | null;
  position: number;
};
