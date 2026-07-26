"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTree, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

export default function Verify2FAPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFactor() {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (totp) setFactorId(totp.id);
      setLoading(false);
    }
    loadFactor();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setVerifying(false);
      setError(challengeError.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    setVerifying(false);

    if (verifyError) {
      setError("That code didn't match — please try again.");
      return;
    }

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

  async function handleLogoutInstead() {
    await supabase.auth.signOut();
    router.push("/login");
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
            Verification Required
          </h1>
          <p className="font-body text-sm text-[var(--color-ink)]/60 mt-1 text-center">
            Enter the current code from your authenticator app to continue.
          </p>
        </div>

        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6">
          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-4">
              Loading...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="font-body text-xs text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                className="w-full font-body text-lg tracking-widest text-center bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
              <button
                type="submit"
                disabled={code.length !== 6 || verifying}
                className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
              >
                {verifying ? "Verifying..." : "Verify & Continue"}
                {!verifying && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                )}
              </button>
              <button
                type="button"
                onClick={handleLogoutInstead}
                className="w-full font-body text-xs text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]/70 transition-colors"
              >
                Not you? Log out
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
