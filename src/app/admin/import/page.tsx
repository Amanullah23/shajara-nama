"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faDownload,
  faUpload,
  faCheck,
  faTriangleExclamation,
  faCircleXmark,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

const COLUMNS = [
  "row_id",
  "full_name",
  "father_row_id",
  "mother_row_id",
  "spouse_row_id",
  "marriage_date",
  "branch_name",
  "gender",
  "birth_date",
  "birth_place",
  "native_name",
  "nickname",
  "is_deceased",
  "death_date",
  "death_place",
  "burial_location",
  "country",
  "province",
  "district",
  "village",
  "phone",
  "email",
  "whatsapp",
  "facebook",
  "telegram",
  "linkedin",
  "school",
  "university",
  "degree",
  "graduation_year",
  "occupation",
  "company",
  "position",
];

const EXAMPLE_ROWS = [
  {
    row_id: "1",
    full_name: "Ahmad Wali Khan",
    gender: "male",
    birth_date: "1950-03-01",
    is_deceased: "false",
    branch_name: "",
  },
  {
    row_id: "2",
    full_name: "Karim Khan",
    father_row_id: "1",
    gender: "male",
    birth_date: "1975-05-10",
    occupation: "Engineer",
  },
  {
    row_id: "3",
    full_name: "Zahra Khan",
    father_row_id: "1",
    gender: "female",
    birth_date: "1978-09-15",
  },
];

type RawRow = Record<string, string>;

type ValidatedRow = {
  rowId: string;
  data: RawRow;
  status: "ok" | "warning" | "error";
  messages: string[];
};

type BranchOption = { id: string; name: string };

export default function BulkImportPage() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    relationships: number;
    skipped: number;
  } | null>(null);

  useEffect(() => {
    async function checkRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/admin");
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();
      if (roleData?.role !== "super_admin") {
        router.push("/admin");
        return;
      }
      setAuthorized(true);
      setCheckingRole(false);
    }
    checkRole();

    supabase
      .from("branches")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setBranches(data);
      });
  }, [router]);

  function downloadTemplate() {
    const worksheet = XLSX.utils.json_to_sheet(EXAMPLE_ROWS, {
      header: COLUMNS,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Family Members");
    XLSX.writeFile(workbook, "shajara-nama-import-template.xlsx");
  }

  function validateRows(rows: RawRow[]): ValidatedRow[] {
    const rowIdSet = new Set<string>();
    const duplicateIds = new Set<string>();
    rows.forEach((r) => {
      const id = (r.row_id ?? "").trim();
      if (id && rowIdSet.has(id)) duplicateIds.add(id);
      rowIdSet.add(id);
    });

    return rows.map((r) => {
      const messages: string[] = [];
      let status: "ok" | "warning" | "error" = "ok";
      const rowId = (r.row_id ?? "").trim();

      if (!rowId) {
        messages.push("Missing row_id");
        status = "error";
      } else if (duplicateIds.has(rowId)) {
        messages.push(`Duplicate row_id "${rowId}"`);
        status = "error";
      }

      if (!r.full_name || !r.full_name.trim()) {
        messages.push("Missing full_name");
        status = "error";
      }

      (["father_row_id", "mother_row_id", "spouse_row_id"] as const).forEach(
        (field) => {
          const ref = (r[field] ?? "").trim();
          if (ref && !rowIdSet.has(ref)) {
            messages.push(
              `${field} "${ref}" doesn't match any row_id in this file`,
            );
            status = "error";
          }
          if (ref && ref === rowId) {
            messages.push(`${field} cannot reference itself`);
            status = "error";
          }
        },
      );

      if (r.branch_name && r.branch_name.trim()) {
        const match = branches.find(
          (b) => b.name.toLowerCase() === r.branch_name.trim().toLowerCase(),
        );
        if (!match && status !== "error") {
          messages.push(
            `Branch "${r.branch_name}" not found — will be left unassigned`,
          );
          status = "warning";
        }
      }

      if (
        r.gender &&
        r.gender.trim() &&
        !["male", "female"].includes(r.gender.trim().toLowerCase())
      ) {
        messages.push(
          `Gender "${r.gender}" not recognized — will be left blank`,
        );
        if (status === "ok") status = "warning";
      }

      return { rowId, data: r, status, messages };
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const cleaned = rows.map((r) => {
        const obj: RawRow = {};
        Object.keys(r).forEach((k) => {
          obj[k] = String(r[k] ?? "").trim();
        });
        return obj;
      });
      setValidatedRows(validateRows(cleaned));
    };
    reader.readAsArrayBuffer(file);
  }

  function parseBool(val: string | undefined) {
    if (!val) return false;
    return ["true", "yes", "1"].includes(val.trim().toLowerCase());
  }

  async function confirmImport() {
    const importableRows = validatedRows.filter((r) => r.status !== "error");
    if (importableRows.length === 0) return;

    setImporting(true);

    const branchMap = new Map(
      branches.map((b) => [b.name.toLowerCase(), b.id]),
    );

    const personPayloads = importableRows.map((r) => {
      const d = r.data;
      const genderVal = d.gender?.trim().toLowerCase();
      return {
        full_name: d.full_name,
        native_name: d.native_name || null,
        nickname: d.nickname || null,
        gender:
          genderVal === "male" || genderVal === "female" ? genderVal : null,
        birth_date: d.birth_date || null,
        birth_place: d.birth_place || null,
        is_deceased: parseBool(d.is_deceased),
        death_date: d.death_date || null,
        death_place: d.death_place || null,
        burial_location: d.burial_location || null,
        country: d.country || null,
        province: d.province || null,
        district: d.district || null,
        village: d.village || null,
        phone: d.phone || null,
        email: d.email || null,
        whatsapp: d.whatsapp || null,
        facebook: d.facebook || null,
        telegram: d.telegram || null,
        linkedin: d.linkedin || null,
        school: d.school || null,
        university: d.university || null,
        degree: d.degree || null,
        graduation_year: d.graduation_year ? parseInt(d.graduation_year) : null,
        occupation: d.occupation || null,
        company: d.company || null,
        position: d.position || null,
        branch_id: d.branch_name
          ? (branchMap.get(d.branch_name.trim().toLowerCase()) ?? null)
          : null,
      };
    });

    const { data: insertedPersons, error: insertError } = await supabase
      .from("persons")
      .insert(personPayloads)
      .select();

    if (insertError || !insertedPersons) {
      setImporting(false);
      alert(`Import failed: ${insertError?.message ?? "Unknown error"}`);
      return;
    }

    // Postgres preserves row order on multi-row INSERT ... RETURNING,
    // so position i in insertedPersons corresponds to position i in importableRows
    const rowIdToPersonId = new Map<string, string>();
    importableRows.forEach((r, i) => {
      rowIdToPersonId.set(r.rowId, insertedPersons[i].id);
    });

    const relationshipPayloads: any[] = [];
    importableRows.forEach((r) => {
      const d = r.data;
      const selfId = rowIdToPersonId.get(r.rowId);
      if (!selfId) return;

      if (d.father_row_id && rowIdToPersonId.has(d.father_row_id.trim())) {
        relationshipPayloads.push({
          person_id: selfId,
          related_person_id: rowIdToPersonId.get(d.father_row_id.trim()),
          relationship_type: "father",
        });
      }
      if (d.mother_row_id && rowIdToPersonId.has(d.mother_row_id.trim())) {
        relationshipPayloads.push({
          person_id: selfId,
          related_person_id: rowIdToPersonId.get(d.mother_row_id.trim()),
          relationship_type: "mother",
        });
      }
      if (d.spouse_row_id && rowIdToPersonId.has(d.spouse_row_id.trim())) {
        relationshipPayloads.push({
          person_id: selfId,
          related_person_id: rowIdToPersonId.get(d.spouse_row_id.trim()),
          relationship_type: "spouse",
          marriage_date: d.marriage_date || null,
        });
      }
    });

    if (relationshipPayloads.length > 0) {
      await supabase.from("relationships").insert(relationshipPayloads);
    }

    setImporting(false);
    setImportResult({
      created: insertedPersons.length,
      relationships: relationshipPayloads.length,
      skipped: validatedRows.length - importableRows.length,
    });
    setValidatedRows([]);
    setFileName("");
  }

  if (checkingRole) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Checking permissions...
      </p>
    );
  }

  if (!authorized) return null;

  const errorCount = validatedRows.filter((r) => r.status === "error").length;
  const warningCount = validatedRows.filter(
    (r) => r.status === "warning",
  ).length;
  const okCount = validatedRows.filter((r) => r.status === "ok").length;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[var(--color-navy)] flex items-center justify-center shrink-0">
          <FontAwesomeIcon
            icon={faFileExcel}
            className="text-[var(--color-gold)] text-lg"
          />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Bulk Import
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-0.5 text-sm">
            Add many family members at once from an Excel file.
          </p>
        </div>
      </div>

      {/* Step 1: Template */}
      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
        <h3 className="font-display text-base font-semibold text-[var(--color-navy)] mb-2">
          1. Download the template
        </h3>
        <p className="font-body text-sm text-[var(--color-ink)]/70 mb-4">
          Each row is one person. Give every row a unique{" "}
          <code className="bg-[var(--color-navy)]/5 px-1.5 py-0.5 rounded">
            row_id
          </code>{" "}
          number. To link a father, mother, or spouse, put that person's{" "}
          <code className="bg-[var(--color-navy)]/5 px-1.5 py-0.5 rounded">
            row_id
          </code>{" "}
          in the{" "}
          <code className="bg-[var(--color-navy)]/5 px-1.5 py-0.5 rounded">
            father_row_id
          </code>{" "}
          /{" "}
          <code className="bg-[var(--color-navy)]/5 px-1.5 py-0.5 rounded">
            mother_row_id
          </code>{" "}
          /{" "}
          <code className="bg-[var(--color-navy)]/5 px-1.5 py-0.5 rounded">
            spouse_row_id
          </code>{" "}
          column — not their name. Only Full Name is required; everything else
          is optional.
        </p>
        <button
          onClick={downloadTemplate}
          className="inline-flex cursor-pointer items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors"
        >
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          Download Excel Template
        </button>
      </div>

      {/* Step 2: Upload */}
      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
        <h3 className="font-display text-base font-semibold text-[var(--color-navy)] mb-2">
          2. Upload your filled-in file
        </h3>
        <label className="bg-white border-2 border-dashed border-[var(--color-navy)]/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--color-gold)]/50 transition-colors cursor-pointer block">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FontAwesomeIcon
            icon={faUpload}
            className="text-[var(--color-navy)] text-lg"
          />
          <p className="font-body text-sm font-medium text-[var(--color-navy)]">
            {fileName || "Click to select an .xlsx file"}
          </p>
        </label>
      </div>

      {/* Step 3: Preview */}
      {validatedRows.length > 0 && (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-display text-base font-semibold text-[var(--color-navy)]">
              3. Review before importing
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-body text-xs font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-2.5 py-1 rounded-full">
                {okCount} ready
              </span>
              {warningCount > 0 && (
                <span className="font-body text-xs font-medium text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full">
                  {warningCount} with warnings
                </span>
              )}
              {errorCount > 0 && (
                <span className="font-body text-xs font-medium text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 px-2.5 py-1 rounded-full">
                  {errorCount} will be skipped
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-navy)]/10">
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-3 py-2">
                    Status
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-3 py-2">
                    Row
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-3 py-2">
                    Name
                  </th>
                  <th className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 text-left px-3 py-2">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {validatedRows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--color-navy)]/5 last:border-0"
                  >
                    <td className="px-3 py-2.5">
                      <FontAwesomeIcon
                        icon={
                          r.status === "error"
                            ? faCircleXmark
                            : r.status === "warning"
                              ? faTriangleExclamation
                              : faCheck
                        }
                        className={
                          r.status === "error"
                            ? "text-[var(--color-maroon)]"
                            : r.status === "warning"
                              ? "text-[var(--color-gold)]"
                              : "text-[var(--color-emerald)]"
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5 font-body text-sm text-[var(--color-ink)]/70">
                      {r.rowId || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-body text-sm text-[var(--color-ink)]/90">
                      {r.data.full_name || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-[var(--color-ink)]/60">
                      {r.messages.length > 0
                        ? r.messages.join("; ")
                        : "Looks good"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={confirmImport}
            disabled={importing || okCount + warningCount === 0}
            className="mt-5 inline-flex items-center gap-2 bg-[var(--color-emerald)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            {importing
              ? "Importing..."
              : `Confirm Import (${okCount + warningCount} people)`}
          </button>
        </div>
      )}

      {/* Result */}
      {importResult && (
        <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/20 rounded-2xl p-5 md:p-6">
          <h3 className="font-display text-base font-semibold text-[var(--color-navy)] mb-2">
            Import complete
          </h3>
          <p className="font-body text-sm text-[var(--color-ink)]/80">
            {importResult.created} people created, {importResult.relationships}{" "}
            relationships linked
            {importResult.skipped > 0 &&
              `, ${importResult.skipped} rows skipped due to errors`}
            .
          </p>
        </div>
      )}
    </div>
  );
}
