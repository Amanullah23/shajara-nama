"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCakeCandles,
  faRing,
  faPeopleGroup,
  faLocationDot,
  faCheck,
  faXmark as faX,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type EventType = "birthday" | "anniversary" | "gathering";
type RsvpStatus = "going" | "not_going" | "maybe";

type EventItem = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location: string | null;
  myStatus: RsvpStatus | null;
};

const TYPE_CONFIG: Record<
  EventType,
  { icon: any; color: string; label: string }
> = {
  birthday: {
    icon: faCakeCandles,
    color: "var(--color-gold)",
    label: "Birthday",
  },
  anniversary: {
    icon: faRing,
    color: "var(--color-maroon)",
    label: "Anniversary",
  },
  gathering: {
    icon: faPeopleGroup,
    color: "var(--color-emerald)",
    label: "Gathering",
  },
};

export default function FamilyEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .order("date");
    const { data: rsvpData } = uid
      ? await supabase
          .from("rsvps")
          .select("event_id, status")
          .eq("user_id", uid)
      : { data: [] };

    const mapped: EventItem[] = (eventsData ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      date: e.date,
      location: e.location,
      myStatus:
        (rsvpData ?? []).find((r) => r.event_id === e.id)?.status ?? null,
    }));

    setEvents(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function setRsvp(eventId: string, status: RsvpStatus) {
    if (!userId) {
      alert("Please log in to RSVP.");
      return;
    }

    const { error } = await supabase
      .from("rsvps")
      .upsert(
        { event_id: eventId, user_id: userId, status },
        { onConflict: "event_id,user_id" },
      );

    if (error) {
      alert(`Could not save RSVP: ${error.message}`);
      return;
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, myStatus: status } : e)),
    );
  }

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-20 px-4 md:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <span className="font-body text-xs tracking-wide uppercase text-[var(--color-maroon)]">
            Family Calendar
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-navy)] mt-3">
            Upcoming Events
          </h1>
          <p className="font-body text-[var(--color-ink)]/70 mt-3">
            RSVP to gatherings and keep track of family milestones.
          </p>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              No events scheduled yet.
            </p>
          ) : (
            <div className="space-y-4 mt-8">
              {events.map((event) => {
                const config = TYPE_CONFIG[event.type];
                const dateObj = new Date(event.date);
                return (
                  <div
                    key={event.id}
                    className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 text-center">
                        <p className="font-display text-lg font-semibold text-[var(--color-navy)] leading-none">
                          {dateObj.getDate()}
                        </p>
                        <p className="font-body text-xs text-[var(--color-ink)]/50 mt-1 uppercase">
                          {dateObj.toLocaleString("en-US", { month: "short" })}
                        </p>
                      </div>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: config.color }}
                      >
                        <FontAwesomeIcon
                          icon={config.icon}
                          className="text-[var(--color-ivory)] text-sm"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm font-medium text-[var(--color-ink)]/90">
                          {event.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="font-body text-xs text-[var(--color-ink)]/50">
                            {config.label}
                          </span>
                          {event.location && (
                            <span className="inline-flex items-center gap-1 font-body text-xs text-[var(--color-ink)]/50">
                              <FontAwesomeIcon
                                icon={faLocationDot}
                                className="text-[10px]"
                              />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {event.type === "gathering" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-navy)]/5">
                        <button
                          onClick={() => setRsvp(event.id, "going")}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 font-body text-xs font-medium py-2 rounded-lg transition-colors ${
                            event.myStatus === "going"
                              ? "bg-[var(--color-emerald)] text-[var(--color-ivory)]"
                              : "bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/20"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-[10px]"
                          />{" "}
                          Going
                        </button>
                        <button
                          onClick={() => setRsvp(event.id, "maybe")}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 font-body text-xs font-medium py-2 rounded-lg transition-colors ${
                            event.myStatus === "maybe"
                              ? "bg-[var(--color-gold)] text-[var(--color-navy)]"
                              : "bg-[var(--color-gold)]/10 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faQuestion}
                            className="text-[10px]"
                          />{" "}
                          Maybe
                        </button>
                        <button
                          onClick={() => setRsvp(event.id, "not_going")}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 font-body text-xs font-medium py-2 rounded-lg transition-colors ${
                            event.myStatus === "not_going"
                              ? "bg-[var(--color-maroon)] text-[var(--color-ivory)]"
                              : "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/20"
                          }`}
                        >
                          <FontAwesomeIcon icon={faX} className="text-[10px]" />{" "}
                          Can't Go
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
