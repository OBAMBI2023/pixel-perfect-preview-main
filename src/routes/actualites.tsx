import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { news } from "@/lib/content";

export const Route = createFileRoute("/actualites")({
  head: () => ({
    meta: [
      { title: "Actualités — IA et la Recherche" },
      { name: "description", content: "Les tendances de l'IA dans la recherche scientifique." },
      { property: "og:title", content: "Actualités — IA et la Recherche" },
      { property: "og:description", content: "Suivez les évolutions de l'IA appliquée à la recherche." },
    ],
  }),
  component: Actualites,
});

function Actualites() {
  return (
    <SiteLayout>
      <PageHero badge="Actualités" title="Ce qui change dans la recherche" description="Les grandes tendances de l'IA appliquée à la science." />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-3 md:px-8">
        {news.map((n) => (
          <article key={n.title} className="rounded-2xl bg-card p-6 shadow-card">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{n.tag}</span>
            <h3 className="mt-4 text-lg font-bold text-navy">{n.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{n.text}</p>
          </article>
        ))}
      </div>
    </SiteLayout>
  );
}
