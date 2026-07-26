"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollReveal from "@/components/ScrollReveal";
import {
  faUser,
  faMagnifyingGlass,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

const Tree = dynamic(() => import("react-d3-tree"), { ssr: false });

type RawNode = {
  name: string;
  attributes: {
    id: string;
    years: string;
    avatarPath: string;
    birthPlace?: string;
    virtual?: string;
  };
  children?: RawNode[];
};

type FlatPerson = { id: string; name: string };

const SAMPLE_TREE: RawNode = {
  name: "Grandfather",
  attributes: { id: "sample-1", years: "", avatarPath: "" },
  children: [
    {
      name: "Son A",
      attributes: { id: "sample-2", years: "", avatarPath: "" },
      children: [
        {
          name: "Grandchild 1",
          attributes: { id: "sample-3", years: "", avatarPath: "" },
        },
        {
          name: "Grandchild 2",
          attributes: { id: "sample-4", years: "", avatarPath: "" },
        },
      ],
    },
    {
      name: "Son B",
      attributes: { id: "sample-5", years: "", avatarPath: "" },
      children: [
        {
          name: "Grandchild 3",
          attributes: { id: "sample-6", years: "", avatarPath: "" },
        },
      ],
    },
  ],
};

function formatYears(
  birthYear: number | null,
  isDeceased: boolean,
  deathYear: number | null,
) {
  if (!birthYear) return "";
  if (isDeceased && deathYear) return `${birthYear}–${deathYear}`;
  if (isDeceased) return `d. ${birthYear}`;
  return `b. ${birthYear}`;
}

function flattenPeople(node: RawNode, acc: FlatPerson[] = []) {
  if (node.attributes?.virtual !== "true") {
    acc.push({ id: node.attributes.id, name: node.name });
  }
  node.children?.forEach((c) => flattenPeople(c, acc));
  return acc;
}

export default function TreePreview() {
  const router = useRouter();

  const [treeData, setTreeData] = useState<RawNode | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treeDisabled, setTreeDisabled] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [hovered, setHovered] = useState<{
    name: string;
    years: string;
    birthPlace: string;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function buildTree() {
      const { data: settings } = await supabase
        .from("app_settings")
        .select("public_tree_visible")
        .eq("id", 1)
        .single();

      if (settings && settings.public_tree_visible === false) {
        setTreeDisabled(true);
        setLoading(false);
        return;
      }

      const [{ data: persons }, { data: relationships }] = await Promise.all([
        supabase.from("persons_public").select("*"),
        supabase
          .from("relationships")
          .select("person_id, related_person_id, relationship_type"),
      ]);

      if (!persons || persons.length === 0 || !relationships) {
        setTreeData(SAMPLE_TREE);
        setIsSample(true);
        setLoading(false);
        return;
      }

      const fatherRels = relationships.filter(
        (r) => r.relationship_type === "father",
      );
      const childrenByFather = new Map<string, string[]>();
      fatherRels.forEach((r) => {
        const list = childrenByFather.get(r.related_person_id) ?? [];
        list.push(r.person_id);
        childrenByFather.set(r.related_person_id, list);
      });

      const personMap = new Map(persons.map((p: any) => [p.id, p]));
      const childIds = new Set(fatherRels.map((r) => r.person_id));
      const rootIds = persons
        .filter((p: any) => !childIds.has(p.id))
        .map((p: any) => p.id);

      function buildNode(id: string): RawNode {
        const p: any = personMap.get(id);
        const kids = childrenByFather.get(id) ?? [];
        return {
          name: p?.full_name ?? "Unknown",
          attributes: {
            id,
            years: p
              ? formatYears(p.birth_year, p.is_deceased, p.death_year)
              : "",
            avatarPath: p?.avatar_path ?? "",
            birthPlace: p?.birth_place ?? "",
          },
          children: kids.map((cid) => buildNode(cid)),
        };
      }

      const roots = rootIds.map((id) => buildNode(id));

      if (roots.length === 0) {
        setTreeData(SAMPLE_TREE);
        setIsSample(true);
      } else if (roots.length === 1) {
        setTreeData(roots[0]);
        setIsSample(false);
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
        setIsSample(false);
      }

      setLoading(false);
    }

    buildTree();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 70 });
    }
  }, [treeData, resetKey]);

  const flatPeople = useMemo(
    () => (treeData ? flattenPeople(treeData) : []),
    [treeData],
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return flatPeople
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6);
  }, [search, flatPeople]);

  function renderNode({ nodeDatum, toggleNode }: any) {
    if (nodeDatum.attributes?.virtual === "true") return <g />;

    const id = nodeDatum.attributes?.id;
    const years = nodeDatum.attributes?.years;
    const avatarPath = nodeDatum.attributes?.avatarPath;
    const birthPlace = nodeDatum.attributes?.birthPlace;
    const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
    const isSelected = id === selectedId;
    const avatarUrl = avatarPath
      ? supabase.storage.from("photos").getPublicUrl(avatarPath).data.publicUrl
      : null;
    const isSampleNode = id.startsWith("sample-");

    return (
      <g>
        <foreignObject
          x={-70}
          y={-42}
          width={140}
          height={90}
          style={{ overflow: "visible" }}
        >
          <div
            onMouseEnter={(e) => {
              setHovered({
                name: nodeDatum.name,
                years,
                birthPlace,
                x: e.clientX,
                y: e.clientY,
              });
            }}
            onMouseMove={(e) => {
              setHovered((prev) =>
                prev ? { ...prev, x: e.clientX, y: e.clientY } : prev,
              );
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelectedId(id);
              if (!isSampleNode) router.push(`/person/${id}`);
            }}
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
              width: "124px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
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
                  style={{ fontSize: "11px", color: "var(--color-gold)" }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--color-navy)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {nodeDatum.name}
            </span>
            {years && (
              <span style={{ fontSize: "9px", color: "rgba(28,27,24,0.5)" }}>
                {years}
              </span>
            )}
          </div>
        </foreignObject>

        {hasChildren && (
          <circle
            r={5}
            cy={46}
            fill="var(--color-gold)"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              toggleNode();
            }}
          />
        )}
      </g>
    );
  }

  return (
    <section
      id="tree"
      className="py-20 md:py-28 px-4 md:px-8 bg-[var(--color-navy)]/[0.03]"
    >
      <ScrollReveal>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-body text-xs tracking-wide uppercase text-[var(--color-maroon)]">
              See It In Action
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-navy)] mt-3">
              Your family, mapped generation by generation
            </h2>
            <p className="font-body text-[var(--color-ink)]/70 mt-4">
              {isSample
                ? "A sample preview below — the real tree fills in as your family's names are added."
                : "The real family tree, built from names your family has added."}
            </p>
          </div>

          {!loading && !treeDisabled && treeData && (
            <div className="relative max-w-sm mx-auto mb-6">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a person..."
                className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--color-navy)]/10 rounded-xl shadow-lg z-10 overflow-hidden">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedId(p.id);
                        setSearch("");
                      }}
                      className="w-full text-left font-body text-sm text-[var(--color-ink)]/85 px-4 py-2.5 hover:bg-[var(--color-navy)]/5"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            ref={containerRef}
            className="bg-white/70 border border-[var(--color-navy)]/10 rounded-3xl overflow-hidden relative"
            style={{ height: "500px" }}
          >
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="font-body text-sm text-[var(--color-ink)]/50">
                  Loading tree...
                </p>
              </div>
            ) : treeDisabled ? (
              <div className="w-full h-full flex items-center justify-center p-6">
                <p className="font-body text-sm text-[var(--color-ink)]/50 text-center max-w-sm">
                  The family tree preview is currently private. Family members
                  can view it after logging in.
                </p>
              </div>
            ) : (
              <>
                {treeData && (
                  <Tree
                    key={resetKey}
                    data={treeData}
                    translate={translate}
                    orientation="vertical"
                    pathFunc="step"
                    collapsible
                    zoomable
                    draggable
                    scaleExtent={{ min: 0.3, max: 2 }}
                    nodeSize={{ x: 150, y: 110 }}
                    separation={{ siblings: 1, nonSiblings: 1.3 }}
                    renderCustomNodeElement={renderNode}
                  />
                )}
                <button
                  onClick={() => setResetKey((k) => k + 1)}
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white border border-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 shadow-sm"
                  aria-label="Reset zoom"
                  title="Fit to screen"
                >
                  <FontAwesomeIcon icon={faExpand} className="text-sm" />
                </button>
              </>
            )}
          </div>

          <p className="text-center font-body text-xs text-[var(--color-ink)]/50 mt-4">
            Scroll or pinch to zoom, drag to pan, click the gold dot to expand
            or collapse a branch.
          </p>
        </div>
      </ScrollReveal>

      {hovered && (
        <div
          className="fixed z-50 pointer-events-none bg-[var(--color-navy)] text-[var(--color-ivory)] rounded-xl px-3 py-2 shadow-lg"
          style={{
            left: hovered.x + 14,
            top: hovered.y + 14,
            maxWidth: "180px",
          }}
        >
          <p className="font-body text-xs font-medium">{hovered.name}</p>
          {hovered.years && (
            <p className="font-body text-[10px] text-[var(--color-ivory)]/70">
              {hovered.years}
            </p>
          )}
          {hovered.birthPlace && (
            <p className="font-body text-[10px] text-[var(--color-ivory)]/70">
              Born in {hovered.birthPlace}
            </p>
          )}
          <p className="font-body text-[10px] text-[var(--color-gold)] mt-1">
            Click for full profile →
          </p>
        </div>
      )}
    </section>
  );
}
