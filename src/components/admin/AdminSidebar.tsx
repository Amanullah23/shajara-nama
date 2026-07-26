"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTree,
  faGauge,
  faUsers,
  faUserPlus,
  faSitemap,
  faFolderTree,
  faImages,
  faCalendarDays,
  faUserShield,
  faGear,
  faBars,
  faXmark,
  faNewspaper,
  faAnglesLeft,
  faAnglesRight,
  faBook,
  faClipboardList,
  faFileExcel,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: any;
  superAdminOnly?: boolean;
  reviewerOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
};

// Top-level items — always visible on their own, not tucked into a group
const TOP_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: faGauge },
];

// Grouped items — organized by theme, collapsible to save space
const NAV_GROUPS: NavGroup[] = [
  {
    id: "family",
    label: "Family",
    icon: faUsers,
    items: [
      { label: "Members", href: "/admin/members", icon: faUsers },
      { label: "Add Person", href: "/admin/members/new", icon: faUserPlus },
      { label: "Family Tree", href: "/admin/tree", icon: faSitemap },
      { label: "Branches", href: "/admin/branches", icon: faFolderTree },
      {
        label: "Bulk Import",
        href: "/admin/import",
        icon: faFileExcel,
        superAdminOnly: true,
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: faImages,
    items: [
      { label: "Gallery & Docs", href: "/admin/media", icon: faImages },
      { label: "Events", href: "/admin/events", icon: faCalendarDays },
      { label: "Blog", href: "/admin/blog", icon: faNewspaper },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: faUserShield,
    items: [
      {
        label: "Approvals",
        href: "/admin/approvals",
        icon: faClipboardList,
        reviewerOnly: true,
      },
      {
        label: "Users & Roles",
        href: "/admin/users",
        icon: faUserShield,
        superAdminOnly: true,
      },
      { label: "Settings", href: "/admin/settings", icon: faGear },
    ],
  },
];

// Bottom-level items — help/reference, always visible
const BOTTOM_ITEMS: NavItem[] = [
  { label: "User Guide", href: "/admin/guide", icon: faBook },
];

function itemVisible(item: NavItem, myRole: string | null) {
  if (item.superAdminOnly && myRole !== "super_admin") return false;
  if (
    item.reviewerOnly &&
    myRole !== "super_admin" &&
    myRole !== "branch_admin"
  )
    return false;
  return true;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function checkRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();

      if (data?.role) setMyRole(data.role);
    }
    checkRole();

    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // Auto-expand whichever group contains the current page, so the active
  // link is never hidden inside a collapsed group on page load/navigation
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((g) =>
      g.items.some((item) => item.href === pathname),
    );
    if (activeGroup) {
      setOpenGroups((prev) => new Set(prev).add(activeGroup.id));
    }
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("adminSidebarCollapsed", String(next));
      return next;
    });
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => itemVisible(item, myRole)),
  })).filter((g) => g.items.length > 0);

  const NavLink = ({
    item,
    indent = false,
  }: {
    item: NavItem;
    indent?: boolean;
  }) => {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 py-2.5 rounded-xl font-body text-sm transition-colors duration-200 ${
          collapsed ? "justify-center px-0" : indent ? "pl-9 pr-4" : "px-4"
        } ${
          active
            ? "bg-[var(--color-gold)] text-[var(--color-navy)] font-medium"
            : "text-[var(--color-ivory)]/70 hover:bg-[var(--color-ivory)]/10 hover:text-[var(--color-ivory)]"
        }`}
      >
        <FontAwesomeIcon icon={item.icon} className="w-4 text-sm shrink-0" />
        {!collapsed && item.label}
      </Link>
    );
  };

  const NavList = () => (
    <ul className="space-y-1">
      {TOP_ITEMS.map((item) => (
        <li key={item.href}>
          <NavLink item={item} />
        </li>
      ))}

      {/* Collapsed mode: flatten groups into a plain icon list (no nesting/expand UI at that width) */}
      {collapsed
        ? visibleGroups
            .flatMap((g) => g.items)
            .map((item) => (
              <li key={item.href}>
                <NavLink item={item} />
              </li>
            ))
        : visibleGroups.map((group) => {
            const isOpen = openGroups.has(group.id);
            return (
              <li key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-body text-xs uppercase tracking-wide text-[var(--color-ivory)]/50 hover:text-[var(--color-ivory)]/80 hover:bg-[var(--color-ivory)]/5 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <FontAwesomeIcon
                      icon={group.icon}
                      className="w-3.5 text-xs"
                    />
                    {group.label}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-[10px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <ul className="mt-1 space-y-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <NavLink item={item} indent />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

      <li className="pt-2 mt-2 border-t border-[var(--color-ivory)]/10">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </li>
    </ul>
  );

  return (
    <>
      {/* Mobile topbar trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-[var(--color-navy)] text-[var(--color-ivory)] flex items-center justify-center shadow-lg"
        aria-label="Open admin menu"
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col shrink-0 bg-[var(--color-navy)] py-6 no-print transition-all duration-300 ${
          collapsed ? "w-20 px-2" : "w-64 px-4"
        }`}
      >
        <div
          className={`flex items-center mb-6 shrink-0 ${collapsed ? "flex-col gap-3 px-0" : "justify-between px-2"}`}
        >
          <div
            className={`flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}
          >
            <FontAwesomeIcon
              icon={faTree}
              className="text-xl text-[var(--color-gold)] shrink-0"
            />
            {!collapsed && (
              <span className="font-display text-lg font-semibold text-[var(--color-ivory)] whitespace-nowrap">
                Shajara Nama
              </span>
            )}
          </div>
          <button
            onClick={toggleCollapsed}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-ivory)]/60 hover:bg-[var(--color-ivory)]/10 hover:text-[var(--color-ivory)] transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FontAwesomeIcon
              icon={collapsed ? faAnglesRight : faAnglesLeft}
              className="text-sm"
            />
          </button>
        </div>

        {/* Scrollable nav area — custom minimal scrollbar, only visible on hover */}
        <div className="sidebar-scroll overflow-y-auto flex-1 pr-1">
          <NavList />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-[var(--color-navy)] px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faTree}
                  className="text-xl text-[var(--color-gold)]"
                />
                <span className="font-display text-lg font-semibold text-[var(--color-ivory)]">
                  Shajara Nama
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-[var(--color-ivory)] text-xl"
                aria-label="Close admin menu"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="sidebar-scroll overflow-y-auto flex-1 pr-1">
              <NavList />
            </div>
          </div>
          <div
            className="flex-1 bg-[var(--color-ink)]/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
