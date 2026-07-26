"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faPen,
  faImage,
  faCakeCandles,
  faPeopleGroup,
  faCircleCheck,
  faCircleQuestion,
  faTrash,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type NotificationType = "member" | "edit" | "media" | "birthday" | "event" | "rsvp";

type Notification = {
  id: string;
  type: NotificationType;
  text: string;
  read: boolean;
  created_at: string;
};

const TYPE_CONFIG: Record<NotificationType, { icon: any; color: string }> = {
  member: { icon: faUserPlus, color: "var(--color-navy)" },
  edit: { icon: faPen, color: "var(--color-emerald)" },
  media: { icon: faImage, color: "var(--color-gold)" },
  birthday: { icon: faCakeCandles, color: "var(--color-maroon)" },
  event: { icon: faPeopleGroup, color: "var(--color-navy)" },
  rsvp: { icon: faCircleQuestion, color: "var(--color-emerald)" },
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  async function loadNotifications() {
    setLoading(true);

    // Generate any birthday notifications for today first, then load everything
    await supabase.rpc("generate_birthday_notifications");

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Notifications</h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            {loading
              ? "Loading..."
              : unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 font-body text-sm font-medium text-[var(--color-navy)] bg-[var(--color-navy)]/5 px-5 py-2.5 rounded-full hover:bg-[var(--color-navy)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faCheckDouble} className="text-xs" />
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`font-body text-sm px-4 py-2 rounded-full transition-colors ${
            filter === "all" ? "bg-[var(--color-navy)] text-[var(--color-ivory)]" : "bg-white border border-[var(--color-navy)]/10 text-[var(--color-ink)]/70 hover:bg-[var(--color-navy)]/5"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`font-body text-sm px-4 py-2 rounded-full transition-colors ${
            filter === "unread" ? "bg-[var(--color-navy)] text-[var(--color-ivory)]" : "bg-white border border-[var(--color-navy)]/10 text-[var(--color-ink)]/70 hover:bg-[var(--color-navy)]/5"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">Loading notifications...</p>
      ) : (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl overflow-hidden">
          {visible.map((n) => {
            const config = TYPE_CONFIG[n.type];
            return (
              <div
                key={n.id}
                className={`group flex items-start gap-3.5 px-5 py-4 border-b border-[var(--color-navy)]/5 last:border-0 transition-colors ${
                  n.read ? "" : "bg-[var(--color-gold)]/[0.05]"
                } hover:bg-[var(--color-navy)]/[0.02]`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: config.color }}
                >
                  <FontAwesomeIcon icon={config.icon} className="text-[var(--color-ivory)] text-xs" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`font-body text-sm leading-relaxed ${n.read ? "text-[var(--color-ink)]/70" : "text-[var(--color-ink)]/90 font-medium"}`}>
                    {n.text}
                  </p>
                  <p className="font-body text-xs text-[var(--color-ink)]/45 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] shrink-0 mt-2" />}

                <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/10"
                      aria-label="Mark as read"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10"
                    aria-label="Dismiss"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>
            );
          })}

          {visible.length === 0 && (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-12">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}