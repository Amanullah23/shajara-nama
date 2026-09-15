"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faSitemap,
  faShieldHalved,
  faLanguage,
  faMobileScreenButton,
  faTree,
  faUsers,
  faImages,
} from "@fortawesome/free-solid-svg-icons";

function scrollToTree(e: React.MouseEvent) {
  e.preventDefault();
  document
    .getElementById("tree")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[var(--color-ivory)]"
    >
      {/* Soft animated gradient — three slow-drifting color blobs, subtle and non-distracting */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute w-[34rem] h-[34rem] rounded-full opacity-[0.10] blur-3xl motion-safe:animate-[heroFloat1_18s_ease-in-out_infinite]"
          style={{
            background: "var(--color-navy)",
            top: "-10rem",
            left: "-8rem",
          }}
        />
        <div
          className="absolute w-[28rem] h-[28rem] rounded-full opacity-[0.12] blur-3xl motion-safe:animate-[heroFloat2_22s_ease-in-out_infinite]"
          style={{
            background: "var(--color-emerald)",
            top: "-6rem",
            right: "-6rem",
          }}
        />
        <div
          className="absolute w-[24rem] h-[24rem] rounded-full opacity-[0.08] blur-3xl motion-safe:animate-[heroFloat3_25s_ease-in-out_infinite]"
          style={{
            background: "var(--color-gold)",
            bottom: "-8rem",
            left: "35%",
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-20 pb-20 md:pt-28 md:pb-28 text-center flex flex-col items-center">
        {/* Icon mark */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-navy)] flex items-center justify-center mb-7 shadow-lg shadow-[var(--color-navy)]/20">
          <FontAwesomeIcon
            icon={faTree}
            className="text-2xl text-[var(--color-gold)]"
          />
        </div>

        <p className="font-body text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-navy)]/60 mb-5">
          Discover &nbsp;&bull;&nbsp; Connect &nbsp;&bull;&nbsp; Preserve
        </p>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--color-ink)] leading-[1.1]">
          Your Family Tree,
          <br />
          <span className="text-[var(--color-navy)]">Your Story</span>
        </h1>

        <p className="font-body text-[var(--color-ink)]/60 mt-6 max-w-xl text-base md:text-lg leading-relaxed">
          Shajara Nama helps you build, explore, and preserve your family
          history. Connect generations, discover your roots, and keep your
          heritage alive for future generations.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3.5">
          <a
            href="#tree"
            onClick={scrollToTree}
            className="inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-white font-body font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300"
          >
            Explore Your Family Tree
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </a>
          <a
            href="#tree"
            onClick={scrollToTree}
            className="inline-flex items-center justify-center gap-2 border border-[var(--color-navy)]/20 text-[var(--color-ink)] font-body font-medium text-sm px-7 py-3.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors duration-300"
          >
            <FontAwesomeIcon icon={faSitemap} className="text-xs" />
            View the Family Tree
          </a>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--color-emerald)]/10 flex items-center justify-center shrink-0">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-[var(--color-emerald)] text-sm"
              />
            </div>
            <div className="text-left">
              <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                Secure &amp; Private
              </p>
              <p className="font-body text-xs text-[var(--color-ink)]/50">
                Your family data is safe
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center shrink-0">
              <FontAwesomeIcon
                icon={faLanguage}
                className="text-[var(--color-navy)] text-sm"
              />
            </div>
            <div className="text-left">
              <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                Multiple Languages
              </p>
              <p className="font-body text-xs text-[var(--color-ink)]/50">
                Dari &middot; Pashto &middot; English
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center shrink-0">
              <FontAwesomeIcon
                icon={faMobileScreenButton}
                className="text-[var(--color-gold)] text-sm"
              />
            </div>
            <div className="text-left">
              <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                Accessible Anywhere
              </p>
              <p className="font-body text-xs text-[var(--color-ink)]/50">
                On all devices
              </p>
            </div>
          </div>
        </div>

        {/* Simple stat strip — quiet, no cards, no photos, nothing to misalign */}
        <div className="flex items-center justify-center gap-8 sm:gap-14 mt-14 pt-10 border-t border-[var(--color-navy)]/10 w-full max-w-lg">
          <div className="flex flex-col items-center gap-1.5">
            <FontAwesomeIcon
              icon={faSitemap}
              className="text-[var(--color-navy)]/50 text-lg"
            />
            <p className="font-display text-xl font-bold text-[var(--color-ink)]">
              5+
            </p>
            <p className="font-body text-[11px] text-[var(--color-ink)]/45">
              Generations
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <FontAwesomeIcon
              icon={faUsers}
              className="text-[var(--color-navy)]/50 text-lg"
            />
            <p className="font-display text-xl font-bold text-[var(--color-ink)]">
              200+
            </p>
            <p className="font-body text-[11px] text-[var(--color-ink)]/45">
              Family Members
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <FontAwesomeIcon
              icon={faImages}
              className="text-[var(--color-navy)]/50 text-lg"
            />
            <p className="font-display text-xl font-bold text-[var(--color-ink)]">
              100+
            </p>
            <p className="font-body text-[11px] text-[var(--color-ink)]/45">
              Years Preserved
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
