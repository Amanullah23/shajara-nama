import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

export const revalidate = 0;

async function getPost(slug: string) {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post
      ? `${post.title} | Shajara Nama`
      : "Post Not Found | Shajara Nama",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <main>
      <Navbar />
      <article className="pt-32 pb-20 px-4 md:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 font-body text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] mb-8"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back to Blog
          </a>

          <span className="inline-flex items-center gap-2 font-body text-xs text-[var(--color-ink)]/50">
            <FontAwesomeIcon icon={faCalendar} className="text-[10px]" />
            {new Date(post.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-navy)] mt-3">
            {post.title}
          </h1>

          <div className="font-body text-[var(--color-ink)]/80 mt-8 space-y-5 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
