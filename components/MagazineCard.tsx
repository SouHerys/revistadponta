import Link from 'next/link';
import type { Magazine } from '@/lib/types';
import { formatDate } from '@/lib/helpers';

export function MagazineCard({ magazine }: { magazine: Magazine }) {
  return (
    <Link className="mag-card" href={`/revistas/${magazine.slug}`}>
      {magazine.cover_url ? (
        <img className="cover" src={magazine.cover_url} alt={magazine.title} />
      ) : (
        <div className="cover placeholder">{magazine.title}</div>
      )}
      <div className="meta">
        {magazine.issue_label && <span className="tag">{magazine.issue_label}</span>}
        <span className="tag">{formatDate(magazine.created_at)}</span>
      </div>
      <h3>{magazine.title}</h3>
      {magazine.subtitle && <p>{magazine.subtitle}</p>}
    </Link>
  );
}
