import { useEffect, useState, useCallback } from "react";
import {
  CreditCardIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { creditApi } from "@/services/api";
import { StatCard, DataTable, Pagination } from "@/components/common";
import type { CreditAccount, CreditTransaction } from "@/types";
import type { DataTableColumn } from "@/components/common/DataTable";
import { useToast } from "@/hooks/useToast";

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

function getCycleResetDate(cycleStart: string, cycleDays: number): string {
  try {
    const start = new Date(cycleStart);
    const reset = new Date(start);
    reset.setDate(reset.getDate() + cycleDays);
    return reset.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function CreditsPage() {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 1,
  });
  const [quotaLimit, setQuotaLimit] = useState(0);
  const [lowThreshold, setLowThreshold] = useState<number | null>(null);
  const [savingQuota, setSavingQuota] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const { addToast } = useToast();

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const res = await creditApi.getAccount();
      if (res.error) {
        addToast(res.error.message, "error");
        setAccount(null);
      } else if (res.data) {
        setAccount(res.data);
        setQuotaLimit(res.data.quota_limit);
        setLowThreshold(res.data.low_credit_threshold);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load account", "error");
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchTransactions = useCallback(
    async (page = 1) => {
      setTxLoading(true);
      try {
        const res = await creditApi.listTransactions(page);
        if (res.error) {
          addToast(res.error.message, "error");
          setTransactions([]);
        } else {
          setTransactions(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to load transactions", "error");
        setTransactions([]);
      } finally {
        setTxLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handleSaveQuota = async () => {
    if (account == null) return;
    setSavingQuota(true);
    try {
      const res = await creditApi.updateQuota(quotaLimit);
      if (res.error) throw new Error(res.error.message);
      setAccount(res.data ?? account);
      addToast("Quota updated successfully", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update quota", "error");
    } finally {
      setSavingQuota(false);
    }
  };

  const handleSaveThreshold = async () => {
    if (account == null) return;
    setSavingThreshold(true);
    try {
      const res = await creditApi.updateLowThreshold(lowThreshold);
      if (res.error) throw new Error(res.error.message);
      setAccount(res.data ?? account);
      addToast("Low credit threshold updated", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update threshold", "error");
    } finally {
      setSavingThreshold(false);
    }
  };

  const maxQuota = account?.credits_balance ?? 0;

  const columns: DataTableColumn<CreditTransaction>[] = [
    {
      key: "created_at",
      header: "Date",
      render: (row) => (
        <span className="text-slate-600">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "transaction_type",
      header: "Action",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {row.transaction_type}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span
          className={
            row.amount >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"
          }
        >
          {row.amount >= 0 ? "+" : ""}
          {row.amount}
        </span>
      ),
    },
    {
      key: "balance_after",
      header: "Balance After",
      render: (row) => (
        <span className="text-slate-700">{row.balance_after}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-slate-600">{row.description || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Credits Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Balance"
          value={loading ? "—" : account?.credits_balance ?? 0}
          icon={<CreditCardIcon className="h-6 w-6" />}
          valueClassName={
            account != null && account.credits_balance < 100 ? "text-amber-600" : undefined
          }
        />
        <StatCard
          label="Quota Limit"
          value={
            loading
              ? "—"
              : `${account?.quota_used ?? 0}/${account?.quota_limit ?? 0}`
          }
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatCard
          label="Used This Cycle"
          value={loading ? "—" : account?.quota_used ?? 0}
          icon={<ArrowPathIcon className="h-6 w-6" />}
        />
        <StatCard
          label="Cycle Reset Date"
          value={
            loading || !account
              ? "—"
              : `Resets ${getCycleResetDate(account.billing_cycle_start, account.billing_cycle_days)}`
          }
          icon={<CalendarDaysIcon className="h-6 w-6" />}
        />
      </div>

      {/* Quota Settings */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quota Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Quota limit
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={maxQuota}
                value={quotaLimit}
                onChange={(e) => setQuotaLimit(Number(e.target.value))}
                className="h-2 w-full max-w-md flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary-600"
              />
              <span className="text-sm font-medium text-slate-700">
                {quotaLimit} / {maxQuota}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveQuota}
              disabled={savingQuota || loading}
              className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {savingQuota ? "Saving…" : "Save"}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Low credit alert threshold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={lowThreshold ?? ""}
                onChange={(e) =>
                  setLowThreshold(e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="e.g. 50"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleSaveThreshold}
                disabled={savingThreshold || loading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {savingThreshold ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {account != null && account.credits_balance < 100 && (
            <p className="text-sm text-slate-600">
              <a
                href="/settings"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Contact admin to purchase more credits
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Transaction History
        </h2>
        <DataTable
          columns={columns}
          data={transactions}
          keyExtractor={(row) => row.id}
          loading={txLoading}
          emptyMessage="No transactions yet"
        />
        {pagination.total_pages > 1 && (
          <div className="mt-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              onPageChange={(p) => fetchTransactions(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
