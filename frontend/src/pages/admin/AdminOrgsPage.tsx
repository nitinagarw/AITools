import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { orgApi } from "@/services/api";
import { Modal } from "@/components/common/Modal";
import { DataTable } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import type { Organization, PaginatedResponse } from "@/types";

export function AdminOrgsPage() {
  const [data, setData] = useState<PaginatedResponse<Organization> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Organization | null>(null);

  const [form, setForm] = useState({ name: "", ticker_symbol: "", sector: "", headquarters: "", description: "" });

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orgApi.search("", page);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await orgApi.create(form);
      setShowAdd(false);
      setForm({ name: "", ticker_symbol: "", sector: "", headquarters: "", description: "" });
      fetchOrgs();
    } catch {
      // ignore
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await orgApi.update(deactivateTarget.id, { is_active: false });
      setDeactivateTarget(null);
      fetchOrgs();
    } catch {
      // ignore
    }
  };

  const columns = [
    { key: "name", header: "Name", render: (r: Organization) => <span className="font-medium">{r.name}</span> },
    { key: "ticker_symbol", header: "Ticker", render: (r: Organization) => <span className="font-mono text-slate-500">{r.ticker_symbol || "—"}</span> },
    { key: "sector", header: "Sector" },
    {
      key: "is_active",
      header: "Status",
      render: (r: Organization) => <StatusBadge status={r.is_active ? "active" : "inactive"} />,
    },
    { key: "scraping_frequency", header: "Scraping Freq" },
    {
      key: "actions",
      header: "Actions",
      render: (r: Organization) => (
        <div className="flex items-center gap-2">
          <Link to={`/org/${r.id}`} className="text-sm text-primary-600 hover:text-primary-700">
            View
          </Link>
          {r.is_active && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeactivateTarget(r); }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  const sectors = ["Technology", "Finance", "Energy", "Healthcare", "Consumer Goods", "Industrial", "Telecom"];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition"
        >
          <PlusIcon className="h-4 w-4" />
          Add Organization
        </button>
      </div>

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <DataTable columns={columns} data={data.data} keyExtractor={(r) => r.id} />
          <div className="mt-4">
            <Pagination page={page} totalPages={data.pagination.total_pages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <EmptyState title="No organizations" description="Add your first organization to get started." action={{ label: "Add Organization", onClick: () => setShowAdd(true) }} />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Organization" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Organization name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ticker Symbol</label>
              <input
                value={form.ticker_symbol}
                onChange={(e) => setForm({ ...form, ticker_symbol: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="e.g., RELIANCE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select sector</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Headquarters</label>
            <input
              value={form.headquarters}
              onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Brief description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button onClick={handleAdd} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition">
              Create Organization
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Organization"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name}"? This will pause all scraping and analysis pipelines.`}
        confirmLabel="Deactivate"
        variant="warning"
      />
    </div>
  );
}
