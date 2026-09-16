"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPen,
  faTrash,
  faUserPlus,
  faMagnifyingGlass,
  faDownload,
  faObjectUngroup,
  faExpand,
  faXmark,
  faEye,
  faPlus,
  faMinus,
  faPalette,
  faPrint,
  faArrowsLeftRight,
  faRoute,
  faCrosshairs,
  faHeart,
  faChild,
  faUsers,
  faSitemap,
  faUpRightAndDownLeftFromCenter,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

const Tree = dynamic(() => import("react-d3-tree"), { ssr: false });

type PersonRow = {
  id: string;
  full_name: string;
  birth_date: string | null;
  birth_place: string | null;
  is_deceased: boolean;
  death_date: string | null;
  avatar_path: string | null;
  gender: string | null;
};

type RawNode = {
  name: string;
  attributes: {
    id: string;
    years: string;
    avatarPath: string;
    birthPlace: string;
    gender?: string;
    virtual?: string;
  };
  children?: RawNode[];
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
// Static (non-interactive) chart node with gender-based coloring — used only for the
// expanded/printable view, since the interactive SVG tree can't be reliably printed or exported.
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

  const gender = node.attributes.gender;
  const genderStyle =
    gender === "male"
      ? {
          border: "2px solid var(--color-navy)",
          background: "rgba(27,75,58,0.05)",
        }
      : gender === "female"
        ? { border: "2px solid #B5487A", background: "rgba(181,72,122,0.06)" }
        : { border: "1px solid rgba(15,31,61,0.15)", background: "white" };

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 break-inside-avoid"
        style={{ minWidth: "140px", ...genderStyle }}
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
              className="text-sm text-[var(--color-navy)]/30"
            />
          )}
        </div>
        <span className="font-body text-sm font-medium text-center whitespace-nowrap text-[var(--color-ink)]">
          {node.name}
        </span>
        {node.attributes.years && (
          <span className="font-body text-xs text-[var(--color-ink)]/50">
            {node.attributes.years}
          </span>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-[var(--color-navy)]/20" />
          <div className="flex gap-8 relative pt-px">
            <div className="absolute top-0 left-0 right-0 h-px bg-[var(--color-navy)]/20" />
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

function filterCollapsed(node: RawNode, collapsed: Set<string>): RawNode {
  if (collapsed.has(node.attributes.id)) {
    return { ...node, children: [] };
  }
  return {
    ...node,
    children: (node.children ?? []).map((c) => filterCollapsed(c, collapsed)),
  };
}

function findNode(node: RawNode, id: string): RawNode | null {
  if (node.attributes.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function collectDescendantIds(node: RawNode): string[] {
  let ids: string[] = [node.attributes.id];
  (node.children ?? []).forEach((c) => {
    ids = ids.concat(collectDescendantIds(c));
  });
  return ids;
}

function collectByGeneration(
  node: RawNode,
  gen: number,
  personMap: Map<string, PersonRow>,
  acc: Map<number, PersonRow[]>,
) {
  const p = personMap.get(node.attributes.id);
  if (p) {
    const list = acc.get(gen) ?? [];
    list.push(p);
    acc.set(gen, list);
  }
  (node.children ?? []).forEach((c) =>
    collectByGeneration(c, gen + 1, personMap, acc),
  );
}

function ordinalWord(n: number): string {
  const words = [
    "Zeroth",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
  ];
  return words[n] ?? `${n}th`;
}

function directLineLabel(distance: number, ascending: boolean): string {
  if (distance === 1) return ascending ? "Parent" : "Child";
  if (distance === 2) return ascending ? "Grandparent" : "Grandchild";
  const greats = distance - 2;
  const prefix = greats === 1 ? "Great-" : `${greats}x Great-`;
  return ascending ? `${prefix}grandparent` : `${prefix}grandchild`;
}

function collateralRelationOfAtoB(
  minDist: number,
  removed: number,
  aIsCloser: boolean,
): string {
  if (minDist === 1) {
    if (removed === 0) return "Sibling";
    const greats = removed - 1;
    if (aIsCloser) {
      const prefix =
        greats === 0 ? "" : greats === 1 ? "Great-" : `${greats}x Great-`;
      return `${prefix}Aunt/Uncle`;
    }
    const prefix =
      greats === 0 ? "" : greats === 1 ? "Grand-" : `${greats}x Grand-`;
    return `${prefix}Niece/Nephew`;
  }
  const degree = minDist - 1;
  const removedText =
    removed === 0
      ? ""
      : removed === 1
        ? " (once removed)"
        : removed === 2
          ? " (twice removed)"
          : ` (${removed} times removed)`;
  return `${ordinalWord(degree)} Cousin${removedText}`;
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 font-body text-sm text-left transition-colors ${
        danger
          ? "text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/8"
          : "text-[var(--color-ink)]/80 hover:bg-[var(--color-emerald)]/8"
      }`}
    >
      <FontAwesomeIcon
        icon={icon}
        className={`text-sm w-4 ${danger ? "text-[var(--color-maroon)]" : "text-[var(--color-emerald)]"}`}
      />
      {label}
    </button>
  );
}

export default function TreeManagerPage() {
  const router = useRouter();

  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [treeData, setTreeData] = useState<RawNode | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [keepId, setKeepId] = useState("");
  const [dupId, setDupId] = useState("");
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const expandedRef = useRef<HTMLDivElement>(null);
  const [merging, setMerging] = useState(false);
  const [hovered, setHovered] = useState<{
    name: string;
    years: string;
    birthPlace: string;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [resetKey, setResetKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<PersonRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fatherOf, setFatherOf] = useState<Map<string, string>>(new Map());
  const [motherOf, setMotherOf] = useState<Map<string, string>>(new Map());
  const [spouseOf, setSpouseOf] = useState<Map<string, string>>(new Map());
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [highlightRootId, setHighlightRootId] = useState<string | null>(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterRootId, setRosterRootId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareAId, setCompareAId] = useState("");
  const [compareBId, setCompareBId] = useState("");
  const [relationshipPathIds, setRelationshipPathIds] = useState<Set<string>>(
    new Set(),
  );

  // Right-click context menu + tree-root override + quick-add relative modal
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    personId: string;
  } | null>(null);
  const [rootOverrideId, setRootOverrideId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<
    "child" | "parent" | "sibling" | "spouse"
  >("child");
  const [quickAddTargetId, setQuickAddTargetId] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddGender, setQuickAddGender] = useState("");
  const [quickAddBirthDate, setQuickAddBirthDate] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddError, setQuickAddError] = useState("");

  async function loadTree() {
    setLoading(true);

    const { data: personsData } = await supabase
      .from("persons")
      .select(
        "id, full_name, birth_date, birth_place, is_deceased, death_date, avatar_path, gender",
      )
      .order("full_name");

    const { data: relData } = await supabase
      .from("relationships")
      .select("person_id, related_person_id, relationship_type");

    if (!personsData) {
      setLoading(false);
      return;
    }

    setPersons(personsData);

    const fatherRels = (relData ?? []).filter(
      (r) => r.relationship_type === "father",
    );
    const childrenByFather = new Map<string, string[]>();
    const fatherOfMap = new Map<string, string>();
    fatherRels.forEach((r) => {
      fatherOfMap.set(r.person_id, r.related_person_id);
    });
    setFatherOf(fatherOfMap);

    const motherRels = (relData ?? []).filter(
      (r) => r.relationship_type === "mother",
    );
    const motherOfMap = new Map<string, string>();
    motherRels.forEach((r) => {
      motherOfMap.set(r.person_id, r.related_person_id);
    });
    setMotherOf(motherOfMap);

    const spouseRels = (relData ?? []).filter(
      (r) => r.relationship_type === "spouse",
    );
    const spouseMap = new Map<string, string>();
    spouseRels.forEach((r) => {
      spouseMap.set(r.person_id, r.related_person_id);
      spouseMap.set(r.related_person_id, r.person_id);
    });
    setSpouseOf(spouseMap);

    fatherRels.forEach((r) => {
      const list = childrenByFather.get(r.related_person_id) ?? [];
      list.push(r.person_id);
      childrenByFather.set(r.related_person_id, list);
    });

    const personMap = new Map(personsData.map((p) => [p.id, p]));
    const childIds = new Set(fatherRels.map((r) => r.person_id));
    const rootIds = personsData
      .filter((p) => !childIds.has(p.id))
      .map((p) => p.id);

    function buildNode(id: string): RawNode {
      const p = personMap.get(id);
      const kids = childrenByFather.get(id) ?? [];
      return {
        name: p?.full_name ?? "Unknown",
        attributes: {
          id,
          years: p ? formatYears(p) : "",
          avatarPath: p?.avatar_path ?? "",
          birthPlace: p?.birth_place ?? "",
          gender: p?.gender ?? undefined,
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
          birthPlace: "",
          virtual: "true",
        },
        children: roots,
      });
    }

    setLoading(false);
  }

  function getAncestorChain(personId: string): PersonRow[] {
    const chain: PersonRow[] = [];
    const personMap = new Map(persons.map((p) => [p.id, p]));
    let currentId: string | undefined = personId;
    const visited = new Set<string>();

    while (currentId && fatherOf.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      const fatherId: string = fatherOf.get(currentId)!;
      const father = personMap.get(fatherId);
      if (father) chain.unshift(father);
      currentId = fatherId;
    }

    return chain;
  }

  function getPathIds(startId: string, steps: number): string[] {
    const path: string[] = [startId];
    let cur = startId;
    for (let i = 0; i < steps; i++) {
      const f = fatherOf.get(cur);
      if (!f) break;
      path.push(f);
      cur = f;
    }
    return path;
  }
  async function handleDownloadPng() {
    if (!expandedRef.current) return;
    setExportingPng(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(expandedRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `shajara-nama-tree-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (err) {
      alert("Could not generate the PNG image. Please try Print instead.");
    }
    setExportingPng(false);
  }
  function getRelationshipResult(idA: string, idB: string) {
    if (idA === idB) return { kind: "same" as const };
    if (spouseOf.get(idA) === idB) return { kind: "spouse" as const };

    const distA = new Map<string, number>();
    distA.set(idA, 0);
    let cur: string | undefined = idA;
    let d = 0;
    const visited = new Set<string>();
    while (cur && fatherOf.has(cur) && !visited.has(cur)) {
      visited.add(cur);
      const f: string = fatherOf.get(cur)!;
      d += 1;
      distA.set(f, d);
      cur = f;
    }

    let curB: string | undefined = idB;
    let dB = 0;
    const visitedB = new Set<string>();
    while (curB && !visitedB.has(curB)) {
      if (distA.has(curB)) {
        return {
          kind: "found" as const,
          distanceA: distA.get(curB)!,
          distanceB: dB,
        };
      }
      visitedB.add(curB);
      const father = fatherOf.get(curB);
      if (!father) break;
      curB = father;
      dB += 1;
    }

    return { kind: "none" as const };
  }

  function buildRelationshipSentence(idA: string, idB: string): string {
    const nameA = persons.find((p) => p.id === idA)?.full_name ?? "Person A";
    const nameB = persons.find((p) => p.id === idB)?.full_name ?? "Person B";
    const result = getRelationshipResult(idA, idB);

    if (result.kind === "same")
      return `${nameA} and ${nameB} are the same person.`;
    if (result.kind === "spouse")
      return `${nameA} and ${nameB} are married to each other.`;
    if (result.kind === "none")
      return `No blood relationship was found between ${nameA} and ${nameB} in the tree.`;

    const { distanceA, distanceB } = result;
    if (distanceA === 0)
      return `${nameA} is ${nameB}'s ${directLineLabel(distanceB, true)}.`;
    if (distanceB === 0)
      return `${nameA} is ${nameB}'s ${directLineLabel(distanceA, false)}.`;

    const minD = Math.min(distanceA, distanceB);
    const removed = Math.abs(distanceA - distanceB);
    const aIsCloser = distanceA < distanceB;
    return `${nameA} is ${nameB}'s ${collateralRelationOfAtoB(minD, removed, aIsCloser)}.`;
  }

  function getAgeCompareText(idA: string, idB: string): string {
    const a = persons.find((p) => p.id === idA);
    const b = persons.find((p) => p.id === idB);
    if (!a?.birth_date || !b?.birth_date)
      return "Birth date not available for one or both.";
    const yearA = new Date(a.birth_date).getFullYear();
    const yearB = new Date(b.birth_date).getFullYear();
    const diff = Math.abs(yearA - yearB);
    if (diff === 0) return `Both born in ${yearA}.`;
    const older = yearA < yearB ? a.full_name : b.full_name;
    return `${older} is ${diff} year${diff !== 1 ? "s" : ""} older (born ${yearA} vs ${yearB}).`;
  }

  function showRelationshipPathInTree() {
    const result = getRelationshipResult(compareAId, compareBId);
    if (result.kind !== "found") return;

    const pathA = getPathIds(compareAId, result.distanceA);
    const pathB = getPathIds(compareBId, result.distanceB);
    const allIds = new Set([...pathA, ...pathB]);

    setRelationshipPathIds(allIds);

    setCollapsedIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.delete(id));
      return next;
    });

    setCompareOpen(false);
  }

  function clearRelationshipPath() {
    setRelationshipPathIds(new Set());
  }

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAndReveal(id: string) {
    const ancestors = getAncestorChain(id);
    if (ancestors.length > 0) {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        ancestors.forEach((a) => next.delete(a.id));
        return next;
      });
    }
    setSelectedId(id);
  }

  function toggleHighlight(id: string) {
    if (highlightRootId === id) {
      setHighlightedIds(new Set());
      setHighlightRootId(null);
      return;
    }
    if (!treeData) return;
    const node = findNode(treeData, id);
    if (!node) return;

    const ids = collectDescendantIds(node);
    setHighlightedIds(new Set(ids));
    setHighlightRootId(id);

    setCollapsedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((descId) => next.delete(descId));
      return next;
    });
  }

  function openRoster(id: string) {
    setRosterRootId(id);
    setRosterOpen(true);
  }

  function getRosterGenerations(): { gen: number; people: PersonRow[] }[] {
    if (!treeData || !rosterRootId) return [];
    const node = findNode(treeData, rosterRootId);
    if (!node) return [];
    const personMap = new Map(persons.map((p) => [p.id, p]));
    const acc = new Map<number, PersonRow[]>();
    collectByGeneration(node, 0, personMap, acc);
    return Array.from(acc.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([gen, people]) => ({ gen, people }));
  }

  function handleExportRosterCsv() {
    const generations = getRosterGenerations();
    const header = [
      "Generation",
      "Full Name",
      "Birth Date",
      "Deceased",
      "Death Date",
    ];
    const rows: string[][] = [];
    generations.forEach(({ gen, people }) => {
      people.forEach((p) => {
        rows.push([
          gen === 0 ? "Root" : `Generation ${gen}`,
          p.full_name,
          p.birth_date ?? "",
          p.is_deceased ? "Yes" : "No",
          p.death_date ?? "",
        ]);
      });
    });
    const csv = [header, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const rootName =
      persons.find((p) => p.id === rosterRootId)?.full_name ?? "branch";
    a.href = url;
    a.download = `${rootName.replace(/\s+/g, "-").toLowerCase()}-roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Context menu handlers ----
  function openContextMenu(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setContextMenu({ x: e.clientX, y: e.clientY, personId: id });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function handleFocusCenter(id: string) {
    selectAndReveal(id);
    setResetKey((k) => k + 1);
    closeContextMenu();
  }

  function handleSetAsRoot(id: string) {
    setRootOverrideId(id);
    setResetKey((k) => k + 1);
    closeContextMenu();
  }

  function clearRootOverride() {
    setRootOverrideId(null);
    setResetKey((k) => k + 1);
  }

  function openQuickAdd(
    type: "child" | "parent" | "sibling" | "spouse",
    targetId: string,
  ) {
    setQuickAddType(type);
    setQuickAddTargetId(targetId);
    setQuickAddName("");
    setQuickAddGender("");
    setQuickAddBirthDate("");
    setQuickAddError("");
    setQuickAddOpen(true);
    closeContextMenu();
  }

  async function submitQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickAddName.trim() || !quickAddTargetId) {
      setQuickAddError("Name is required.");
      return;
    }
    setQuickAddSaving(true);
    setQuickAddError("");

    const { data: newPerson, error: insertError } = await supabase
      .from("persons")
      .insert({
        full_name: quickAddName,
        gender: quickAddGender || null,
        birth_date: quickAddBirthDate || null,
      })
      .select()
      .single();

    if (insertError || !newPerson) {
      setQuickAddSaving(false);
      setQuickAddError(insertError?.message ?? "Could not create person.");
      return;
    }

    const target = persons.find((p) => p.id === quickAddTargetId);
    const relRows: any[] = [];

    if (quickAddType === "child") {
      const relType = target?.gender === "female" ? "mother" : "father";
      relRows.push({
        person_id: newPerson.id,
        related_person_id: quickAddTargetId,
        relationship_type: relType,
      });
    } else if (quickAddType === "parent") {
      const relType = quickAddGender === "female" ? "mother" : "father";
      relRows.push({
        person_id: quickAddTargetId,
        related_person_id: newPerson.id,
        relationship_type: relType,
      });
    } else if (quickAddType === "sibling") {
      const dad = fatherOf.get(quickAddTargetId);
      const mom = motherOf.get(quickAddTargetId);
      if (dad)
        relRows.push({
          person_id: newPerson.id,
          related_person_id: dad,
          relationship_type: "father",
        });
      if (mom)
        relRows.push({
          person_id: newPerson.id,
          related_person_id: mom,
          relationship_type: "mother",
        });
    } else if (quickAddType === "spouse") {
      relRows.push({
        person_id: quickAddTargetId,
        related_person_id: newPerson.id,
        relationship_type: "spouse",
      });
    }

    if (relRows.length > 0) {
      const { error: relError } = await supabase
        .from("relationships")
        .insert(relRows);
      if (relError) {
        setQuickAddSaving(false);
        setQuickAddError(
          `Person created, but linking failed: ${relError.message}`,
        );
        return;
      }
    }

    setQuickAddSaving(false);
    setQuickAddOpen(false);
    loadTree();
  }

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 90 });
    }
  }, [treeData, rootOverrideId, resetKey]);

  // The tree we're actually displaying — either the full tree, or (if "Set as tree root"
  // was used) just the subtree starting from the chosen person downward.
  const displayTreeData = useMemo(() => {
    if (!treeData) return null;
    if (!rootOverrideId) return treeData;
    return findNode(treeData, rootOverrideId) ?? treeData;
  }, [treeData, rootOverrideId]);

  const hasChildrenSet = useMemo(() => {
    const set = new Set<string>();
    function walk(node: RawNode) {
      if (node.children && node.children.length > 0) {
        set.add(node.attributes.id);
        node.children.forEach(walk);
      }
    }
    if (displayTreeData) walk(displayTreeData);
    return set;
  }, [displayTreeData]);

  const visibleTreeData = useMemo(() => {
    if (!displayTreeData) return null;
    return filterCollapsed(displayTreeData, collapsedIds);
  }, [displayTreeData, collapsedIds]);

  const selectedPerson = persons.find((p) => p.id === selectedId) ?? null;

  const ancestorChain = selectedPerson
    ? getAncestorChain(selectedPerson.id)
    : [];

  const compareResult =
    compareAId && compareBId
      ? getRelationshipResult(compareAId, compareBId)
      : null;

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return persons
      .filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 8);
  }, [search, persons]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("persons")
      .delete()
      .eq("id", pendingDelete.id);
    setDeleting(false);

    if (error) {
      alert(`Could not delete: ${error.message}`);
      return;
    }

    setSelectedId(null);
    setPendingDelete(null);
    loadTree();
  }

  function handleExport() {
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
    a.download = "shajara-nama-family-tree.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleMerge() {
    if (!keepId || !dupId || keepId === dupId) return;
    setMerging(true);

    await supabase
      .from("relationships")
      .update({ person_id: keepId })
      .eq("person_id", dupId);
    await supabase
      .from("relationships")
      .update({ related_person_id: keepId })
      .eq("related_person_id", dupId);
    await supabase
      .from("photos")
      .update({ person_id: keepId })
      .eq("person_id", dupId);
    await supabase
      .from("documents")
      .update({ owner_person_id: keepId })
      .eq("owner_person_id", dupId);
    await supabase
      .from("events")
      .update({ person_id: keepId })
      .eq("person_id", dupId);
    const { error } = await supabase.from("persons").delete().eq("id", dupId);

    setMerging(false);

    if (error) {
      alert(`Merge failed: ${error.message}`);
      return;
    }

    setMergeOpen(false);
    setKeepId("");
    setDupId("");
    loadTree();
  }

  function renderNode({ nodeDatum, toggleNode }: any) {
    const isVirtual = nodeDatum.attributes?.virtual === "true";
    if (isVirtual) return <g />;

    const id = nodeDatum.attributes?.id;
    const years = nodeDatum.attributes?.years;
    const avatarPath = nodeDatum.attributes?.avatarPath;
    const hasChildren = hasChildrenSet.has(id);
    const isCollapsed = collapsedIds.has(id);
    const isSelected = id === selectedId;
    const isHighlighted = highlightedIds.has(id);
    const isOnPath = relationshipPathIds.has(id);

    const avatarUrl = avatarPath
      ? supabase.storage.from("photos").getPublicUrl(avatarPath).data.publicUrl
      : null;

    let background = "white";
    if (isOnPath) background = "rgba(122,46,46,0.14)";
    else if (isHighlighted) background = "rgba(31,157,99,0.12)";

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
            onMouseEnter={(e) =>
              setHovered({
                name: nodeDatum.name,
                years,
                birthPlace: nodeDatum.attributes?.birthPlace,
                x: e.clientX,
                y: e.clientY,
              })
            }
            onMouseMove={(e) =>
              setHovered((prev) =>
                prev ? { ...prev, x: e.clientX, y: e.clientY } : prev,
              )
            }
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelectedId(id)}
            onContextMenu={(e) => openContextMenu(e, id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "16px",
              background,
              border: isSelected
                ? "2px solid var(--color-emerald)"
                : isOnPath
                  ? "2px solid var(--color-maroon)"
                  : "1px solid rgba(15,31,61,0.12)",
              boxShadow: isSelected ? "0 4px 12px rgba(27,75,58,0.15)" : "none",
              width: "134px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "rgba(27,75,58,0.08)",
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
                color: "var(--color-ink)",
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

        {hasChildren && (
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(id);
            }}
          >
            <circle
              r={7}
              cy={50}
              fill={isCollapsed ? "var(--color-navy)" : "var(--color-emerald)"}
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={53}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="white"
              style={{ pointerEvents: "none" }}
            >
              {isCollapsed ? "+" : "−"}
            </text>
          </g>
        )}
      </g>
    );
  }

  return (
    <div className="space-y-6">
      {expandedOpen ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
                Full Tree Chart
              </h2>
              <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1">
                {rootOverrideId
                  ? `Viewing from ${persons.find((p) => p.id === rootOverrideId)?.full_name} downward`
                  : "The complete family tree"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPng}
                disabled={exportingPng}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-4 py-2.5 rounded-full hover:bg-[var(--color-gold)]/20 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faImage} className="text-xs" />
                {exportingPng ? "Generating..." : "Download PNG"}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-4 py-2.5 rounded-full hover:bg-[var(--color-emerald)]/20 transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPrint} className="text-xs" />
                Print / Save as PDF
              </button>
              <button
                onClick={() => setExpandedOpen(false)}
                className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white font-body text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
                Close
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 no-print">
            <span className="inline-flex items-center gap-2 font-body text-xs text-[var(--color-ink)]/60">
              <span
                className="w-3 h-3 rounded-full"
                style={{ border: "2px solid var(--color-navy)" }}
              />
              Male
            </span>
            <span className="inline-flex items-center gap-2 font-body text-xs text-[var(--color-ink)]/60">
              <span
                className="w-3 h-3 rounded-full"
                style={{ border: "2px solid #B5487A" }}
              />
              Female
            </span>
            <span className="inline-flex items-center gap-2 font-body text-xs text-[var(--color-ink)]/60">
              <span className="w-3 h-3 rounded-full border border-[var(--color-navy)]/20" />
              Unspecified
            </span>
          </div>

          <div
            ref={expandedRef}
            className="bg-white border border-[var(--color-navy)]/8 rounded-2xl p-6 md:p-10 print:border-none print:bg-transparent overflow-x-auto"
          >
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
                Shajara Nama
              </h3>
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
              {displayTreeData && (
                <StaticChartNode node={displayTreeData} isRoot />
              )}
            </div>
          </div>
        </>
      ) : rosterOpen && rosterRootId ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
                Branch Roster
              </h2>
              <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1">
                {persons.find((p) => p.id === rosterRootId)?.full_name} and all
                descendants
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportRosterCsv}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-navy)] bg-[var(--color-navy)]/5 px-4 py-2.5 rounded-full hover:bg-[var(--color-navy)]/10 transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-4 py-2.5 rounded-full hover:bg-[var(--color-emerald)]/20 transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPrint} className="text-xs" />
                Print / Save as PDF
              </button>
              <button
                onClick={() => setRosterOpen(false)}
                className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white font-body text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
                Close
              </button>
            </div>
          </div>

          <div className="bg-white border border-[var(--color-navy)]/8 rounded-2xl p-6 md:p-8 print:border-none print:bg-transparent">
            <h3 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-1">
              {persons.find((p) => p.id === rosterRootId)?.full_name}'s Family
              Roster
            </h3>
            <p className="font-body text-xs text-[var(--color-ink)]/50 mb-6">
              Generated{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {getRosterGenerations().map(({ gen, people }) => (
              <div key={gen} className="mb-6">
                <h4 className="font-body text-xs uppercase tracking-wide text-[var(--color-gold)] font-semibold mb-2">
                  {gen === 0 ? "Root" : `Generation ${gen}`} ({people.length})
                </h4>
                <ul className="space-y-1">
                  {people.map((p) => (
                    <li
                      key={p.id}
                      className="font-body text-sm text-[var(--color-ink)]/85 flex justify-between border-b border-[var(--color-navy)]/5 py-1.5"
                    >
                      <span>{p.full_name}</span>
                      <span className="text-[var(--color-ink)]/50 text-xs">
                        {formatYears(p)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
                Family Tree Manager
              </h2>
              <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
                Scroll or pinch to zoom, drag to pan. Click a person to select,
                right-click for quick actions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMergeOpen(true)}
                className="w-10 cursor-pointer h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                aria-label="Merge duplicates"
                title="Merge duplicate people"
              >
                <FontAwesomeIcon icon={faObjectUngroup} className="text-sm" />
              </button>
              <button
                onClick={() => setCompareOpen(true)}
                className="w-10 cursor-pointer h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                aria-label="Compare relationship"
                title="Compare relationship between two people"
              >
                <FontAwesomeIcon icon={faArrowsLeftRight} className="text-sm" />
              </button>
              <button
                onClick={() => setResetKey((k) => k + 1)}
                className="w-10 cursor-pointer h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                aria-label="Fit to screen"
                title="Reset zoom and center"
              >
                <FontAwesomeIcon icon={faExpand} className="text-sm" />
              </button>
              <button
                onClick={() => setExpandedOpen(true)}
                className="w-10 cursor-pointer h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                aria-label="Full tree chart"
                title="Open full printable tree chart"
              >
                <FontAwesomeIcon
                  icon={faUpRightAndDownLeftFromCenter}
                  className="text-sm"
                />
              </button>
              <button
                onClick={() => setCollapsedIds(new Set())}
                className="w-10 cursor-pointer h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                aria-label="Expand all"
                title="Expand all branches"
              >
                <FontAwesomeIcon icon={faPlus} className="text-sm" />
              </button>
              <button
                onClick={() => setCollapsedIds(new Set(hasChildrenSet))}
                className="w-10 cursor-pointer h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5"
                aria-label="Collapse all"
                title="Collapse all branches"
              >
                <FontAwesomeIcon icon={faMinus} className="text-sm" />
              </button>
              <button
                onClick={handleExport}
                className="inline-flex cursor-pointer items-center gap-2 bg-[var(--color-navy)] text-white font-body text-sm font-medium px-4 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
                Export CSV
              </button>
            </div>
          </div>

          {rootOverrideId && (
            <div className="flex items-center justify-between gap-4 bg-[var(--color-emerald)]/5 border border-[var(--color-emerald)]/20 rounded-xl px-4 py-3">
              <span className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-emerald)]">
                <FontAwesomeIcon icon={faSitemap} className="text-xs" />
                Viewing tree from{" "}
                {persons.find((p) => p.id === rootOverrideId)?.full_name}{" "}
                downward
              </span>
              <button
                onClick={clearRootOverride}
                className="font-body text-xs font-medium text-[var(--color-emerald)] hover:underline"
              >
                Show Full Tree
              </button>
            </div>
          )}

          {relationshipPathIds.size > 0 && (
            <div className="flex items-center justify-between gap-4 bg-[var(--color-maroon)]/5 border border-[var(--color-maroon)]/20 rounded-xl px-4 py-3">
              <span className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-maroon)]">
                <FontAwesomeIcon icon={faRoute} className="text-xs" />
                Showing a relationship path in the tree below
              </span>
              <button
                onClick={clearRelationshipPath}
                className="font-body text-xs font-medium text-[var(--color-maroon)] hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          <div className="relative max-w-md">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/35 text-sm"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a person..."
              className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--color-navy)]/10 rounded-xl shadow-lg z-10 overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectAndReveal(p.id);
                      setSearch("");
                    }}
                    className="w-full text-left font-body text-sm text-[var(--color-ink)]/85 px-4 py-2.5 hover:bg-[var(--color-emerald)]/5"
                  >
                    {p.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Loading tree...
            </p>
          ) : persons.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              No family members yet — add your first person to see the tree
              here.
            </p>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div
                ref={containerRef}
                className="lg:col-span-2 bg-white border border-[var(--color-navy)]/8 rounded-2xl overflow-hidden"
                style={{ height: "600px" }}
              >
                {visibleTreeData && (
                  <Tree
                    key={resetKey}
                    data={visibleTreeData}
                    translate={translate}
                    orientation="vertical"
                    pathFunc="step"
                    collapsible={false}
                    zoomable
                    draggable
                    scaleExtent={{ min: 0.2, max: 2 }}
                    nodeSize={{ x: 160, y: 130 }}
                    separation={{ siblings: 1, nonSiblings: 1.3 }}
                    renderCustomNodeElement={renderNode}
                  />
                )}
              </div>

              <div className="bg-white border border-[var(--color-navy)]/8 rounded-2xl p-5 md:p-6 h-fit">
                <h3 className="font-display text-lg font-semibold text-[var(--color-ink)] mb-4">
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
                                .getPublicUrl(selectedPerson.avatar_path).data
                                .publicUrl
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
                        <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                          {selectedPerson.full_name}
                        </p>
                        <p className="font-body text-xs text-[var(--color-ink)]/50">
                          {formatYears(selectedPerson) || "No dates set"}
                        </p>
                        {ancestorChain.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {ancestorChain.map((ancestor) => (
                              <span
                                key={ancestor.id}
                                className="flex items-center gap-1.5"
                              >
                                <button
                                  onClick={() => selectAndReveal(ancestor.id)}
                                  className="font-body text-xs text-[var(--color-ink)]/50 hover:text-[var(--color-emerald)] hover:underline transition-colors"
                                >
                                  {ancestor.full_name}
                                </button>
                                <span className="text-[var(--color-ink)]/25 text-xs">
                                  →
                                </span>
                              </span>
                            ))}
                            <span className="font-body text-xs text-[var(--color-emerald)] font-medium">
                              {selectedPerson.full_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => toggleHighlight(selectedPerson.id)}
                        className={`inline-flex items-center justify-center gap-1.5 font-body text-xs rounded-lg py-2.5 transition-colors ${
                          highlightRootId === selectedPerson.id
                            ? "text-white bg-[var(--color-emerald)] hover:opacity-90"
                            : "text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 hover:bg-[var(--color-emerald)]/20"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faPalette}
                          className="text-[10px]"
                        />
                        {highlightRootId === selectedPerson.id
                          ? "Remove Highlight"
                          : "Highlight This Branch"}
                      </button>
                      <button
                        onClick={() => openRoster(selectedPerson.id)}
                        className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-navy)] bg-[var(--color-navy)]/5 rounded-lg py-2.5 hover:bg-[var(--color-navy)]/10"
                      >
                        <FontAwesomeIcon
                          icon={faPrint}
                          className="text-[10px]"
                        />
                        Export / Print Branch
                      </button>
                      <Link
                        href={`/admin/members/${selectedPerson.id}/view`}
                        className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded-lg py-2.5 hover:bg-[var(--color-emerald)]/20"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-[10px]" />{" "}
                        View Full Profile
                      </Link>
                      <Link
                        href={`/admin/members/${selectedPerson.id}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-navy)] bg-[var(--color-navy)]/5 rounded-lg py-2.5 hover:bg-[var(--color-navy)]/10"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />{" "}
                        Edit Profile
                      </Link>
                      <Link
                        href={`/admin/members/new?fatherId=${selectedPerson.id}`}
                        className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-gold)] bg-[var(--color-gold)]/10 rounded-lg py-2.5 hover:bg-[var(--color-gold)]/20"
                      >
                        <FontAwesomeIcon
                          icon={faUserPlus}
                          className="text-[10px]"
                        />{" "}
                        Add Child
                      </Link>
                      <button
                        onClick={() => setPendingDelete(selectedPerson)}
                        className="inline-flex items-center justify-center gap-1.5 font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg py-2.5 hover:bg-[var(--color-maroon)]/20"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="text-[10px]"
                        />{" "}
                        Delete Person
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-sm text-[var(--color-ink)]/50">
                    Click on a person in the tree (or search above) to see
                    actions here.
                  </p>
                )}
              </div>
            </div>
          )}

          {mergeOpen && (
            <div
              className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
              onClick={() => setMergeOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                    Merge Duplicate People
                  </h3>
                  <button
                    onClick={() => setMergeOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                    aria-label="Close"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                </div>
                <p className="font-body text-xs text-[var(--color-ink)]/60 mb-5">
                  Choose the profile to keep, and the duplicate to remove. All
                  relationships, photos, and documents from the duplicate
                  transfer to the kept profile.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Keep this profile
                    </label>
                    <select
                      value={keepId}
                      onChange={(e) => setKeepId(e.target.value)}
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                    >
                      <option value="">Select...</option>
                      {persons.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Remove this duplicate
                    </label>
                    <select
                      value={dupId}
                      onChange={(e) => setDupId(e.target.value)}
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                    >
                      <option value="">Select...</option>
                      {persons
                        .filter((p) => p.id !== keepId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMergeOpen(false)}
                      className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMerge}
                      disabled={!keepId || !dupId || merging}
                      className="flex-1 bg-[var(--color-maroon)] text-white font-body text-sm font-medium py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {merging ? "Merging..." : "Merge & Delete Duplicate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {compareOpen && (
            <div
              className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
              onClick={() => setCompareOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                    Compare Relationship
                  </h3>
                  <button
                    onClick={() => setCompareOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                    aria-label="Close"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                </div>
                <p className="font-body text-xs text-[var(--color-ink)]/60 mb-5">
                  Select two people to see how they're related and compare their
                  ages.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Person A
                    </label>
                    <select
                      value={compareAId}
                      onChange={(e) => setCompareAId(e.target.value)}
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                    >
                      <option value="">Select...</option>
                      {persons.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Person B
                    </label>
                    <select
                      value={compareBId}
                      onChange={(e) => setCompareBId(e.target.value)}
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                    >
                      <option value="">Select...</option>
                      {persons
                        .filter((p) => p.id !== compareAId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {compareAId && compareBId && (
                    <div className="bg-[var(--color-navy)]/5 rounded-xl p-4 space-y-2">
                      <p className="font-body text-sm text-[var(--color-ink)] font-medium">
                        {buildRelationshipSentence(compareAId, compareBId)}
                      </p>
                      <p className="font-body text-xs text-[var(--color-ink)]/60">
                        {getAgeCompareText(compareAId, compareBId)}
                      </p>
                    </div>
                  )}

                  {compareResult?.kind === "found" && (
                    <button
                      onClick={showRelationshipPathInTree}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-maroon)] text-white font-body text-sm font-medium py-2.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <FontAwesomeIcon icon={faRoute} className="text-xs" />
                      Show This Path in the Tree
                    </button>
                  )}

                  <button
                    onClick={() => setCompareOpen(false)}
                    className="w-full font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right-click quick-action menu */}
          {contextMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={closeContextMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeContextMenu();
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bg-white rounded-2xl shadow-xl border border-[var(--color-navy)]/10 py-2 w-60"
                style={{
                  left: Math.min(
                    contextMenu.x,
                    (typeof window !== "undefined" ? window.innerWidth : 800) -
                      250,
                  ),
                  top: Math.min(
                    contextMenu.y,
                    (typeof window !== "undefined" ? window.innerHeight : 600) -
                      420,
                  ),
                }}
              >
                <div className="px-4 py-2.5 border-b border-[var(--color-navy)]/8">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink)]/40">
                    Person
                  </p>
                  <p className="font-body text-sm font-semibold text-[var(--color-ink)] truncate">
                    {
                      persons.find((p) => p.id === contextMenu.personId)
                        ?.full_name
                    }
                  </p>
                </div>
                <div className="py-1">
                  <MenuItem
                    icon={faPen}
                    label="Edit person"
                    onClick={() =>
                      router.push(`/admin/members/${contextMenu.personId}/edit`)
                    }
                  />
                  <MenuItem
                    icon={faEye}
                    label="Focus & center"
                    onClick={() => handleFocusCenter(contextMenu.personId)}
                  />
                  <MenuItem
                    icon={faCrosshairs}
                    label="Set as tree root"
                    onClick={() => handleSetAsRoot(contextMenu.personId)}
                  />
                  <MenuItem
                    icon={faHeart}
                    label="Add spouse / partner"
                    onClick={() => openQuickAdd("spouse", contextMenu.personId)}
                  />
                  <MenuItem
                    icon={faChild}
                    label="Add child"
                    onClick={() => openQuickAdd("child", contextMenu.personId)}
                  />
                  <MenuItem
                    icon={faUserPlus}
                    label="Add parent"
                    onClick={() => openQuickAdd("parent", contextMenu.personId)}
                  />
                  <MenuItem
                    icon={faUsers}
                    label="Add sibling"
                    onClick={() =>
                      openQuickAdd("sibling", contextMenu.personId)
                    }
                  />
                </div>
                <div className="border-t border-[var(--color-navy)]/8 mt-1 pt-1">
                  <MenuItem
                    icon={faTrash}
                    label="Delete person"
                    danger
                    onClick={() => {
                      const p = persons.find(
                        (pp) => pp.id === contextMenu.personId,
                      );
                      if (p) setPendingDelete(p);
                      closeContextMenu();
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick-add relative modal */}
          {quickAddOpen && (
            <div
              className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
              onClick={() => setQuickAddOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                    Add{" "}
                    {quickAddType === "child"
                      ? "Child"
                      : quickAddType === "parent"
                        ? "Parent"
                        : quickAddType === "sibling"
                          ? "Sibling"
                          : "Spouse"}{" "}
                    of{" "}
                    {persons.find((p) => p.id === quickAddTargetId)?.full_name}
                  </h3>
                  <button
                    onClick={() => setQuickAddOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                    aria-label="Close"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                </div>

                {quickAddError && (
                  <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2 mb-4">
                    {quickAddError}
                  </div>
                )}

                <form onSubmit={submitQuickAdd} className="space-y-4">
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Full Name *
                    </label>
                    <input
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      placeholder="Full name"
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Gender{" "}
                      {quickAddType === "parent" && (
                        <span className="text-[var(--color-ink)]/40">
                          (determines Father/Mother)
                        </span>
                      )}
                    </label>
                    <select
                      value={quickAddGender}
                      onChange={(e) => setQuickAddGender(e.target.value)}
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={quickAddBirthDate}
                      onChange={(e) => setQuickAddBirthDate(e.target.value)}
                      className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/12 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-emerald)]/50 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setQuickAddOpen(false)}
                      className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickAddSaving}
                      className="flex-1 bg-[var(--color-navy)] text-white font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
                    >
                      {quickAddSaving ? "Saving..." : "Add & Link"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <DeleteConfirmModal
            open={!!pendingDelete}
            title="Delete this person?"
            message={
              pendingDelete
                ? `"${pendingDelete.full_name}" and all their relationships will be permanently removed. This cannot be undone.`
                : ""
            }
            deleting={deleting}
            onCancel={() => setPendingDelete(null)}
            onConfirm={confirmDelete}
          />

          {hovered && (
            <div
              className="fixed z-50 pointer-events-none bg-[var(--color-navy)] text-white rounded-xl px-3 py-2 shadow-lg"
              style={{
                left: hovered.x + 14,
                top: hovered.y + 14,
                maxWidth: "180px",
              }}
            >
              <p className="font-body text-xs font-medium">{hovered.name}</p>
              {hovered.years && (
                <p className="font-body text-[10px] text-white/70">
                  {hovered.years}
                </p>
              )}
              {hovered.birthPlace && (
                <p className="font-body text-[10px] text-white/70">
                  Born in {hovered.birthPlace}
                </p>
              )}
              <p className="font-body text-[10px] text-[var(--color-gold)] mt-1">
                Click to select →
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
