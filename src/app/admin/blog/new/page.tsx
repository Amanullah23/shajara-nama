"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewBlogPostPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError("Title, slug, and content are all required.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("blog_posts").insert({
      title,
      slug,
      excerpt: excerpt || null,
      content,
      published,
      author_id: user?.id ?? null,
    });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That slug is already in use — please choose a different one."
          : insertError.message,
      );
      return;
    }

    router.push("/admin/blog");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          New Post
        </h2>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          Write a new blog post for the family.
        </p>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-5 md:p-6 space-y-4">
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. A Trip Back to the Old Village"
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            URL Slug *
          </label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            placeholder="a-trip-back-to-the-old-village"
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
          <p className="font-body text-xs text-[var(--color-ink)]/45 mt-1.5">
            Will be published at /blog/{slug || "your-slug-here"}
          </p>
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Excerpt
          </label>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A short one or two sentence summary shown on the blog listing page"
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            Content *
          </label>
          <textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post here..."
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-y"
          />
          <p className="font-body text-xs text-[var(--color-ink)]/45 mt-1.5">
            Plain text — line breaks are preserved automatically on the
            published page.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-navy)]"
          />
          <span className="font-body text-sm font-medium text-[var(--color-navy)]">
            Publish immediately
          </span>
        </label>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[var(--color-ivory)]/95 backdrop-blur-sm border-t border-[var(--color-navy)]/10 px-4 md:px-8 py-4 flex items-center justify-end gap-3 z-30">
        <Link
          href="/admin/blog"
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
          {saving ? "Saving..." : published ? "Publish Post" : "Save Draft"}
        </button>
      </div>
    </form>
  );
}
