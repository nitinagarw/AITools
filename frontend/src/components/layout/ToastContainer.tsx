import { useToast } from "@/contexts/ToastContext";
import clsx from "clsx";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
            t.type === "success" && "border-green-200 bg-green-50 text-green-800",
            t.type === "error" && "border-red-200 bg-red-50 text-red-800",
            t.type === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
            t.type === "info" && "border-slate-200 bg-white text-slate-800"
          )}
        >
          <span className="flex-1 text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="rounded p-1 hover:bg-black/5"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
