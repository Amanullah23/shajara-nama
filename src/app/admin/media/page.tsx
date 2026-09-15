"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faFileLines,
  faCloudArrowUp,
  faImage,
  faFilePdf,
  faFileWord,
  faFile,
  faTrash,
  faDownload,
  faCheck,
  faXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

type Photo = {
  id: string;
  caption: string | null;
  album: string | null;
  storage_path: string;
  url: string;
  is_approved_public: boolean;
};
type Doc = {
  id: string;
  name: string;
  storage_path: string;
  file_type: string | null;
};

type PendingDelete =
  | { kind: "photo"; item: Photo }
  | { kind: "doc"; item: Doc }
  | null;

export default function MediaPage() {
  const [tab, setTab] = useState<"photos" | "documents">("photos");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const withUrls = data.map((p: any) => {
        const { data: urlData } = supabase.storage
          .from("photos")
          .getPublicUrl(p.storage_path);
        return {
          id: p.id,
          caption: p.caption,
          album: p.album,
          storage_path: p.storage_path,
          url: urlData.publicUrl,
          is_approved_public: p.is_approved_public,
        };
      });
      setPhotos(withUrls);
    }
  }

  async function loadDocs() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setDocs(
        data.map((d: any) => ({
          id: d.id,
          name: d.name,
          storage_path: d.storage_path,
          file_type: d.file_type,
        })),
      );
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadPhotos(), loadDocs()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const bucket = tab === "photos" ? "photos" : "documents";
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        alert(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      if (tab === "photos") {
        await supabase.from("photos").insert({
          storage_path: path,
          caption: file.name.replace(/\.[^/.]+$/, ""),
          album: "Uncategorized",
          is_approved_public: false,
        });
      } else {
        await supabase.from("documents").insert({
          name: file.name,
          storage_path: path,
          file_type: file.name.split(".").pop() ?? null,
        });
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadAll();
  }

  async function toggleApproval(photo: Photo) {
    const { error } = await supabase
      .from("photos")
      .update({ is_approved_public: !photo.is_approved_public })
      .eq("id", photo.id);

    if (error) {
      alert(`Could not update: ${error.message}`);
      return;
    }

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photo.id
          ? { ...p, is_approved_public: !p.is_approved_public }
          : p,
      ),
    );
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);

    if (pendingDelete.kind === "photo") {
      const photo = pendingDelete.item;
      await supabase.storage.from("photos").remove([photo.storage_path]);
      await supabase.from("photos").delete().eq("id", photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } else {
      const doc = pendingDelete.item;
      await supabase.storage.from("documents").remove([doc.storage_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    }

    setDeleting(false);
    setPendingDelete(null);
  }

  async function downloadDoc(doc: Doc) {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);
    if (error || !data) {
      alert("Could not download this file.");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function docIcon(fileType: string | null) {
    if (fileType === "pdf") return faFilePdf;
    if (fileType === "doc" || fileType === "docx") return faFileWord;
    return faFile;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          Gallery & Documents
        </h2>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          Manage family photos, albums, and archived documents.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-navy)]/10">
        <button
          onClick={() => setTab("photos")}
          className={`inline-flex items-center gap-2 font-body text-sm font-medium px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            tab === "photos"
              ? "border-[var(--color-gold)] text-[var(--color-navy)]"
              : "border-transparent text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]/80"
          }`}
        >
          <FontAwesomeIcon icon={faImages} className="text-xs" />
          Photos ({photos.length})
        </button>
        <button
          onClick={() => setTab("documents")}
          className={`inline-flex items-center gap-2 font-body text-sm font-medium px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            tab === "documents"
              ? "border-[var(--color-gold)] text-[var(--color-navy)]"
              : "border-transparent text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]/80"
          }`}
        >
          <FontAwesomeIcon icon={faFileLines} className="text-xs" />
          Documents ({docs.length})
        </button>
      </div>

      {/* Upload zone */}
      <label className="bg-white/70 border-2 border-dashed border-[var(--color-navy)]/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-[var(--color-gold)]/50 transition-colors cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={tab === "photos" ? "image/*" : ".pdf,.doc,.docx"}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-full bg-[var(--color-navy)]/5 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faCloudArrowUp}
            className="text-[var(--color-navy)] text-lg"
          />
        </div>
        <div>
          <p className="font-body text-sm font-medium text-[var(--color-navy)]">
            {uploading
              ? "Uploading..."
              : tab === "photos"
                ? "Click to upload photos"
                : "Click to upload documents"}
          </p>
          <p className="font-body text-xs text-[var(--color-ink)]/50 mt-1">
            {tab === "photos"
              ? "JPG, PNG up to 10MB each"
              : "PDF, DOC, DOCX up to 20MB each"}
          </p>
        </div>
      </label>

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
          Loading...
        </p>
      ) : tab === "photos" ? (
        photos.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
            No photos yet — upload your first one above.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl bg-[var(--color-navy)]/10 border border-[var(--color-navy)]/10 overflow-hidden"
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <span className="font-body text-xs text-[var(--color-ivory)] truncate">
                    {photo.caption}
                  </span>
                  <span className="font-body text-[10px] text-[var(--color-ivory)]/60">
                    {photo.album}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setPendingDelete({ kind: "photo", item: photo })
                  }
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[var(--color-maroon)] text-[var(--color-ivory)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                </button>
                <button
                  onClick={() => toggleApproval(photo)}
                  className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity ${
                    photo.is_approved_public
                      ? "bg-[var(--color-emerald)] text-[var(--color-ivory)] opacity-100"
                      : "bg-white/90 text-[var(--color-ink)]/40 opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label={
                    photo.is_approved_public
                      ? "Approved for public — click to unapprove"
                      : "Approve for public"
                  }
                  title={
                    photo.is_approved_public
                      ? "Public"
                      : "Click to approve for public"
                  }
                >
                  <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : docs.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-10">
          No documents yet — upload your first one above.
        </p>
      ) : (
        <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl overflow-hidden">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--color-navy)]/5 last:border-0 hover:bg-[var(--color-navy)]/[0.02]"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)]/5 flex items-center justify-center shrink-0">
                <FontAwesomeIcon
                  icon={docIcon(doc.file_type)}
                  className="text-sm text-[var(--color-navy)]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm text-[var(--color-ink)]/90 truncate">
                  {doc.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => downloadDoc(doc)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                  aria-label="Download"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-xs" />
                </button>
                <button
                  onClick={() => setPendingDelete({ kind: "doc", item: doc })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10"
                  aria-label="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 flex items-center justify-center p-4"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-ivory)] rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-full bg-[var(--color-maroon)]/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="text-[var(--color-maroon)] text-lg"
                />
              </div>
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink)]/50 hover:bg-[var(--color-navy)]/5 disabled:opacity-40"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">
              {pendingDelete.kind === "photo"
                ? "Delete this photo?"
                : "Delete this document?"}
            </h3>
            <p className="font-body text-sm text-[var(--color-ink)]/60 mt-2">
              {pendingDelete.kind === "photo"
                ? `"${pendingDelete.item.caption || "This photo"}" will be permanently removed. This cannot be undone.`
                : `"${pendingDelete.item.name}" will be permanently removed. This cannot be undone.`}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="flex-1 font-body text-sm font-medium text-[var(--color-ink)]/70 py-2.5 rounded-full hover:bg-[var(--color-navy)]/5 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--color-maroon)] text-[var(--color-ivory)] font-body text-sm font-medium py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
