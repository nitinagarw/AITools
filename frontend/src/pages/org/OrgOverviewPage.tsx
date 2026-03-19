import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SentimentBadge, StatusBadge } from "@/components/common";
import type { OrgDashboard, OrgLayoutContext } from "@/types";

// Mock share price data
const MOCK_PRICE_DATA = [
  { date: "2024-01", price: 2450 },
  { date: "2024-02", price: 2520 },
  { date: "2024-03", price: 2480 },
  { date: "2024-04", price: 2610 },
  { date: "2024-05", price: 2580 },
  { date: "2024-06", price: 2720 },
  { date: "2024-07", price: 2690 },
  { date: "2024-08", price: 2810 },
  { date: "2024-09", price: 2750 },
  { date: "2024-10", price: 2890 },
  { date: "2024-11", price: 2950 },
  { date: "2024-12", price: 3020 },
];

const PERIODS = ["1M", "3M", "6M", "1Y", "3Y"] as const;

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `₹${(value / 1e6).toFixed(2)}M`;
  return `₹${value.toLocaleString()}`;
}

export function OrgOverviewPage() {
  const { dashboard, loading } = useOutletContext<OrgLayoutContext>();
  const [chartPeriod, setChartPeriod] = useState<(typeof PERIODS)[number]>("1Y");

  if (loading || !dashboard) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  const { organization, latest_financial, recent_news, ai_model_status, kg_node_count } =
    dashboard;

  const sharePrice = latest_financial?.share_price ?? 0;
  const dailyChange = latest_financial?.daily_change_pct ?? 0;
  const marketCap = latest_financial?.market_cap;
  const revenueTtm = latest_financial?.revenue_ttm;
  const profitTtm = latest_financial?.profit_ttm;

  const sentimentCounts = {
    positive: recent_news.filter((n) => n.sentiment === "positive").length,
    neutral: recent_news.filter((n) => n.sentiment === "neutral").length,
    negative: recent_news.filter((n) => n.sentiment === "negative").length,
  };
  const totalSentiment =
    sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const positivePct =
    totalSentiment > 0 ? (sentimentCounts.positive / totalSentiment) * 100 : 0;
  const neutralPct =
    totalSentiment > 0 ? (sentimentCounts.neutral / totalSentiment) * 100 : 0;
  const negativePct =
    totalSentiment > 0 ? (sentimentCounts.negative / totalSentiment) * 100 : 0;

  const entityCount = kg_node_count ?? 0;
  const lastEnriched = organization.updated_at;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Financial Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-slate-500">Financial Snapshot</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                ₹{sharePrice.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Share Price</p>
              {dailyChange !== 0 && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    dailyChange >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {dailyChange >= 0 ? "+" : ""}
                  {dailyChange.toFixed(2)}% today
                </p>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(marketCap)}
              </p>
              <p className="text-sm text-slate-500">Market Cap</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(revenueTtm)}
              </p>
              <p className="text-sm text-slate-500">Revenue TTM</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(profitTtm)}
              </p>
              <p className="text-sm text-slate-500">Profit TTM</p>
            </div>
          </div>
        </div>

        {/* Sentiment Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-slate-500">News Sentiment</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">Positive</span>
              <span className="text-sm font-medium text-slate-900">
                {sentimentCounts.positive}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${positivePct}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">Neutral</span>
              <span className="text-sm font-medium text-slate-900">
                {sentimentCounts.neutral}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${neutralPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">Negative</span>
              <span className="text-sm font-medium text-slate-900">
                {sentimentCounts.negative}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{ width: `${negativePct}%` }}
              />
            </div>
            <p className="pt-2 text-xs text-slate-500">
              Total: {totalSentiment} articles
            </p>
          </div>
        </div>

        {/* Share Price Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Share Price</h3>
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChartPeriod(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    chartPeriod === p
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_PRICE_DATA}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Price"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Knowledge Base Health */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-slate-500">Knowledge Base Health</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Entities</span>
              <span className="font-medium text-slate-900">{entityCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Relationships</span>
              <span className="font-medium text-slate-900">—</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Embeddings</span>
              <span className="font-medium text-slate-900">—</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">AI Model</span>
              {ai_model_status ? (
                <StatusBadge status={ai_model_status} />
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Last Enriched</span>
              <span className="font-medium text-slate-900">
                {lastEnriched
                  ? new Date(lastEnriched).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent News */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Recent News</h3>
            <Link
              to={`/org/${organization.id}/news`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recent_news.slice(0, 5).map((article) => (
              <li key={article.id} className="border-b border-slate-100 pb-3 last:border-0">
                <p className="font-semibold text-slate-900 line-clamp-2">
                  {article.headline}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>{article.source ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  <SentimentBadge sentiment={article.sentiment} />
                </div>
              </li>
            ))}
            {recent_news.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-500">
                No recent news
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
