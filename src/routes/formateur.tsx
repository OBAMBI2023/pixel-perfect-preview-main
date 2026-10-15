import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EspaceFormateur } from "@/components/espace/EspaceFormateur";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/formateur")({
  head: () => ({
    meta: [
      { title: "Espace formateur — IA et la Recherche" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Formateur,
});

function Formateur() {
  const { status, user, profile } = useAuth();
  const navigate = useNavigate();
  const autorise = status === "ready" && !!user && profile?.role === "formateur";

  // La session n'existe que dans le navigateur : la vérification se fait ici, puis la RLS protège les données.
  useEffect(() => {
    if (status !== "ready") return;
    if (!user) void navigate({ to: "/connexion", replace: true });
    else if (profile?.role !== "formateur") void navigate({ to: "/mon-espace", replace: true });
  }, [status, user, profile, navigate]);

  return (
    <SiteLayout>
      <PageHero badge="Espace formateur" title="Suivi des apprenants" description="Crée tes groupes, partage le code d'invitation et suis la progression de tes apprenants." />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {autorise ? <EspaceFormateur userId={user.id} /> : <p className="text-muted-foreground">{status === "loading" ? "Chargement…" : "Redirection…"}</p>}
      </div>
    </SiteLayout>
  );
}
