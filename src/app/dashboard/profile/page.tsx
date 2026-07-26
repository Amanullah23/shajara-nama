"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faCheck,
  faShieldHalved,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type PersonOption = { id: string; full_name: string };

export default function MemberProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedPersonId, setLinkedPersonId] = useState("");
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [pendingRemoveFactorId, setPendingRemoveFactorId] = useState<
    string | null
  >(null);

  async function loadMfaFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) setMfaFactors(data.totp ?? []);
  }

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");
      setDisplayName(user.user_metadata?.full_name ?? "");
      setPhone(user.user_metadata?.phone ?? "");

      const [{ data: roleData }, { data: personsData }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("linked_person_id")
          .eq("user_id", user.id)
          .single(),
        supabase.from("persons").select("id, full_name").order("full_name"),
      ]);

      if (roleData) setLinkedPersonId(roleData.linked_person_id ?? "");
      if (personsData) setPeople(personsData);

      setLoading(false);
    }
    loadProfile();
    loadMfaFactors();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: metaError } = await supabase.auth.updateUser({
      data: { full_name: displayName, phone },
    });

    if (metaError) {
      setSaving(false);
      setError(metaError.message);
      return;
    }

    const { error: linkError } = await supabase.rpc("set_my_linked_person", {
      new_person_id: linkedPersonId || null,
    });

    setSaving(false);

    if (linkError) {
      setError(linkError.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setChangingPassword(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) {
      setChangingPassword(false);
      setPasswordError("Current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setChangingPassword(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(false), 3000);
  }

  async function startEnroll() {
    setMfaError("");
    setMfaSuccess(false);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });
    if (error) {
      setMfaError(error.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setEnrolling(true);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setMfaError("");

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setMfaError(challengeError.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });

    if (verifyError) {
      setMfaError(
        "That code didn't match — check your authenticator app and try again.",
      );
      return;
    }

    setMfaSuccess(true);
    setEnrolling(false);
    setQrCode(null);
    setVerifyCode("");
    loadMfaFactors();
  }

  async function cancelEnroll() {
    if (factorId) await supabase.auth.mfa.unenroll({ factorId });
    setEnrolling(false);
    setQrCode(null);
    setFactorId(null);
    setVerifyCode("");
    setMfaError("");
  }

  async function confirmRemoveFactor() {
    if (!pendingRemoveFactorId) return;
    setUnenrolling(true);
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: pendingRemoveFactorId,
    });
    setUnenrolling(false);
    setPendingRemoveFactorId(null);
    if (!error) loadMfaFactors();
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading profile...
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          My Profile
        </h2>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          Manage your account details and login information.
        </p>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSaveProfile}
        className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0">
            <FontAwesomeIcon
              icon={faUser}
              className="text-[var(--color-ivory)] text-sm"
            />
          </div>
          <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-navy)]">
            Account Details
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>
          <div>
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              Email
            </label>
            <input
              value={email}
              disabled
              className="w-full font-body text-sm bg-[var(--color-navy)]/5 border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 text-[var(--color-ink)]/50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+93 XX XXX XXXX"
              className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>
          <div>
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              Linked Family Profile
            </label>
            <select
              value={linkedPersonId}
              onChange={(e) => setLinkedPersonId(e.target.value)}
              className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            >
              <option value="">— Not linked —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-emerald)] mr-auto">
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
              Profile updated
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0">
            <FontAwesomeIcon
              icon={faLock}
              className="text-[var(--color-ivory)] text-sm"
            />
          </div>
          <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-navy)]">
            Change Password
          </h3>
        </div>
        {passwordError && (
          <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="font-body text-sm text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded-xl px-4 py-3">
            Password updated successfully.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>
          <div>
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>
          <div>
            <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0">
            <FontAwesomeIcon
              icon={faShieldHalved}
              className="text-[var(--color-ivory)] text-sm"
            />
          </div>
          <div>
            <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-navy)]">
              Two-Factor Authentication
            </h3>
            <p className="font-body text-xs text-[var(--color-ink)]/50 mt-0.5">
              Add an extra layer of security using an authenticator app.
            </p>
          </div>
        </div>

        {mfaError && (
          <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
            {mfaError}
          </div>
        )}
        {mfaSuccess && (
          <div className="font-body text-sm text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded-xl px-4 py-3">
            Two-factor authentication is now enabled on your account.
          </div>
        )}

        {mfaFactors.length > 0 && !enrolling && (
          <div className="space-y-2">
            {mfaFactors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-[var(--color-emerald)]/5 rounded-xl px-4 py-3"
              >
                <span className="font-body text-sm text-[var(--color-ink)]/80">
                  Authenticator app —{" "}
                  {f.status === "verified" ? "Active" : "Pending"}
                </span>
                <button
                  onClick={() => setPendingRemoveFactorId(f.id)}
                  disabled={unenrolling}
                  className="font-body text-xs text-[var(--color-maroon)] hover:underline disabled:opacity-50"
                >
                  Turn off
                </button>
              </div>
            ))}
          </div>
        )}

        {mfaFactors.length === 0 && !enrolling && (
          <button
            onClick={startEnroll}
            className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors"
          >
            <FontAwesomeIcon icon={faQrcode} className="text-xs" />
            Set Up Two-Factor Authentication
          </button>
        )}

        {enrolling && qrCode && (
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm text-[var(--color-navy)] mb-3">
                1. Scan this QR code with Google Authenticator, Authy, or a
                similar app:
              </p>
              <div
                className="bg-white p-4 rounded-xl inline-block border border-[var(--color-navy)]/10"
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            </div>
            <form onSubmit={confirmEnroll} className="space-y-3">
              <label className="font-body text-sm text-[var(--color-navy)] block">
                2. Enter the 6-digit code from the app:
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
                className="w-40 font-body text-lg tracking-widest text-center bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelEnroll}
                  className="font-body text-sm font-medium text-[var(--color-ink)]/70 px-5 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyCode.length !== 6}
                  className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-40"
                >
                  Verify & Enable
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={!!pendingRemoveFactorId}
        title="Turn off two-factor authentication?"
        message="This will make your account less secure — anyone with just your password would be able to log in."
        confirmLabel="Turn Off"
        deleting={unenrolling}
        onCancel={() => setPendingRemoveFactorId(null)}
        onConfirm={confirmRemoveFactor}
      />
    </div>
  );
}
