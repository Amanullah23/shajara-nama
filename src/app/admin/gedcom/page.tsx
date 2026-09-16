"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faDownload,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

const GEDCOM_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function formatGedcomDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${GEDCOM_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function splitName(fullName: string): { given: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { given: parts[0], surname: "" };
  return {
    given: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

type FamUnit = {
  id: string;
  husb?: string;
  wife?: string;
  children: string[];
  marrDate?: string | null;
  marrPlace?: string | null;
};

export default function GedcomPage() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportCount, setExportCount] = useState<number | null>(null);

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
  }, [router]);

  async function handleExport() {
    setExporting(true);
    setExportCount(null);

    const { data: persons } = await supabase
      .from("persons")
      .select(
        "id, full_name, gender, birth_date, birth_place, is_deceased, death_date, death_place, biography, occupation",
      );

    const { data: relationships } = await supabase
      .from("relationships")
      .select(
        "person_id, related_person_id, relationship_type, marriage_date, marriage_place",
      );

    if (!persons || persons.length === 0) {
      setExporting(false);
      alert("No people found to export.");
      return;
    }

    const idMap = new Map<string, string>();
    persons.forEach((p, i) => idMap.set(p.id, `I${i + 1}`));

    const fatherOf = new Map<string, string>();
    const motherOf = new Map<string, string>();
    (relationships ?? []).forEach((r) => {
      if (r.relationship_type === "father")
        fatherOf.set(r.person_id, r.related_person_id);
      if (r.relationship_type === "mother")
        motherOf.set(r.person_id, r.related_person_id);
    });

    const personGenderMap = new Map(persons.map((p) => [p.id, p.gender]));
    const famUnits: FamUnit[] = [];
    const famKeyToUnit = new Map<string, FamUnit>();

    function getOrCreateFam(husb?: string, wife?: string): FamUnit {
      const key = `${husb ?? ""}|${wife ?? ""}`;
      let unit = famKeyToUnit.get(key);
      if (!unit) {
        unit = { id: `F${famUnits.length + 1}`, husb, wife, children: [] };
        famUnits.push(unit);
        famKeyToUnit.set(key, unit);
      }
      return unit;
    }

    const seenSpousePairs = new Set<string>();
    (relationships ?? []).forEach((r) => {
      if (r.relationship_type !== "spouse") return;
      const key = [r.person_id, r.related_person_id].sort().join("|");
      if (seenSpousePairs.has(key)) return;
      seenSpousePairs.add(key);

      const aGender = personGenderMap.get(r.person_id);
      let husb = r.person_id;
      let wife = r.related_person_id;
      if (aGender === "female") {
        husb = r.related_person_id;
        wife = r.person_id;
      }
      const unit = getOrCreateFam(husb, wife);
      unit.marrDate = r.marriage_date;
      unit.marrPlace = r.marriage_place;
    });

    persons.forEach((p) => {
      const father = fatherOf.get(p.id);
      const mother = motherOf.get(p.id);
      if (!father && !mother) return;
      const unit = getOrCreateFam(father, mother);
      unit.children.push(p.id);
    });

    const famcOf = new Map<string, string>();
    const famsOf = new Map<string, string[]>();
    famUnits.forEach((f) => {
      f.children.forEach((c) => famcOf.set(c, f.id));
      if (f.husb) famsOf.set(f.husb, [...(famsOf.get(f.husb) ?? []), f.id]);
      if (f.wife) famsOf.set(f.wife, [...(famsOf.get(f.wife) ?? []), f.id]);
    });

    const lines: string[] = [];
    lines.push("0 HEAD");
    lines.push("1 SOUR Shajara_Nama");
    lines.push("2 NAME Shajara Nama");
    lines.push("1 GEDC");
    lines.push("2 VERS 5.5.1");
    lines.push("2 FORM LINEAGE-LINKED");
    lines.push("1 CHAR UTF-8");
    lines.push(
      `1 DATE ${formatGedcomDate(new Date().toISOString().slice(0, 10))}`,
    );

    persons.forEach((p) => {
      const id = idMap.get(p.id);
      lines.push(`0 @${id}@ INDI`);
      const { given, surname } = splitName(p.full_name);
      lines.push(`1 NAME ${given} /${surname}/`);
      if (p.gender) lines.push(`1 SEX ${p.gender === "male" ? "M" : "F"}`);
      if (p.birth_date || p.birth_place) {
        lines.push("1 BIRT");
        if (p.birth_date)
          lines.push(`2 DATE ${formatGedcomDate(p.birth_date)}`);
        if (p.birth_place) lines.push(`2 PLAC ${p.birth_place}`);
      }
      if (p.is_deceased) {
        lines.push("1 DEAT Y");
        if (p.death_date)
          lines.push(`2 DATE ${formatGedcomDate(p.death_date)}`);
        if (p.death_place) lines.push(`2 PLAC ${p.death_place}`);
      }
      if (p.occupation) lines.push(`1 OCCU ${p.occupation}`);
      if (p.biography) {
        const noteLines = p.biography.split("\n");
        lines.push(`1 NOTE ${noteLines[0]}`);
        for (let i = 1; i < noteLines.length; i++)
          lines.push(`2 CONT ${noteLines[i]}`);
      }
      const famc = famcOf.get(p.id);
      if (famc) lines.push(`1 FAMC @${famc}@`);
      (famsOf.get(p.id) ?? []).forEach((f) => lines.push(`1 FAMS @${f}@`));
    });

    famUnits.forEach((f) => {
      lines.push(`0 @${f.id}@ FAM`);
      if (f.husb) lines.push(`1 HUSB @${idMap.get(f.husb)}@`);
      if (f.wife) lines.push(`1 WIFE @${idMap.get(f.wife)}@`);
      f.children.forEach((c) => lines.push(`1 CHIL @${idMap.get(c)}@`));
      if (f.marrDate || f.marrPlace) {
        lines.push("1 MARR");
        if (f.marrDate) lines.push(`2 DATE ${formatGedcomDate(f.marrDate)}`);
        if (f.marrPlace) lines.push(`2 PLAC ${f.marrPlace}`);
      }
    });

    lines.push("0 TRLR");

    const gedcomText = lines.join("\n");
    const blob = new Blob([gedcomText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shajara-nama-export-${new Date().toISOString().slice(0, 10)}.ged`;
    a.click();
    URL.revokeObjectURL(url);

    setExportCount(persons.length);
    setExporting(false);
  }

  if (checkingRole) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Checking permissions...
      </p>
    );
  }
  if (!authorized) return null;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[var(--color-navy)] flex items-center justify-center shrink-0">
          <FontAwesomeIcon
            icon={faFileExport}
            className="text-[var(--color-gold)] text-lg"
          />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
            GEDCOM
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-0.5 text-sm">
            Export your family tree in the standard genealogy interchange
            format.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-navy)]/8 rounded-2xl p-5 md:p-6">
        <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-2">
          Export to GEDCOM
        </h3>
        <p className="font-body text-sm text-[var(--color-ink)]/65 mb-4">
          Downloads a{" "}
          <code className="bg-[var(--color-navy)]/5 px-1.5 py-0.5 rounded">
            .ged
          </code>{" "}
          file containing every person, their relationships (parents, spouses,
          children), and dates/places — readable by any standard genealogy
          software (Ancestry, MyHeritage, FamilySearch, Gramps, and others).
        </p>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          {exporting ? "Generating..." : "Download GEDCOM File"}
        </button>

        {exportCount !== null && (
          <p className="font-body text-xs text-[var(--color-emerald)] mt-3">
            Exported {exportCount} people successfully.
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 bg-[var(--color-navy)]/[0.03] border border-[var(--color-navy)]/8 rounded-2xl p-5">
        <FontAwesomeIcon
          icon={faCircleInfo}
          className="text-[var(--color-gold)] text-sm mt-0.5 shrink-0"
        />
        <p className="font-body text-sm text-[var(--color-ink)]/65">
          GEDCOM <strong>import</strong> (bringing a .ged file from another
          service into Shajara Nama) is coming next — it needs the same
          review-before-saving safeguards as Bulk Excel Import.
        </p>
      </div>
    </div>
  );
}
