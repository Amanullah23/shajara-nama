"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faUser,
  faArrowRightFromBracket,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

export default function AdminTopbar() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [capital, setCapital] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    async function loadUnreadCount() {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      setUnreadCount(count ?? 0);
    }
    loadUnreadCount();
  }, []);

  useEffect(() => {
    async function loadLocation() {
      try {
        const res = await fetch("https://ipwho.is/");
        const data = await res.json();

        if (!data.success) {
          console.warn("ipwho.is lookup failed:", data.message);
          throw new Error("Geolocation lookup unsuccessful");
        }

        setCapital(data.capital ?? data.city ?? null);

        const formatted = new Date().toLocaleDateString("en-US", {
          timeZone: data.timezone?.id || undefined,
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        setDateStr(formatted);
      } catch (err) {
        console.error(
          "Location detection failed, falling back to date only:",
          err,
        );
        const formatted = new Date().toLocaleDateString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        setDateStr(formatted);
      }
    }
    loadLocation();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-[var(--color-navy)]/10 flex items-center justify-end md:justify-between px-4 md:px-8 gap-4 no-print">
      <div className="hidden md:flex items-center gap-2">
        <h1 className="font-display text-lg font-semibold text-[var(--color-navy)]">
          Welcome back
        </h1>
        {dateStr && (
          <>
            <span className="text-[var(--color-navy)]/20">|</span>
            <span className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-ink)]/60">
              {capital && (
                <>
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-[var(--color-gold)] text-xs"
                  />
                  {capital}
                </>
              )}
              <span>{dateStr}</span>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 ml-12 md:ml-0">
        <Link
          href="/admin/notifications"
          className="relative w-9 h-9 rounded-full bg-[var(--color-navy)]/5 flex items-center justify-center hover:bg-[var(--color-navy)]/10 transition-colors"
          aria-label="Notifications"
        >
          <FontAwesomeIcon
            icon={faBell}
            className="text-[var(--color-navy)] text-sm"
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-maroon)] text-[var(--color-ivory)] text-[9px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link href="/admin/profile" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[var(--color-gold)] flex items-center justify-center">
            <FontAwesomeIcon
              icon={faUser}
              className="text-[var(--color-navy)] text-xs"
            />
          </div>
          <span className="hidden sm:block font-body text-sm text-[var(--color-ink)]/80">
            Admin
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-[var(--color-maroon)]/10 flex items-center justify-center hover:bg-[var(--color-maroon)]/20 transition-colors cursor-pointer"
          aria-label="Log out"
        >
          <FontAwesomeIcon
            icon={faArrowRightFromBracket}
            className="text-[var(--color-maroon)] text-xs"
          />
        </button>
      </div>
    </header>
  );
}
