"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTree,
  faUser,
  faArrowRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

const LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Family Tree", href: "/#tree" },
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Blog", href: "/blog" },
];

export default function MemberNavbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-ivory)]/95 backdrop-blur-sm border-b border-[var(--color-navy)]/10">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faTree}
            className="text-xl text-[var(--color-gold)]"
          />
          <span className="font-display text-lg font-semibold text-[var(--color-navy)]">
            Shajara Nama
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-body text-sm text-[var(--color-ink)]/75 hover:text-[var(--color-navy)] transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="w-9 h-9 rounded-full bg-[var(--color-gold)] flex items-center justify-center"
            aria-label="My Profile"
          >
            <FontAwesomeIcon
              icon={faUser}
              className="text-[var(--color-navy)] text-xs"
            />
          </Link>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-[var(--color-maroon)]/10 flex items-center justify-center hover:bg-[var(--color-maroon)]/20 transition-colors"
            aria-label="Log out"
          >
            <FontAwesomeIcon
              icon={faArrowRightFromBracket}
              className="text-[var(--color-maroon)] text-xs"
            />
          </button>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="md:hidden text-[var(--color-navy)] text-xl"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </nav>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-[var(--color-ink)]/50"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] w-72 h-full ml-auto p-6 flex flex-col gap-1"
          >
            <button
              onClick={() => setOpen(false)}
              className="self-end text-[var(--color-navy)] text-xl mb-4"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-body text-sm text-[var(--color-ink)]/80 py-3 border-b border-[var(--color-navy)]/5"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="font-body text-sm text-[var(--color-ink)]/80 py-3 border-b border-[var(--color-navy)]/5"
            >
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-left font-body text-sm text-[var(--color-maroon)] py-3"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
