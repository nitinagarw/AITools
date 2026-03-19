import { useState } from "react";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

interface CompareOrgData {
  name: string;
  sector: string;
  sharePrice: string;
  marketCap: string;
  revenue: string;
  profit: string;
  sentiment: string;
  knowledgeBaseStats: string;
}

export function ComparePage() {
  const [org1Name, setOrg1Name] = useState("");
  const [org2Name, setOrg2Name] = useState("");
  const [org1, setOrg1] = useState<CompareOrgData | null>(null);
  const [org2, setOrg2] = useState<CompareOrgData | null>(null);
  const [comparing, setComparing] = useState(false);

  const handleCompare = () => {
    const name1 = org1Name.trim();
    const name2 = org2Name.trim();
    if (!name1 || !name2) return;

    setComparing(true);
    setOrg1({
      name: name1,
      sector: "Technology",
      sharePrice: "₹2,450",
      marketCap: "₹16.5T",
      revenue: "₹8.2T",
      profit: "₹1.2T",
      sentiment: "Positive (0.72)",
      knowledgeBaseStats: "1,240 entities",
    });
    setOrg2({
      name: name2,
      sector: "Technology",
      sharePrice: "₹1,890",
      marketCap: "₹7.2T",
      revenue: "₹4.1T",
      profit: "₹680B",
      sentiment: "Neutral (0.45)",
      knowledgeBaseStats: "892 entities",
    });
    setComparing(false);
  };

  const hasSelection = org1 && org2;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Compare Organizations</h1>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="w-full flex-1">
          <label htmlFor="org1" className="mb-1 block text-sm font-medium text-slate-700">
            Organization 1
          </label>
          <input
            id="org1"
            type="text"
            value={org1Name}
            onChange={(e) => setOrg1Name(e.target.value)}
            placeholder="e.g. Reliance Industries"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex shrink-0 items-center justify-center">
          <ArrowsRightLeftIcon className="h-8 w-8 text-slate-400" />
        </div>
        <div className="w-full flex-1">
          <label htmlFor="org2" className="mb-1 block text-sm font-medium text-slate-700">
            Organization 2
          </label>
          <input
            id="org2"
            type="text"
            value={org2Name}
            onChange={(e) => setOrg2Name(e.target.value)}
            placeholder="e.g. TCS"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          type="button"
          onClick={handleCompare}
          disabled={comparing || !org1Name.trim() || !org2Name.trim()}
          className="w-full rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
        >
          Compare
        </button>
      </div>

      {!hasSelection ? (
        <EmptyState
          icon={<ArrowsRightLeftIcon className="h-12 w-12 text-slate-300" />}
          title="Select two organizations to compare"
          description="Enter organization names above and click Compare to see a side-by-side analysis."
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{org1!.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{org1!.sector}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Share Price" value={org1!.sharePrice} />
              <StatCard label="Market Cap" value={org1!.marketCap} />
              <StatCard label="Revenue (TTM)" value={org1!.revenue} />
              <StatCard label="Profit (TTM)" value={org1!.profit} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Sentiment Summary</h3>
              <p className="text-slate-600">{org1!.sentiment}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Knowledge Base Stats</h3>
              <p className="text-slate-600">{org1!.knowledgeBaseStats}</p>
            </div>
          </div>

          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{org2!.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{org2!.sector}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Share Price" value={org2!.sharePrice} />
              <StatCard label="Market Cap" value={org2!.marketCap} />
              <StatCard label="Revenue (TTM)" value={org2!.revenue} />
              <StatCard label="Profit (TTM)" value={org2!.profit} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Sentiment Summary</h3>
              <p className="text-slate-600">{org2!.sentiment}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Knowledge Base Stats</h3>
              <p className="text-slate-600">{org2!.knowledgeBaseStats}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
