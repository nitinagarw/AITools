import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [];
  if (page <= 3) {
    pages.push(1, 2, 3, 4, "ellipsis", totalPages);
  } else if (page >= totalPages - 2) {
    pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
  }
  return pages;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pageNumbers = getPageNumbers(page, totalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages || 1}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          className={clsx(
            "rounded-lg p-2 transition-colors",
            isFirstPage
              ? "cursor-not-allowed text-slate-300"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={clsx(
                  "min-w-[2rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  page === p
                    ? "bg-primary-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          className={clsx(
            "rounded-lg p-2 transition-colors",
            isLastPage
              ? "cursor-not-allowed text-slate-300"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
