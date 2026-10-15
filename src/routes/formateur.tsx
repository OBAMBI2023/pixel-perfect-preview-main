import { createFileRoute } from "@tanstack/react-router";
import { EspaceFormateur } from "@/components/espace/EspaceFormateur";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { useGardeFormateur } from "@/lib/auth";

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
  const { status, user } = useGardeFormateur();

  return (
    <SiteLayout>
      <PageHero badge="Espace formateur" title="Suivi des apprenants" description="Crée tes groupes, partage le lien d'invitation et suis la progression de tes apprenants." />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {user ? <EspaceFormateur userId={user.id} /> : <p className="text-muted-foreground">{status === "loading" ? "Chargement…" : "Redirection…"}</p>}
      </div>
    </SiteLayout>
  );
}
