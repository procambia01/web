'use client'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key:       string
  header:    string
  width?:    string
  className?: string
  render:    (row: T, i: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns:     Column<T>[]
  data:        T[]
  keyFn:       (row: T) => string
  isLoading?:  boolean
  emptyTitle?: string
  emptyDesc?:  string
  emptyAction?: React.ReactNode
  page?:       number
  totalPages?: number
  onPageChange?: (p: number) => void
  total?:      number
  perPage?:    number
  className?:  string
}

export function DataTable<T>({
  columns, data, keyFn,
  isLoading, emptyTitle = 'No data', emptyDesc,
  emptyAction, page, totalPages, onPageChange,
  total, perPage, className,
}: DataTableProps<T>) {
  return (
    <div className={cn('rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] font-body uppercase tracking-wide',
                    col.width,
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)] mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <p className="font-display font-bold text-[var(--color-text-primary)] text-sm">{emptyTitle}</p>
                  {emptyDesc && <p className="text-xs text-[var(--color-text-muted)] font-body mt-1">{emptyDesc}</p>}
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyFn(row)}
                  className="border-b border-[var(--color-divider)] last:border-0 hover:bg-[var(--color-bg)]/60 transition-colors"
                >
                  {columns.map(col => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages !== undefined && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]/40">
          <p className="text-xs text-[var(--color-text-muted)] font-body">
            {total !== undefined && perPage !== undefined
              ? `Showing ${Math.min((page! - 1) * perPage + 1, total)}–${Math.min(page! * perPage, total)} of ${total}`
              : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page! - 1)}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page! <= 3 ? i + 1 : page! + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-semibold font-body transition-colors',
                    p === page
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]',
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page! + 1)}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
