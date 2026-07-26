"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTree,
  faEnvelope,
  faArrowRight,
  faArrowLeft,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
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
            Reset Your Password
          </h1>
          <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1 text-center">
            Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-emerald)] flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-[var(--color-ivory)] text-lg"
                />
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
                Check your email
              </h3>
              <p className="font-body text-sm text-[var(--color-ink)]/60">
                If an account exists for <strong>{email}</strong>, a password
                reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
                {!loading && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                )}
              </button>
            </form>
          )}
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] mt-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back to login
        </Link>
      </div>
    </main>
  );
}
