import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  MagnifyingGlassIcon,
  BellIcon,
  CreditCardIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCredits } from "@/contexts/CreditContext";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount, togglePanel } = useNotifications();
  const { account } = useCredits();
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/search");
    }
  }, [searchQuery, navigate]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("topbar-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const balance = account?.credits_balance ?? 0;
  const isLowBalance = balance < 100;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="font-bold text-xl text-primary-600">AI360</span>
        </div>

        <div className="relative hidden sm:block">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="topbar-search"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={handleSearch}
              className="w-96 rounded-xl border border-slate-300 py-2 pl-10 pr-20 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePanel}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/credits")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              isLowBalance ? "text-amber-600 hover:bg-amber-50" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <CreditCardIcon className="h-5 w-5" />
            <span>{account?.credits_balance ?? 0}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {initials}
              </div>
              <ChevronDownIcon
                className={clsx("h-4 w-4 text-slate-500 transition", userDropdownOpen && "rotate-180")}
              />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <a
                    href="/profile"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/profile");
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    Profile
                  </a>
                  <a
                    href="/settings"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/settings");
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Settings
                  </a>
                  <a
                    href="/signout"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/signout");
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Sign Out
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
