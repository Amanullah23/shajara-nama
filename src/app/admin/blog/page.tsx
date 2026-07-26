"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPen,
  faTrash,
  faEye,
  faEyeSlash,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published: boolean;
  created_at: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadPosts() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, published, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setPosts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function togglePublished(post: Post) {
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ published: !post.published })
      .eq("id", post.id);

    if (updateError) {
      alert(`Could not update: ${updateError.message}`);
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, published: !p.published } : p,
      ),
    );
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);

    const { error: deleteError } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", pendingDelete.id);

    setDeleting(false);

    if (deleteError) {
      alert(`Could not delete: ${deleteError.message}`);
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-(--color-navy)">
            Blog
          </h2>
          <p className="font-body `text-ink/60` mt-1 text-sm">
            {loading
              ? "Loading..."
              : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center justify-center gap-2 bg-[var(--color-navy)] text-[var(--color-ivory)] font-body text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--color-navy-light)] transition-colors duration-300 whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          New Post
        </Link>
      </div>

      {error && (
        <div className="font-body text-sm text-[var(--color-maroon)] bg-[var(--color-maroon)]/10 rounded-xl px-4 py-3">
          Couldn't load posts: {error}
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          Loading posts...
        </p>
      ) : posts.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
          No posts yet — click "New Post" to write your first one.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-4 md:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-body text-sm font-medium text-[var(--color-ink)]/90 truncate">
                      {post.title}
                    </h3>
                    <span
                      className={`font-body text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        post.published
                          ? "bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]"
                          : "bg-[var(--color-ink)]/10 text-[var(--color-ink)]/60"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {post.excerpt && (
                    <p className="font-body text-xs text-[var(--color-ink)]/60 mt-1 line-clamp-1">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-[var(--color-ink)]/45 mt-2">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-[10px]"
                    />
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => togglePublished(post)}
                    className="w-8 cursor-pointer h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                    aria-label={post.published ? "Unpublish" : "Publish"}
                    title={post.published ? "Unpublish" : "Publish"}
                  >
                    <FontAwesomeIcon
                      icon={post.published ? faEyeSlash : faEye}
                      className="text-xs"
                    />
                  </button>
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-navy)] hover:bg-[var(--color-navy)]/10"
                    aria-label="Edit"
                  >
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                  </Link>
                  <button
                    onClick={() => setPendingDelete(post)}
                    className="w-8 cursor-pointer h-8 rounded-lg flex items-center justify-center text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/10"
                    aria-label="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Delete this post?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed. This cannot be undone.`
            : ""
        }
        deleting={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
