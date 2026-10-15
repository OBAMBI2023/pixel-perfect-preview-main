import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { resources } from "@/lib/content";

export const Route = createFileRoute("/ressources")({
  head: () => ({
    meta: [
      { title: "Ressources — IA et la Recherche" },
      { name: "description", content: "Guides, tutoriels, bibliothèque de prompts et articles pédagogiques." },
      { property: "og:title", content: "Ressources — IA et la Recherche" },
      { property: "og:description", content: "Bibliothèque de ressources pour la recherche assistée par IA." },
    ],
  }),
  component: Ressources,
});

function Ressources() {
  const [q, setQ] = useState("");
  const list = resources.filter((r) => (r.title + r.text + r.kind).toLowerCase().includes(q.toLowerCase()));
  return (
    <SiteLayout>
      <PageHero badge="Ressources" title="Bibliothèque de ressources" description="Guides, tutoriels, prompts et articles pour progresser à votre rythme." />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <label className="flex items-center gap-3 rounded-full bg-card px-5 py-3 shadow-card">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une ressource…" className="w-full bg-transparent outline-hidden" />
        </label>
        {list.length === 0 && <p className="mt-10 text-center text-muted-foreground">Aucune ressource ne correspond à votre recherche.</p>}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <article key={r.title} className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary"><FileText className="h-4 w-4" />{r.kind}</div>
              <h3 className="mt-3 text-lg font-bold text-navy">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </article>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
