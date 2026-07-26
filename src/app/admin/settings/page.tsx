"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faShieldHalved,
  faLanguage,
  faBell,
  faFloppyDisk,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0">
          <FontAwesomeIcon
            icon={icon}
            className="text-[var(--color-ivory)] text-sm"
          />
        </div>
        <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-navy)]">
          {title}
        </h3>
      </div>
      {description && (
        <p className="font-body text-xs text-[var(--color-ink)]/50 ml-12 mb-4">
          {description}
        </p>
      )}
      <div className={`space-y-4 ${description ? "" : "mt-4"}`}>{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="font-body text-sm text-[var(--color-ink)]/85">{label}</p>
        {description && (
          <p className="font-body text-xs text-[var(--color-ink)]/50 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        type="button"
        className={`shrink-0 w-11 h-6 rounded-full transition-colors duration-300 relative ${
          checked ? "bg-[var(--color-emerald)]" : "bg-[var(--color-navy)]/15"
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [familyName, setFamilyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [publicTreeVisible, setPublicTreeVisible] = useState(true);
  const [publicPhotosVisible, setPublicPhotosVisible] = useState(true);
  const [familySeeOccupation, setFamilySeeOccupation] = useState(true);
  const [familySeeLocation, setFamilySeeLocation] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [allowLanguageSwitch, setAllowLanguageSwitch] = useState(true);
  const [notifyBirthdays, setNotifyBirthdays] = useState(true);
  const [notifyAnniversaries, setNotifyAnniversaries] = useState(true);
  const [notifyDeathAnniversaries, setNotifyDeathAnniversaries] =
    useState(true);
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);
  const [notifyProfileUpdates, setNotifyProfileUpdates] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setFamilyName(data.family_name ?? "");
        setContactEmail(data.contact_email ?? "");
        setPublicTreeVisible(data.public_tree_visible);
        setPublicPhotosVisible(data.public_photos_visible);
        setFamilySeeOccupation(data.family_can_see_occupation);
        setFamilySeeLocation(data.family_can_see_location);
        setRequireApproval(data.require_approval_for_edits);
        setDefaultLanguage(data.default_language ?? "en");
        setAllowLanguageSwitch(data.allow_language_switch);
        setNotifyBirthdays(data.notify_birthdays);
        setNotifyAnniversaries(data.notify_anniversaries);
        setNotifyDeathAnniversaries(data.notify_death_anniversaries);
        setNotifyNewMembers(data.notify_new_members);
        setNotifyProfileUpdates(data.notify_profile_updates);
      }

      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("app_settings")
      .update({
        family_name: familyName || null,
        contact_email: contactEmail || null,
        public_tree_visible: publicTreeVisible,
        public_photos_visible: publicPhotosVisible,
        family_can_see_occupation: familySeeOccupation,
        family_can_see_location: familySeeLocation,
        require_approval_for_edits: requireApproval,
        default_language: defaultLanguage,
        allow_language_switch: allowLanguageSwitch,
        notify_birthdays: notifyBirthdays,
        notify_anniversaries: notifyAnniversaries,
        notify_death_anniversaries: notifyDeathAnniversaries,
        notify_new_members: notifyNewMembers,
        notify_profile_updates: notifyProfileUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading settings...
      </p>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          Settings
        </h2>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          Configure site-wide preferences and defaults.
        </p>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <SectionCard icon={faGear} title="General">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Family Name
          </label>
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Contact Email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={faShieldHalved}
        title="Privacy Defaults"
        description="Controls what visitors and family members can see by default."
      >
        <Toggle
          checked={publicTreeVisible}
          onChange={setPublicTreeVisible}
          label="Public visitors can view the family tree structure"
          description="Names, relationships, birth/death years"
        />
        <Toggle
          checked={publicPhotosVisible}
          onChange={setPublicPhotosVisible}
          label="Public visitors can view approved historical photos"
        />
        <Toggle
          checked={familySeeOccupation}
          onChange={setFamilySeeOccupation}
          label="Logged-in family members can see occupation & education"
        />
        <Toggle
          checked={familySeeLocation}
          onChange={setFamilySeeLocation}
          label="Logged-in family members can see current city/country"
        />
        <Toggle
          checked={requireApproval}
          onChange={setRequireApproval}
          label="Require admin approval before new profile edits go live"
          description="Recommended while data is still being verified"
        />
      </SectionCard>

      <SectionCard icon={faLanguage} title="Language">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Default Site Language
          </label>
          <select
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="en">English</option>
            <option value="fa" disabled>
              دری (Dari) — coming soon
            </option>
          </select>
        </div>
        <Toggle
          checked={allowLanguageSwitch}
          onChange={setAllowLanguageSwitch}
          label="Allow family members to switch language themselves"
        />
      </SectionCard>

      <SectionCard icon={faBell} title="Notifications">
        <Toggle
          checked={notifyBirthdays}
          onChange={setNotifyBirthdays}
          label="Birthday reminders"
        />
        <Toggle
          checked={notifyAnniversaries}
          onChange={setNotifyAnniversaries}
          label="Marriage anniversary reminders"
        />
        <Toggle
          checked={notifyDeathAnniversaries}
          onChange={setNotifyDeathAnniversaries}
          label="Death anniversary remembrance"
        />
        <Toggle
          checked={notifyNewMembers}
          onChange={setNotifyNewMembers}
          label="New member added notifications"
        />
        <Toggle
          checked={notifyProfileUpdates}
          onChange={setNotifyProfileUpdates}
          label="Profile update notifications"
        />
      </SectionCard>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[var(--color-ivory)]/95 backdrop-blur-sm border-t border-[var(--color-navy)]/10 px-4 md:px-8 py-4 flex items-center justify-end gap-3 z-30">
        {saved && (
          <span className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-emerald)] mr-auto">
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            Settings saved
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
