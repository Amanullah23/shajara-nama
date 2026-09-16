import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEye, faUserShield } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Privacy Policy | Shajara Nama",
};

const LEVELS = [
  {
    icon: faEye,
    title: "Public",
    color: "var(--color-emerald)",
    items: [
      "Full name and profile photo",
      "Parent, spouse, and children names",
      "Birth year and death year",
      "Family branch and biography",
      "Family tree structure",
      "Approved historical photos",
    ],
  },
  {
    icon: faUserShield,
    title: "Family-Only",
    color: "var(--color-gold)",
    items: [
      "Current country and city",
      "Education and occupation details",
      "Recent family photos",
      "Contact preferences",
      "Family announcements and event attendance",
    ],
  },
  {
    icon: faLock,
    title: "Private",
    color: "var(--color-navy)",
    items: [
      "Exact home address and phone numbers",
      "National ID and passport numbers",
      "GPS coordinates",
      "Medical information",
      "Private notes and login history",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <main>
      <Navbar />

      <section className="pt-32 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
            Legal
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--color-ink)] mt-3">
            Privacy Policy
          </h1>
          <p className="font-body text-[var(--color-ink)]/50 mt-3 text-sm">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="font-body text-[var(--color-ink)]/75 mt-8 space-y-6 leading-relaxed">
            <p>
              Shajara Nama exists to preserve family history while protecting
              the people in it. This policy explains what information we
              collect, how it&apos;s classified, who can see it, and how
              it&apos;s kept secure.
            </p>

            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] pt-4">
              Three levels of visibility
            </h2>
            <p>
              Every piece of information in a family profile falls into one of
              three levels, so history stays accessible while living members
              stay protected.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-8">
            {LEVELS.map((level) => (
              <div
                key={level.title}
                className="bg-white border border-[var(--color-navy)]/8 rounded-2xl p-6"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${level.color} 14%, transparent)`,
                  }}
                >
                  <FontAwesomeIcon
                    icon={level.icon}
                    style={{ color: level.color }}
                    className="text-sm"
                  />
                </div>
                <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-3">
                  {level.title}
                </h3>
                <ul className="space-y-2">
                  {level.items.map((item) => (
                    <li
                      key={item}
                      className="font-body text-xs text-[var(--color-ink)]/65 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--color-emerald)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="font-body text-[var(--color-ink)]/75 mt-10 space-y-6 leading-relaxed">
            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
              How we protect your data
            </h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                Passwords are encrypted using industry-standard hashing
                (bcrypt/Argon2).
              </li>
              <li>All data in transit is encrypted via HTTPS/TLS.</li>
              <li>Sensitive data at rest is encrypted in our database.</li>
              <li>Every change to a profile is logged with an audit trail.</li>
              <li>
                Deleted records are recoverable for 90 days before permanent
                removal.
              </li>
              <li>Regular automated backups protect against data loss.</li>
              <li>Two-factor authentication is available for every account.</li>
            </ul>

            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] pt-4">
              Your rights
            </h2>
            <p>
              Living family members can request access to, correction of, or
              deletion of their personal information at any time by contacting a
              family administrator or reaching out through our{" "}
              <a
                href="/#contact"
                className="text-[var(--color-emerald)] underline decoration-[var(--color-emerald)]/40"
              >
                contact form
              </a>
              .
            </p>

            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] pt-4">
              Questions?
            </h2>
            <p>
              If you have questions about this policy or how your family&apos;s
              data is handled, reach us at{" "}
              <a
                href="mailto:hello@shajaranama.com"
                className="text-[var(--color-emerald)] underline decoration-[var(--color-emerald)]/40"
              >
                hello@shajaranama.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
