import { useEffect, useState } from "react";
import { settingsApi } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import type { PlatformSettings } from "@/types";

const LLM_PROVIDERS = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "self_hosted", label: "Self Hosted" },
];

const EMBEDDING_PROVIDERS = [
  { value: "bge-m3", label: "BGE-M3" },
  { value: "openai", label: "OpenAI" },
  { value: "cohere", label: "Cohere" },
  { value: "sentence_transformers", label: "Sentence Transformers" },
];

const DEFAULT_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "analyst", label: "Analyst" },
  { value: "viewer", label: "Viewer" },
];

const SCRAPING_FREQUENCIES = [
  { value: "hourly", label: "Hourly" },
  { value: "every_6h", label: "Every 6 hours" },
  { value: "every_12h", label: "Every 12 hours" },
  { value: "daily", label: "Daily" },
];

export function AdminSettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<PlatformSettings> & { llm_api_key?: string; llm_endpoint_url?: string; embedding_endpoint_url?: string }>({
    default_user_role: "analyst",
    default_scraping_frequency: "daily",
    llm_provider: "anthropic",
    llm_model: "",
    llm_api_key: "",
    llm_endpoint_url: "",
    embedding_provider: "bge-m3",
    embedding_model: "",
    embedding_dimensions: 1024,
    embedding_endpoint_url: "",
  });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await settingsApi.get();
        if (res.data) {
          setForm((prev) => ({
            ...prev,
            ...res.data,
            llm_api_key: (res.data as PlatformSettings & { llm_api_key?: string }).llm_api_key ?? "",
            llm_endpoint_url: (res.data as PlatformSettings & { llm_endpoint_url?: string }).llm_endpoint_url ?? "",
            embedding_endpoint_url: (res.data as PlatformSettings & { embedding_endpoint_url?: string }).embedding_endpoint_url ?? "",
          }));
        }
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to fetch settings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        default_user_role: form.default_user_role,
        default_scraping_frequency: form.default_scraping_frequency,
        llm_provider: form.llm_provider,
        llm_model: form.llm_model,
        embedding_provider: form.embedding_provider,
        embedding_model: form.embedding_model,
        embedding_dimensions: form.embedding_dimensions,
      };
      if (form.llm_api_key) payload.llm_api_key = form.llm_api_key;
      if (form.llm_endpoint_url) payload.llm_endpoint_url = form.llm_endpoint_url;
      if (form.embedding_endpoint_url) payload.embedding_endpoint_url = form.embedding_endpoint_url;
      await settingsApi.update(payload as Partial<PlatformSettings>);
      addToast("Settings saved successfully", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">LLM Configuration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="llm_provider" className="mb-1 block text-sm font-medium text-slate-700">
                Provider
              </label>
              <select
                id="llm_provider"
                value={form.llm_provider ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, llm_provider: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {LLM_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="llm_model" className="mb-1 block text-sm font-medium text-slate-700">
                Model
              </label>
              <input
                id="llm_model"
                type="text"
                value={form.llm_model ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, llm_model: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. claude-3-sonnet-20240229"
              />
            </div>
            <div>
              <label htmlFor="llm_api_key" className="mb-1 block text-sm font-medium text-slate-700">
                API Key
              </label>
              <input
                id="llm_api_key"
                type="password"
                value={form.llm_api_key ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, llm_api_key: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="••••••••"
                autoComplete="off"
              />
            </div>
            {(form.llm_provider === "self_hosted") && (
              <div>
                <label htmlFor="llm_endpoint_url" className="mb-1 block text-sm font-medium text-slate-700">
                  Endpoint URL
                </label>
                <input
                  id="llm_endpoint_url"
                  type="url"
                  value={form.llm_endpoint_url ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, llm_endpoint_url: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Embedding Configuration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="embedding_provider" className="mb-1 block text-sm font-medium text-slate-700">
                Provider
              </label>
              <select
                id="embedding_provider"
                value={form.embedding_provider ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, embedding_provider: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {EMBEDDING_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="embedding_model" className="mb-1 block text-sm font-medium text-slate-700">
                Model
              </label>
              <input
                id="embedding_model"
                type="text"
                value={form.embedding_model ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, embedding_model: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. BAAI/bge-m3"
              />
            </div>
            <div>
              <label htmlFor="embedding_dimensions" className="mb-1 block text-sm font-medium text-slate-700">
                Dimensions
              </label>
              <input
                id="embedding_dimensions"
                type="number"
                min={1}
                value={form.embedding_dimensions ?? 1024}
                onChange={(e) => setForm((f) => ({ ...f, embedding_dimensions: parseInt(e.target.value, 10) || 1024 }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="embedding_endpoint_url" className="mb-1 block text-sm font-medium text-slate-700">
                Endpoint URL
              </label>
              <input
                id="embedding_endpoint_url"
                type="url"
                value={form.embedding_endpoint_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, embedding_endpoint_url: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Defaults</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="default_user_role" className="mb-1 block text-sm font-medium text-slate-700">
                Default User Role
              </label>
              <select
                id="default_user_role"
                value={form.default_user_role ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, default_user_role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {DEFAULT_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="default_scraping_frequency" className="mb-1 block text-sm font-medium text-slate-700">
                Default Scraping Frequency
              </label>
              <select
                id="default_scraping_frequency"
                value={form.default_scraping_frequency ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, default_scraping_frequency: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {SCRAPING_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
