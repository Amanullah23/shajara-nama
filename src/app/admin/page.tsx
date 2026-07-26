"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faMars,
  faVenus,
  faHeartPulse,
  faCross,
  faSitemap,
  faCakeCandles,
  faUserPlus,
  faImage,
  faPen,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Stats = {
  total: number;
  male: number;
  female: number;
  living: number;
  deceased: number;
  branches: number;
};

type ActivityItem = {
  icon: any;
  text: string;
  time: string;
};

type UpcomingItem = {
  label: string;
  date: string;
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: persons } = await supabase
        .from("persons")
        .select(
          "id, gender, is_deceased, created_at, full_name, updated_at, birth_date",
        )
        .order("created_at", { ascending: false });

      const { count: branchCount } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true });

      if (persons) {
        setStats({
          total: persons.length,
          male: persons.filter((p) => p.gender === "male").length,
          female: persons.filter((p) => p.gender === "female").length,
          living: persons.filter((p) => !p.is_deceased).length,
          deceased: persons.filter((p) => p.is_deceased).length,
          branches: branchCount ?? 0,
        });

        // Recent activity: most recently created people
        const recentAdds: ActivityItem[] = persons.slice(0, 5).map((p) => ({
          icon: faUserPlus,
          text: `Added new member: ${p.full_name}`,
          time: timeAgo(p.created_at),
        }));
        setActivity(recentAdds);

        // Upcoming birthdays: people with a birth_date, sorted by next occurrence this year
        const today = new Date();
        const withBirthdays = persons
          .filter((p) => p.birth_date && !p.is_deceased)
          .map((p) => {
            const bd = new Date(p.birth_date!);
            const nextBirthday = new Date(
              today.getFullYear(),
              bd.getMonth(),
              bd.getDate(),
            );
            if (nextBirthday < today)
              nextBirthday.setFullYear(today.getFullYear() + 1);
            return { label: `${p.full_name}'s Birthday`, date: nextBirthday };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 3)
          .map((item) => ({
            label: item.label,
            date: item.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          }));

        setUpcoming(withBirthdays);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Members",
          value: stats.total.toString(),
          icon: faUsers,
          color: "var(--color-navy)",
        },
        {
          label: "Male",
          value: stats.male.toString(),
          icon: faMars,
          color: "var(--color-navy)",
        },
        {
          label: "Female",
          value: stats.female.toString(),
          icon: faVenus,
          color: "var(--color-maroon)",
        },
        {
          label: "Living",
          value: stats.living.toString(),
          icon: faHeartPulse,
          color: "var(--color-emerald)",
        },
        {
          label: "Deceased",
          value: stats.deceased.toString(),
          icon: faCross,
          color: "var(--color-ink)",
        },
        {
          label: "Family Branches",
          value: stats.branches.toString(),
          icon: faSitemap,
          color: "var(--color-gold)",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Dashboard
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            Overview of your family tree at a glance.
          </p>
        </div>
        <Link
          href="/admin/guide"
          className="inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300 whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faBook} className="text-xs" />
          User Guide
        </Link>
      </div>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
          Loading dashboard...
        </p>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-4"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: stat.color }}
                >
                  <FontAwesomeIcon
                    icon={stat.icon}
                    className="text-[var(--color-ivory)] text-sm"
                  />
                </div>
                <p className="font-display text-xl font-semibold text-[var(--color-navy)]">
                  {stat.value}
                </p>
                <p className="font-body text-xs text-[var(--color-ink)]/60 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent activity */}
            <div className="lg:col-span-2 bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4">
                Recent Activity
              </h3>
              {activity.length === 0 ? (
                <p className="font-body text-sm text-[var(--color-ink)]/50">
                  No activity yet — add your first family member to get started.
                </p>
              ) : (
                <ul className="space-y-4">
                  {activity.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-navy)]/5 flex items-center justify-center shrink-0 mt-0.5">
                        <FontAwesomeIcon
                          icon={item.icon}
                          className="text-[var(--color-navy)] text-xs"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm text-[var(--color-ink)]/85">
                          {item.text}
                        </p>
                        <p className="font-body text-xs text-[var(--color-ink)]/45 mt-0.5">
                          {item.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Upcoming birthdays */}
            <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4">
                Upcoming
              </h3>
              {upcoming.length === 0 ? (
                <p className="font-body text-sm text-[var(--color-ink)]/50">
                  No upcoming birthdays yet — add birth dates to family members
                  to see them here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((event, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-navy)]/5 last:border-0 last:pb-0"
                    >
                      <span className="font-body text-sm text-[var(--color-ink)]/80">
                        {event.label}
                      </span>
                      <span className="font-body text-xs font-medium text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {event.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
