import { useEffect, useState, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { userApi } from "@/services/api";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { Role, User } from "@/types";

interface RoleChangePayload {
  user: User;
  newRole: Role;
  reason: string;
}

interface AuditLogEntry {
  id: string;
  user_id: string;
  changed_by: string;
  old_role: string;
  new_role: string;
  reason: string | null;
  created_at: string;
}

const ROLES: Role[] = ["admin", "analyst", "viewer"];

export function AdminUsersPage() {
  const { isRole } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [roleDropdownUser, setRoleDropdownUser] = useState<string | null>(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<RoleChangePayload | null>(null);
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.listUsers(usersPage);
      setUsers(res.data ?? []);
      setUsersTotalPages(res.pagination?.total_pages ?? 1);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLog = async () => {
    setAuditLoading(true);
    try {
      const res = await userApi.getAuditLog(auditPage);
      setAuditLog(res.data ?? []);
      setAuditTotalPages(res.pagination?.total_pages ?? 1);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to fetch audit log", "error");
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [usersPage]);

  useEffect(() => {
    fetchAuditLog();
  }, [auditPage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownUser(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleSelect = (user: User, newRole: Role) => {
    setRoleDropdownUser(null);
    if (user.role === newRole) return;
    setRoleChangeConfirm({ user, newRole, reason: "" });
    setRoleChangeReason("");
  };

  const handleRoleChangeConfirm = async () => {
    if (!roleChangeConfirm) return;
    try {
      await userApi.changeRole(roleChangeConfirm.user.id, roleChangeConfirm.newRole, roleChangeReason || undefined);
      addToast("Role updated successfully", "success");
      setRoleChangeConfirm(null);
      setRoleChangeReason("");
      fetchUsers();
      fetchAuditLog();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to change role", "error");
    }
  };

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  const userColumns: DataTableColumn<User>[] = [
    { key: "display_name", header: "Display Name", render: (r) => <span className="font-medium">{r.display_name}</span> },
    { key: "email", header: "Email", render: (r) => r.email },
    {
      key: "role",
      header: "Role",
      render: (r) =>
        isRole("admin") ? (
          <div className="relative" ref={roleDropdownUser === r.id ? dropdownRef : undefined}>
            <button
              type="button"
              onClick={() => setRoleDropdownUser(roleDropdownUser === r.id ? null : r.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100"
            >
              <RoleBadge role={r.role} />
              <ChevronDownIcon className="h-4 w-4 text-slate-500" />
            </button>
            {roleDropdownUser === r.id && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[120px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(r, role)}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <RoleBadge role={r.role} />
        ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (r) => <StatusBadge status={r.is_active ? "active" : "inactive"} />,
    },
    { key: "last_login_at", header: "Last Login", render: (r) => formatDate(r.last_login_at) },
    { key: "created_at", header: "Created At", render: (r) => formatDate(r.created_at) },
  ];

  const auditColumns: DataTableColumn<AuditLogEntry>[] = [
    { key: "created_at", header: "Date", render: (r) => formatDate(r.created_at) },
    { key: "user_id", header: "User", render: (r) => r.user_id },
    { key: "changed_by", header: "Changed By", render: (r) => r.changed_by },
    {
      key: "roles",
      header: "Old Role → New Role",
      render: (r) => (
        <span className="text-slate-700">
          <RoleBadge role={r.old_role} /> → <RoleBadge role={r.new_role} />
        </span>
      ),
    },
    { key: "reason", header: "Reason", render: (r) => r.reason ?? "—" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users & Roles</h1>
      </div>

      <DataTable
        columns={userColumns}
        data={users}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No users found"
      />

      {usersTotalPages > 1 && (
        <Pagination page={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Role Change Audit Log</h2>
        <DataTable
          columns={auditColumns}
          data={auditLog}
          keyExtractor={(r) => r.id}
          loading={auditLoading}
          emptyMessage="No audit log entries"
        />
        {auditTotalPages > 1 && (
          <div className="mt-4">
            <Pagination page={auditPage} totalPages={auditTotalPages} onPageChange={setAuditPage} />
          </div>
        )}
      </div>

      <Modal
        open={!!roleChangeConfirm}
        onClose={() => {
          setRoleChangeConfirm(null);
          setRoleChangeReason("");
        }}
        title="Confirm Role Change"
        size="md"
      >
        {roleChangeConfirm && (
          <>
            <p className="text-sm text-slate-600">
              Change {roleChangeConfirm.user.display_name}&apos;s role from {roleChangeConfirm.user.role} to{" "}
              {roleChangeConfirm.newRole}.
            </p>
            <div className="mt-4">
              <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-700">
                Reason (optional)
              </label>
              <input
                id="reason"
                type="text"
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. Promoted to analyst"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setRoleChangeConfirm(null)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeConfirm}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Change Role
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
