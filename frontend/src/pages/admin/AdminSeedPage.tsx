import { useEffect, useState } from "react";
import { orgApi, pipelineApi } from "@/services/api";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import type { Organization } from "@/types";

interface SeedStatusItem {
  organization_id: string;
  status: string;
  progress_pct: number;
}

export function AdminSeedPage() {
  const { addToast } = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [seedStatus, setSeedStatus] = useState<SeedStatusItem[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set());
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrgs = async () => {
    setLoadingOrgs(true);
    try {
      const res = await orgApi.search("", 1);
      setOrgs(res.data ?? []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to fetch organizations", "error");
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fetchSeedStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await pipelineApi.seedStatus();
      setSeedStatus(res.data ?? []);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to fetch seed status", "error");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    fetchSeedStatus();
    const interval = setInterval(fetchSeedStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOrg = (id: string) => {
    setSelectedOrgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrgIds.size === orgs.length) {
      setSelectedOrgIds(new Set());
    } else {
      setSelectedOrgIds(new Set(orgs.map((o) => o.id)));
    }
  };

  const handleInitializeSeed = async () => {
    if (selectedOrgIds.size === 0) {
      addToast("Select at least one organization", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await pipelineApi.seedInitialize(Array.from(selectedOrgIds));
      addToast("Seed pipeline initialized", "success");
      setSelectedOrgIds(new Set());
      fetchSeedStatus();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to initialize seed pipeline", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const orgMap = new Map(orgs.map((o) => [o.id, o]));
  const statusWithNames: (SeedStatusItem & { orgName: string })[] = seedStatus.map((s) => ({
    ...s,
    orgName: orgMap.get(s.organization_id)?.name ?? s.organization_id,
  }));

  const statusColumns: DataTableColumn<SeedStatusItem & { orgName: string }>[] = [
    { key: "orgName", header: "Organization", render: (r) => <span className="font-medium">{r.orgName}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "progress_pct",
      header: "Progress",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 min-w-[80px] rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all"
              style={{ width: `${Math.min(100, r.progress_pct)}%` }}
            />
          </div>
          <span className="text-sm text-slate-600">{r.progress_pct}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Seed Pipeline</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Trigger Seed</h2>
        <p className="mb-4 text-sm text-slate-600">
          Select organizations to initialize the seed pipeline. This will scrape and ingest data for the selected organizations.
        </p>
        {loadingOrgs ? (
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        ) : orgs.length === 0 ? (
          <EmptyState title="No organizations" description="Add organizations first to enable seeding." />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedOrgIds.size === orgs.length && orgs.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700">Select all</span>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {orgs.map((org) => (
                <label
                  key={org.id}
                  className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrgIds.has(org.id)}
                    onChange={() => handleToggleOrg(org.id)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">{org.name}</span>
                  {org.ticker_symbol && (
                    <span className="text-xs text-slate-500">({org.ticker_symbol})</span>
                  )}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={handleInitializeSeed}
              disabled={submitting || selectedOrgIds.size === 0}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "Initializing…" : "Initialize Seed Pipeline"}
            </button>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Seed Status</h2>
        <p className="mb-4 text-sm text-slate-600">
          Status of seed pipelines. Auto-refreshes every 10 seconds.
        </p>
        {loadingStatus ? (
          <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
        ) : statusWithNames.length === 0 ? (
          <EmptyState
            title="No seed in progress"
            description="Initialize a seed pipeline above to see status here."
          />
        ) : (
          <DataTable
            columns={statusColumns}
            data={statusWithNames}
            keyExtractor={(r) => r.organization_id}
            emptyMessage="No seed in progress"
          />
        )}
      </div>
    </div>
  );
}
