import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  UsersIcon,
  Cog6ToothIcon,
  CircleStackIcon,
  PlayIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BellIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("admin" | "analyst" | "viewer")[];
}

const mainItems: NavItem[] = [
  { to: "/", label: "Search", icon: MagnifyingGlassIcon },
  { to: "/requests", label: "My Requests", icon: DocumentTextIcon, roles: ["admin", "analyst"] },
  { to: "/compare", label: "Compare", icon: ArrowsRightLeftIcon, roles: ["admin", "analyst"] },
];

const adminItems: NavItem[] = [
  { to: "/admin/organizations", label: "Organizations", icon: BuildingOffice2Icon, roles: ["admin"] },
  { to: "/admin/users", label: "Users & Roles", icon: UsersIcon, roles: ["admin"] },
  { to: "/admin/settings", label: "Platform Settings", icon: Cog6ToothIcon, roles: ["admin"] },
  { to: "/admin/data-sources", label: "Data Sources", icon: CircleStackIcon, roles: ["admin"] },
  { to: "/admin/seed", label: "Seed Pipeline", icon: PlayIcon, roles: ["admin"] },
  { to: "/admin/pricing", label: "Credit Pricing", icon: CurrencyDollarIcon, roles: ["admin"] },
];

const userItems: NavItem[] = [
  { to: "/credits", label: "Credits & Billing", icon: CreditCardIcon },
  { to: "/settings/notifications", label: "Notifications", icon: BellIcon },
  { to: "/profile", label: "Profile", icon: UserCircleIcon },
];

function NavItemComponent({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { isRole } = useAuth();
  if (item.roles && !item.roles.some((r) => isRole(r))) return null;

  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          collapsed ? "justify-center px-2" : "",
          isActive
            ? "border-r-2 border-primary-600 bg-primary-50 text-primary-700"
            : "text-slate-600 hover:bg-slate-50"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { isRole } = useAuth();
  const showAdmin = isRole("admin");

  return (
    <aside
      className={clsx(
        "fixed left-0 top-16 bottom-0 z-30 border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <nav className="flex flex-col gap-1 p-3">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Main
            </p>
          )}
          {mainItems.map((item) => (
            <NavItemComponent key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        {showAdmin && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </p>
            )}
            {adminItems.map((item) => (
              <NavItemComponent key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}

        <div className="mt-auto space-y-1">
          {!collapsed && (
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              User
            </p>
          )}
          {userItems.map((item) => (
            <NavItemComponent key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
