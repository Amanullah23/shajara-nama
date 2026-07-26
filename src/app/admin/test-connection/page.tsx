"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestConnection() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function check() {
      const { error } = await supabase.from("_test_").select("*").limit(1);
      // We expect an error here since no tables exist yet —
      // what matters is WHICH error: a connection error vs. "table not found"
      if (
        error?.message.includes("does not exist") ||
        error?.code === "42P01"
      ) {
        setStatus(
          "✅ Connected to Supabase successfully! (table doesn't exist yet — that's expected)",
        );
      } else if (error) {
        setStatus(`⚠️ Connection issue: ${error.message}`);
      } else {
        setStatus("✅ Connected to Supabase successfully!");
      }
    }
    check();
  }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">
        Supabase Connection Test
      </h1>
      <p className="font-body text-sm text-[var(--color-ink)]/70 mt-3">
        {status}
      </p>
    </div>
  );
}
