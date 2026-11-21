"use client";

import * as React from "react";
import { listUsers, updateUserRole, toggleUserActive } from "@/lib/api";
import { User, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Shield, ShieldAlert, UserCheck, UserX } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string) => {
    try {
      setActionLoading(userId);
      await toggleUserActive(userId);
      await fetchUsers();
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      await updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (err: any) {
      alert(`Role change failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-serif text-3xl font-medium text-brand-ink">User Management</h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 font-light">
          Audit customer identities, manage administrative privileges, and suspend accounts.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs text-brand-muted mt-4">Consulting user directory...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-surface-subtle/50 border-b border-brand-border text-brand-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-surface-subtle/40">
                  <td className="py-3.5 px-4 font-medium text-brand-ink">
                    <div className="font-medium text-sm text-brand-ink">{u.full_name}</div>
                    <span className="text-[11px] text-brand-muted font-mono">{u.email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.role === "admin" ? "warning" : "default"}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.is_active ? "success" : "error"}>
                      {u.is_active ? "Active" : "Suspended"}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-brand-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionLoading === u.id}
                        onClick={() =>
                          handleRoleChange(u.id, u.role === "admin" ? "customer" : "admin")
                        }
                      >
                        {u.role === "admin" ? "Demote to Guest" : "Promote to Admin"}
                      </Button>

                      <Button
                        size="sm"
                        variant={u.is_active ? "ghost" : "outline"}
                        className={u.is_active ? "text-error hover:bg-error-light" : ""}
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggleActive(u.id)}
                      >
                        {u.is_active ? "Suspend" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
