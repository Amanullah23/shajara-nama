import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

async function getPosts() {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-20 px-4 md:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <span className="font-body text-xs tracking-wide uppercase text-[var(--color-maroon)]">
            Journal
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-[var(--color-navy)] mt-3">
            Family Blog
          </h1>
          <p className="font-body text-[var(--color-ink)]/70 mt-3">
            Updates, stories, and reflections from the family.
          </p>

          {posts.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              No posts published yet.
            </p>
          ) : (
            <div className="space-y-5 mt-10">
              {posts.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-6 hover:border-[var(--color-gold)]/50 hover:shadow-md transition-all duration-300"
                >
                  <span className="inline-flex items-center gap-2 font-body text-xs text-[var(--color-ink)]/50">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-[10px]"
                    />
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <h2 className="font-display text-xl font-semibold text-[var(--color-navy)] mt-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="font-body text-sm text-[var(--color-ink)]/70 mt-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-gold)] mt-4 group-hover:gap-2.5 transition-all">
                    Read more
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
