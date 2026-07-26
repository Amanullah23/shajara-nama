"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderTree,
  faPlus,
  faPen,
  faTrash,
  faUsers,
  faXmark,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type Branch = {
  id: string;
  name: string;
  description: string | null;
  founder_name: string | null;
  memberCount: number;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [founder, setFounder] = useState("");
  const [blockedDeleteName, setBlockedDeleteName] = useState<string | null>(
    null,
  );

  async function loadBranches() {
    setLoading(true);
    setError("");

    const { data: branchData, error: branchError } = await supabase
      .from("branches")
      .select("*")
      .order("name");

    if (branchError) {
      setError(branchError.message);
      setLoading(false);
      return;
    }

    // Get member counts per branch
    const { data: personsData } = await supabase
      .from("persons")
      .select("branch_id");

    const counts = new Map<string, number>();
    (personsData ?? []).forEach((p) => {
      if (p.branch_id)
        counts.set(p.branch_id, (counts.get(p.branch_id) ?? 0) + 1);
    });

    const mapped: Branch[] = (branchData ?? []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      founder_name: b.founder_name,
      memberCount: counts.get(b.id) ?? 0,
    }));

    setBranches(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function openAdd() {
    setEditing(null);
    setName("");
    setDescription("");
    setFounder("");
    setModalOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setName(branch.name);
    setDescription(branch.description ?? "");
    setFounder(branch.founder_name ?? "");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);

    if (editing) {
      const { error: updateError } = await supabase
        .from("branches")
        .update({
          name,
          description: description || null,
          founder_name: founder || null,
        })
        .eq("id", editing.id);

      if (updateError) {
        alert(`Could not update branch: ${updateError.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("branches").insert({
        name,
        description: description || null,
        founder_name: founder || null,
      });

      if (insertError) {
        alert(`Could not create branch: ${insertError.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalOpen(false);
    loadBranches();
  }

  function handleDeleteClick(branch: Branch) {
    if (branch.memberCount > 0) {
      setBlockedDeleteName(branch.name);
      return;
    }
    setPendingDelete(branch);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);

    const { error: deleteError } = await supabase
      .from("branches")
      .delete()
      .eq("id", pendingDelete.id);

    setDeleting(false);

    if (deleteError) {
      alert(`Could not delete: ${deleteError.message}`);
      return;
    }

    setPendingDelete(null);
    loadBranches();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Family Branches
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            {loading
              ? "Loading..."
              : `${branches.length} branches, ${branches.reduce((sum, b) => sum + b.memberCount, 0)} total members`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex cursor-pointer items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300 whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Branch
        </button>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          Couldn't load branches: {error}
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          Loading branches...
        </p>
      ) : branches.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          No branches yet — click "Add Branch" to create your first one.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 hover:border-[var(--color-gold)]/40 transition-colors duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faFolderTree}
                    className="text-[var(--color-gold)] text-base"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/branches/${branch.id}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/10"
                    aria-label="View branch tree"
                    title="View branch tree"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-xs" />
                  </Link>
                  <button
                    onClick={() => openEdit(branch)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                    aria-label="Edit branch"
                  >
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(branch)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10"
                    aria-label="Delete branch"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>

              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)] mt-4">
                {branch.name}
              </h3>
              <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1.5 leading-relaxed">
                {branch.description || "No description yet."}
              </p>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--color-navy)]/5">
                <span className="font-body text-xs text-[var(--color-ink)]/50">
                  {branch.founder_name
                    ? `Founded by ${branch.founder_name}`
                    : "Founder not set"}
                </span>
                <span className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                  <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                  {branch.memberCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex cursor-pointer items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                {editing ? "Edit Branch" : "Add Branch"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Branch E"
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this branch..."
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Founder
                </label>
                <input
                  type="text"
                  value={founder}
                  onChange={(e) => setFounder(e.target.value)}
                  placeholder="Founding family member"
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
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
                  disabled={saving}
                  className="flex-1 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Delete this branch?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        deleting={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      {blockedDeleteName && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setBlockedDeleteName(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="w-11 h-11 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center mb-4">
              <FontAwesomeIcon
                icon={faUsers}
                className="text-[var(--color-gold)] text-lg"
              />
            </div>
            <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
              Can't delete this branch
            </h3>
            <p className="font-body text-sm text-[var(--color-ink)]/60 mt-2">
              "{blockedDeleteName}" still has members assigned to it. Reassign
              them to a different branch first, then try deleting again.
            </p>
            <button
              onClick={() => setBlockedDeleteName(null)}
              className="w-full mt-6 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
