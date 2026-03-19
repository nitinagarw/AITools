import clsx from "clsx";

interface RoleBadgeProps {
  role: string;
}

const roleConfig: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  analyst: "bg-blue-50 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const className = roleConfig[role.toLowerCase()] ?? "bg-slate-100 text-slate-600";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
    </span>
  );
}
