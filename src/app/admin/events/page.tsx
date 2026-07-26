"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCakeCandles,
  faRing,
  faPeopleGroup,
  faPlus,
  faTrash,
  faXmark,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type EventType = "birthday" | "anniversary" | "gathering";

type EventRow = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location: string | null;
  going: number;
  notGoing: number;
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

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("gathering");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  async function loadEvents() {
    setLoading(true);
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .order("date");
    const { data: rsvpData } = await supabase
      .from("rsvps")
      .select("event_id, status");

    const mapped: EventRow[] = (eventsData ?? []).map((e: any) => {
      const rsvpsForEvent = (rsvpData ?? []).filter((r) => r.event_id === e.id);
      return {
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date,
        location: e.location,
        going: rsvpsForEvent.filter((r) => r.status === "going").length,
        notGoing: rsvpsForEvent.filter((r) => r.status === "not_going").length,
      };
    });

    setEvents(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSaving(true);
    const { error } = await supabase.from("events").insert({
      title,
      type,
      date,
      location: location || null,
    });
    setSaving(false);

    if (error) {
      alert(`Could not create event: ${error.message}`);
      return;
    }

    setTitle("");
    setType("gathering");
    setDate("");
    setLocation("");
    setModalOpen(false);
    loadEvents();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    await supabase.from("events").delete().eq("id", pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    loadEvents();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Events
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            Birthdays, anniversaries, and family gatherings.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300 whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Event
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "birthday", "anniversary", "gathering"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-body text-sm px-4 py-2 rounded-full transition-colors capitalize ${
              filter === f
                ? "bg-[var(--color-navy)] text-[var(--color-ivory)]"
                : "bg-white border border-[var(--color-navy)]/10 text-[var(--color-ink)]/70 hover:bg-[var(--color-navy)]/5"
            }`}
          >
            {f === "all" ? "All Events" : `${f}s`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          Loading events...
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const config = TYPE_CONFIG[event.type];
            const dateObj = new Date(event.date);
            return (
              <div
                key={event.id}
                className="flex items-center gap-4 bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-4 md:p-5"
              >
                <div className="shrink-0 w-14 text-center">
                  <p className="font-display text-xl font-semibold text-[var(--color-navy)] leading-none">
                    {dateObj.getDate()}
                  </p>
                  <p className="font-body text-xs text-[var(--color-ink)]/50 mt-1 uppercase">
                    {dateObj.toLocaleString("en-US", { month: "short" })}
                  </p>
                </div>

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  <FontAwesomeIcon
                    icon={config.icon}
                    className="text-[var(--color-ivory)] text-sm"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-[var(--color-ink)]/90 truncate">
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
                    {event.type === "gathering" && (
                      <span className="font-body text-xs font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-2 py-0.5 rounded-full">
                        {event.going} going
                        {event.notGoing > 0
                          ? `, ${event.notGoing} not going`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setPendingDelete(event)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10 shrink-0"
                  aria-label="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
              No events in this category.
            </p>
          )}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                Add Event
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Event Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Family Reunion"
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EventType)}
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="gathering">Gathering</option>
                </select>
              </div>
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Location (for gatherings)
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Optional"
                  className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Delete this event?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed, along with any RSVPs. This cannot be undone.`
            : ""
        }
        deleting={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
