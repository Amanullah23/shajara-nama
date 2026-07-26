"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTree, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Home", href: "/#home" },
  { label: "Features", href: "/#features" },
  { label: "Family Tree", href: "/#tree" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
];
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-ivory)]/95 backdrop-blur-sm border-b border-[var(--color-navy)]/10">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        {/* Logo */}
        <a href="/#home" className="flex items-center gap-2 group">
          <FontAwesomeIcon
            icon={faTree}
            className="text-2xl text-[var(--color-gold)] group-hover:rotate-6 transition-transform duration-300"
          />
          <span className="font-display text-xl font-semibold text-[var(--color-navy)]">
            Shajara Nama
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-body text-sm text-[var(--color-ink)]/80 hover:text-[var(--color-navy)] relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-[var(--color-gold)] after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-gold)] transition-colors"
          >
            Login
          </Link>
          <a
            href="/#contact"
            className="bg-[var(--color-navy)] text-[var(--color-ivory)] text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300"
          >
            Get Started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-[var(--color-navy)] text-2xl"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col px-4 pb-4 gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 font-body text-[var(--color-ink)]/80 hover:text-[var(--color-navy)] border-b border-[var(--color-navy)]/5"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="pt-3 space-y-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block text-center border border-[var(--color-navy)]/20 text-[var(--color-navy)] font-medium px-5 py-2.5 rounded-full"
            >
              Login
            </Link>
            <a
              href="/#contact"
              onClick={() => setIsOpen(false)}
              className="block text-center bg-[var(--color-navy)] text-[var(--color-ivory)] font-medium px-5 py-2.5 rounded-full"
            >
              Get Started
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
