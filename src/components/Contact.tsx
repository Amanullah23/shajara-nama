"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faEnvelope,
  faPhone,
  faLocationDot,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import ScrollReveal from "@/components/ScrollReveal";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="py-20 md:py-28 px-4 md:px-8">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Left: info */}
          <div>
            <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
              Get In Touch
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-3">
              Start Preserving Your Family&apos;s Story
            </h2>
            <p className="font-body text-[var(--color-ink)]/60 mt-4 max-w-md">
              Have questions, or ready to begin building your family tree? Reach
              out and we&apos;ll get back to you shortly.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-emerald)]/10 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-[var(--color-emerald)] text-sm"
                  />
                </div>
                <span className="font-body text-[var(--color-ink)]/75">
                  hello@shajaranama.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="text-[var(--color-navy)] text-sm"
                  />
                </div>
                <span className="font-body text-[var(--color-ink)]/75">
                  +93 XX XXX XXXX
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-[var(--color-gold)] text-sm"
                  />
                </div>
                <span className="font-body text-[var(--color-ink)]/75">
                  Kabul, Afghanistan
                </span>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white border border-[var(--color-navy)]/8 rounded-3xl p-6 md:p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-emerald)] flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-white text-xl"
                  />
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                  Message Sent
                </h3>
                <p className="font-body text-[var(--color-ink)]/60 text-sm max-w-xs">
                  Thanks for reaching out — we&apos;ll reply as soon as we can.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/12 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-emerald)]/50 focus:ring-2 focus:ring-[var(--color-emerald)]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/12 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-emerald)]/50 focus:ring-2 focus:ring-[var(--color-emerald)]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your family..."
                    className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/12 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-emerald)]/50 focus:ring-2 focus:ring-[var(--color-emerald)]/10 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-white font-body text-sm font-medium px-6 py-3.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300"
                >
                  Send Message
                  <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                </button>
              </form>
            )}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
