import { type ReactNode } from "react";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = icon ?? (
    <DocumentMagnifyingGlassIcon className="h-12 w-12 text-slate-300" />
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4">{Icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
