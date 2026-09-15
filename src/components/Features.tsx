import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollReveal from "@/components/ScrollReveal";
import {
  faSitemap,
  faIdCard,
  faImages,
  faFolderTree,
  faShieldHalved,
  faFileExport,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

const FEATURES = [
  {
    icon: faSitemap,
    title: "Interactive Family Tree",
    desc: "Explore generations with zoom, pan, and expandable branches — see ancestors and descendants at a glance.",
    color: "emerald",
  },
  {
    icon: faIdCard,
    title: "Person Profiles",
    desc: "Detailed profiles for every member — photos, biography, education, career, and life events.",
    color: "navy",
  },
  {
    icon: faImages,
    title: "Photos & Documents",
    desc: "Preserve certificates, letters, and family photos in organized, searchable albums.",
    color: "gold",
  },
  {
    icon: faFolderTree,
    title: "Family Branches",
    desc: "Organize large families into branches, each with its own scoped tree and printable report.",
    color: "emerald",
  },
  {
    icon: faShieldHalved,
    title: "Privacy & Security",
    desc: "Public, family-only, and private information levels, plus two-factor authentication, keep sensitive details protected.",
    color: "navy",
  },
  {
    icon: faFileExport,
    title: "Reports & Export",
    desc: "Generate printable family trees, PDF reports, and Excel exports whenever you need them.",
    color: "gold",
  },
  {
    icon: faClockRotateLeft,
    title: "Timeline",
    desc: "See key family events — births, marriages, milestones — laid out chronologically.",
    color: "emerald",
  },
];

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  emerald: {
    bg: "bg-[var(--color-emerald)]/10",
    icon: "text-[var(--color-emerald)]",
  },
  navy: { bg: "bg-[var(--color-navy)]/10", icon: "text-[var(--color-navy)]" },
  gold: { bg: "bg-[var(--color-gold)]/10", icon: "text-[var(--color-gold)]" },
};

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 px-4 md:px-8">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
              Key Features
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-3">
              Everything You Need to Explore Your Heritage
            </h2>
            <p className="font-body text-[var(--color-ink)]/60 mt-4">
              Powerful tools to build, explore, and preserve your family
              history.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, i) => {
              const colors = COLOR_MAP[feature.color];
              return (
                <div
                  key={i}
                  className="relative bg-white rounded-2xl p-6 border border-[var(--color-navy)]/8 hover:border-[var(--color-emerald)]/30 hover:shadow-lg hover:shadow-[var(--color-navy)]/5 transition-all duration-300"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}
                  >
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className={`${colors.icon} text-base`}
                    />
                  </div>
                  <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-[var(--color-ink)]/60 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
