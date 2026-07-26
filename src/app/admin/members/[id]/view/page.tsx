"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPen,
  faArrowLeft,
  faPrint,
  faArrowUpRightFromSquare,
  faLocationDot,
  faGraduationCap,
  faBriefcase,
  faHeartPulse,
  faAddressBook,
  faImage,
  faFileLines,
  faClockRotateLeft,
  faUsers,
  faCross,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type Person = {
  id: string;
  full_name: string;
  native_name: string | null;
  nickname: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  biography: string | null;
  branch_id: string | null;
  is_deceased: boolean;
  death_date: string | null;
  death_place: string | null;
  burial_location: string | null;
  country: string | null;
  province: string | null;
  district: string | null;
  village: string | null;
  phone: string | null;
  email: string | null;
  school: string | null;
  university: string | null;
  degree: string | null;
  graduation_year: number | null;
  occupation: string | null;
  company: string | null;
  position: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_notes: string | null;
  whatsapp: string | null;
  facebook: string | null;
  telegram: string | null;
  linkedin: string | null;
  avatar_path: string | null;
  national_id: string | null;
};

type RelPerson = { id: string; full_name: string };
type Photo = { id: string; caption: string | null; url: string };
type Doc = { id: string; name: string };
type HistoryItem = { id: string; text: string; created_at: string };

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ViewPersonPage() {
  const params = useParams();
  const personId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [father, setFather] = useState<RelPerson | null>(null);
  const [mother, setMother] = useState<RelPerson | null>(null);
  const [spouse, setSpouse] = useState<RelPerson | null>(null);
  const [children, setChildren] = useState<RelPerson[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: p } = await supabase
        .from("persons")
        .select("*")
        .eq("id", personId)
        .single();
      if (!p) {
        setLoading(false);
        return;
      }
      setPerson(p);

      const tasks: any[] = [];

      if (p.branch_id) {
        tasks.push(
          supabase
            .from("branches")
            .select("name")
            .eq("id", p.branch_id)
            .single()
            .then(({ data }) => {
              if (data) setBranchName(data.name);
            }),
        );
      }

      tasks.push(
        supabase
          .from("relationships")
          .select(
            "relationship_type, related_person_id, person_id, persons_related:related_person_id(id, full_name), persons_child:person_id(id, full_name)",
          )
          .or(`person_id.eq.${personId},related_person_id.eq.${personId}`)
          .then(({ data }) => {
            if (!data) return;
            data.forEach((rel: any) => {
              if (
                rel.person_id === personId &&
                rel.relationship_type === "father"
              ) {
                setFather(rel.persons_related);
              } else if (
                rel.person_id === personId &&
                rel.relationship_type === "mother"
              ) {
                setMother(rel.persons_related);
              } else if (
                rel.person_id === personId &&
                rel.relationship_type === "spouse"
              ) {
                setSpouse(rel.persons_related);
              } else if (
                rel.related_person_id === personId &&
                rel.relationship_type === "father"
              ) {
                setChildren((prev) => [...prev, rel.persons_child]);
              } else if (
                rel.related_person_id === personId &&
                rel.relationship_type === "spouse"
              ) {
                setSpouse(rel.persons_child);
              }
            });
          }),
      );

      tasks.push(
        supabase
          .from("photos")
          .select("id, caption, storage_path")
          .eq("person_id", personId)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) {
              setPhotos(
                data.map((ph: any) => ({
                  id: ph.id,
                  caption: ph.caption,
                  url: supabase.storage
                    .from("photos")
                    .getPublicUrl(ph.storage_path).data.publicUrl,
                })),
              );
            }
          }),
      );

      tasks.push(
        supabase
          .from("documents")
          .select("id, name")
          .eq("owner_person_id", personId)
          .then(({ data }) => {
            if (data) setDocs(data);
          }),
      );

      tasks.push(
        supabase
          .from("notifications")
          .select("id, text, created_at")
          .eq("related_person_id", personId)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data }) => {
            if (data) setHistory(data);
          }),
      );

      await Promise.all(tasks);
      setLoading(false);
    }
    load();
  }, [personId]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading profile...
      </p>
    );
  }

  if (!person) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Person not found.
      </p>
    );
  }

  const avatarUrl = person.avatar_path
    ? supabase.storage.from("photos").getPublicUrl(person.avatar_path).data
        .publicUrl
    : null;

  return (
    <div className="space-y-6 pb-8" id="printable-bio">
      {/* Top bar — hidden when printing; wraps on mobile instead of overflowing */}
      <div className="flex flex-col gap-3 no-print">
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] self-start"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back to Members
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/person/${person.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-xs sm:text-sm font-medium text-[var(--color-navy)] bg-[var(--color-navy)]/5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-[var(--color-navy)]/10 transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="text-xs"
            />
            <span className="hidden xs:inline">View Public Profile</span>
            <span className="xs:hidden">Public Profile</span>
          </a>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 font-body text-xs sm:text-sm font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-[var(--color-emerald)]/20 transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faDownload} className="text-xs" />
            <span className="hidden xs:inline">Print / Save as PDF</span>
            <span className="xs:hidden">Print</span>
          </button>
          <Link
            href={`/admin/members/${person.id}/edit`}
            className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
            Edit
          </Link>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left print:border-none print:bg-transparent">
        <div className="w-24 h-24 rounded-full bg-[var(--color-navy)]/10 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={person.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              className="text-[var(--color-navy)]/30 text-4xl"
            />
          )}
        </div>
        <div className="flex-1 min-w-0 w-full">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-navy)] break-words">
            {person.full_name}
          </h1>
          {person.native_name && (
            <p className="font-body text-[var(--color-ink)]/60 mt-0.5 break-words">
              {person.native_name}
            </p>
          )}
          {person.nickname && (
            <p className="font-body text-sm text-[var(--color-ink)]/50 mt-0.5">
              "{person.nickname}"
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
              {person.is_deceased ? "Deceased" : "Living"}
            </span>
            {person.gender && (
              <span className="font-body text-xs font-medium text-[var(--color-navy)] bg-[var(--color-navy)]/5 px-2.5 py-1 rounded-full capitalize">
                {person.gender}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 justify-center sm:justify-start">
            {fmtDate(person.birth_date) && (
              <span className="font-body text-xs text-[var(--color-ink)]/60">
                Born {fmtDate(person.birth_date)}
              </span>
            )}
            {person.birth_place && (
              <span className="font-body text-xs text-[var(--color-ink)]/60">
                in {person.birth_place}
              </span>
            )}
            {person.is_deceased && fmtDate(person.death_date) && (
              <span className="font-body text-xs text-[var(--color-ink)]/60">
                Died {fmtDate(person.death_date)}
              </span>
            )}
          </div>
        </div>
      </div>

      {person.biography && (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-2">
            Biography
          </h2>
          <p className="font-body text-sm text-[var(--color-ink)]/80 leading-relaxed whitespace-pre-line">
            {person.biography}
          </p>
        </div>
      )}

      {/* Family */}
      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
        <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-[var(--color-gold)] text-sm"
          />
          Family
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {father && (
            <div>
              <p className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50">
                Father
              </p>
              <p className="font-body text-sm text-[var(--color-ink)]/85 mt-0.5">
                {father.full_name}
              </p>
            </div>
          )}
          {mother && (
            <div>
              <p className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50">
                Mother
              </p>
              <p className="font-body text-sm text-[var(--color-ink)]/85 mt-0.5">
                {mother.full_name}
              </p>
            </div>
          )}
          {spouse && (
            <div>
              <p className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50">
                Spouse
              </p>
              <p className="font-body text-sm text-[var(--color-ink)]/85 mt-0.5">
                {spouse.full_name}
              </p>
            </div>
          )}
          {children.length > 0 && (
            <div>
              <p className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50">
                Children
              </p>
              <p className="font-body text-sm text-[var(--color-ink)]/85 mt-0.5">
                {children.map((c) => c.full_name).join(", ")}
              </p>
            </div>
          )}
          {!father && !mother && !spouse && children.length === 0 && (
            <p className="font-body text-sm text-[var(--color-ink)]/50">
              No family relationships recorded yet.
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Location */}
        {(person.country || person.province || person.village) && (
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
            <h2 className="font-display text-base font-semibold text-[var(--color-navy)] mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="text-[var(--color-gold)] text-sm"
              />
              Location
            </h2>
            <p className="font-body text-sm text-[var(--color-ink)]/80">
              {[
                person.village,
                person.district,
                person.province,
                person.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {/* Education */}
        {(person.school || person.university || person.degree) && (
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
            <h2 className="font-display text-base font-semibold text-[var(--color-navy)] mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faGraduationCap}
                className="text-[var(--color-gold)] text-sm"
              />
              Education
            </h2>
            <p className="font-body text-sm text-[var(--color-ink)]/80">
              {[person.degree, person.university || person.school]
                .filter(Boolean)
                .join(" — ")}
              {person.graduation_year && ` (${person.graduation_year})`}
            </p>
          </div>
        )}

        {/* Career */}
        {(person.occupation || person.company) && (
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
            <h2 className="font-display text-base font-semibold text-[var(--color-navy)] mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faBriefcase}
                className="text-[var(--color-gold)] text-sm"
              />
              Career
            </h2>
            <p className="font-body text-sm text-[var(--color-ink)]/80">
              {[person.position, person.occupation].filter(Boolean).join(", ")}
              {person.company && ` at ${person.company}`}
            </p>
          </div>
        )}

        {/* Contact — admin-only sensitive info, still included in the printed PDF since this is an internal admin document */}
        {(person.phone || person.email || person.whatsapp) && (
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
            <h2 className="font-display text-base font-semibold text-[var(--color-navy)] mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faAddressBook}
                className="text-[var(--color-gold)] text-sm"
              />
              Contact
            </h2>
            <div className="space-y-1">
              {person.phone && (
                <p className="font-body text-sm text-[var(--color-ink)]/80 break-words">
                  Phone: {person.phone}
                </p>
              )}
              {person.email && (
                <p className="font-body text-sm text-[var(--color-ink)]/80 break-words">
                  Email: {person.email}
                </p>
              )}
              {person.whatsapp && (
                <p className="font-body text-sm text-[var(--color-ink)]/80 break-words">
                  WhatsApp: {person.whatsapp}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Medical — private */}
        {(person.blood_group || person.allergies || person.medical_notes) && (
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
            <h2 className="font-display text-base font-semibold text-[var(--color-navy)] mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faHeartPulse}
                className="text-[var(--color-gold)] text-sm"
              />
              Medical (Private)
            </h2>
            <div className="space-y-1">
              {person.blood_group && (
                <p className="font-body text-sm text-[var(--color-ink)]/80">
                  Blood Group: {person.blood_group}
                </p>
              )}
              {person.allergies && (
                <p className="font-body text-sm text-[var(--color-ink)]/80">
                  Allergies: {person.allergies}
                </p>
              )}
              {person.medical_notes && (
                <p className="font-body text-sm text-[var(--color-ink)]/80">
                  {person.medical_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Death info */}
        {person.is_deceased &&
          (person.death_place || person.burial_location) && (
            <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
              <h2 className="font-display text-base font-semibold text-[var(--color-navy)] mb-3 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCross}
                  className="text-[var(--color-ink)]/50 text-sm"
                />
                In Memoriam
              </h2>
              <div className="space-y-1">
                {person.death_place && (
                  <p className="font-body text-sm text-[var(--color-ink)]/80">
                    Place: {person.death_place}
                  </p>
                )}
                {person.burial_location && (
                  <p className="font-body text-sm text-[var(--color-ink)]/80">
                    Burial: {person.burial_location}
                  </p>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 print:border-none print:bg-transparent print:px-0">
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4 flex items-center gap-2">
            <FontAwesomeIcon
              icon={faImage}
              className="text-[var(--color-gold)] text-sm"
            />
            Photos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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

      {/* Documents — hidden from print, admin reference only */}
      {docs.length > 0 && (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 no-print">
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4 flex items-center gap-2">
            <FontAwesomeIcon
              icon={faFileLines}
              className="text-[var(--color-gold)] text-sm"
            />
            Documents
          </h2>
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="font-body text-sm text-[var(--color-ink)]/80 break-words"
              >
                {doc.name}
              </li>
            ))}
          </ul>
          <Link
            href="/admin/media"
            className="inline-block font-body text-xs text-[var(--color-navy)] underline mt-3"
          >
            Manage documents in Gallery & Documents →
          </Link>
        </div>
      )}

      {/* History — hidden from print */}
      {history.length > 0 && (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 sm:p-6 no-print">
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)] mb-4 flex items-center gap-2">
            <FontAwesomeIcon
              icon={faClockRotateLeft}
              className="text-[var(--color-gold)] text-sm"
            />
            Activity History
          </h2>
          <ul className="space-y-3">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3 pb-3 border-b border-[var(--color-navy)]/5 last:border-0 last:pb-0"
              >
                <span className="font-body text-sm text-[var(--color-ink)]/80">
                  {h.text}
                </span>
                <span className="font-body text-xs text-[var(--color-ink)]/45 whitespace-nowrap">
                  {new Date(h.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
