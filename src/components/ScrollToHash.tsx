"use client";

import { useEffect } from "react";

export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.replace("#", "");

    // The browser's own native jump happens too early — before async data
    // (like Gallery's photos) has finished loading and settled the page's
    // final height. This waits a beat, then corrects the scroll position
    // to the right spot once everything has actually rendered.
    const timer = setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
