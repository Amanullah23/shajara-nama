"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTree, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { label: "Home", href: "/#home", ready: true },
  { label: "Family Tree", href: "/#tree", ready: true },
  { label: "Timeline", href: "/timeline", ready: true },
  { label: "Photos", href: "/#gallery", ready: true },
  { label: "Places", href: "/places", ready: true },
  { label: "About", href: "/#features", ready: true },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [homeHref, setHomeHref] = useState("/admin");

  useEffect(() => {
    async function checkAuth() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setCheckedAuth(true);
        return;
      }
      setIsLoggedIn(true);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();

      if (roleData?.role === "member") setHomeHref("/dashboard");
      else if (roleData?.role === "guest") setHomeHref("/");
      else setHomeHref("/admin");

      setCheckedAuth(true);
    }
    checkAuth();

    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleAnchorClick(
    e: React.MouseEvent,
    href: string,
    ready: boolean,
    closeMobile: boolean,
  ) {
    if (!ready) {
      e.preventDefault();
      return;
    }
    if (!href.includes("#")) {
      if (closeMobile) setIsOpen(false);
      return;
    }
    e.preventDefault();
    if (closeMobile) setIsOpen(false);
    const targetId = href.split("#")[1];

    const jump = () => {
      if (window.location.pathname !== "/") {
        window.location.href = href;
        return;
      }
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    closeMobile ? setTimeout(jump, 320) : jump();
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-sm shadow-[var(--color-navy)]/5" : ""
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
        {/* Logo */}
        <a
          href="/#home"
          onClick={(e) => handleAnchorClick(e, "/#home", true, false)}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--color-navy)] flex items-center justify-center">
            <FontAwesomeIcon icon={faTree} className="text-sm text-white" />
          </div>
          <span className="font-display text-lg font-bold text-[var(--color-ink)] hidden sm:block">
            Shajara Nama
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={(e) =>
                  handleAnchorClick(e, link.href, link.ready, false)
                }
                className={`inline-flex items-center gap-1.5 font-body text-sm px-3.5 py-2 rounded-full transition-colors whitespace-nowrap ${
                  link.ready
                    ? "text-[var(--color-ink)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 cursor-pointer"
                    : "text-[var(--color-ink)]/30 cursor-default"
                }`}
              >
                {link.label}
                {!link.ready && (
                  <span className="font-body text-[9px] font-semibold text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!checkedAuth ? (
            <div className="w-32 h-9" aria-hidden="true" />
          ) : isLoggedIn ? (
            <>
              <Link
                href={homeHref}
                className="font-body text-sm font-medium text-[var(--color-navy)] px-4 py-2 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
              >
                {homeHref === "/dashboard" ? "Dashboard" : "Admin Panel"}
              </Link>
              <button
                onClick={handleLogout}
                className="font-body text-sm font-medium text-white bg-[var(--color-navy)] px-4 py-2 rounded-full hover:bg-[var(--color-navy-light)] transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-body text-sm font-medium text-[var(--color-navy)] px-4 py-2 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
              >
                Log In
              </Link>
              <a
                href="/#contact"
                onClick={(e) => handleAnchorClick(e, "/#contact", true, false)}
                className="font-body text-sm font-medium text-white bg-[var(--color-navy)] px-4 py-2 rounded-full hover:bg-[var(--color-navy-light)] transition-colors"
              >
                Get Started
              </a>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 transition-colors shrink-0"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <FontAwesomeIcon
            icon={isOpen ? faXmark : faBars}
            className="text-lg"
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out bg-white border-t border-[var(--color-navy)]/5 ${
          isOpen ? "max-h-[26rem]" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col px-4 py-2">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={(e) =>
                  handleAnchorClick(e, link.href, link.ready, true)
                }
                className={`flex items-center justify-between py-3.5 font-body text-[15px] border-b border-[var(--color-navy)]/5 ${
                  link.ready
                    ? "text-[var(--color-ink)]/80"
                    : "text-[var(--color-ink)]/30"
                }`}
              >
                {link.label}
                {!link.ready && (
                  <span className="font-body text-[9px] font-semibold text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="px-4 pb-5 pt-2 flex flex-col gap-2.5">
          {!checkedAuth ? null : isLoggedIn ? (
            <>
              <Link
                href={homeHref}
                onClick={() => setIsOpen(false)}
                className="text-center font-body text-sm font-medium text-[var(--color-navy)] border border-[var(--color-navy)]/15 py-3 rounded-full"
              >
                {homeHref === "/dashboard" ? "Dashboard" : "Admin Panel"}
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="font-body text-sm font-medium text-white bg-[var(--color-navy)] py-3 rounded-full"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center font-body text-sm font-medium text-[var(--color-navy)] border border-[var(--color-navy)]/15 py-3 rounded-full"
              >
                Log In
              </Link>
              <a
                href="/#contact"
                onClick={(e) => handleAnchorClick(e, "/#contact", true, true)}
                className="text-center font-body text-sm font-medium text-white bg-[var(--color-navy)] py-3 rounded-full"
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
