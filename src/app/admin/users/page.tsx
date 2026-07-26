"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faPen,
  faTrash,
  faCrown,
  faUserShield,
  faPenToSquare,
  faUser,
  faEye,
  faEnvelope,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { faUserGear, faLock } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

type Role = "super_admin" | "branch_admin" | "editor" | "member" | "guest";

type AppUser = {
  user_id: string;
  email: string;
  role: Role;
  branch_id: string | null;
  branch_name: string | null;
  linked_person_id: string | null;
  linked_person_name: string | null;
  created_at: string;
};

type BranchOption = { id: string; name: string };

const ROLE_CONFIG: Record<Role, { icon: any; color: string; label: string }> = {
  super_admin: {
    icon: faCrown,
    color: "var(--color-gold)",
    label: "Super Admin",
  },
  branch_admin: {
    icon: faUserShield,
    color: "var(--color-navy)",
    label: "Branch Admin",
  },
  editor: {
    icon: faPenToSquare,
    color: "var(--color-emerald)",
    label: "Editor",
  },
  member: { icon: faUser, color: "var(--color-ink)", label: "Family Member" },
  guest: { icon: faEye, color: "var(--color-maroon)", label: "Guest" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("member");
  const [newBranchId, setNewBranchId] = useState("");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [branchId, setBranchId] = useState("");
  const [pendingRemove, setPendingRemove] = useState<AppUser | null>(null);
  const [removing, setRemoving] = useState(false);

  // Editing an existing user's role
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState<Role>("member");
  const [editBranchId, setEditBranchId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [removeError, setRemoveError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase.rpc("get_app_users");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setUsers(data ?? []);
    setLoading(false);
  }

  async function loadBranches() {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .order("name");
    if (data) setBranches(data);
  }

  useEffect(() => {
    loadUsers();
    loadBranches();
    loadMyRole();
  }, []);
  const router = useRouter();

  useEffect(() => {
    if (myRole !== null && myRole !== "super_admin") {
      router.push("/admin");
    }
  }, [myRole, router]);

  async function loadMyRole() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();
    if (data) setMyRole(data.role as Role);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    setInviteError("");
    setInviteSuccess(false);

    try {
      const res = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, branchId: branchId || null }),
      });
      const result = await res.json();

      if (!res.ok) {
        setInviteError(result.error ?? "Something went wrong.");
        setInviting(false);
        return;
      }

      setInviteSuccess(true);
      setEmail("");
      setRole("member");
      setBranchId("");
      loadUsers();
      setTimeout(() => {
        setModalOpen(false);
        setInviteSuccess(false);
      }, 1500);
    } catch (err: any) {
      setInviteError(err.message ?? "Network error.");
    }

    setInviting(false);
  }
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword) return;

    if (newPassword !== newConfirmPassword) {
      setCreateError("Passwords don't match.");
      return;
    }

    setCreating(true);
    setCreateError("");
    setCreateSuccess(false);

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          branchId: newBranchId || null,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        setCreateError(result.error ?? "Something went wrong.");
        setCreating(false);
        return;
      }

      setCreateSuccess(true);
      setNewEmail("");
      setNewPassword("");
      setNewConfirmPassword("");
      setNewRole("member");
      setNewBranchId("");
      loadUsers();
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateSuccess(false);
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message ?? "Network error.");
    }

    setCreating(false);
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setEditRole(user.role);
    setEditBranchId(user.branch_id ?? "");
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setSavingEdit(true);

    const { error: upsertError } = await supabase.from("user_roles").upsert(
      {
        user_id: editingUser.user_id,
        role: editRole,
        branch_id: editBranchId || null,
      },
      { onConflict: "user_id" },
    );

    setSavingEdit(false);

    if (upsertError) {
      alert(`Could not update role: ${upsertError.message}`);
      return;
    }

    setEditingUser(null);
    loadUsers();
  }

  async function confirmRemove() {
    if (!pendingRemove) return;
    setRemoving(true);
    setRemoveError("");

    const res = await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: pendingRemove.user_id }),
    });

    const result = await res.json();
    setRemoving(false);

    if (!res.ok) {
      setRemoveError(result.error ?? "Could not delete this user.");
      return;
    }

    setPendingRemove(null);
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Users & Roles
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            {loading
              ? "Loading..."
              : `${users.length} user${users.length !== 1 ? "s" : ""} with access`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myRole === "super_admin" && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 bg-[var(--color-gold)] text-[var(--color-navy)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-gold-light)] transition-colors duration-300 whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faUserGear} className="text-xs" />
              Create User
            </button>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300 whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
            Invite User
          </button>
        </div>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          Couldn't load users: {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 font-body text-xs px-3 py-1.5 rounded-full bg-white border border-[var(--color-navy)]/10"
          >
            <FontAwesomeIcon
              icon={config.icon}
              style={{ color: config.color }}
              className="text-[10px]"
            />
            {config.label}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          Loading users...
        </p>
      ) : users.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          No users yet — invite your first family member above.
        </p>
      ) : (
        <>
          {/* Table — desktop */}
          <div className="hidden md:block bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-navy)]/10 bg-[var(--color-navy)]/[0.03]">
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    User
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Role
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Branch
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Linked Profile
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-right px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const config = ROLE_CONFIG[user.role];
                  return (
                    <tr
                      key={user.user_id}
                      className="border-b border-[var(--color-navy)]/5 last:border-0 hover:bg-[var(--color-navy)]/[0.02]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center shrink-0">
                            <FontAwesomeIcon
                              icon={faUser}
                              className="text-[var(--color-navy)] text-xs"
                            />
                          </div>
                          <p className="font-body text-sm text-[var(--color-ink)]/90 truncate">
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 font-body text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                            color: config.color,
                          }}
                        >
                          <FontAwesomeIcon
                            icon={config.icon}
                            className="text-[10px]"
                          />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm text-[var(--color-ink)]/70">
                        {user.branch_name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 font-body text-sm text-[var(--color-ink)]/70">
                        {user.linked_person_name ?? "Not linked"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                            aria-label="Edit role"
                          >
                            <FontAwesomeIcon icon={faPen} className="text-xs" />
                          </button>
                          <button
                            onClick={() => setPendingRemove(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10"
                            aria-label="Remove user"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="text-xs"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {users.map((user) => {
              const config = ROLE_CONFIG[user.role];
              return (
                <div
                  key={user.user_id}
                  className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-[var(--color-navy)] text-sm"
                      />
                    </div>
                    <p className="font-body text-sm font-medium text-[var(--color-ink)]/90 truncate flex-1">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-navy)]/5">
                    <span
                      className="inline-flex items-center gap-1.5 font-body text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                        color: config.color,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={config.icon}
                        className="text-[10px]"
                      />
                      {config.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(user)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                        aria-label="Edit role"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                      </button>
                      <button
                        onClick={() => setPendingRemove(user)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10"
                        aria-label="Remove user"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Invite Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                Invite User
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {inviteSuccess ? (
              <p className="font-body text-sm text-[var(--color-emerald)] text-center py-6">
                Invite sent! They'll receive an email to set up their account.
              </p>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2">
                    {inviteError}
                  </div>
                )}
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  >
                    <option value="member">Family Member</option>
                    <option value="editor">Editor</option>
                    <option value="branch_admin">Branch Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Branch (optional)
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  >
                    <option value="">None</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
                  >
                    {inviting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                Create User Account
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>
            <p className="font-body text-xs text-[var(--color-ink)]/60 mb-5">
              Creates a ready-to-use login immediately — no invite email
              required. Share the password with them directly and securely.
            </p>

            {createSuccess ? (
              <p className="font-body text-sm text-[var(--color-emerald)] text-center py-6">
                Account created — they can log in with the credentials right
                away.
              </p>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                {createError && (
                  <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2">
                    {createError}
                  </div>
                )}
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
                    />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                      Password
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  >
                    <option value="member">Family Member</option>
                    <option value="editor">Editor</option>
                    <option value="branch_admin">Branch Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                  <p className="font-body text-[11px] text-[var(--color-ink)]/45 mt-1">
                    Super Admin accounts can't be created here — that's a manual
                    step for security.
                  </p>
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Branch (optional)
                  </label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  >
                    <option value="">None</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
                  >
                    {creating ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setEditingUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                Edit Role — {editingUser.email}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="branch_admin">Branch Admin</option>
                  <option value="editor">Editor</option>
                  <option value="member">Family Member</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Branch
                </label>
                <select
                  value={editBranchId}
                  onChange={(e) => setEditBranchId(e.target.value)}
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                >
                  <option value="">None</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        open={!!pendingRemove}
        title="Delete this user?"
        message={
          pendingRemove
            ? `${pendingRemove.email}'s login will be permanently deleted along with their access. This cannot be undone.${removeError ? `\n\n${removeError}` : ""}`
            : ""
        }
        confirmLabel="Delete Account"
        deleting={removing}
        onCancel={() => {
          setPendingRemove(null);
          setRemoveError("");
        }}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
