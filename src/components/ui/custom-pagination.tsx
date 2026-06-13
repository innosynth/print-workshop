import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export function PaginationBar({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: PaginationBarProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startRange = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRange = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 border border-border text-muted-foreground px-4 py-2 rounded-lg text-xs w-full mt-4 select-none">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">Page Size:</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent border border-input hover:border-muted-foreground/30 rounded px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs font-mono w-16 text-center cursor-pointer appearance-none transition-colors"
              disabled={isLoading}
            >
              {[10, 25, 50, 75, 100].map((size) => (
                <option key={size} value={size} className="bg-background text-foreground text-left">
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <span className="text-muted-foreground/80 font-mono">
          {startRange} to {endRange} of {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || isLoading}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all cursor-pointer disabled:cursor-not-allowed"
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <span className="font-semibold text-foreground/95">
          Page {page} of {totalPages}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || isLoading}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
