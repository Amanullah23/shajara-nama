"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faCrown,
  faUserShield,
  faPenToSquare,
  faEye,
  faFloppyDisk,
  faCheck,
  faArrowRightFromBracket,
  faShieldHalved,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type Role = "super_admin" | "branch_admin" | "editor" | "member" | "guest";

const ROLE_CONFIG: Record<Role, { icon: any; color: string; label: string }> = {
  super_admin: {
    icon: faCrown,
    color: "var(--color-gold)",
    label: "Super Admin",
  },
  branch_admin: {
    icon: faUserShield,
    color: "var(--color-navy)",
    label: "Branch Admin",
  },
  editor: {
    icon: faPenToSquare,
    color: "var(--color-emerald)",
    label: "Editor",
  },
  member: { icon: faUser, color: "var(--color-ink)", label: "Family Member" },
  guest: { icon: faEye, color: "var(--color-maroon)", label: "Guest" },
};

type PersonOption = { id: string; full_name: string };

export default function AdminProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("guest");
  const [branchName, setBranchName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedPersonId, setLinkedPersonId] = useState("");
  const [people, setPeople] = useState<PersonOption[]>([]);
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
  const [removalChallengeFactorId, setRemovalChallengeFactorId] = useState<
    string | null
  >(null);
  const [removalCode, setRemovalCode] = useState("");
  const [removalVerifying, setRemovalVerifying] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");
      setDisplayName(user.user_metadata?.full_name ?? "");
      setPhone(user.user_metadata?.phone ?? "");

      const [{ data: roleData }, { data: personsData }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role, branch_id, linked_person_id, branches(name)")
          .eq("user_id", user.id)
          .single(),
        supabase.from("persons").select("id, full_name").order("full_name"),
      ]);

      if (roleData) {
        setRole(roleData.role as Role);
        setBranchName((roleData as any).branches?.name ?? null);
        setLinkedPersonId(roleData.linked_person_id ?? "");
      }
      if (personsData) setPeople(personsData);

      setLoading(false);
    }
    async function loadMfaFactors() {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) setMfaFactors(data.totp ?? []);
    }
    loadProfile();
    loadMfaFactors();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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

    const { error: linkError } = await supabase
      .from("user_roles")
      .update({ linked_person_id: linkedPersonId || null })
      .eq("user_id", userId);

    setSaving(false);

    if (linkError) {
      setError(linkError.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function loadMfaFactorsAgain() {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) setMfaFactors(data.totp ?? []);
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
    loadMfaFactorsAgain();
  }

  async function cancelEnroll() {
    if (factorId) {
      await supabase.auth.mfa.unenroll({ factorId });
    }
    setEnrolling(false);
    setQrCode(null);
    setFactorId(null);
    setVerifyCode("");
    setMfaError("");
  }

  async function confirmRemoveFactor() {
    if (!pendingRemoveFactorId) return;
    setUnenrolling(true);
    setMfaError("");

    const { error } = await supabase.auth.mfa.unenroll({
      factorId: pendingRemoveFactorId,
    });

    setUnenrolling(false);

    if (error) {
      // Supabase blocks removing a verified factor unless the current session has
      // completed an MFA challenge (AAL2) — ask for a fresh code instead.
      if (
        error.message.toLowerCase().includes("aal2") ||
        error.message.toLowerCase().includes("assurance")
      ) {
        setPendingRemoveFactorId(null);
        setRemovalChallengeFactorId(pendingRemoveFactorId);
        return;
      }
      setMfaError(error.message);
      setPendingRemoveFactorId(null);
      return;
    }

    setPendingRemoveFactorId(null);
    loadMfaFactorsAgain();
  }
  async function verifyAndRemove(e: React.FormEvent) {
    e.preventDefault();
    if (!removalChallengeFactorId) return;
    setMfaError("");
    setRemovalVerifying(true);

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: removalChallengeFactorId,
      });

    if (challengeError) {
      setRemovalVerifying(false);
      setMfaError(challengeError.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: removalChallengeFactorId,
      challengeId: challengeData.id,
      code: removalCode,
    });

    if (verifyError) {
      setRemovalVerifying(false);
      setMfaError("That code didn't match — please try again.");
      return;
    }

    // Session is now AAL2 — the unenroll will succeed
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: removalChallengeFactorId,
    });

    setRemovalVerifying(false);

    if (unenrollError) {
      setMfaError(unenrollError.message);
      return;
    }

    setRemovalChallengeFactorId(null);
    setRemovalCode("");
    loadMfaFactorsAgain();
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

    // Verify the current password by attempting a sign-in with it
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

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading profile...
      </p>
    );
  }

  const config = ROLE_CONFIG[role];

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

      {/* Profile header card */}
      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-[var(--color-gold)] flex items-center justify-center shrink-0">
          <FontAwesomeIcon
            icon={faUser}
            className="text-[var(--color-navy)] text-2xl"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
            {displayName || "No name set"}
          </h3>
          <p className="font-body text-sm text-[var(--color-ink)]/60">
            {email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
            <span
              className="inline-flex items-center gap-1.5 font-body text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                color: config.color,
              }}
            >
              <FontAwesomeIcon icon={config.icon} className="text-[10px]" />
              {config.label}
            </span>
            {branchName && (
              <span className="font-body text-xs text-[var(--color-ink)]/50">
                {branchName}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex cursor-pointer items-center gap-2 font-body text-sm font-medium text-[var(--color-maroon)] bg-[var(--color-maroon)]/5 px-4 py-2.5 rounded-full hover:bg-[var(--color-maroon)]/10 transition-colors whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
          Log Out
        </button>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
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
                placeholder="Your name"
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
            <FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Password change — separate form, separate submit */}
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
          <div className="font-body text-sm text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded-xl px-4 py-3 inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
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
              placeholder="••••••••"
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
              placeholder="••••••••"
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
              placeholder="••••••••"
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
            <FontAwesomeIcon icon={faLock} className="text-xs" />
            {changingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* Two-Factor Authentication */}
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
                  className="font-body cursor-pointer text-xs text-[var(--color-maroon)] hover:underline disabled:opacity-50"
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
      {removalChallengeFactorId && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => setRemovalChallengeFactorId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-2">
              Confirm with your authenticator
            </h3>
            <p className="font-body text-sm text-[var(--color-ink)]/60 mb-4">
              For your security, enter a current code from your app to turn off
              two-factor authentication.
            </p>
            {mfaError && (
              <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2 mb-4">
                {mfaError}
              </div>
            )}
            <form onSubmit={verifyAndRemove} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={removalCode}
                onChange={(e) =>
                  setRemovalCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
                autoFocus
                className="w-full font-body text-lg tracking-widest text-center bg-white border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRemovalChallengeFactorId(null);
                    setRemovalCode("");
                  }}
                  className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={removalCode.length !== 6 || removalVerifying}
                  className="flex-1 bg-[var(--color-maroon)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {removalVerifying ? "Verifying..." : "Turn Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
