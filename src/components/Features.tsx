import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollReveal from "@/components/ScrollReveal";
import {
  faSitemap,
  faImages,
  faShieldHalved,
  faMagnifyingGlass,
  faLocationDot,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

const FEATURES = [
  {
    icon: faSitemap,
    title: "Interactive Family Tree",
    desc: "Explore generations with zoom, drag, and expandable branches — see ancestors and descendants at a glance.",
  },
  {
    icon: faImages,
    title: "Photo & Document Archive",
    desc: "Preserve certificates, old letters, and family photos in organized, searchable albums.",
  },
  {
    icon: faShieldHalved,
    title: "Privacy by Design",
    desc: "Public, family-only, and private information levels keep sensitive details protected.",
  },
  {
    icon: faMagnifyingGlass,
    title: "Powerful Search",
    desc: "Find anyone by name, village, occupation, birth year, or generation in seconds.",
  },
  {
    icon: faLocationDot,
    title: "Maps & Migration",
    desc: "Visualize birth places, current locations, and the family's journey across generations.",
  },
  {
    icon: faFileLines,
    title: "Reports & Export",
    desc: "Generate printable family trees, PDF reports, and Excel exports whenever you need them.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 px-4 md:px-8">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-body text-xs tracking-wide uppercase text-[var(--color-maroon)]">
              What You Get
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-navy)] mt-3">
              Everything your family&apos;s story needs
            </h2>
            <p className="font-body text-[var(--color-ink)]/70 mt-4">
              Built to hold a hundred years of history, and the hundred more to
              come.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group bg-white/60 border border-[var(--color-navy)]/10 rounded-2xl p-6 hover:border-[var(--color-gold)]/50 hover:shadow-lg hover:shadow-[var(--color-navy)]/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-navy)] flex items-center justify-center mb-5 group-hover:bg-[var(--color-gold)] transition-colors duration-300">
                  <FontAwesomeIcon
                    icon={feature.icon}
                    className="text-[var(--color-ivory)] text-lg"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-[var(--color-ink)]/70 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
