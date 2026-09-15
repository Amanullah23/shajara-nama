"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBaby,
  faRing,
  faDove,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type TimelineEvent = {
  id: string;
  year: number;
  type: "birth" | "marriage" | "death";
  title: string;
  subtitle: string | null;
  avatarPath: string | null;
};

const TYPE_CONFIG = {
  birth: { icon: faBaby, color: "var(--color-emerald)" },
  marriage: { icon: faRing, color: "var(--color-gold)" },
  death: { icon: faDove, color: "var(--color-navy)" },
};

export default function TimelinePage() {
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

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

      const [{ data: persons }, { data: marriages }] = await Promise.all([
        supabase
          .from("persons_public")
          .select(
            "id, full_name, avatar_path, birth_year, birth_place, is_deceased, death_year",
          ),
        supabase
          .from("relationships")
          .select("person_id, related_person_id, marriage_date, marriage_place")
          .eq("relationship_type", "spouse"),
      ]);

      const personMap = new Map((persons ?? []).map((p: any) => [p.id, p]));
      const entries: TimelineEvent[] = [];

      (persons ?? []).forEach((p: any) => {
        if (p.birth_year) {
          entries.push({
            id: `birth-${p.id}`,
            year: p.birth_year,
            type: "birth",
            title: `${p.full_name} was born`,
            subtitle: p.birth_place,
            avatarPath: p.avatar_path,
          });
        }
        if (p.is_deceased && p.death_year) {
          entries.push({
            id: `death-${p.id}`,
            year: p.death_year,
            type: "death",
            title: `${p.full_name} passed away`,
            subtitle: null,
            avatarPath: p.avatar_path,
          });
        }
      });

      const seenPairs = new Set<string>();
      (marriages ?? []).forEach((m: any) => {
        if (!m.marriage_date) return;
        const pairKey = [m.person_id, m.related_person_id].sort().join("-");
        if (seenPairs.has(pairKey)) return;
        seenPairs.add(pairKey);

        const a = personMap.get(m.person_id);
        const b = personMap.get(m.related_person_id);
        if (!a || !b) return;

        entries.push({
          id: `marriage-${pairKey}`,
          year: new Date(m.marriage_date).getFullYear(),
          type: "marriage",
          title: `${a.full_name} & ${b.full_name} were married`,
          subtitle: m.marriage_place,
          avatarPath: a.avatar_path,
        });
      });

      entries.sort((x, y) => x.year - y.year);
      setEvents(entries);
      setLoading(false);
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<number, TimelineEvent[]>();
    events.forEach((e) => {
      const list = map.get(e.year) ?? [];
      list.push(e);
      map.set(e.year, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [events]);

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-24 px-4 md:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
              Our Story
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-3">
              Family Timeline
            </h1>
            <p className="font-body text-[var(--color-ink)]/60 mt-3">
              Key moments in the family&apos;s history, laid out
              chronologically.
            </p>
          </div>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Loading timeline...
            </p>
          ) : disabled ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16 max-w-sm mx-auto">
              The family timeline is currently private. Family members can view
              it after logging in.
            </p>
          ) : grouped.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              No dated events have been recorded yet.
            </p>
          ) : (
            <div className="relative pl-8">
              <div className="absolute top-1 bottom-1 left-[11px] w-px bg-[var(--color-navy)]/10" />

              {grouped.map(([year, yearEvents]) => (
                <div key={year} className="relative mb-10 last:mb-0">
                  <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[var(--color-navy)] flex items-center justify-center">
                    <span className="font-body text-[9px] font-bold text-white">
                      &bull;
                    </span>
                  </div>
                  <p className="font-display text-lg font-bold text-[var(--color-navy)] mb-3">
                    {year}
                  </p>

                  <div className="space-y-3">
                    {yearEvents.map((event) => {
                      const config = TYPE_CONFIG[event.type];
                      const avatarUrl = event.avatarPath
                        ? supabase.storage
                            .from("photos")
                            .getPublicUrl(event.avatarPath).data.publicUrl
                        : null;
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 bg-white border border-[var(--color-navy)]/8 rounded-2xl p-4"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                            }}
                          >
                            <FontAwesomeIcon
                              icon={config.icon}
                              style={{ color: config.color }}
                              className="text-xs"
                            />
                          </div>
                          {avatarUrl && (
                            <img
                              src={avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                              {event.title}
                            </p>
                            {event.subtitle && (
                              <p className="font-body text-xs text-[var(--color-ink)]/50">
                                {event.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
