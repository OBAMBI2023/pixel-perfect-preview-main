import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Se connecter — IA et la Recherche" },
      { name: "description", content: "Espace apprenant de la plateforme IA et la Recherche." },
      { property: "og:title", content: "Se connecter — IA et la Recherche" },
      { property: "og:description", content: "Accédez à votre espace apprenant." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold text-navy">Espace apprenant</h1>
          <p className="mt-3 text-muted-foreground">Les comptes personnels arrivent bientôt. En attendant, votre progression aux exercices est enregistrée sur cet appareil.</p>
          <Link to="/exercices" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Accéder aux exercices</Link>
        </div>
      </div>
    </SiteLayout>
  );
}
