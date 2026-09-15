"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import ScrollReveal from "@/components/ScrollReveal";

type DiscoverCard = {
  title: string;
  desc: string;
  image: string;
  href: string;
  ready: boolean;
};

const CARDS: DiscoverCard[] = [
  {
    title: "Family Photos",
    desc: "Browse and share old and new family photos and albums.",
    image: "https://picsum.photos/seed/shajara-photos/600/500",
    href: "/#gallery",
    ready: true,
  },
  {
    title: "Family Tree",
    desc: "Explore generations, branches, and relationships in one interactive view.",
    image: "https://picsum.photos/seed/shajara-tree/600/500",
    href: "/#tree",
    ready: true,
  },
  {
    title: "Family Blog",
    desc: "Stories, reflections, and updates written by the family.",
    image: "https://picsum.photos/seed/shajara-blog/600/500",
    href: "/blog",
    ready: true,
  },
  {
    title: "Family Branches",
    desc: "Explore different branches of the family tree, each with its own history.",
    image: "https://picsum.photos/seed/shajara-branches/600/500",
    href: "#",
    ready: false,
  },
  {
    title: "Family Map",
    desc: "Explore where ancestors lived and migrated across generations.",
    image: "https://picsum.photos/seed/shajara-map/600/500",
    href: "#",
    ready: false,
  },
  {
    title: "Historical Documents",
    desc: "Upload and organize important family documents and records.",
    image: "https://picsum.photos/seed/shajara-docs/600/500",
    href: "#",
    ready: false,
  },
];

function scrollOrGo(e: React.MouseEvent, href: string, ready: boolean) {
  if (!ready) {
    e.preventDefault();
    return;
  }
  if (!href.includes("#")) return;
  e.preventDefault();
  const targetId = href.split("#")[1];
  if (window.location.pathname !== "/") {
    window.location.href = href;
    return;
  }
  document
    .getElementById(targetId)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function DiscoverMore() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-8 bg-[var(--color-navy)]/[0.025]">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
              Explore More
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-3">
              Discover Your Family&apos;s Rich History
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CARDS.map((card) => (
              <a
                key={card.title}
                href={card.href}
                onClick={(e) => scrollOrGo(e, card.href, card.ready)}
                className={`group block rounded-2xl overflow-hidden bg-white border border-[var(--color-navy)]/8 transition-all duration-300 ${
                  card.ready
                    ? "hover:shadow-lg hover:shadow-[var(--color-navy)]/10 cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-navy)]/5">
                  <img
                    src={card.image}
                    alt=""
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      card.ready
                        ? "group-hover:scale-105"
                        : "grayscale opacity-70"
                    }`}
                  />
                  {!card.ready && (
                    <span className="absolute top-3 right-3 font-body text-[9px] font-semibold text-white bg-[var(--color-ink)]/70 backdrop-blur-sm px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-semibold text-[var(--color-ink)] mb-1">
                    {card.title}
                  </h3>
                  <p className="font-body text-sm text-[var(--color-ink)]/60 leading-relaxed mb-3">
                    {card.desc}
                  </p>
                  {card.ready && (
                    <span className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-[var(--color-emerald)] group-hover:gap-2.5 transition-all">
                      Explore
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="text-[10px]"
                      />
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
