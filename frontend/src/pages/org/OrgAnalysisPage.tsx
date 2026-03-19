import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { intelligenceApi } from "@/services/api";
import { EmptyState } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { AnalysisReport } from "@/types";

const REPORT_TYPE_LABELS: Record<string, string> = {
  growth_trajectory: "Growth Trajectory",
  sentiment_summary: "Sentiment Summary",
  competitive_landscape: "Competitive Landscape",
};

export function OrgAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isRole } = useAuth();
  const { addToast } = useToast();

  const canRefresh = isRole("admin", "analyst");

  const fetchAnalysis = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await intelligenceApi.listAnalysis(id);
      setReports(res.data ?? []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load analysis", "error");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await intelligenceApi.refreshAnalysis(id);
      addToast("Analysis refresh started", "success");
      await fetchAnalysis();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const growthReports = reports.filter((r) => r.report_type === "growth_trajectory");
  const sentimentReports = reports.filter((r) => r.report_type === "sentiment_summary");
  const competitiveReports = reports.filter((r) => r.report_type === "competitive_landscape");

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState
          title="No analysis reports yet"
          description="Growth trajectory, sentiment summary, and competitive landscape reports will appear here once the analysis pipeline completes."
          action={
            canRefresh
              ? { label: "Refresh Analysis", onClick: handleRefresh }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canRefresh && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {refreshing ? "Refreshing..." : "Refresh Analysis"}
          </button>
        </div>
      )}

      {growthReports.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Growth Trajectory</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {growthReports.map((report) => (
              <AnalysisCard key={report.id} report={report} />
            ))}
          </div>
          <div className="mt-4 h-32 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Area chart placeholder</p>
          </div>
        </section>
      )}

      {sentimentReports.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Sentiment Summary</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {sentimentReports.map((report) => (
              <AnalysisCard key={report.id} report={report} />
            ))}
          </div>
          <div className="mt-4 h-32 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Bar chart or summary stats placeholder</p>
          </div>
        </section>
      )}

      {competitiveReports.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Competitive Landscape</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {competitiveReports.map((report) => (
              <AnalysisCard key={report.id} report={report} />
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Text-based analysis placeholder</p>
          </div>
        </section>
      )}
    </div>
  );
}

function AnalysisCard({ report }: { report: AnalysisReport }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
      <p className="text-sm font-medium text-slate-900">
        {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Generated: {new Date(report.generated_at).toLocaleDateString()}
      </p>
      {report.confidence_score != null && (
        <p className="mt-1 text-xs text-slate-600">
          Confidence: {(report.confidence_score * 100).toFixed(0)}%
        </p>
      )}
      {report.model_version && (
        <p className="mt-1 text-xs text-slate-500">
          Model: {report.model_version}
        </p>
      )}
    </div>
  );
}
