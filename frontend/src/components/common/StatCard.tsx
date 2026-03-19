import { type ReactNode } from "react";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  valueClassName?: string;
}

export function StatCard({ label, value, icon, trend, className, valueClassName }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;
  const isNegative = trend && trend.value < 0;

  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-slate-200 p-6",
        className
      )}
    >
      <div className="relative">
        {icon && (
          <div className="absolute top-0 right-0 text-slate-400">{icon}</div>
        )}
        <p className={clsx("text-2xl font-bold text-slate-900", valueClassName)}>{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
        {trend && (
          <div
            className={clsx(
              "mt-2 flex items-center gap-1 text-xs font-medium",
              isPositive && "text-emerald-600",
              isNegative && "text-red-600"
            )}
          >
            {isPositive && <ArrowTrendingUpIcon className="h-4 w-4" />}
            {isNegative && <ArrowTrendingDownIcon className="h-4 w-4" />}
            <span>
              {isPositive ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
