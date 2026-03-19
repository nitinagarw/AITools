import { useEffect, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { settingsApi } from "@/services/api";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import type { DataSourceConfig } from "@/types";

const SOURCE_TYPES = [
  { value: "financial", label: "Financial" },
  { value: "news", label: "News" },
];

const defaultForm: Partial<DataSourceConfig> & { api_key?: string } = {
  source_type: "financial",
  provider_name: "",
  display_name: "",
  adapter_class: "",
  base_url: "",
  api_key: "",
  priority: 0,
  is_enabled: true,
};

export function AdminDataSourcesPage() {
  const { addToast } = useToast();
  const [sources, setSources] = useState<DataSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSourceConfig | null>(null);
  const [deleteSource, setDeleteSource] = useState<DataSourceConfig | null>(null);
  const [form, setForm] = useState<Partial<DataSourceConfig> & { api_key?: string }>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.listDataSources();
      setSources(res.data ?? []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to fetch data sources", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const openAddModal = () => {
    setEditingSource(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (source: DataSourceConfig) => {
    setEditingSource(source);
    setForm({
      ...source,
      api_key: (source.config as { api_key?: string })?.api_key ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provider_name?.trim() || !form.display_name?.trim() || !form.adapter_class?.trim() || !form.base_url?.trim()) {
      addToast("Please fill required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<DataSourceConfig> = {
        source_type: form.source_type ?? "financial",
        provider_name: form.provider_name.trim(),
        display_name: form.display_name.trim(),
        adapter_class: form.adapter_class.trim(),
        base_url: form.base_url.trim(),
        priority: form.priority ?? 0,
        is_enabled: form.is_enabled ?? true,
      };
      if (form.api_key) {
        payload.config = { ...(editingSource?.config ?? {}), api_key: form.api_key };
      }
      if (editingSource) {
        await settingsApi.updateDataSource(editingSource.id, payload);
        addToast("Data source updated", "success");
      } else {
        await settingsApi.createDataSource(payload);
        addToast("Data source created", "success");
      }
      setModalOpen(false);
      fetchSources();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save data source", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSource) return;
    try {
      await settingsApi.deleteDataSource(deleteSource.id);
      addToast("Data source deleted", "success");
      setDeleteSource(null);
      fetchSources();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const columns: DataTableColumn<DataSourceConfig>[] = [
    { key: "provider_name", header: "Provider Name", render: (r) => <span className="font-medium">{r.provider_name}</span> },
    { key: "display_name", header: "Display Name", render: (r) => r.display_name },
    {
      key: "source_type",
      header: "Type",
      render: (r) => (
        <StatusBadge
          status={r.source_type}
        />
      ),
    },
    { key: "base_url", header: "Base URL", render: (r) => <span className="truncate max-w-[200px] block" title={r.base_url}>{r.base_url}</span> },
    {
      key: "is_enabled",
      header: "Enabled",
      render: (r) => (
        <input
          type="checkbox"
          checked={r.is_enabled}
          onChange={async () => {
            try {
              await settingsApi.updateDataSource(r.id, { is_enabled: !r.is_enabled });
              addToast("Data source updated", "success");
              fetchSources();
            } catch (err) {
              addToast(err instanceof Error ? err.message : "Failed to update", "error");
            }
          }}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
      ),
    },
    {
      key: "is_default",
      header: "Default",
      render: (r) => (r.is_default ? <StatusBadge status="active" /> : <span className="text-slate-400">—</span>),
    },
    { key: "priority", header: "Priority", render: (r) => r.priority },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(r)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-primary-600 hover:bg-primary-50"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteSource(r)}
            disabled={r.is_default}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Data Source
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sources}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No data sources configured"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSource ? "Edit Data Source" : "Add Data Source"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="source_type" className="mb-1 block text-sm font-medium text-slate-700">
              Source Type
            </label>
            <select
              id="source_type"
              value={form.source_type ?? "financial"}
              onChange={(e) => setForm((f) => ({ ...f, source_type: e.target.value as "financial" | "news" }))}
              disabled={!!editingSource}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="provider_name" className="mb-1 block text-sm font-medium text-slate-700">
              Provider Name <span className="text-red-500">*</span>
            </label>
            <input
              id="provider_name"
              type="text"
              value={form.provider_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, provider_name: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. yahoo_finance"
            />
          </div>
          <div>
            <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-slate-700">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              id="display_name"
              type="text"
              value={form.display_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Yahoo Finance"
            />
          </div>
          <div>
            <label htmlFor="adapter_class" className="mb-1 block text-sm font-medium text-slate-700">
              Adapter Class <span className="text-red-500">*</span>
            </label>
            <input
              id="adapter_class"
              type="text"
              value={form.adapter_class ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, adapter_class: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="adapters.YahooFinanceAdapter"
            />
          </div>
          <div>
            <label htmlFor="base_url" className="mb-1 block text-sm font-medium text-slate-700">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              id="base_url"
              type="url"
              value={form.base_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="api_key" className="mb-1 block text-sm font-medium text-slate-700">
              API Key (optional)
            </label>
            <input
              id="api_key"
              type="password"
              value={form.api_key ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="••••••••"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <input
              id="priority"
              type="number"
              min={0}
              value={form.priority ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value, 10) || 0 }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_enabled"
              type="checkbox"
              checked={form.is_enabled ?? true}
              onChange={(e) => setForm((f) => ({ ...f, is_enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_enabled" className="text-sm font-medium text-slate-700">
              Enabled
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : editingSource ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteSource}
        onClose={() => setDeleteSource(null)}
        onConfirm={handleDelete}
        title="Delete Data Source"
        message={deleteSource ? `Are you sure you want to delete "${deleteSource.display_name}"?` : ""}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
