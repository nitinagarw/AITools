import { Link } from "react-router-dom";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import type { Organization } from "@/types";

interface OrgCardProps {
  organization: Organization;
}

export function OrgCard({ organization }: OrgCardProps) {
  const { id, name, ticker_symbol, sector } = organization;

  return (
    <Link
      to={`/org/${id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
          <BuildingOffice2Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          <div className="mt-1 flex flex-wrap gap-2">
            {ticker_symbol && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {ticker_symbol}
              </span>
            )}
            {sector && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {sector}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
