"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (fetchError || !data) {
        setError(fetchError?.message ?? "Post not found.");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt ?? "");
      setContent(data.content);
      setPublished(data.published);
      setLoading(false);
    }
    loadPost();
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError("Title, slug, and content are all required.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.code === "23505"
          ? "That slug is already in use — please choose a different one."
          : updateError.message,
      );
      return;
    }

    router.push("/admin/blog");
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
        Loading post...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
          Edit Post
        </h2>
        <p className="font-body text-[var(--color-ink)]/60 mt-1 text-sm">
          Update this blog post.
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
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-sm text-[var(--color-navy)] mb-1.5 block">
            URL Slug *
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
          <p className="font-body text-xs text-[var(--color-ink)]/45 mt-1.5">
            Published at /blog/{slug}
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
            className="w-full font-body text-sm bg-[var(--color-ivory)] border border-[var(--color-navy)]/15 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-y"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-navy)]"
          />
          <span className="font-body text-sm font-medium text-[var(--color-navy)]">
            Published
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
          className="inline-flex cursor-pointer items-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
