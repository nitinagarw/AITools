import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge } from "@/components/common/RoleBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getInitials(displayName: string | undefined, email: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0];
  return local.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {error ?? "Unable to load profile. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const initials = getInitials(user.display_name, user.email);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
            {initials}
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900">
              {user.display_name || "Unknown"}
            </h2>
            <p className="text-slate-600">{user.email}</p>
            <div>
              <RoleBadge role={user.role} />
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">SSO ID</dt>
                <dd className="text-slate-900">{user.sso_id}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Last login</dt>
                <dd className="text-slate-900">{formatDate(user.last_login_at)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Account created</dt>
                <dd className="text-slate-900">{formatDate(user.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
