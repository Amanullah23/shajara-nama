"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faXmark,
  faUserPlus,
  faPen,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type PendingEdit = {
  id: string;
  action: "create" | "update";
  person_id: string | null;
  proposed_data: any;
  submitted_by: string;
  created_at: string;
  submitterEmail?: string;
  currentPersonName?: string;
};

export default function ApprovalsPage() {
  const [edits, setEdits] = useState<PendingEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadPending() {
    setLoading(true);
    const { data } = await supabase
      .from("pending_edits")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (edit) => {
          const [{ data: userRes }, personRes] = await Promise.all([
            supabase.rpc("get_app_users"), // reused from Users & Roles — filters to admin-visible list, contains emails
            edit.person_id
              ? supabase
                  .from("persons")
                  .select("full_name")
                  .eq("id", edit.person_id)
                  .single()
              : Promise.resolve({ data: null }),
          ]);
          const submitter = (userRes ?? []).find(
            (u: any) => u.user_id === edit.submitted_by,
          );
          return {
            ...edit,
            submitterEmail: submitter?.email ?? "Unknown",
            currentPersonName: (personRes as any)?.data?.full_name,
          };
        }),
      );
      setEdits(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleApprove(edit: PendingEdit) {
    setProcessingId(edit.id);
    const d = edit.proposed_data;
    const personFields = { ...d };
    delete personFields.father_id;
    delete personFields.mother_id;
    delete personFields.spouse_id;
    delete personFields.marriage_date;

    let targetPersonId = edit.person_id;

    if (edit.action === "create") {
      const { data: newPerson, error } = await supabase
        .from("persons")
        .insert(personFields)
        .select()
        .single();
      if (error) {
        alert(`Could not approve: ${error.message}`);
        setProcessingId(null);
        return;
      }
      targetPersonId = newPerson.id;

      const rels = [];
      if (d.father_id)
        rels.push({
          person_id: targetPersonId,
          related_person_id: d.father_id,
          relationship_type: "father",
        });
      if (d.mother_id)
        rels.push({
          person_id: targetPersonId,
          related_person_id: d.mother_id,
          relationship_type: "mother",
        });
      if (d.spouse_id)
        rels.push({
          person_id: targetPersonId,
          related_person_id: d.spouse_id,
          relationship_type: "spouse",
          marriage_date: d.marriage_date,
        });
      if (rels.length > 0) await supabase.from("relationships").insert(rels);
    } else {
      const { error } = await supabase
        .from("persons")
        .update(personFields)
        .eq("id", targetPersonId);
      if (error) {
        alert(`Could not approve: ${error.message}`);
        setProcessingId(null);
        return;
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("pending_edits")
      .update({
        status: "approved",
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", edit.id);

    setProcessingId(null);
    loadPending();
  }

  async function handleReject(edit: PendingEdit) {
    setProcessingId(edit.id);
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("pending_edits")
      .update({
        status: "rejected",
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", edit.id);
    setProcessingId(null);
    loadPending();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          Pending Approvals
        </h2>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          {loading
            ? "Loading..."
            : `${edits.length} submission${edits.length !== 1 ? "s" : ""} awaiting review`}
        </p>
      </div>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          Loading...
        </p>
      ) : edits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <FontAwesomeIcon
            icon={faClipboardList}
            className="text-[var(--color-ink)]/20 text-3xl"
          />
          <p className="font-body text-sm text-[var(--color-ink)]/50">
            Nothing waiting for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {edits.map((edit) => (
            <div
              key={edit.id}
              className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0 mt-0.5">
                    <FontAwesomeIcon
                      icon={edit.action === "create" ? faUserPlus : faPen}
                      className="text-[var(--color-gold)] text-sm"
                    />
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-[var(--color-navy)]">
                      {edit.action === "create" ? "New person: " : "Edit to: "}
                      {edit.action === "create"
                        ? edit.proposed_data.full_name
                        : (edit.currentPersonName ?? "Unknown")}
                    </p>
                    <p className="font-body text-xs text-[var(--color-ink)]/50 mt-0.5">
                      Submitted by {edit.submitterEmail} ·{" "}
                      {new Date(edit.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(edit)}
                    disabled={processingId === edit.id}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 hover:bg-[var(--color-maroon)]/20 disabled:opacity-40"
                    aria-label="Reject"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleApprove(edit)}
                    disabled={processingId === edit.id}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 hover:bg-[var(--color-emerald)]/20 disabled:opacity-40"
                    aria-label="Approve"
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-sm" />
                  </button>
                </div>
              </div>

              <details className="mt-3">
                <summary className="font-body text-xs text-[var(--color-navy)]/60 cursor-pointer hover:text-[var(--color-navy)]">
                  View proposed data
                </summary>
                <pre className="font-body text-xs text-[var(--color-ink)]/70 bg-[var(--color-navy)]/5 rounded-lg p-3 mt-2 overflow-x-auto">
                  {JSON.stringify(edit.proposed_data, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
