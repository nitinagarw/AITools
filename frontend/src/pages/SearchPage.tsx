import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { orgApi, pipelineApi } from "@/services/api";
import { SearchBar } from "@/components/common/SearchBar";
import { OrgCard } from "@/components/common/OrgCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { Organization } from "@/types";

const TRENDING_ORGS: Organization[] = [
  {
    id: "1",
    name: "Reliance Industries",
    ticker_symbol: "RELIANCE",
    sector: "Conglomerate",
    headquarters: "Mumbai, India",
    description: null,
    logo_url: null,
    is_active: true,
    scraping_frequency: "daily",
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    name: "TCS",
    ticker_symbol: "TCS",
    sector: "Technology",
    headquarters: "Mumbai, India",
    description: null,
    logo_url: null,
    is_active: true,
    scraping_frequency: "daily",
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    name: "Infosys",
    ticker_symbol: "INFY",
    sector: "Technology",
    headquarters: "Bengaluru, India",
    description: null,
    logo_url: null,
    is_active: true,
    scraping_frequency: "daily",
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    name: "HDFC Bank",
    ticker_symbol: "HDFCBANK",
    sector: "Finance",
    headquarters: "Mumbai, India",
    description: null,
    logo_url: null,
    is_active: true,
    scraping_frequency: "daily",
    created_at: "",
    updated_at: "",
  },
];

const SECTOR_OPTIONS = [
  "Technology",
  "Finance",
  "Energy",
  "Healthcare",
  "Consumer",
  "Industrial",
  "Conglomerate",
  "Other",
];

function RequestAnalysisModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [organizationName, setOrganizationName] = useState("");
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [sector, setSector] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) return;
    setSubmitting(true);
    try {
      const res = await pipelineApi.submit({
        organization_name: organizationName.trim(),
        ticker_symbol: tickerSymbol.trim() || undefined,
        sector: sector || undefined,
      });
      if (res.error) throw new Error(res.error.message);
      addToast("Analysis request submitted successfully", "success");
      onClose();
      onSuccess();
      navigate("/requests");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to submit request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request Analysis" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="org-name" className="block text-sm font-medium text-slate-700">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            id="org-name"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="e.g. Reliance Industries"
          />
        </div>
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium text-slate-700">
            Ticker Symbol
          </label>
          <input
            id="ticker"
            type="text"
            value={tickerSymbol}
            onChange={(e) => setTickerSymbol(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="e.g. RELIANCE"
          />
        </div>
        <div>
          <label htmlFor="sector" className="block text-sm font-medium text-slate-700">
            Sector
          </label>
          <select
            id="sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select sector</option>
            {SECTOR_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const [results, setResults] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 12,
    total_items: 0,
    total_pages: 1,
  });
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const { isRole } = useAuth();
  const navigate = useNavigate();

  const isSearchMode = query.length > 0;
  const canRequestAnalysis = isRole("admin", "analyst");

  useEffect(() => {
    if (!isSearchMode) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    orgApi
      .search(query, currentPage)
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error.message);
          setResults([]);
        } else {
          setResults(res.data);
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, currentPage, isSearchMode]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    navigate(`/?${params.toString()}`);
  };

  if (!isSearchMode) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
        <h1 className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-4xl font-bold text-transparent">
          AI360
        </h1>
        <p className="mt-2 text-slate-500">AI-Powered Organization Intelligence</p>
        <div className="mt-8 w-full max-w-2xl">
          <SearchBar variant="hero" />
        </div>
        <section className="mt-16 w-full max-w-5xl">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-700">
            Trending Organizations
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRENDING_ORGS.map((org) => (
              <OrgCard key={org.id} organization={org} />
            ))}
          </div>
        </section>
        <footer className="mt-16 text-center text-sm text-slate-400">
          Tracking 500+ organizations with AI-powered insights
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <SearchBar key={query} variant="compact" defaultValue={query} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title={`No organizations found for '${query}'`}
          description="Try a different search term or request an analysis for a new organization."
          action={
            canRequestAnalysis
              ? { label: "Request Analysis", onClick: () => setRequestModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {results.map((org) => (
              <OrgCard key={org.id} organization={org} />
            ))}
          </div>
          {pagination.total_pages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      <RequestAnalysisModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
