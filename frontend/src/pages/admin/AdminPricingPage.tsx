import { useEffect, useState } from "react";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { creditApi } from "@/services/api";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/hooks/useToast";
import type { CreditPricing } from "@/types";

const ACTION_TYPE_LABELS: Record<string, string> = {
  analysis_request: "Analysis Request",
  chat_query: "Chat Query",
  export_pdf: "Export PDF",
  export_csv: "Export CSV",
  export_json: "Export JSON",
};

function formatActionType(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] ?? actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminPricingPage() {
  const { addToast } = useToast();
  const [pricing, setPricing] = useState<CreditPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreditPricing | null>(null);
  const [form, setForm] = useState<Partial<CreditPricing>>({
    action_type: "",
    credits_cost: 0,
    description: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await creditApi.listPricing();
      setPricing(res.data ?? []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to fetch pricing", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      action_type: "",
      credits_cost: 0,
      description: "",
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: CreditPricing) => {
    setEditingItem(item);
    setForm({
      action_type: item.action_type,
      credits_cost: item.credits_cost,
      description: item.description,
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.action_type?.trim()) {
      addToast("Action type is required", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await creditApi.updatePricing(editingItem.id, {
          action_type: form.action_type,
          credits_cost: form.credits_cost ?? 0,
          description: form.description ?? "",
          is_active: form.is_active ?? true,
        });
        addToast("Pricing updated", "success");
      } else {
        await creditApi.createPricing({
          action_type: form.action_type,
          credits_cost: form.credits_cost ?? 0,
          description: form.description ?? "",
        });
        addToast("Pricing created", "success");
      }
      setModalOpen(false);
      fetchPricing();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save pricing", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<CreditPricing>[] = [
    {
      key: "action_type",
      header: "Action Type",
      render: (r) => formatActionType(r.action_type),
    },
    { key: "credits_cost", header: "Credits Cost", render: (r) => r.credits_cost },
    { key: "description", header: "Description", render: (r) => r.description ?? "—" },
    {
      key: "is_active",
      header: "Active",
      render: (r) => <StatusBadge status={r.is_active ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button
          type="button"
          onClick={() => openEditModal(r)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-primary-600 hover:bg-primary-50"
        >
          <PencilSquareIcon className="h-4 w-4" />
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Credit Pricing</h1>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Pricing
        </button>
      </div>

      <DataTable
        columns={columns}
        data={pricing}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No pricing configured"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Pricing" : "Add Pricing"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="action_type" className="mb-1 block text-sm font-medium text-slate-700">
              Action Type
            </label>
            <input
              id="action_type"
              type="text"
              value={form.action_type ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value }))}
              readOnly={!!editingItem}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="e.g. analysis_request"
            />
          </div>
          <div>
            <label htmlFor="credits_cost" className="mb-1 block text-sm font-medium text-slate-700">
              Credits Cost
            </label>
            <input
              id="credits_cost"
              type="number"
              min={0}
              value={form.credits_cost ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, credits_cost: parseInt(e.target.value, 10) || 0 }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Brief description"
            />
          </div>
          {editingItem && (
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>
          )}
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
              {submitting ? "Saving…" : editingItem ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
