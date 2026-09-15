"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUsers,
  faLocationDot,
  faGraduationCap,
  faBriefcase,
  faHeartPulse,
  faCross,
  faAddressBook,
  faFloppyDisk,
  faXmark,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type PersonOption = { id: string; full_name: string };
type BranchOption = { id: string; name: string };

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0">
          <FontAwesomeIcon
            icon={icon}
            className="text-[var(--color-ivory)] text-sm"
          />
        </div>
        <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-navy)]">
          {title}
        </h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [myRole, setMyRole] = useState<string | null>(null);
  const [requireApproval, setRequireApproval] = useState(false);
  const [submittedForApproval, setSubmittedForApproval] = useState(false);

  const [fullName, setFullName] = useState("");
  const [nativeName, setNativeName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [biography, setBiography] = useState("");
  const [branchId, setBranchId] = useState("");
  const [fatherId, setFatherId] = useState("");
  const [motherId, setMotherId] = useState("");
  const [spouseId, setSpouseId] = useState("");
  const [marriageDate, setMarriageDate] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [occupation, setOccupation] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState("");
  const [deathPlace, setDeathPlace] = useState("");
  const [burialLocation, setBurialLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [telegram, setTelegram] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [existingAvatarPath, setExistingAvatarPath] = useState<string | null>(
    null,
  );

  const [people, setPeople] = useState<PersonOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  // Track existing relationship row IDs so we can update/replace them cleanly
  const [existingRelIds, setExistingRelIds] = useState<{
    father?: string;
    mother?: string;
    spouse?: string;
  }>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const [
        { data: personData, error: personError },
        { data: personsData },
        { data: branchesData },
        { data: relData },
      ] = await Promise.all([
        supabase.from("persons").select("*").eq("id", personId).single(),
        supabase
          .from("persons")
          .select("id, full_name")
          .neq("id", personId)
          .order("full_name"),
        supabase.from("branches").select("id, name").order("name"),
        supabase.from("relationships").select("*").eq("person_id", personId),
      ]);

      if (personError || !personData) {
        setError(personError?.message ?? "Person not found.");
        setLoading(false);
        return;
      }

      setFullName(personData.full_name ?? "");
      setNativeName(personData.native_name ?? "");
      setNickname(personData.nickname ?? "");
      setGender(personData.gender ?? "");
      setBirthDate(personData.birth_date ?? "");
      setBirthPlace(personData.birth_place ?? "");
      setBloodGroup(personData.blood_group ?? "");
      setNationalId(personData.national_id ?? "");
      setBiography(personData.biography ?? "");
      setBranchId(personData.branch_id ?? "");
      setCountry(personData.country ?? "");
      setProvince(personData.province ?? "");
      setDistrict(personData.district ?? "");
      setVillage(personData.village ?? "");
      setPhone(personData.phone ?? "");
      setEmail(personData.email ?? "");
      setSchool(personData.school ?? "");
      setUniversity(personData.university ?? "");
      setDegree(personData.degree ?? "");
      setGraduationYear(personData.graduation_year?.toString() ?? "");
      setOccupation(personData.occupation ?? "");
      setCompany(personData.company ?? "");
      setPosition(personData.position ?? "");
      setAllergies(personData.allergies ?? "");
      setMedicalNotes(personData.medical_notes ?? "");
      setIsDeceased(personData.is_deceased ?? false);
      setDeathDate(personData.death_date ?? "");
      setDeathPlace(personData.death_place ?? "");
      setBurialLocation(personData.burial_location ?? "");
      setWhatsapp(personData.whatsapp ?? "");
      setFacebook(personData.facebook ?? "");
      setTelegram(personData.telegram ?? "");
      setLinkedin(personData.linkedin ?? "");

      // Avatar: load existing photo preview if one exists
      setExistingAvatarPath(personData.avatar_path ?? null);
      if (personData.avatar_path) {
        const { data: urlData } = supabase.storage
          .from("photos")
          .getPublicUrl(personData.avatar_path);
        setAvatarPreview(urlData.publicUrl);
      }

      if (personsData) setPeople(personsData);
      if (branchesData) setBranches(branchesData);

      const relIds: typeof existingRelIds = {};
      (relData ?? []).forEach((rel: any) => {
        if (rel.relationship_type === "father") {
          setFatherId(rel.related_person_id);
          relIds.father = rel.id;
        } else if (rel.relationship_type === "mother") {
          setMotherId(rel.related_person_id);
          relIds.mother = rel.id;
        } else if (rel.relationship_type === "spouse") {
          setSpouseId(rel.related_person_id);
          setMarriageDate(rel.marriage_date ?? "");
          relIds.spouse = rel.id;
        }
      });
      setExistingRelIds(relIds);

      setLoading(false);
    }

    loadData();
  }, [personId]);

  useEffect(() => {
    async function loadGatingInfo() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();
      if (roleData) setMyRole(roleData.role);

      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("require_approval_for_edits")
        .eq("id", 1)
        .single();
      if (settingsData)
        setRequireApproval(settingsData.require_approval_for_edits);
    }
    loadGatingInfo();
  }, []);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);

    // Upload new avatar if one was selected, otherwise keep the existing path
    let avatarPath: string | null = existingAvatarPath;
    if (avatarFile) {
      const path = `avatars/${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, avatarFile, { cacheControl: "31536000", upsert: false });
      if (uploadError) {
        setSaving(false);
        setError(`Photo upload failed: ${uploadError.message}`);
        return;
      }
      avatarPath = path;
    }

    const needsApproval = myRole === "editor" && requireApproval;

    if (needsApproval) {
      const proposedData = {
        full_name: fullName,
        avatar_path: avatarPath,
        native_name: nativeName || null,
        nickname: nickname || null,
        gender: gender || null,
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        blood_group: bloodGroup || null,
        national_id: nationalId || null,
        biography: biography || null,
        branch_id: branchId || null,
        country: country || null,
        province: province || null,
        district: district || null,
        village: village || null,
        phone: phone || null,
        email: email || null,
        school: school || null,
        university: university || null,
        degree: degree || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        occupation: occupation || null,
        company: company || null,
        position: position || null,
        allergies: allergies || null,
        medical_notes: medicalNotes || null,
        is_deceased: isDeceased,
        death_date: isDeceased ? deathDate || null : null,
        death_place: isDeceased ? deathPlace || null : null,
        burial_location: isDeceased ? burialLocation || null : null,
        whatsapp: whatsapp || null,
        facebook: facebook || null,
        telegram: telegram || null,
        linkedin: linkedin || null,
        father_id: fatherId || null,
        mother_id: motherId || null,
        spouse_id: spouseId || null,
        marriage_date: marriageDate || null,
      };

      const { data: userData } = await supabase.auth.getUser();
      const { error: pendingError } = await supabase
        .from("pending_edits")
        .insert({
          action: "update",
          person_id: personId,
          proposed_data: proposedData,
          submitted_by: userData.user?.id,
        });

      setSaving(false);

      if (pendingError) {
        setError(pendingError.message);
        return;
      }

      setSubmittedForApproval(true);
      return;
    }

    const { error: updateError } = await supabase
      .from("persons")
      .update({
        full_name: fullName,
        avatar_path: avatarPath,
        native_name: nativeName || null,
        nickname: nickname || null,
        gender: gender || null,
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        blood_group: bloodGroup || null,
        national_id: nationalId || null,
        biography: biography || null,
        branch_id: branchId || null,
        country: country || null,
        province: province || null,
        district: district || null,
        village: village || null,
        phone: phone || null,
        email: email || null,
        school: school || null,
        university: university || null,
        degree: degree || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        occupation: occupation || null,
        company: company || null,
        position: position || null,
        allergies: allergies || null,
        medical_notes: medicalNotes || null,
        is_deceased: isDeceased,
        death_date: isDeceased ? deathDate || null : null,
        death_place: isDeceased ? deathPlace || null : null,
        burial_location: isDeceased ? burialLocation || null : null,
        whatsapp: whatsapp || null,
        facebook: facebook || null,
        telegram: telegram || null,
        linkedin: linkedin || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", personId);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    // Upsert relationships: update existing rows, insert new ones, delete cleared ones
    async function syncRelationship(
      type: "father" | "mother" | "spouse",
      relatedId: string,
      existingId: string | undefined,
      extra: Record<string, any> = {},
    ) {
      if (!relatedId && existingId) {
        await supabase.from("relationships").delete().eq("id", existingId);
      } else if (relatedId && existingId) {
        await supabase
          .from("relationships")
          .update({ related_person_id: relatedId, ...extra })
          .eq("id", existingId);
      } else if (relatedId && !existingId) {
        await supabase.from("relationships").insert({
          person_id: personId,
          related_person_id: relatedId,
          relationship_type: type,
          ...extra,
        });
      }
    }

    await Promise.all([
      syncRelationship("father", fatherId, existingRelIds.father),
      syncRelationship("mother", motherId, existingRelIds.mother),
      syncRelationship("spouse", spouseId, existingRelIds.spouse, {
        marriage_date: marriageDate || null,
      }),
    ]);

    setSaving(false);
    router.push("/admin/members");
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading person...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            Edit Person
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
            Update {fullName}'s profile information.
          </p>
        </div>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {submittedForApproval && (
        <div className="font-body text-sm text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded-xl px-4 py-3">
          Submitted for admin approval. You'll be notified once it's reviewed.
        </div>
      )}

      <SectionCard icon={faUser} title="Basic Information">
        {/* Avatar upload */}
        <div className="sm:col-span-2 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[var(--color-navy)]/10 border border-[var(--color-navy)]/15 overflow-hidden flex items-center justify-center shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <FontAwesomeIcon
                icon={faUser}
                className="text-[var(--color-navy)]/30 text-2xl"
              />
            )}
          </div>
          <label className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-navy)] bg-[var(--color-navy)]/5 px-4 py-2.5 rounded-full hover:bg-[var(--color-navy)]/10 transition-colors cursor-pointer">
            <FontAwesomeIcon icon={faCamera} className="text-xs" />
            {avatarFile || avatarPreview ? "Change Photo" : "Upload Photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Full Name *
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Native Name
          </label>
          <input
            value={nativeName}
            onChange={(e) => setNativeName(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Nickname
          </label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Birth Date
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Birth Place
          </label>
          <input
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Blood Group
          </label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">Select...</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            National ID
          </label>
          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Family Branch
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">None yet</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Biography
          </label>
          <textarea
            rows={4}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
          />
        </div>
      </SectionCard>

      <SectionCard icon={faUsers} title="Family Relationships">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Father
          </label>
          <select
            value={fatherId}
            onChange={(e) => setFatherId(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">None</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Mother
          </label>
          <select
            value={motherId}
            onChange={(e) => setMotherId(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">None</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Spouse
          </label>
          <select
            value={spouseId}
            onChange={(e) => setSpouseId(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="">None</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Marriage Date
          </label>
          <input
            type="date"
            value={marriageDate}
            onChange={(e) => setMarriageDate(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <SectionCard icon={faLocationDot} title="Current Information">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Country
          </label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Province
          </label>
          <input
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            District
          </label>
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Village
          </label>
          <input
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <SectionCard icon={faGraduationCap} title="Education">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            School
          </label>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            University
          </label>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Degree
          </label>
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Graduation Year
          </label>
          <input
            type="number"
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <SectionCard icon={faBriefcase} title="Career">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Occupation
          </label>
          <input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Company
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Position
          </label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <SectionCard icon={faHeartPulse} title="Medical Information (Private)">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Allergies
          </label>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Medical Notes
          </label>
          <input
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isDeceased}
            onChange={(e) => setIsDeceased(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-navy)]"
          />
          <span className="font-body text-sm font-medium text-[var(--color-navy)]">
            This person is deceased
          </span>
        </label>

        {isDeceased && (
          <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-[var(--color-navy)]/10">
            <div className="flex items-center gap-2 sm:col-span-2 mb-1">
              <FontAwesomeIcon
                icon={faCross}
                className="text-[var(--color-ink)]/50 text-sm"
              />
              <span className="font-body text-sm text-[var(--color-ink)]/70">
                Death Information
              </span>
            </div>
            <div>
              <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                Date of Death
              </label>
              <input
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
            </div>
            <div>
              <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                Place of Death
              </label>
              <input
                value={deathPlace}
                onChange={(e) => setDeathPlace(e.target.value)}
                className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
                Burial Location
              </label>
              <input
                value={burialLocation}
                onChange={(e) => setBurialLocation(e.target.value)}
                className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      <SectionCard icon={faAddressBook} title="Social & Contact">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            WhatsApp
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Facebook
          </label>
          <input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Telegram
          </label>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            LinkedIn
          </label>
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </SectionCard>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[var(--color-ivory)]/95 backdrop-blur-sm border-t border-[var(--color-navy)]/10 px-4 md:px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-2 font-body text-sm font-medium text-[var(--color-ink)]/70 px-5 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
