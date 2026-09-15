"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faUser,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type PersonLoc = {
  id: string;
  full_name: string;
  avatar_path: string | null;
  birth_place: string | null;
};

type PlaceGroup = {
  place: string;
  people: PersonLoc[];
};

export default function PlacesPage() {
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [groups, setGroups] = useState<PlaceGroup[]>([]);

  useEffect(() => {
    async function load() {
      const { data: settings } = await supabase
        .from("app_settings")
        .select("public_tree_visible")
        .eq("id", 1)
        .single();

      if (settings && settings.public_tree_visible === false) {
        setDisabled(true);
        setLoading(false);
        return;
      }

      const { data: persons } = await supabase
        .from("persons_public")
        .select("id, full_name, avatar_path, birth_place");

      const map = new Map<string, PersonLoc[]>();
      (persons ?? []).forEach((p: any) => {
        if (!p.birth_place || !p.birth_place.trim()) return;
        const key = p.birth_place.trim();
        const list = map.get(key) ?? [];
        list.push(p);
        map.set(key, list);
      });

      const grouped = Array.from(map.entries())
        .map(([place, people]) => ({ place, people }))
        .sort((a, b) => b.people.length - a.people.length);

      setGroups(grouped);
      setLoading(false);
    }
    load();
  }, []);

  const totalPlaces = groups.length;
  const totalPeople = useMemo(
    () => groups.reduce((sum, g) => sum + g.people.length, 0),
    [groups],
  );

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-24 px-4 md:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
              Roots &amp; Journeys
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-3">
              Places
            </h1>
            <p className="font-body text-[var(--color-ink)]/60 mt-3 max-w-lg mx-auto">
              Where the family was born, across {totalPlaces} place
              {totalPlaces !== 1 ? "s" : ""} and {totalPeople} member
              {totalPeople !== 1 ? "s" : ""}.
            </p>
          </div>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Loading places...
            </p>
          ) : disabled ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16 max-w-sm mx-auto">
              Family places are currently private. Family members can view them
              after logging in.
            </p>
          ) : groups.length === 0 ? (
            <div className="text-center py-16">
              <FontAwesomeIcon
                icon={faGlobe}
                className="text-[var(--color-navy)]/15 text-4xl mb-4"
              />
              <p className="font-body text-sm text-[var(--color-ink)]/50">
                No birth places have been recorded yet.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {groups.map((group) => (
                <div
                  key={group.place}
                  className="bg-white border border-[var(--color-navy)]/8 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-emerald)]/10 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="text-[var(--color-emerald)] text-sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-[var(--color-ink)] truncate">
                        {group.place}
                      </h3>
                      <p className="font-body text-xs text-[var(--color-ink)]/50">
                        {group.people.length} member
                        {group.people.length !== 1 ? "s" : ""} born here
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.people.slice(0, 8).map((p) => {
                      const avatarUrl = p.avatar_path
                        ? supabase.storage
                            .from("photos")
                            .getPublicUrl(p.avatar_path).data.publicUrl
                        : null;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-1.5 bg-[var(--color-navy)]/5 rounded-full pl-1 pr-3 py-1"
                          title={p.full_name}
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
                                className="text-[8px] text-[var(--color-navy)]/40"
                              />
                            )}
                          </div>
                          <span className="font-body text-xs text-[var(--color-ink)]/75 whitespace-nowrap">
                            {p.full_name}
                          </span>
                        </div>
                      );
                    })}
                    {group.people.length > 8 && (
                      <span className="font-body text-xs text-[var(--color-ink)]/40 self-center px-2">
                        +{group.people.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
