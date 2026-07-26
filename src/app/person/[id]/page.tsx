"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLocationDot,
  faGraduationCap,
  faBriefcase,
  faImage,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type PublicPerson = {
  id: string;
  full_name: string;
  native_name: string | null;
  nickname: string | null;
  gender: string | null;
  birth_year: number | null;
  birth_place: string | null;
  biography: string | null;
  branch_id: string | null;
  is_deceased: boolean;
  death_year: number | null;
  avatar_path: string | null;
};

type FamilyExtra = {
  country: string | null;
  province: string | null;
  occupation: string | null;
  company: string | null;
  school: string | null;
  university: string | null;
  degree: string | null;
};

type Photo = { id: string; caption: string | null; url: string };

export default function PersonProfilePage() {
  const params = useParams();
  const personId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<PublicPerson | null>(null);
  const [familyExtra, setFamilyExtra] = useState<FamilyExtra | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: publicData } = await supabase
        .from("persons_public")
        .select("*")
        .eq("id", personId)
        .single();

      if (!publicData) {
        setLoading(false);
        return;
      }
      setPerson(publicData);

      if (publicData.branch_id) {
        const { data: branchData } = await supabase
          .from("branches")
          .select("name")
          .eq("id", publicData.branch_id)
          .single();
        if (branchData) setBranchName(branchData.name);
      }

      // Only succeeds for logged-in family members+ — RLS blocks this view for everyone else
      const { data: familyData } = await supabase
        .from("persons_family")
        .select(
          "country, province, occupation, company, school, university, degree",
        )
        .eq("id", personId)
        .single();
      if (familyData) setFamilyExtra(familyData);

      // RLS automatically limits this to approved photos for anonymous/guest viewers,
      // and all of this person's photos for logged-in family members+
      const { data: photoData } = await supabase
        .from("photos")
        .select("id, caption, storage_path")
        .eq("person_id", personId)
        .order("created_at", { ascending: false });

      if (photoData) {
        setPhotos(
          photoData.map((p: any) => ({
            id: p.id,
            caption: p.caption,
            url: supabase.storage.from("photos").getPublicUrl(p.storage_path)
              .data.publicUrl,
          })),
        );
      }

      setLoading(false);
    }
    load();
  }, [personId]);

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-20 px-4 md:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <a
            href="/#tree"
            className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] mb-8"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back to Family Tree
          </a>

          {loading ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              Loading profile...
            </p>
          ) : !person ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              This person's profile could not be found.
            </p>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="w-24 h-24 rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center shrink-0">
                  {person.avatar_path ? (
                    <img
                      src={
                        supabase.storage
                          .from("photos")
                          .getPublicUrl(person.avatar_path).data.publicUrl
                      }
                      alt={person.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-[var(--color-navy)]/30 text-3xl"
                    />
                  )}
                </div>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-navy)]">
                    {person.full_name}
                  </h1>
                  {person.native_name && (
                    <p className="font-body text-[var(--color-ink)]/60 mt-0.5">
                      {person.native_name}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    {branchName && (
                      <span className="font-body text-xs font-medium text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full">
                        {branchName}
                      </span>
                    )}
                    <span
                      className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${
                        person.is_deceased
                          ? "bg-[var(--color-ink)]/10 text-[var(--color-ink)]/60"
                          : "bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]"
                      }`}
                    >
                      {person.is_deceased
                        ? `${person.birth_year ?? "?"}–${person.death_year ?? "?"}`
                        : person.birth_year
                          ? `Born ${person.birth_year}`
                          : "Living"}
                    </span>
                  </div>
                </div>
              </div>

              {person.biography && (
                <div className="mt-8">
                  <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-2">
                    Biography
                  </h2>
                  <p className="font-body text-sm text-[var(--color-ink)]/80 leading-relaxed whitespace-pre-line">
                    {person.biography}
                  </p>
                </div>
              )}

              {person.birth_place && (
                <div className="mt-6 flex items-center gap-2 font-body text-sm text-[var(--color-ink)]/70">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="text-[var(--color-gold)] text-xs"
                  />
                  Born in {person.birth_place}
                </div>
              )}

              {/* Family-tier info — only renders if the viewer is logged in */}
              {familyExtra && (
                <div className="mt-10 grid sm:grid-cols-2 gap-6">
                  {(familyExtra.country || familyExtra.province) && (
                    <div>
                      <h3 className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faLocationDot}
                          className="text-[10px]"
                        />
                        Current Location
                      </h3>
                      <p className="font-body text-sm text-[var(--color-ink)]/80">
                        {[familyExtra.province, familyExtra.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                  {(familyExtra.school ||
                    familyExtra.university ||
                    familyExtra.degree) && (
                    <div>
                      <h3 className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faGraduationCap}
                          className="text-[10px]"
                        />
                        Education
                      </h3>
                      <p className="font-body text-sm text-[var(--color-ink)]/80">
                        {[
                          familyExtra.degree,
                          familyExtra.university || familyExtra.school,
                        ]
                          .filter(Boolean)
                          .join(" — ")}
                      </p>
                    </div>
                  )}
                  {(familyExtra.occupation || familyExtra.company) && (
                    <div>
                      <h3 className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faBriefcase}
                          className="text-[10px]"
                        />
                        Career
                      </h3>
                      <p className="font-body text-sm text-[var(--color-ink)]/80">
                        {[familyExtra.occupation, familyExtra.company]
                          .filter(Boolean)
                          .join(" at ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!familyExtra && (
                <p className="font-body text-xs text-[var(--color-ink)]/45 mt-8 italic">
                  Log in as a family member to see education, career, and
                  location details.
                </p>
              )}

              {/* Photos */}
              {photos.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faImage}
                      className="text-[var(--color-gold)] text-sm"
                    />
                    Photos
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-xl overflow-hidden bg-[var(--color-navy)]/10"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption ?? ""}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
