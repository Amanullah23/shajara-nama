"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCircleNodes } from "@fortawesome/free-solid-svg-icons";

export default function Hero() {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-8 pb-16"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center w-full">
        {/* Left: copy */}
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 font-body text-xs tracking-wide uppercase text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 px-3 py-1 rounded-full mb-5">
            <FontAwesomeIcon icon={faCircleNodes} className="text-[10px]" />
            Family Heritage, Preserved
          </span>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-[var(--color-navy)] leading-tight">
            Every branch tells
            <span className="text-[var(--color-gold)]"> a story.</span>
          </h1>

          <p className="font-body text-[var(--color-ink)]/70 mt-6 max-w-md mx-auto md:mx-0 text-base md:text-lg">
            Shajara Nama brings your family&apos;s history, generations of
            names, stories, and photographs, into one living, growing tree.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="#tree"
              className="inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300"
            >
              View the Tree
              <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 border border-[var(--color-navy)]/20 text-[var(--color-navy)] font-medium px-6 py-3 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors duration-300"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Right: signature animated tree */}
        <div className="flex justify-center md:justify-end">
          <svg
            viewBox="0 90 400 310"
            className="w-full max-w-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Trunk */}
            <path
              d="M200 380 L200 260"
              stroke="var(--color-navy)"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: drawn ? 0 : 1,
                transition: "stroke-dashoffset 0.8s ease-out",
              }}
            />
            {/* Branches — each with staggered delay */}
            {[
              { d: "M200 260 L120 200", delay: 0.6 },
              { d: "M200 260 L280 200", delay: 0.6 },
              { d: "M120 200 L70 140", delay: 1.1 },
              { d: "M120 200 L140 130", delay: 1.1 },
              { d: "M280 200 L330 140", delay: 1.1 },
              { d: "M280 200 L260 130", delay: 1.1 },
            ].map((branch, i) => (
              <path
                key={i}
                d={branch.d}
                stroke="var(--color-navy)"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength="1"
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: drawn ? 0 : 1,
                  transition: `stroke-dashoffset 0.6s ease-out ${branch.delay}s`,
                }}
              />
            ))}
            {/* Nodes — fade in after branches */}
            {[
              {
                cx: 200,
                cy: 260,
                r: 8,
                delay: 0.4,
                color: "var(--color-gold)",
              },
              {
                cx: 120,
                cy: 200,
                r: 7,
                delay: 1.0,
                color: "var(--color-gold)",
              },
              {
                cx: 280,
                cy: 200,
                r: 7,
                delay: 1.0,
                color: "var(--color-gold)",
              },
              {
                cx: 70,
                cy: 140,
                r: 10,
                delay: 1.6,
                color: "var(--color-maroon)",
              },
              {
                cx: 140,
                cy: 130,
                r: 10,
                delay: 1.6,
                color: "var(--color-maroon)",
              },
              {
                cx: 330,
                cy: 140,
                r: 10,
                delay: 1.6,
                color: "var(--color-maroon)",
              },
              {
                cx: 260,
                cy: 130,
                r: 10,
                delay: 1.6,
                color: "var(--color-maroon)",
              },
            ].map((node, i) => (
              <circle
                key={i}
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill={node.color}
                style={{
                  opacity: drawn ? 1 : 0,
                  transform: drawn ? "scale(1)" : "scale(0)",
                  transformOrigin: `${node.cx}px ${node.cy}px`,
                  transition: `all 0.4s ease-out ${node.delay}s`,
                }}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
