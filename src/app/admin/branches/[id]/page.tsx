"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPen,
  faEye,
  faArrowLeft,
  faExpand,
  faDownload,
  faFolderTree,
  faUsers,
  faPrint,
  faSitemap,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

const Tree = dynamic(() => import("react-d3-tree"), { ssr: false });

type PersonRow = {
  id: string;
  full_name: string;
  birth_date: string | null;
  birth_place: string | null;
  is_deceased: boolean;
  death_date: string | null;
  avatar_path: string | null;
};

type RawNode = {
  name: string;
  attributes: {
    id: string;
    years: string;
    avatarPath: string;
    virtual?: string;
  };
  children?: RawNode[];
};

type BranchInfo = {
  id: string;
  name: string;
  description: string | null;
  founder_name: string | null;
};

type FullPerson = {
  id: string;
  full_name: string;
  native_name: string | null;
  avatar_path: string | null;
  birth_date: string | null;
  birth_place: string | null;
  is_deceased: boolean;
  death_date: string | null;
  death_place: string | null;
  biography: string | null;
  country: string | null;
  province: string | null;
  village: string | null;
  school: string | null;
  university: string | null;
  degree: string | null;
  occupation: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_notes: string | null;
};

function formatYears(person: PersonRow) {
  const by = person.birth_date
    ? new Date(person.birth_date).getFullYear()
    : null;
  const dy = person.death_date
    ? new Date(person.death_date).getFullYear()
    : null;
  if (!by) return "";
  if (person.is_deceased && dy) return `${by}–${dy}`;
  if (person.is_deceased) return `d. ${by}`;
  return `b. ${by}`;
}

function collectIdsByGeneration(
  node: RawNode,
  gen: number,
  acc: Map<number, string[]>,
) {
  const isVirtual = node.attributes?.virtual === "true";
  if (!isVirtual) {
    const list = acc.get(gen) ?? [];
    list.push(node.attributes.id);
    acc.set(gen, list);
  }
  (node.children ?? []).forEach((c) =>
    collectIdsByGeneration(c, isVirtual ? gen : gen + 1, acc),
  );
}

// Static (non-interactive) chart node — used only for printing, since the
// interactive SVG tree can't be paginated or scaled by the browser's print engine.
function StaticChartNode({
  node,
  isRoot = false,
}: {
  node: RawNode;
  isRoot?: boolean;
}) {
  const isVirtual = node.attributes?.virtual === "true";
  if (isVirtual) {
    return (
      <div className="flex gap-10">
        {(node.children ?? []).map((child) => (
          <StaticChartNode key={child.attributes.id} node={child} isRoot />
        ))}
      </div>
    );
  }

  const avatarUrl = node.attributes.avatarPath
    ? supabase.storage.from("photos").getPublicUrl(node.attributes.avatarPath)
        .data.publicUrl
    : null;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 border break-inside-avoid ${
          isRoot
            ? "bg-[var(--color-navy)] border-[var(--color-navy)]"
            : "bg-white border-[var(--color-navy)]/20"
        }`}
        style={{ minWidth: "140px" }}
      >
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--color-navy)]/10 flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              className={`text-sm ${isRoot ? "text-[var(--color-ivory)]/50" : "text-[var(--color-navy)]/30"}`}
            />
          )}
        </div>
        <span
          className={`font-body text-sm font-medium text-center whitespace-nowrap ${isRoot ? "text-[var(--color-ivory)]" : "text-[var(--color-navy)]"}`}
        >
          {node.name}
        </span>
        {node.attributes.years && (
          <span
            className={`font-body text-xs ${isRoot ? "text-[var(--color-ivory)]/60" : "text-[var(--color-ink)]/50"}`}
          >
            {node.attributes.years}
          </span>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-[var(--color-navy)]/25" />
          <div className="flex gap-8 relative pt-px">
            <div className="absolute top-0 left-0 right-0 h-px bg-[var(--color-navy)]/25" />
            {node.children.map((child) => (
              <div
                key={child.attributes.id}
                className="flex flex-col items-center pt-6"
              >
                <StaticChartNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function BranchTreePage() {
  const params = useParams();
  const branchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [treeData, setTreeData] = useState<RawNode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<
    { gen: number; people: FullPerson[] }[]
  >([]);

  const [chartPrintOpen, setChartPrintOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  async function loadBranchTree() {
    setLoading(true);

    const { data: branchData } = await supabase
      .from("branches")
      .select("id, name, description, founder_name")
      .eq("id", branchId)
      .single();

    if (branchData) setBranch(branchData);

    const { data: personsData } = await supabase
      .from("persons")
      .select(
        "id, full_name, birth_date, birth_place, is_deceased, death_date, avatar_path",
      )
      .eq("branch_id", branchId)
      .order("full_name");

    if (!personsData || personsData.length === 0) {
      setPersons([]);
      setTreeData(null);
      setLoading(false);
      return;
    }

    setPersons(personsData);

    const branchIdsSet = new Set(personsData.map((p) => p.id));

    const { data: relData } = await supabase
      .from("relationships")
      .select("person_id, related_person_id, relationship_type")
      .eq("relationship_type", "father");

    const branchFatherRels = (relData ?? []).filter(
      (r) =>
        branchIdsSet.has(r.person_id) && branchIdsSet.has(r.related_person_id),
    );

    const childrenByFather = new Map<string, string[]>();
    branchFatherRels.forEach((r) => {
      const list = childrenByFather.get(r.related_person_id) ?? [];
      list.push(r.person_id);
      childrenByFather.set(r.related_person_id, list);
    });

    const personMap = new Map(personsData.map((p) => [p.id, p]));
    const childIds = new Set(branchFatherRels.map((r) => r.person_id));
    let rootIds = personsData
      .filter((p) => !childIds.has(p.id))
      .map((p) => p.id);

    if (branchData?.founder_name) {
      const founderMatch = personsData.find(
        (p) =>
          p.full_name.toLowerCase() === branchData.founder_name!.toLowerCase(),
      );
      if (founderMatch && rootIds.includes(founderMatch.id)) {
        rootIds = [
          founderMatch.id,
          ...rootIds.filter((id) => id !== founderMatch.id),
        ];
      }
    }

    function buildNode(id: string): RawNode {
      const p = personMap.get(id);
      const kids = childrenByFather.get(id) ?? [];
      return {
        name: p?.full_name ?? "Unknown",
        attributes: {
          id,
          years: p ? formatYears(p) : "",
          avatarPath: p?.avatar_path ?? "",
        },
        children: kids.map((cid) => buildNode(cid)),
      };
    }

    const roots = rootIds.map((id) => buildNode(id));

    if (roots.length === 0) {
      setTreeData(null);
    } else if (roots.length === 1) {
      setTreeData(roots[0]);
    } else {
      setTreeData({
        name: "",
        attributes: {
          id: "virtual-root",
          years: "",
          avatarPath: "",
          virtual: "true",
        },
        children: roots,
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBranchTree();
  }, [branchId]);

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 90 });
    }
  }, [treeData, resetKey]);

  const selectedPerson = persons.find((p) => p.id === selectedId) ?? null;

  function handleExportCsv() {
    const header = ["Full Name", "Birth Date", "Deceased", "Death Date"];
    const rows = persons.map((p) => [
      p.full_name,
      p.birth_date ?? "",
      p.is_deceased ? "Yes" : "No",
      p.death_date ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(branch?.name ?? "branch").replace(/\s+/g, "-").toLowerCase()}-members.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openReport() {
    if (!treeData) return;
    setReportLoading(true);
    setReportOpen(true);

    const genMap = new Map<number, string[]>();
    collectIdsByGeneration(treeData, 0, genMap);

    const allIds = Array.from(genMap.values()).flat();

    const { data: fullPersons } = await supabase
      .from("persons")
      .select(
        "id, full_name, native_name, avatar_path, birth_date, birth_place, is_deceased, death_date, death_place, biography, country, province, village, school, university, degree, occupation, company, phone, email, blood_group, allergies, medical_notes",
      )
      .in("id", allIds);

    const personMap = new Map(
      (fullPersons ?? []).map((p) => [p.id, p as FullPerson]),
    );

    const grouped = Array.from(genMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([gen, ids]) => ({
        gen,
        people: ids
          .map((id) => personMap.get(id))
          .filter((p): p is FullPerson => !!p),
      }));

    setReportData(grouped);
    setReportLoading(false);
  }

  function renderNode({ nodeDatum }: any) {
    const isVirtual = nodeDatum.attributes?.virtual === "true";
    if (isVirtual) return <g />;

    const id = nodeDatum.attributes?.id;
    const years = nodeDatum.attributes?.years;
    const avatarPath = nodeDatum.attributes?.avatarPath;
    const isSelected = id === selectedId;
    const avatarUrl = avatarPath
      ? supabase.storage.from("photos").getPublicUrl(avatarPath).data.publicUrl
      : null;

    return (
      <g>
        <foreignObject
          x={-75}
          y={-45}
          width={150}
          height={95}
          style={{ overflow: "visible" }}
        >
          <div
            onClick={() => setSelectedId(id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "16px",
              background: "white",
              border: isSelected
                ? "2px solid var(--color-gold)"
                : "1px solid rgba(15,31,61,0.15)",
              boxShadow: isSelected ? "0 4px 12px rgba(15,31,61,0.15)" : "none",
              width: "134px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "rgba(15,31,61,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUser}
                  style={{ fontSize: "12px", color: "var(--color-navy)" }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-navy)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {nodeDatum.name}
            </span>
            {years && (
              <span style={{ fontSize: "10px", color: "rgba(28,27,24,0.5)" }}>
                {years}
              </span>
            )}
          </div>
        </foreignObject>
      </g>
    );
  }

  return (
    <div className="space-y-6">
      {chartPrintOpen ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
                Branch Tree Chart
              </h2>
              <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1">
                {branch?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-4 py-2.5 rounded-full hover:bg-[var(--color-emerald)]/20 transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPrint} className="text-xs" />
                Print / Save as PDF
              </button>
              <button
                onClick={() => setChartPrintOpen(false)}
                className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>

          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6 md:p-10 print:border-none print:bg-transparent overflow-x-auto">
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
                {branch?.name}
              </h3>
              {branch?.description && (
                <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1">
                  {branch.description}
                </p>
              )}
              <p className="font-body text-xs text-[var(--color-ink)]/50 mt-2">
                {persons.length} member{persons.length !== 1 ? "s" : ""} ·
                Generated{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex justify-center min-w-max px-4">
              {treeData && <StaticChartNode node={treeData} isRoot />}
            </div>
          </div>
        </>
      ) : reportOpen ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
                Full Branch Report
              </h2>
              <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1">
                {branch?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-4 py-2.5 rounded-full hover:bg-[var(--color-emerald)]/20 transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPrint} className="text-xs" />
                Print / Save as PDF
              </button>
              <button
                onClick={() => setReportOpen(false)}
                className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>

          {reportLoading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Building report...
            </p>
          ) : (
            <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6 md:p-8 print:border-none print:bg-transparent">
              <h3 className="font-display text-2xl font-semibold text-[var(--color-navy)] mb-1">
                {branch?.name} — Full Report
              </h3>
              <p className="font-body text-xs text-[var(--color-ink)]/50 mb-8">
                Generated{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {reportData.reduce((sum, g) => sum + g.people.length, 0)}{" "}
                members
              </p>

              {reportData.map(({ gen, people }) => (
                <div key={gen} className="mb-10">
                  <h4 className="font-display text-lg font-semibold text-[var(--color-gold)] border-b border-[var(--color-gold)]/30 pb-2 mb-6">
                    {gen === 0 ? "Root Generation" : `Generation ${gen}`}
                  </h4>

                  <div className="space-y-8">
                    {people.map((p) => {
                      const avatarUrl = p.avatar_path
                        ? supabase.storage
                            .from("photos")
                            .getPublicUrl(p.avatar_path).data.publicUrl
                        : null;
                      return (
                        <div
                          key={p.id}
                          className="flex flex-col sm:flex-row gap-4 pb-8 border-b border-[var(--color-navy)]/10 last:border-0 break-inside-avoid"
                        >
                          <div className="w-20 h-20 rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center shrink-0">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FontAwesomeIcon
                                icon={faUser}
                                className="text-[var(--color-navy)]/30 text-2xl"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                              {p.full_name}
                            </h5>
                            {p.native_name && (
                              <p className="font-body text-sm text-[var(--color-ink)]/60">
                                {p.native_name}
                              </p>
                            )}
                            <p className="font-body text-xs text-[var(--color-ink)]/50 mt-1">
                              {p.is_deceased
                                ? `Deceased${p.death_date ? ` · ${new Date(p.death_date).getFullYear()}` : ""}${p.death_place ? ` in ${p.death_place}` : ""}`
                                : "Living"}
                              {p.birth_date &&
                                ` · Born ${new Date(p.birth_date).getFullYear()}`}
                              {p.birth_place && ` in ${p.birth_place}`}
                            </p>

                            {p.biography && (
                              <p className="font-body text-sm text-[var(--color-ink)]/80 mt-3 leading-relaxed">
                                {p.biography}
                              </p>
                            )}

                            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3">
                              {(p.village || p.province || p.country) && (
                                <p className="font-body text-xs text-[var(--color-ink)]/70">
                                  <span className="text-[var(--color-ink)]/45">
                                    Location:{" "}
                                  </span>
                                  {[p.village, p.province, p.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                              {(p.school || p.university || p.degree) && (
                                <p className="font-body text-xs text-[var(--color-ink)]/70">
                                  <span className="text-[var(--color-ink)]/45">
                                    Education:{" "}
                                  </span>
                                  {[p.degree, p.university || p.school]
                                    .filter(Boolean)
                                    .join(" — ")}
                                </p>
                              )}
                              {(p.occupation || p.company) && (
                                <p className="font-body text-xs text-[var(--color-ink)]/70">
                                  <span className="text-[var(--color-ink)]/45">
                                    Career:{" "}
                                  </span>
                                  {[p.occupation, p.company]
                                    .filter(Boolean)
                                    .join(" at ")}
                                </p>
                              )}
                              {(p.phone || p.email) && (
                                <p className="font-body text-xs text-[var(--color-ink)]/70">
                                  <span className="text-[var(--color-ink)]/45">
                                    Contact:{" "}
                                  </span>
                                  {[p.phone, p.email]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                              {(p.blood_group || p.allergies) && (
                                <p className="font-body text-xs text-[var(--color-ink)]/70 sm:col-span-2">
                                  <span className="text-[var(--color-ink)]/45">
                                    Medical:{" "}
                                  </span>
                                  {[p.blood_group, p.allergies]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Link
            href="/admin/branches"
            className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)]"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back to Branches
          </Link>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Loading branch...
            </p>
          ) : !branch ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Branch not found.
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                    <FontAwesomeIcon
                      icon={faFolderTree}
                      className="text-[var(--color-gold)] text-base"
                    />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
                      {branch.name}
                    </h2>
                    <p className="font-body text-sm text-[var(--color-ink)]/60 mt-0.5">
                      {branch.description || "No description"} ·{" "}
                      {persons.length} member{persons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* View control — separate from the export/print actions below */}
                  <button
                    onClick={() => setResetKey((k) => k + 1)}
                    className="w-10 h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 shrink-0"
                    aria-label="Fit to screen"
                    title="Reset zoom and center"
                  >
                    <FontAwesomeIcon icon={faExpand} className="text-sm" />
                  </button>

                  {/* Print/export actions — grouped in one consistent pill row */}
                  <div className="flex items-center gap-1 bg-white border border-[var(--color-navy)]/10 rounded-full p-1">
                    <button
                      onClick={() => setChartPrintOpen(true)}
                      className="inline-flex items-center gap-2 font-body text-xs sm:text-sm font-medium text-[var(--color-navy)]/80 px-3 sm:px-4 py-2 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors whitespace-nowrap"
                    >
                      <FontAwesomeIcon
                        icon={faSitemap}
                        className="text-xs text-[var(--color-gold)]"
                      />
                      Tree Chart
                    </button>
                    <span className="w-px h-5 bg-[var(--color-navy)]/10" />
                    <button
                      onClick={openReport}
                      className="inline-flex items-center gap-2 font-body text-xs sm:text-sm font-medium text-[var(--color-navy)]/80 px-3 sm:px-4 py-2 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors whitespace-nowrap"
                    >
                      <FontAwesomeIcon
                        icon={faPrint}
                        className="text-xs text-[var(--color-emerald)]"
                      />
                      Full Report
                    </button>
                    <span className="w-px h-5 bg-[var(--color-navy)]/10" />
                    <button
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-2 font-body text-xs sm:text-sm font-medium text-[var(--color-navy)]/80 px-3 sm:px-4 py-2 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors whitespace-nowrap"
                    >
                      <FontAwesomeIcon
                        icon={faDownload}
                        className="text-xs text-[var(--color-navy)]"
                      />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {persons.length === 0 ? (
                <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
                  No members are assigned to this branch yet.
                </p>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div
                    ref={containerRef}
                    className="lg:col-span-2 bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl overflow-hidden"
                    style={{ height: "600px" }}
                  >
                    {treeData && (
                      <Tree
                        key={resetKey}
                        data={treeData}
                        translate={translate}
                        orientation="vertical"
                        pathFunc="step"
                        zoomable
                        draggable
                        scaleExtent={{ min: 0.2, max: 2 }}
                        nodeSize={{ x: 160, y: 130 }}
                        separation={{ siblings: 1, nonSiblings: 1.3 }}
                        renderCustomNodeElement={renderNode}
                      />
                    )}
                  </div>

                  <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6 h-fit">
                    <h3 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4">
                      Selected Person
                    </h3>
                    {selectedPerson ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center">
                            {selectedPerson.avatar_path ? (
                              <img
                                src={
                                  supabase.storage
                                    .from("photos")
                                    .getPublicUrl(selectedPerson.avatar_path)
                                    .data.publicUrl
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FontAwesomeIcon
                                icon={faUser}
                                className="text-[var(--color-navy)]"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-body text-sm font-medium text-[var(--color-navy)]">
                              {selectedPerson.full_name}
                            </p>
                            <p className="font-body text-xs text-[var(--color-ink)]/50">
                              {formatYears(selectedPerson) || "No dates set"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                          <Link
                            href={`/admin/members/${selectedPerson.id}/view`}
                            className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded-lg py-2.5 hover:bg-[var(--color-emerald)]/20"
                          >
                            <FontAwesomeIcon
                              icon={faEye}
                              className="text-[10px]"
                            />{" "}
                            View Full Profile
                          </Link>
                          <Link
                            href={`/admin/members/${selectedPerson.id}/edit`}
                            className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-navy)] bg-[var(--color-navy)]/5 rounded-lg py-2.5 hover:bg-[var(--color-navy)]/10"
                          >
                            <FontAwesomeIcon
                              icon={faPen}
                              className="text-[10px]"
                            />{" "}
                            Edit Profile
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="font-body text-sm text-[var(--color-ink)]/50">
                        Click on a person in the tree to see their details here.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
