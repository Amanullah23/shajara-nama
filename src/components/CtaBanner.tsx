"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faTree } from "@fortawesome/free-solid-svg-icons";

function scrollToTree(e: React.MouseEvent) {
  e.preventDefault();
  if (window.location.pathname !== "/") {
    window.location.href = "/#tree";
    return;
  }
  document
    .getElementById("tree")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-navy)]">
      {/* Soft glow accents — same drifting style as the hero, in muted tones against the dark background */}
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <div
          className="absolute w-[28rem] h-[28rem] rounded-full opacity-[0.12] blur-3xl motion-safe:animate-[heroFloat2_22s_ease-in-out_infinite]"
          style={{
            background: "var(--color-emerald)",
            top: "-10rem",
            left: "-6rem",
          }}
        />
        <div
          className="absolute w-[24rem] h-[24rem] rounded-full opacity-[0.10] blur-3xl motion-safe:animate-[heroFloat3_25s_ease-in-out_infinite]"
          style={{
            background: "var(--color-gold)",
            bottom: "-10rem",
            right: "-4rem",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon
            icon={faTree}
            className="text-xl text-[var(--color-gold)]"
          />
        </div>

        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
          Preserve Your Family Heritage
        </h2>
        <p className="font-body text-white/65 mt-4 max-w-lg mx-auto text-base md:text-lg">
          Join today and be part of your family&apos;s living history — connect
          generations, one story at a time.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center">
          <a
            href="#tree"
            onClick={scrollToTree}
            className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-navy)] font-body font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-white/90 transition-colors"
          >
            Explore Your Family Tree
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </a>
        </div>
      </div>
    </section>
  );
}
