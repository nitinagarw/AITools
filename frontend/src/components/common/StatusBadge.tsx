import clsx from "clsx";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { className: string; pulse?: boolean }> = {
  active: { className: "bg-emerald-50 text-emerald-700" },
  inactive: { className: "bg-slate-100 text-slate-500" },
  financial: { className: "bg-blue-50 text-blue-700" },
  news: { className: "bg-amber-50 text-amber-700" },
  ready: { className: "bg-emerald-50 text-emerald-700" },
  completed: { className: "bg-emerald-50 text-emerald-700" },
  building: { className: "bg-blue-50 text-blue-700", pulse: true },
  updating: { className: "bg-blue-50 text-blue-700", pulse: true },
  processing: { className: "bg-blue-50 text-blue-700", pulse: true },
  pending: { className: "bg-blue-50 text-blue-700", pulse: true },
  queued: { className: "bg-blue-50 text-blue-700", pulse: true },
  scraping: { className: "bg-blue-50 text-blue-700", pulse: true },
  building_knowledge_base: { className: "bg-blue-50 text-blue-700", pulse: true },
  training_model: { className: "bg-blue-50 text-blue-700", pulse: true },
  failed: { className: "bg-red-50 text-red-700" },
  cancelled: { className: "bg-slate-100 text-slate-500" },
};

function getStatusConfig(status: string) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  return (
    statusConfig[normalized] || statusConfig[status] || {
      className: "bg-slate-100 text-slate-500",
    }
  );
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const displayLabel = status.replace(/_/g, " ");

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        config.pulse && "animate-pulse"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          config.className.includes("emerald") && "bg-emerald-500",
          config.className.includes("blue") && "bg-blue-500",
          config.className.includes("red") && "bg-red-500",
          (config.className.includes("slate") || !config.className) && "bg-slate-400"
        )}
      />
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
}
