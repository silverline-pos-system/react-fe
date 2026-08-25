import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

/**
 * Standard async-state wrapper for a data-fetch result (React Query or any { isLoading, isError }
 * shape). Renders one consistent Loading / Error+Retry / Empty state, then the children.
 *
 * Usage:
 *   <QueryState isLoading={q.isLoading} isError={q.isError} onRetry={q.refetch}
 *               isEmpty={!q.data?.length} emptyMessage="No products.">
 *     {rows}
 *   </QueryState>
 */
export default function QueryState({
  isLoading = false,
  isError = false,
  onRetry,
  isEmpty = false,
  loading = null,
  emptyMessage = 'No data found.',
  errorMessage = 'Something went wrong while loading this data.',
  className = '',
  children,
}) {
  if (isLoading) {
    if (loading) return loading;
    return (
      <div className={`flex items-center justify-center gap-2 py-10 text-slate-500 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${className}`}>
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-slate-600 max-w-sm">{errorMessage}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 py-10 text-slate-400 ${className}`}>
        <Inbox className="w-8 h-8" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return typeof children === 'function' ? children() : children;
}
