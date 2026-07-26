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
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: any;
  superAdminOnly?: boolean;
  reviewerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: faGauge },
  { label: "Members", href: "/admin/members", icon: faUsers },
  { label: "Add Person", href: "/admin/members/new", icon: faUserPlus },
  { label: "Family Tree", href: "/admin/tree", icon: faSitemap },
  { label: "Branches", href: "/admin/branches", icon: faFolderTree },
  { label: "Gallery & Docs", href: "/admin/media", icon: faImages },
  { label: "Events", href: "/admin/events", icon: faCalendarDays },
  {
    label: "Approvals",
    href: "/admin/approvals",
    icon: faClipboardList,
    reviewerOnly: true,
  },
  { label: "Blog", href: "/admin/blog", icon: faNewspaper },
  { label: "User Guide", href: "/admin/guide", icon: faBook },
  {
    label: "Users & Roles",
    href: "/admin/users",
    icon: faUserShield,
    superAdminOnly: true,
  },
  { label: "Settings", href: "/admin/settings", icon: faGear },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

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

    // Restore the user's last collapse preference
    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("adminSidebarCollapsed", String(next));
      return next;
    });
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.superAdminOnly || myRole === "super_admin") &&
      (!item.reviewerOnly ||
        myRole === "super_admin" ||
        myRole === "branch_admin"),
  );

  const NavList = () => (
    <ul className="space-y-1">
      {visibleItems.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-body text-sm transition-colors duration-200 ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-[var(--color-gold)] text-[var(--color-navy)] font-medium"
                  : "text-[var(--color-ivory)]/70 hover:bg-[var(--color-ivory)]/10 hover:text-[var(--color-ivory)]"
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="w-4 text-sm shrink-0"
              />
              {!collapsed && item.label}
            </Link>
          </li>
        );
      })}
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

      {/* Desktop sidebar — width toggles between full (16rem) and slim icon rail (5rem) */}
      <aside
        className={`hidden md:flex md:flex-col shrink-0 bg-[var(--color-navy)] py-6 no-print transition-all duration-300 ${
          collapsed ? "w-20 px-2" : "w-64 px-4"
        }`}
      >
        <div
          className={`flex items-center mb-8 ${collapsed ? "flex-col gap-3 px-0" : "justify-between px-2"}`}
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
        <NavList />
      </aside>

      {/* Mobile drawer — unaffected by desktop collapse state */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-[var(--color-navy)] px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-8">
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
            <NavList />
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
