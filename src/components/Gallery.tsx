"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faImage } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";

type GalleryPhoto = { id: string; caption: string | null; url: string };

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<GalleryPhoto | null>(null);
  const [photosDisabled, setPhotosDisabled] = useState(false);

  useEffect(() => {
    async function loadApprovedPhotos() {
      const { data: settings } = await supabase
        .from("app_settings")
        .select("public_photos_visible")
        .eq("id", 1)
        .single();

      if (settings && settings.public_photos_visible === false) {
        setPhotosDisabled(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("photos")
        .select("id, caption, storage_path")
        .eq("is_approved_public", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const withUrls = data.map((p: any) => {
          const { data: urlData } = supabase.storage
            .from("photos")
            .getPublicUrl(p.storage_path);
          return { id: p.id, caption: p.caption, url: urlData.publicUrl };
        });
        setPhotos(withUrls);
      }
      setLoading(false);
    }
    loadApprovedPhotos();
  }, []);

  return (
    <section id="gallery" className="py-20 md:py-28 px-4 md:px-8">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-gold)]">
              Memories
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-ink)] mt-3">
              Moments Worth Keeping
            </h2>
            <p className="font-body text-[var(--color-ink)]/60 mt-4">
              Photos, letters, and keepsakes — organized and safe for every
              generation to revisit.
            </p>
          </div>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
              Loading gallery...
            </p>
          ) : photosDisabled ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
              The gallery is currently private. Family members can view it after
              logging in.
            </p>
          ) : photos.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
              No photos have been shared publicly yet — check back soon.
            </p>
          ) : (
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setActive(photo)}
                  className="group relative w-full rounded-2xl overflow-hidden bg-[var(--color-navy)]/8 border border-[var(--color-navy)]/8 block break-inside-avoid hover:border-[var(--color-emerald)]/30 transition-colors"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    className="w-full h-auto block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="font-body text-sm text-white text-left">
                      {photo.caption}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {active && (
        <div
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/90 flex items-center justify-center p-6"
        >
          <button
            onClick={() => setActive(null)}
            className="absolute top-6 right-6 text-white text-2xl hover:text-[var(--color-gold)] transition-colors"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <img
            src={active.url}
            alt={active.caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
          />
        </div>
      )}
    </section>
  );
}
