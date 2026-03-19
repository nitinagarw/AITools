import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { orgApi } from "@/services/api";
import { DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { AnnualReport } from "@/types";

export function OrgAnnualReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [reports, setReports] = useState<AnnualReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    orgApi
      .listAnnualReports(id)
      .then((res) => {
        if (cancelled) return;
        setReports(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setReports([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <DataTable<AnnualReport>
        columns={[]}
        data={[]}
        keyExtractor={() => ""}
        loading
      />
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState
          title="No annual reports processed yet"
          description="Annual reports will appear here once they are ingested and processed by the pipeline."
        />
      </div>
    );
  }

  return (
    <DataTable<AnnualReport>
      columns={[
        { key: "fiscal_year", header: "Fiscal Year" },
        { key: "title", header: "Title" },
        {
          key: "processing_status",
          header: "Status",
          render: (row) => <StatusBadge status={row.processing_status} />,
        },
        {
          key: "pages_count",
          header: "Pages",
          render: (row) => row.pages_count ?? "—",
        },
        { key: "extracted_entities_count", header: "Entities Extracted" },
        { key: "embeddings_count", header: "Embeddings" },
        {
          key: "processed_at",
          header: "Processed Date",
          render: (row) =>
            row.processed_at
              ? new Date(row.processed_at).toLocaleDateString()
              : "—",
        },
        {
          key: "actions",
          header: "",
          render: (row) => {
            if (row.processing_status === "completed") {
              return (
                <Link
                  to={`/org/${id}/annual-reports/${row.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View
                </Link>
              );
            }
            if (
              row.processing_status === "processing" ||
              row.processing_status === "pending"
            ) {
              return (
                <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Processing
                </span>
              );
            }
            return null;
          },
        },
      ]}
      data={reports}
      keyExtractor={(row) => row.id}
      emptyMessage="No annual reports"
    />
  );
}
