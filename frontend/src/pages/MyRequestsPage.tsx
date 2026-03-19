import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { pipelineApi } from "@/services/api";
import { DataTable, StatusBadge, Pagination } from "@/components/common";
import { useToast } from "@/hooks/useToast";
import type { AnalysisRequest } from "@/types";
import type { DataTableColumn } from "@/components/common/DataTable";

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function MyRequestsPage() {
  const [data, setData] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 1,
  });
  const { addToast } = useToast();

  const fetchRequests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await pipelineApi.list(page);
      if (res.error) {
        addToast(res.error.message, "error");
        setData([]);
      } else {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load requests", "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handleCancel = async (id: string) => {
    try {
      const res = await pipelineApi.cancel(id);
      if (res.error) throw new Error(res.error.message);
      addToast("Request cancelled", "success");
      fetchRequests(pagination.page);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to cancel request", "error");
    }
  };

  const columns: DataTableColumn<AnalysisRequest>[] = [
    {
      key: "organization_name",
      header: "Organization Name",
      render: (row) => (
        <span className="font-medium text-slate-900">{row.organization_name}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "submitted_at",
      header: "Submitted At",
      render: (row) => (
        <span className="text-slate-600">{formatDate(row.submitted_at)}</span>
      ),
    },
    {
      key: "estimated_completion",
      header: "Estimated Completion",
      render: (row) => (
        <span className="text-slate-600">{formatDate(row.estimated_completion)}</span>
      ),
    },
    {
      key: "completed_at",
      header: "Completed At",
      render: (row) => (
        <span className="text-slate-600">{formatDate(row.completed_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "queued" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(row.id);
              }}
              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          {row.status === "ready" && row.organization_id && (
            <Link
              to={`/org/${row.organization_id}`}
              className="rounded-lg border border-primary-200 px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              View dashboard
            </Link>
          )}
        </div>
      ),
    },
  ];

  const handlePageChange = (page: number) => {
    fetchRequests(page);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Analysis Requests</h1>

      {!loading && data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-500">You haven&apos;t submitted any analysis requests yet</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Search & Request Analysis
          </Link>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(row) => row.id}
            loading={loading}
            emptyMessage="No requests found"
          />
          {pagination.total_pages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
