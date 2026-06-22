import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(page - 1)} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {start > 1 && (
        <>
          <Button variant={page === 1 ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => onPage(1)}>1</Button>
          {start > 2 && <span className="px-1 text-muted-foreground text-xs">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => onPage(p)}>
          {p}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground text-xs">…</span>}
          <Button variant={page === totalPages ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => onPage(totalPages)}>{totalPages}</Button>
        </>
      )}

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(page + 1)} disabled={page === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PaginationInfo({ page, pageSize, total }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <p className="text-xs text-muted-foreground text-center">
      Showing {from}–{to} of {total}
    </p>
  );
}
