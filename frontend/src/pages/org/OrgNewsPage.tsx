import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { orgApi } from "@/services/api";
import { FilterBar, SentimentBadge, Pagination } from "@/components/common";
import type { NewsArticle } from "@/types";

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
];

export function OrgNewsPage() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ sentiment: "" });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 1,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    orgApi
      .listNews(id, page, filters.sentiment || undefined)
      .then((res) => {
        if (cancelled) return;
        setNews(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {
        if (!cancelled) setNews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, page, filters.sentiment]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ sentiment: "" });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <FilterBar
        filters={[
          {
            key: "sentiment",
            label: "Sentiment",
            options: SENTIMENT_OPTIONS,
          },
        ]}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((article) => (
            <article
              key={article.id}
              className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {article.headline}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{article.source ?? "Unknown"}</span>
                    <span>·</span>
                    <span>
                      {new Date(article.published_at).toLocaleDateString()}
                    </span>
                    <SentimentBadge sentiment={article.sentiment} />
                  </div>
                  {article.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {article.summary}
                    </p>
                  )}
                </div>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-600"
                  aria-label="Read full article"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </a>
              </div>
            </article>
          ))}

          {news.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
              <p className="text-sm text-slate-500">No news articles found</p>
            </div>
          )}
        </div>
      )}

      {!loading && pagination.total_pages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
