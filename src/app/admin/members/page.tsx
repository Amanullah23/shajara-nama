"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faUserPlus,
  faPen,
  faTrash,
  faMars,
  faVenus,
  faUser,
  faEye,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type Member = {
  id: string;
  full_name: string;
  gender: "male" | "female" | null;
  birth_date: string | null;
  is_deceased: boolean;
  branch_id: string | null;
  branch_name: string | null;
  village: string | null;
  avatar_path: string | null;
};

function AvatarThumb({
  avatarPath,
  gender,
  size = "w-8 h-8",
}: {
  avatarPath: string | null;
  gender: "male" | "female" | null;
  size?: string;
}) {
  const url = avatarPath
    ? supabase.storage.from("photos").getPublicUrl(avatarPath).data.publicUrl
    : null;
  return (
    <div
      className={`${size} rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center shrink-0`}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : gender ? (
        <FontAwesomeIcon
          icon={gender === "male" ? faMars : faVenus}
          className={`text-[10px] ${gender === "male" ? "text-[var(--color-navy)]" : "text-[var(--color-maroon)]"}`}
        />
      ) : (
        <FontAwesomeIcon
          icon={faUser}
          className="text-[10px] text-[var(--color-navy)]/40"
        />
      )}
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "living" | "deceased"
  >("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  async function loadMembers() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("persons")
      .select(
        "id, full_name, gender, birth_date, is_deceased, village, branch_id, avatar_path, branches(name)",
      )
      .order("full_name");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const mapped: Member[] = (data ?? []).map((row: any) => ({
      id: row.id,
      full_name: row.full_name,
      gender: row.gender,
      birth_date: row.birth_date,
      is_deceased: row.is_deceased,
      branch_id: row.branch_id,
      branch_name: row.branches?.name ?? null,
      village: row.village,
      avatar_path: row.avatar_path,
    }));

    setMembers(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const branches = useMemo(() => {
    const unique = new Map<string, string>();
    members.forEach((m) => {
      if (m.branch_id && m.branch_name) unique.set(m.branch_id, m.branch_name);
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = m.full_name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "living" && !m.is_deceased) ||
        (statusFilter === "deceased" && m.is_deceased);
      const matchesBranch =
        branchFilter === "all" || m.branch_id === branchFilter;
      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [members, search, statusFilter, branchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, branchFilter]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);

    const { error: deleteError } = await supabase
      .from("persons")
      .delete()
      .eq("id", pendingDelete.id);

    setDeletingId(null);

    if (deleteError) {
      alert(`Could not delete: ${deleteError.message}`);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  function birthYear(dateStr: string | null) {
    return dateStr ? new Date(dateStr).getFullYear() : "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Members
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            {loading
              ? "Loading..."
              : `${filtered.length} of ${members.length} family members`}
          </p>
        </div>
        <Link
          href="/admin/members/new"
          className="inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300 whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
          Add Person
        </Link>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          Couldn't load members: {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
          />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="living">Living</option>
          <option value="deceased">Deceased</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          Loading members...
        </p>
      ) : (
        <>
          {/* Table — desktop */}
          <div className="hidden md:block bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-navy)]/10 bg-[var(--color-navy)]/[0.03]">
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Name
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Birth Year
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Status
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Branch
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-5 py-3">
                    Village
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-right px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--color-navy)]/5 last:border-0 hover:bg-[var(--color-navy)]/[0.02]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarThumb
                          avatarPath={m.avatar_path}
                          gender={m.gender}
                        />
                        <span className="font-body text-sm text-[var(--color-ink)]/90">
                          {m.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm text-[var(--color-ink)]/70">
                      {birthYear(m.birth_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${
                          !m.is_deceased
                            ? "bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]"
                            : "bg-[var(--color-ink)]/10 text-[var(--color-ink)]/60"
                        }`}
                      >
                        {m.is_deceased ? "Deceased" : "Living"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm text-[var(--color-ink)]/70">
                      {m.branch_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm text-[var(--color-ink)]/70">
                      {m.village ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/members/${m.id}/view`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/10"
                          aria-label="View details"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-xs" />
                        </Link>
                        <Link
                          href={`/admin/members/${m.id}/edit`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                          aria-label="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-xs" />
                        </Link>
                        <button
                          onClick={() => setPendingDelete(m)}
                          disabled={deletingId === m.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10 disabled:opacity-40"
                          aria-label="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
                No members match your filters.
              </p>
            )}
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {paginated.map((m) => (
              <div
                key={m.id}
                className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarThumb avatarPath={m.avatar_path} gender={m.gender} />
                    <span className="font-body text-sm font-medium text-[var(--color-ink)]/90 truncate">
                      {m.full_name}
                    </span>
                  </div>
                  <span
                    className={`font-body text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                      !m.is_deceased
                        ? "bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]"
                        : "bg-[var(--color-ink)]/10 text-[var(--color-ink)]/60"
                    }`}
                  >
                    {m.is_deceased ? "Deceased" : "Living"}
                  </span>
                </div>
                <div className="font-body text-xs text-[var(--color-ink)]/60 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Born {birthYear(m.birth_date)}</span>
                  <span>{m.branch_name ?? "No branch"}</span>
                  <span>{m.village ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-navy)]/5">
                  <Link
                    href={`/admin/members/${m.id}/view`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-emerald)] bg-[var(--color-emerald)]/5 rounded-lg py-2"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-[10px]" />{" "}
                    View
                  </Link>
                  <Link
                    href={`/admin/members/${m.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-navy)] bg-[var(--color-navy)]/5 rounded-lg py-2"
                  >
                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />{" "}
                    Edit
                  </Link>
                  <button
                    onClick={() => setPendingDelete(m)}
                    disabled={deletingId === m.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/5 rounded-lg py-2 disabled:opacity-40"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />{" "}
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
                No members match your filters.
              </p>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > pageSize && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="font-body text-xs text-[var(--color-ink)]/50">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-navy)] bg-white border border-[var(--color-navy)]/10 hover:bg-[var(--color-navy)]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1.5">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="font-body text-xs text-[var(--color-ink)]/40 px-1">
                          …
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-lg font-body text-xs font-medium transition-colors ${
                          p === currentPage
                            ? "bg-[var(--color-navy)] text-[var(--color-ivory)]"
                            : "bg-white border border-[var(--color-navy)]/10 text-[var(--color-ink)]/70 hover:bg-[var(--color-navy)]/5"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-navy)] bg-white border border-[var(--color-navy)]/10 hover:bg-[var(--color-navy)]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Delete this person?"
        message={
          pendingDelete
            ? `"${pendingDelete.full_name}" and all their relationships will be permanently removed. This cannot be undone.`
            : ""
        }
        deleting={!!deletingId}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
