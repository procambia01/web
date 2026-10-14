import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PageMeta } from '@/contracts'
import { Button } from '@/components/ui/button'

export function Pager({ meta, onPage }: { meta?: PageMeta; onPage: (p: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
      <p className="text-xs text-[var(--color-text-muted)]">Page {meta.page} of {meta.totalPages} · {meta.total} results</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!meta.hasPrevPage} onClick={() => onPage(meta.page - 1)}><ChevronLeft size={14} /> Previous</Button>
        <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => onPage(meta.page + 1)}>Next <ChevronRight size={14} /></Button>
      </div>
    </nav>
  )
}
