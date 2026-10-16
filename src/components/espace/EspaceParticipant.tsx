import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { BarChart3, FlaskConical, LogIn, PenLine, UserPlus, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { btnPrimary, btnSecondary } from "@/components/espace/styles";
import { Carte } from "@/components/espace/ui";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@/lib/supabase";

/** Pages personnelles du participant connecté (menu du compte, onglets en haut de chaque page). */
export const PAGES_PARTICIPANT = [
  { to: "/espace-recherche", label: "Mon espace de recherche", court: "Recherche", icone: FlaskConical },
  { to: "/profil-chercheur", label: "Mon profil chercheur", court: "Profil", icone: UserRound },
  { to: "/mes-exercices", label: "Mes exercices", court: "Exercices", icone: PenLine },
  { to: "/mon-espace", label: "Ma progression", court: "Progression", icone: BarChart3 },
] as const;

export function OngletsParticipant() {
  return (
    <nav aria-label="Mon espace" className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 md:px-8">
        {PAGES_PARTICIPANT.map(({ to, label, court, icone: Icone }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
          >
            <Icone className="h-4 w-4" />
            <span className="sm:hidden">{court}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/**
 * Coquille d'une page personnelle : en-tête, onglets, puis le contenu une fois l'utilisateur connu.
 * Sans compte, invite à se connecter (la RLS protège de toute façon les données).
 */
export function PageParticipant({
  badge = "Mon espace",
  titre,
  description,
  children,
}: {
  badge?: string;
  titre: string;
  description: string;
  children: (session: { user: User; profile: Profile | null }) => ReactNode;
}) {
  const { status, configured, user, profile } = useAuth();
  return (
    <SiteLayout>
      <PageHero badge={badge} title={titre} description={description} />
      {user && <OngletsParticipant />}
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8">
        {status === "loading" ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !configured || !user ? (
          <Carte>
            <p className="text-muted-foreground">
              {configured ? "Connecte-toi pour accéder à ton espace personnel." : "Les comptes ne sont pas encore configurés sur ce site."}
            </p>
            {configured && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/connexion" className={btnPrimary}><LogIn className="h-4 w-4" /> Se connecter</Link>
                <Link to="/inscription" className={btnSecondary}><UserPlus className="h-4 w-4" /> Créer un compte</Link>
              </div>
            )}
          </Carte>
        ) : (
          children({ user, profile })
        )}
      </div>
    </SiteLayout>
  );
}
