import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — IA et la Recherche" },
      { name: "description", content: "La mission de la plateforme IA et la Recherche." },
      { property: "og:title", content: "À propos — IA et la Recherche" },
      { property: "og:description", content: "Aider chercheurs et étudiants à utiliser l'IA de façon responsable." },
    ],
  }),
  component: About,
});

const values = [
  { t: "Comprendre", d: "Démystifier l'IA et ses mécanismes pour en faire un usage éclairé." },
  { t: "Explorer", d: "Découvrir les outils et méthodes qui transforment chaque étape de la recherche." },
  { t: "Innover", d: "Mettre l'IA au service d'une science plus ouverte, rapide et impactante." },
];

function About() {
  return (
    <SiteLayout>
      <PageHero badge="À propos" title="Notre mission" description="Permettre à chacun de découvrir, apprendre, pratiquer et maîtriser l'intelligence artificielle appliquée à la recherche, de façon responsable." />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-3 md:px-8">
        {values.map((v) => (
          <div key={v.t} className="rounded-2xl bg-card p-7 shadow-card">
            <h3 className="text-2xl font-bold text-primary">{v.t}</h3>
            <p className="mt-2 text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
