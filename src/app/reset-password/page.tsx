"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTree,
  faLock,
  faArrowRight,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // When someone arrives via the emailed reset link, Supabase automatically
    // exchanges the token in the URL for a temporary "recovery" session.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Fallback: if a session already exists by the time this loads, allow it through too
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setReady((prev) => {
        if (!prev) setInvalidLink(true);
        return prev;
      });
    }, 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
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
            Set a New Password
          </h1>
        </div>

        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6">
          {invalidLink ? (
            <p className="font-body text-sm text-[var(--color-maroon)] text-center py-4">
              This reset link is invalid or has expired. Please request a new
              one from the login page.
            </p>
          ) : success ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-emerald)] flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-[var(--color-ivory)] text-lg"
                />
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                Password updated
              </h3>
              <p className="font-body text-sm text-[var(--color-ink)]/60">
                Redirecting you to login...
              </p>
            </div>
          ) : !ready ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-4">
              Verifying your reset link...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  New Password
                </label>
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

              <div>
                <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
                {!loading && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
