"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTree,
  faEnvelope,
  faLock,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      aalData &&
      aalData.nextLevel === "aal2" &&
      aalData.currentLevel !== "aal2"
    ) {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.[0];

      if (totpFactor) {
        setMfaFactorId(totpFactor.id);
        setMfaRequired(true);
        setLoading(false);
        return; // stop here — don't redirect to /admin yet
      }
    }

    setLoading(false);
    await redirectByRole();
  }
  async function redirectByRole() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();

    const role = roleData?.role ?? "guest";
    if (role === "member") router.push("/dashboard");
    else if (role === "guest") router.push("/");
    else router.push("/admin");
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMfaVerifying(true);

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

    if (challengeError) {
      setMfaVerifying(false);
      setError(challengeError.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challengeData.id,
      code: mfaCode,
    });

    setMfaVerifying(false);

    if (verifyError) {
      setError("That code didn't match — please try again.");
      return;
    }

    await redirectByRole();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-ivory)]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <FontAwesomeIcon
            icon={faTree}
            className="text-4xl text-[var(--color-gold)] mb-3"
          />
          <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Shajara Nama
          </h1>
          <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1">
            Sign in to manage your family tree
          </p>
        </div>
        {mfaRequired ? (
          <form
            onSubmit={handleVerifyMfa}
            className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">
              Enter your authentication code
            </h2>
            <p className="font-body text-sm text-[var(--color-ink)]/60">
              Open your authenticator app and enter the current 6-digit code.
            </p>

            {error && (
              <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoFocus
              className="w-full font-body text-lg tracking-widest text-center bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />

            <button
              type="submit"
              disabled={mfaCode.length !== 6 || mfaVerifying}
              className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
            >
              {mfaVerifying ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleLogin}
            className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6 space-y-4"
          >
            {error && (
              <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-body text-sm text-[var(--color-navy)]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-body text-xs text-[var(--color-navy)]/60 hover:text-[var(--color-gold)] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center cursor-pointer gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && (
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
