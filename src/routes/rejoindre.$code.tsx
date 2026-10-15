import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, LogIn, UserPlus, Users } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { btnPrimary, btnSecondary } from "@/components/espace/styles";
import { Message } from "@/components/espace/ui";
import { useAuth } from "@/lib/auth";
import { codeValide, erreurRejoindre, memoriserInvitation, normaliserCode, oublierInvitation } from "@/lib/invitation";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/rejoindre/$code")({
  head: () => ({
    meta: [
      { title: "Rejoindre un groupe — IA et la Recherche" },
      { name: "description", content: "Rejoins le groupe de ton formateur pour qu'il suive ta progression." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Rejoindre,
});

function Cadre({ children }: { children: ReactNode }) {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">{children}</div>
      </div>
    </SiteLayout>
  );
}

function Rejoindre() {
  const code = normaliserCode(Route.useParams().code);
  const valide = codeValide(code);
  const { status, configured, user, profile } = useAuth();
  const qc = useQueryClient();
  const lance = useRef(false);
  const estFormateur = profile?.role === "formateur";

  const rejoindre = useMutation({
    mutationFn: async () => {
      const { data, error } = await getSupabase()!.rpc("rejoindre_groupe", { p_code: code });
      if (error) throw new Error(erreurRejoindre(error.message));
      return data[0];
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mes-groupes"] });
      void qc.invalidateQueries({ queryKey: ["mes-devoirs"] });
    },
    onSettled: oublierInvitation,
  });

  useEffect(() => {
    if (!valide || status !== "ready") return;
    // Pas encore connecté : on garde le code pour le reprendre après la connexion ou l'inscription.
    if (!user) return memoriserInvitation(code);
    if (estFormateur) return oublierInvitation();
    if (lance.current) return;
    lance.current = true;
    rejoindre.mutate();
  }, [valide, status, user, estFormateur, code, rejoindre]);

  if (!valide) {
    return (
      <Cadre>
        <h1 className="text-2xl font-bold text-navy">Lien d'invitation invalide</h1>
        <p className="mt-3 text-sm text-muted-foreground">Vérifie le lien reçu de ton formateur, ou saisis son code dans ton espace.</p>
        <Link to="/mon-espace" className={`${btnPrimary} mt-6`}>Aller à mon espace</Link>
      </Cadre>
    );
  }
  if (status === "loading") return <Cadre><p className="text-muted-foreground">Chargement…</p></Cadre>;
  if (!configured) return <Cadre><Message>Les comptes ne sont pas encore configurés sur ce site.</Message></Cadre>;

  if (!user) {
    return (
      <Cadre>
        <Users className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Rejoindre un groupe</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ton formateur t'invite à rejoindre son groupe (code <strong className="font-mono tracking-widest text-foreground">{code}</strong>).
          Connecte-toi ou crée ton compte : tu rejoindras le groupe automatiquement.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/connexion" search={{ invitation: code }} className={btnPrimary}><LogIn className="h-4 w-4" /> Se connecter</Link>
          <Link to="/inscription" search={{ invitation: code }} className={btnSecondary}><UserPlus className="h-4 w-4" /> Créer un compte</Link>
        </div>
      </Cadre>
    );
  }

  if (estFormateur) {
    return (
      <Cadre>
        <h1 className="text-2xl font-bold text-navy">Lien réservé aux apprenants</h1>
        <p className="mt-3 text-sm text-muted-foreground">Ce compte est un compte formateur : ce lien sert à tes apprenants pour rejoindre ton groupe.</p>
        <Link to="/formateur" className={`${btnPrimary} mt-6`}>Espace formateur</Link>
      </Cadre>
    );
  }

  if (rejoindre.isError) {
    return (
      <Cadre>
        <h1 className="text-2xl font-bold text-navy">Impossible de rejoindre le groupe</h1>
        <div className="mt-4 text-left"><Message ton="erreur">{rejoindre.error.message}</Message></div>
        <Link to="/mon-espace" className={`${btnPrimary} mt-6`}>Aller à mon espace</Link>
      </Cadre>
    );
  }

  if (rejoindre.isSuccess) {
    return (
      <Cadre>
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Bienvenue dans « {rejoindre.data?.nom} » !</h1>
        <p className="mt-3 text-sm text-muted-foreground">Ton formateur peut maintenant suivre ta progression et t'assigner des travaux.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/mon-espace" className={btnPrimary}>Voir mon espace</Link>
          <Link to="/exercices" className={btnSecondary}>Commencer les exercices</Link>
        </div>
      </Cadre>
    );
  }

  return <Cadre><p className="text-muted-foreground">Inscription au groupe…</p></Cadre>;
}
