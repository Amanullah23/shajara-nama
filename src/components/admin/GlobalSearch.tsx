"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faXmark,
  faGauge,
  faUsers,
  faUserPlus,
  faSitemap,
  faFolderTree,
  faImages,
  faCalendarDays,
  faNewspaper,
  faClipboardList,
  faUserShield,
  faGear,
  faFileExcel,
  faFileExport,
  faBook,
  faUser,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type NavResult = { kind: "nav"; label: string; href: string; icon: any };
type PersonResult = {
  kind: "person";
  id: string;
  name: string;
  avatarPath: string | null;
};
type Result = NavResult | PersonResult;

const NAV_ITEMS: { label: string; href: string; icon: any }[] = [
  { label: "Dashboard", href: "/admin", icon: faGauge },
  { label: "Members", href: "/admin/members", icon: faUsers },
  { label: "Add Person", href: "/admin/members/new", icon: faUserPlus },
  { label: "Family Tree", href: "/admin/tree", icon: faSitemap },
  { label: "Branches", href: "/admin/branches", icon: faFolderTree },
  { label: "Bulk Import", href: "/admin/import", icon: faFileExcel },
  { label: "GEDCOM", href: "/admin/gedcom", icon: faFileExport },
  { label: "Gallery & Docs", href: "/admin/media", icon: faImages },
  { label: "Events", href: "/admin/events", icon: faCalendarDays },
  { label: "Blog", href: "/admin/blog", icon: faNewspaper },
  { label: "Approvals", href: "/admin/approvals", icon: faClipboardList },
  { label: "Users & Roles", href: "/admin/users", icon: faUserShield },
  { label: "Settings", href: "/admin/settings", icon: faGear },
  { label: "User Guide", href: "/admin/guide", icon: faBook },
  { label: "My Profile", href: "/admin/profile", icon: faUser },
];

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K shortcut to open, Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setPersonResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search real people whenever the query changes (only once there's something to search)
  useEffect(() => {
    if (!query.trim()) {
      setPersonResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("persons")
        .select("id, full_name, avatar_path")
        .ilike("full_name", `%${query.trim()}%`)
        .limit(6);

      setPersonResults(
        (data ?? []).map((p) => ({
          kind: "person",
          id: p.id,
          name: p.full_name,
          avatarPath: p.avatar_path,
        })),
      );
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const navResults: NavResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q)).map(
      (item) => ({ kind: "nav", ...item }),
    );
  }, [query]);

  const allResults: Result[] = [...navResults, ...personResults];

  function goTo(result: Result) {
    setOpen(false);
    if (result.kind === "nav") router.push(result.href);
    else router.push(`/admin/members/${result.id}/view`);
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[activeIndex]) {
      e.preventDefault();
      goTo(allResults[activeIndex]);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2.5 font-body text-sm text-[var(--color-ink)]/45 bg-[var(--color-navy)]/5 hover:bg-[var(--color-navy)]/8 border border-[var(--color-navy)]/10 rounded-full pl-4 pr-3 py-2 transition-colors"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
        Search...
        <span className="font-body text-[10px] text-[var(--color-ink)]/35 bg-white border border-[var(--color-navy)]/10 rounded px-1.5 py-0.5">
          &#8984;K
        </span>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden w-9 h-9 rounded-full bg-[var(--color-navy)]/5 flex items-center justify-center text-[var(--color-ink)]/50"
        aria-label="Search"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-[var(--color-ink)]/40 flex items-start justify-center pt-20 md:pt-28 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-[var(--color-navy)]/8">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="text-[var(--color-ink)]/35 text-sm shrink-0"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search for persons, trees, or pages..."
                className="flex-1 py-4 font-body text-sm text-[var(--color-ink)] focus:outline-none placeholder:text-[var(--color-ink)]/35"
              />
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--color-ink)]/35 hover:text-[var(--color-ink)]/60 shrink-0"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto py-2">
              {!query.trim() ? (
                <p className="font-body text-sm text-[var(--color-ink)]/40 text-center py-10">
                  Start typing to search pages and people.
                </p>
              ) : allResults.length === 0 ? (
                <p className="font-body text-sm text-[var(--color-ink)]/40 text-center py-10">
                  No results found.
                </p>
              ) : (
                <>
                  {navResults.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink)]/35 px-2.5 py-1.5">
                        Navigation
                      </p>
                      {navResults.map((item, i) => (
                        <button
                          key={item.href}
                          onClick={() => goTo(item)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl font-body text-sm transition-colors ${
                            activeIndex === i
                              ? "bg-[var(--color-emerald)]/10 text-[var(--color-navy)]"
                              : "text-[var(--color-ink)]/75 hover:bg-[var(--color-navy)]/5"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className="text-[var(--color-emerald)] text-xs w-4"
                          />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {personResults.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink)]/35 px-2.5 py-1.5">
                        People
                      </p>
                      {personResults.map((person, i) => {
                        const globalIndex = navResults.length + i;
                        const avatarUrl = person.avatarPath
                          ? supabase.storage
                              .from("photos")
                              .getPublicUrl(person.avatarPath).data.publicUrl
                          : null;
                        return (
                          <button
                            key={person.id}
                            onClick={() => goTo(person)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl font-body text-sm transition-colors ${
                              activeIndex === globalIndex
                                ? "bg-[var(--color-emerald)]/10 text-[var(--color-navy)]"
                                : "text-[var(--color-ink)]/75 hover:bg-[var(--color-navy)]/5"
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center shrink-0">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={faUser}
                                  className="text-[9px] text-[var(--color-navy)]/40"
                                />
                              )}
                            </div>
                            {person.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--color-navy)]/8 bg-[var(--color-navy)]/[0.02]">
              <span className="font-body text-[10px] text-[var(--color-ink)]/40 flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faLocationArrow}
                  className="text-[8px] rotate-90"
                />{" "}
                Navigate
              </span>
              <span className="font-body text-[10px] text-[var(--color-ink)]/40">
                &crarr; Select
              </span>
              <span className="font-body text-[10px] text-[var(--color-ink)]/40">
                Esc Close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
