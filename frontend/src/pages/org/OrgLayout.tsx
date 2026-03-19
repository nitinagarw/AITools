import { useEffect, useState } from "react";
import { useParams, Outlet, NavLink } from "react-router-dom";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { orgApi, exportApi } from "@/services/api";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { OrgDashboard } from "@/types";
import { formatDistanceToNow } from "date-fns";

const EXPORT_SECTIONS = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "financials", label: "Financials" },
  { key: "growth_trajectory", label: "Growth Trajectory" },
  { key: "news_sentiment", label: "News Sentiment" },
  { key: "knowledge_graph", label: "Knowledge Graph" },
  { key: "annual_reports", label: "Annual Reports" },
];

const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
];

const EXPORT_CREDITS = 5;

interface OrgLayoutContext {
  dashboard: OrgDashboard | null;
  loading: boolean;
}

export function OrgLayout() {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<OrgDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "json">("pdf");
  const [exportSections, setExportSections] = useState<string[]>(
    EXPORT_SECTIONS.map((s) => s.key)
  );
  const [exportSubmitting, setExportSubmitting] = useState(false);

  const { isRole } = useAuth();
  const { addToast } = useToast();

  const canExport = isRole("admin", "analyst");

  const fetchDashboard = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await orgApi.getDashboard(id);
      setDashboard(res.data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  const handleRefresh = () => {
    fetchDashboard();
    addToast("Refreshing dashboard...", "info");
  };

  const handleExportSubmit = async () => {
    if (!id) return;
    setExportSubmitting(true);
    try {
      const res = await exportApi.create({
        organization_id: id,
        format: exportFormat,
        sections: exportSections,
      });
      if (res.error) throw new Error(res.error.message);
      addToast("Export job created successfully", "success");
      setExportModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setExportSubmitting(false);
    }
  };

  const toggleSection = (key: string) => {
    setExportSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const lastUpdated = dashboard?.organization?.updated_at
    ? formatDistanceToNow(new Date(dashboard.organization.updated_at), { addSuffix: true })
    : "—";

  return (
    <div className="space-y-6">
      {/* Org Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {loading ? "Loading..." : dashboard?.organization?.name ?? "—"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {dashboard?.organization?.ticker_symbol && (
                <span className="font-mono text-sm text-slate-600">
                  {dashboard.organization.ticker_symbol}
                </span>
              )}
              {dashboard?.organization?.sector && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {dashboard.organization.sector}
                </span>
              )}
              {dashboard?.organization?.headquarters && (
                <span className="text-sm text-slate-500">
                  {dashboard.organization.headquarters}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canExport && (
              <>
                <button
                  type="button"
                  onClick={() => setExportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Tab Bar */}
      <nav className="flex gap-6 border-b border-slate-200">
        <NavLink
          to={`/org/${id}`}
          end
          className={({ isActive }) =>
            `pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-slate-500 hover:text-slate-700"
            }`
          }
        >
          Overview
        </NavLink>
        <NavLink
          to={`/org/${id}/news`}
          className={({ isActive }) =>
            `pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-slate-500 hover:text-slate-700"
            }`
          }
        >
          News
        </NavLink>
        <NavLink
          to={`/org/${id}/analysis`}
          className={({ isActive }) =>
            `pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-slate-500 hover:text-slate-700"
            }`
          }
        >
          Growth Analysis
        </NavLink>
        <NavLink
          to={`/org/${id}/graph`}
          className={({ isActive }) =>
            `pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-slate-500 hover:text-slate-700"
            }`
          }
        >
          Knowledge Graph
        </NavLink>
        <NavLink
          to={`/org/${id}/annual-reports`}
          className={({ isActive }) =>
            `pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-slate-500 hover:text-slate-700"
            }`
          }
        >
          Annual Reports
        </NavLink>
        {canExport && (
          <NavLink
            to={`/org/${id}/chat`}
            className={({ isActive }) =>
              `pb-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-slate-500 hover:text-slate-700"
              }`
            }
          >
            Chat
          </NavLink>
        )}
      </nav>

      {/* Child Content */}
      <Outlet context={{ dashboard, loading } satisfies OrgLayoutContext} />

      {/* Export Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Report"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Format</p>
            <div className="flex gap-4">
              {EXPORT_FORMATS.map((f) => (
                <label
                  key={f.value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.value}
                    checked={exportFormat === f.value}
                    onChange={() => setExportFormat(f.value as "pdf" | "csv" | "json")}
                    className="rounded-full border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Sections</p>
            <div className="space-y-2">
              {EXPORT_SECTIONS.map((s) => (
                <label
                  key={s.key}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={exportSections.includes(s.key)}
                    onChange={() => toggleSection(s.key)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Cost: {EXPORT_CREDITS} credits
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportSubmit}
              disabled={exportSubmitting || exportSections.length === 0}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportSubmitting ? "Submitting..." : "Export"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
