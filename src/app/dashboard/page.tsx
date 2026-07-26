"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSitemap,
  faCalendarDays,
  faImages,
  faNewspaper,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type LinkedPerson = {
  id: string;
  full_name: string;
  avatar_path: string | null;
  birth_year: number | null;
};

const QUICK_LINKS = [
  { label: "Family Tree", href: "/#tree", icon: faSitemap },
  { label: "Events", href: "/events", icon: faCalendarDays },
  { label: "Gallery", href: "/#gallery", icon: faImages },
  { label: "Blog", href: "/blog", icon: faNewspaper },
];

export default function MemberDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [linkedPerson, setLinkedPerson] = useState<LinkedPerson | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setDisplayName(user.user_metadata?.full_name ?? "");

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("linked_person_id")
        .eq("user_id", user.id)
        .single();

      if (roleData?.linked_person_id) {
        const { data: personData } = await supabase
          .from("persons_public")
          .select("id, full_name, avatar_path, birth_year")
          .eq("id", roleData.linked_person_id)
          .single();
        if (personData) setLinkedPerson(personData);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          Your family, all in one place.
        </p>
      </div>

      {linkedPerson ? (
        <Link
          href={`/person/${linkedPerson.id}`}
          className="flex items-center gap-4 bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 hover:border-[var(--color-gold)]/50 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center shrink-0">
            {linkedPerson.avatar_path ? (
              <img
                src={
                  supabase.storage
                    .from("photos")
                    .getPublicUrl(linkedPerson.avatar_path).data.publicUrl
                }
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <FontAwesomeIcon
                icon={faUser}
                className="text-[var(--color-navy)]/30 text-xl"
              />
            )}
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-[var(--color-navy)]">
              {linkedPerson.full_name}
            </p>
            <p className="font-body text-sm text-[var(--color-ink)]/60">
              {linkedPerson.birth_year
                ? `Born ${linkedPerson.birth_year} — `
                : ""}
              View your family profile
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex items-start gap-3 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-2xl p-5">
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="text-[var(--color-gold)] mt-0.5"
          />
          <p className="font-body text-sm text-[var(--color-ink)]/70">
            Your account isn't linked to a profile in the family tree yet. Visit{" "}
            <Link
              href="/dashboard/profile"
              className="underline text-[var(--color-navy)]"
            >
              My Profile
            </Link>{" "}
            to link yourself, or ask an admin to do it for you.
          </p>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-3">
          Explore
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 text-center hover:border-[var(--color-gold)]/50 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--color-navy)] flex items-center justify-center">
                <FontAwesomeIcon
                  icon={link.icon}
                  className="text-[var(--color-gold)]"
                />
              </div>
              <span className="font-body text-sm font-medium text-[var(--color-navy)]">
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
