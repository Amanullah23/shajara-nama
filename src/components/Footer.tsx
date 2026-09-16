import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTree } from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const FOOTER_LINKS = [
  {
    heading: "Explore",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Family Tree", href: "/#tree" },
      { label: "Timeline", href: "/timeline" },
      { label: "Photos", href: "/#gallery" },
      { label: "Places", href: "/places" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#features" },
      { label: "Contact", href: "/#contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const SOCIALS = [
  { icon: faFacebook, href: "#", label: "Facebook" },
  { icon: faTwitter, href: "#", label: "Twitter" },
  { icon: faInstagram, href: "#", label: "Instagram" },
  { icon: faLinkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-navy)] text-white px-4 md:px-8 pt-16 pb-8">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon
              icon={faTree}
              className="text-xl text-[var(--color-gold)]"
            />
            <span className="font-display text-lg font-semibold">
              Shajara Nama
            </span>
          </div>
          <p className="font-body text-sm text-white/60 max-w-xs">
            Preserving family history across generations, one branch at a time.
          </p>
          <div className="flex gap-3 mt-5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-colors duration-300"
              >
                <FontAwesomeIcon icon={s.icon} className="text-sm" />
              </a>
            ))}
          </div>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.heading}>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)] mb-4">
              {col.heading}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-body text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)] mb-4">
            Language
          </h4>
          <p className="font-body text-sm text-white/70">
            English
            <span className="block text-white/40 mt-1">دری — coming soon</span>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-body text-xs text-white/50">
          © {new Date().getFullYear()} Shajara Nama. All rights reserved.
        </p>
        <p className="font-body text-xs text-white/50">
          Made with care, for every generation.
        </p>
      </div>
    </footer>
  );
}
