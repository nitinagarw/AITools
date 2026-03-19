import { useEffect, useState, useCallback } from "react";
import { userApi } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import type { NotificationPreferences } from "@/types";

const NOTIFICATION_TYPES = [
  { key: "analysis_ready", label: "Analysis Ready" },
  { key: "analysis_failed", label: "Analysis Failed" },
  { key: "enrichment_complete", label: "Enrichment Complete" },
  { key: "export_ready", label: "Export Ready" },
  { key: "credit_low", label: "Credit Low" },
  { key: "quota_reached", label: "Quota Reached" },
] as const;

const CHANNELS = [
  { key: "in_app", label: "In-App", alwaysChecked: true },
  { key: "email", label: "Email", alwaysChecked: false },
  { key: "sms", label: "SMS", alwaysChecked: false },
  { key: "push", label: "Push", alwaysChecked: false },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];
type NotifyTypeKey = (typeof NOTIFICATION_TYPES)[number]["key"];

function getChannelsForType(notifyOn: Record<string, string[]>, typeKey: string): Set<string> {
  const arr = notifyOn[typeKey];
  return new Set(Array.isArray(arr) ? arr : ["in_app"]);
}

function buildNotifyOn(
  routing: Record<NotifyTypeKey, Record<ChannelKey, boolean>>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const { key: typeKey } of NOTIFICATION_TYPES) {
    const channels: string[] = [];
    for (const { key: chKey } of CHANNELS) {
      const checked = routing[typeKey]?.[chKey] ?? (chKey === "in_app");
      if (checked) channels.push(chKey);
    }
    result[typeKey] = channels;
  }
  return result;
}

function buildRoutingFromNotifyOn(
  notifyOn: Record<string, string[]>
): Record<NotifyTypeKey, Record<ChannelKey, boolean>> {
  const routing: Record<string, Record<string, boolean>> = {};
  for (const { key: typeKey } of NOTIFICATION_TYPES) {
    const channels = getChannelsForType(notifyOn, typeKey);
    routing[typeKey] = {};
    for (const { key: chKey } of CHANNELS) {
      routing[typeKey][chKey] = channels.has(chKey) || chKey === "in_app";
    }
  }
  return routing as Record<NotifyTypeKey, Record<ChannelKey, boolean>>;
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-primary-600" : "bg-slate-200"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </label>
  );
}

export function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [routing, setRouting] = useState<Record<NotifyTypeKey, Record<ChannelKey, boolean>>>(
    () => buildRoutingFromNotifyOn({})
  );
  const { addToast } = useToast();

  const fetchPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getNotificationPrefs();
      if (res.error) {
        addToast(res.error.message, "error");
        setPrefs(null);
      } else if (res.data) {
        setPrefs(res.data);
        setEmailEnabled(res.data.email_enabled);
        setEmailAddress(res.data.email_address ?? "");
        setSmsEnabled(res.data.sms_enabled);
        setSmsPhone(res.data.sms_phone_number ?? "");
        setPushEnabled(res.data.push_enabled);
        setQuietStart(res.data.quiet_hours_start ?? "");
        setQuietEnd(res.data.quiet_hours_end ?? "");
        setRouting(buildRoutingFromNotifyOn(res.data.notify_on ?? {}));
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load preferences", "error");
      setPrefs(null);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleRoutingChange = (typeKey: NotifyTypeKey, chKey: ChannelKey, checked: boolean) => {
    if (chKey === "in_app") return;
    setRouting((prev) => ({
      ...prev,
      [typeKey]: {
        ...prev[typeKey],
        [chKey]: checked,
      },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const notifyOn = buildNotifyOn(routing);
      const res = await userApi.updateNotificationPrefs({
        email_enabled: emailEnabled,
        email_address: emailEnabled ? emailAddress || null : null,
        sms_enabled: smsEnabled,
        sms_phone_number: smsEnabled ? smsPhone || null : null,
        push_enabled: pushEnabled,
        quiet_hours_start: quietStart || null,
        quiet_hours_end: quietEnd || null,
        notify_on: notifyOn,
      });
      if (res.error) throw new Error(res.error.message);
      setPrefs(res.data ?? prefs);
      addToast("Notification preferences saved", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save preferences", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>

      {/* Channel Toggles */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Channel Toggles</h2>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Toggle checked={emailEnabled} onChange={setEmailEnabled} />
              <span className="text-sm font-medium text-slate-700">Email</span>
            </div>
            {emailEnabled && (
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@example.com"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-64"
              />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Toggle checked={smsEnabled} onChange={setSmsEnabled} />
              <span className="text-sm font-medium text-slate-700">SMS</span>
            </div>
            {smsEnabled && (
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-64"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <Toggle checked={pushEnabled} onChange={setPushEnabled} />
            <span className="text-sm font-medium text-slate-700">Push</span>
            <span className="text-sm text-slate-500">
              Enable browser notifications
            </span>
          </div>
        </div>
      </div>

      {/* Notification Routing */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Notification Routing</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Notification Type
                </th>
                {CHANNELS.map((ch) => (
                  <th
                    key={ch.key}
                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    {ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_TYPES.map((type) => (
                <tr key={type.key} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-700">{type.label}</td>
                  {CHANNELS.map((ch) => (
                    <td key={ch.key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={routing[type.key]?.[ch.key] ?? (ch.key === "in_app")}
                        onChange={(e) =>
                          handleRoutingChange(type.key, ch.key, e.target.checked)
                        }
                        disabled={ch.alwaysChecked}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quiet Hours</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Start time
            </label>
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              End time
            </label>
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveAll}
        disabled={saving}
        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save All"}
      </button>
    </div>
  );
}
