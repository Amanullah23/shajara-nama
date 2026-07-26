"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollReveal from "@/components/ScrollReveal";
import {
  faPaperPlane,
  faEnvelope,
  faPhone,
  faLocationDot,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Wiring to a real API/email service comes in the backend phase
    setSubmitted(true);
  }

  return (
    <section id="contact" className="py-20 md:py-8 px-4 md:px-8">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Left: info */}
          <div>
            <span className="font-body text-xs tracking-wide uppercase text-[var(--color-maroon)]">
              Get In Touch
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-navy)] mt-3">
              Start preserving your family&apos;s story
            </h2>
            <p className="font-body text-[var(--color-ink)]/70 mt-4 max-w-md">
              Have questions, or ready to begin building your family tree? Reach
              out and we&apos;ll get back to you shortly.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-[var(--color-gold)] text-sm"
                  />
                </div>
                <span className="font-body text-[var(--color-ink)]/80">
                  hello@shajaranama.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="text-[var(--color-gold)] text-sm"
                  />
                </div>
                <span className="font-body text-[var(--color-ink)]/80">
                  +93 XX XXX XXXX
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-[var(--color-gold)] text-sm"
                  />
                </div>
                <span className="font-body text-[var(--color-ink)]/80">
                  Kabul, Afghanistan
                </span>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-3xl p-6 md:p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-emerald)] flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-[var(--color-ivory)] text-xl"
                  />
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-navy)]">
                  Message sent
                </h3>
                <p className="font-body text-[var(--color-ink)]/70 text-sm max-w-xs">
                  Thanks for reaching out — we&apos;ll reply as soon as we can.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your family..."
                    className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-medium px-6 py-3.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300"
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
