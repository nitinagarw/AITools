import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface SearchBarProps {
  variant?: "hero" | "compact";
  defaultValue?: string;
  placeholder?: string;
}

export function SearchBar({
  variant = "compact",
  defaultValue = "",
  placeholder = "Search organizations...",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        navigate(`/?q=${encodeURIComponent(trimmed)}`);
      } else {
        navigate("/");
      }
    },
    [query, navigate]
  );

  const isHero = variant === "hero";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={clsx(
          "flex items-center rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20",
          isHero ? "gap-4 px-5 py-4" : "gap-3 px-4 py-2.5"
        )}
      >
        <MagnifyingGlassIcon
          className={clsx(
            "shrink-0 text-slate-400",
            isHero ? "h-6 w-6" : "h-5 w-5"
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            "flex-1 border-0 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0",
            isHero ? "text-lg" : "text-sm"
          )}
          aria-label="Search organizations"
        />
        <button
          type="submit"
          className={clsx(
            "rounded-lg bg-primary-600 font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
            isHero ? "px-6 py-2.5 text-base" : "px-4 py-1.5 text-sm"
          )}
        >
          Search
        </button>
      </div>
    </form>
  );
}
