import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Circle, ClipboardCheck, LayoutDashboard, LogIn, MapPin, PartyPopper, Play, RotateCcw, UserPlus, Video } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { btnPrimary, btnSecondary } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { etapesFaites, ETAPES_ACCUEIL, MODES_PARTICIPATION, NB_ETAPES_ACCUEIL, useAccueil, useMajAccueil, type EtapeAccueil } from "@/lib/accueil";
import { useAuth } from "@/lib/auth";
import { formationModules } from "@/lib/content";
import type { ModeParticipation } from "@/lib/supabase";

export const Route = createFileRoute("/bienvenue")({
  head: () => ({
    meta: [
      { title: "Bienvenue — IA et la Recherche" },
      { name: "description", content: "Démarrer la formation L'IA et la Recherche : fonctionnement du site, parcours de démarrage et consignes pratiques." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Bienvenue,
});

const PREMIER_MODULE = formationModules[0]?.slug ?? "comprendre-ia";

function Coquille({ children }: { children: React.ReactNode }) {
  return (
    <SiteLayout>
      <PageHero
        badge="Bienvenue"
        title="Bienvenue dans la formation L’IA ET LA RECHERCHE"
        description="Quelques minutes pour prendre tes repères, puis tu pourras commencer la formation dans de bonnes conditions."
      />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8">{children}</div>
    </SiteLayout>
  );
}

function Bienvenue() {
  const { status, configured, user, profile } = useAuth();

  if (status === "loading") return <Coquille><p className="text-muted-foreground">Chargement…</p></Coquille>;
  if (!configured || !user) {
    return (
      <Coquille>
        <Carte>
          <p className="text-muted-foreground">
            {configured ? "Connecte-toi pour suivre ton parcours de démarrage et l'enregistrer dans ton compte." : "Les comptes ne sont pas encore configurés sur ce site."}
          </p>
          {configured && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/connexion" className={btnPrimary}><LogIn className="h-4 w-4" /> Se connecter</Link>
              <Link to="/inscription" className={btnSecondary}><UserPlus className="h-4 w-4" /> Créer un compte</Link>
            </div>
          )}
        </Carte>
      </Coquille>
    );
  }
  return <Parcours userId={user.id} prenom={(profile?.nom_complet || "").split(" ")[0] ?? ""} />;
}

const FONCTIONNEMENT = [
  { icone: BookOpen, titre: "Apprendre", texte: "Les cours, les leçons interactives et les supports se trouvent dans Formations." },
  { icone: ClipboardCheck, titre: "S'exercer", texte: "Les QCM et les exercices pratiques te permettent de vérifier ce que tu as compris." },
  { icone: LayoutDashboard, titre: "Suivre", texte: "Ton espace personnel rassemble tes résultats, tes travaux à faire et tes groupes." },
];

function Parcours({ userId, prenom }: { userId: string; prenom: string }) {
  const navigate = useNavigate();
  const accueil = useAccueil(userId);
  const maj = useMajAccueil(userId);

  const faites = etapesFaites(accueil.data);
  const nbFaites = faites.length;
  const termine = nbFaites === NB_ETAPES_ACCUEIL;
  const mode = accueil.data?.mode_participation ?? null;
  const enCours = (etape: EtapeAccueil) => maj.isPending && maj.variables.p_etape === etape;

  const commencer = () => {
    maj.mutate({ p_vu: true });
    document.getElementById("demarrage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const decouvrirEspace = () => {
    maj.mutate({ p_vu: true }, { onSettled: () => void navigate({ to: "/mon-espace" }) });
  };

  return (
    <Coquille>
      <Carte>
        <p className="text-lg font-semibold text-navy">{prenom ? `Bonjour ${prenom}, nous sommes ravis de t'accueillir.` : "Nous sommes ravis de t'accueillir."}</p>
        <p className="mt-2 text-muted-foreground">
          Ce site t'accompagne pendant toute la formation, en salle comme à distance : tu y suis les cours, tu t'exerces et tu retrouves ta progression.
        </p>
        <h2 className="mt-6 text-lg font-bold text-navy">Objectif de la formation</h2>
        <p className="mt-2 text-muted-foreground">
          Apprendre à utiliser l'intelligence artificielle de façon efficace, critique et responsable à chaque étape d'un travail de recherche :
          rechercher et analyser des sources, rédiger de bons prompts, vérifier les réponses produites et respecter l'éthique scientifique.
        </p>
        <h2 className="mt-6 text-lg font-bold text-navy">Comment fonctionne le site</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {FONCTIONNEMENT.map(({ icone: Icone, titre, texte }) => (
            <li key={titre} className="rounded-2xl bg-muted p-4">
              <Icone className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold text-navy">{titre}</p>
              <p className="mt-1 text-sm text-muted-foreground">{texte}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={commencer} className={btnPrimary}><Play className="h-4 w-4" /> Commencer la formation</button>
          <button type="button" onClick={decouvrirEspace} disabled={maj.isPending} className={btnSecondary}><LayoutDashboard className="h-4 w-4" /> Découvrir mon espace pédagogique</button>
        </div>
      </Carte>

      {accueil.isError && (
        <Message ton="erreur">
          Impossible de charger ton parcours de démarrage. Vérifie ta connexion internet.{" "}
          <button type="button" onClick={() => void accueil.refetch()} className="font-semibold underline">Réessayer</button>
        </Message>
      )}
      {maj.isError && <Message ton="erreur">{maj.error.message}</Message>}

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <section id="demarrage" className="scroll-mt-24 space-y-4" aria-labelledby="titre-demarrage">
          <Carte>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titre-demarrage" className="text-lg font-bold text-navy">Parcours de démarrage</h2>
              <span className="text-sm font-semibold text-navy" aria-live="polite">
                {accueil.isLoading ? "…" : `${nbFaites} étape${nbFaites > 1 ? "s" : ""} sur ${NB_ETAPES_ACCUEIL} terminée${nbFaites > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progression du démarrage" aria-valuemin={0} aria-valuemax={NB_ETAPES_ACCUEIL} aria-valuenow={nbFaites}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(nbFaites / NB_ETAPES_ACCUEIL) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Ce parcours sert seulement à prendre tes repères : il ne compte pas dans tes scores ni dans tes résultats.</p>

            {termine && (
              <div className="mt-5 space-y-3">
                <Message ton="succes"><PartyPopper className="mr-1 inline h-4 w-4" /> Bravo, ton démarrage est terminé ! Tu peux maintenant commencer le premier module.</Message>
                <Link to="/formations/$slug" params={{ slug: PREMIER_MODULE }} className={btnPrimary}>Accéder au premier module <ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}
          </Carte>

          <ol className="space-y-3">
            {ETAPES_ACCUEIL.map((e, i) => {
              const fait = faites.includes(e.id);
              return (
                <li key={e.id} className={`rounded-2xl border-2 bg-card p-5 shadow-card ${fait ? "border-success/40" : "border-transparent"}`}>
                  <div className="flex items-start gap-3">
                    {fait ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden /> : <Circle className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-navy">
                        {i + 1}. {e.titre}
                        {fait && <span className="sr-only"> (terminée)</span>}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{e.texte}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {e.points.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {e.lien && <Link to={e.lien.to} className={btnSecondary}>{e.lien.label}</Link>}
                        <button
                          type="button"
                          onClick={() => maj.mutate({ p_etape: e.id, p_fait: !fait })}
                          disabled={accueil.isLoading || enCours(e.id)}
                          className={fait ? "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50" : btnPrimary}
                        >
                          {fait ? <><RotateCcw className="h-4 w-4" /> Marquer comme non terminée</> : <><CheckCircle2 className="h-4 w-4" /> {enCours(e.id) ? "Enregistrement…" : "J'ai terminé cette étape"}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <ModeParticipationCarte mode={mode} chargement={accueil.isLoading} enregistrement={maj.isPending && maj.variables.p_mode !== undefined} onChoisir={(m) => maj.mutate({ p_mode: m })} />
      </div>
    </Coquille>
  );
}

function ModeParticipationCarte({ mode, chargement, enregistrement, onChoisir }: { mode: ModeParticipation | null; chargement: boolean; enregistrement: boolean; onChoisir: (m: ModeParticipation) => void }) {
  const choisi = MODES_PARTICIPATION.find((m) => m.id === mode);
  return (
    <Carte titre="Mon mode de participation" className="lg:sticky lg:top-24">
      <p className="text-sm text-muted-foreground">Indique comment tu suis la formation pour recevoir les bonnes consignes. Tu peux changer ce choix à tout moment.</p>
      <div role="radiogroup" aria-label="Mode de participation" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {MODES_PARTICIPATION.map((m) => {
          const actif = m.id === mode;
          const Icone = m.id === "distance" ? Video : MapPin;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={actif}
              disabled={chargement || enregistrement}
              onClick={() => !actif && onChoisir(m.id)}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition disabled:opacity-60 ${actif ? "border-primary bg-primary/10 text-navy" : "border-border hover:border-primary/50"}`}
            >
              <Icone className="h-5 w-5 shrink-0 text-primary" /> {m.label}
            </button>
          );
        })}
      </div>
      {choisi ? (
        <div className="mt-5">
          <h3 className="font-semibold text-navy">Consignes pratiques</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {choisi.consignes.map((c) => (
              <li key={c} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {c}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Ce choix sert uniquement à adapter ces consignes : il ne change ni tes accès ni tes résultats.</p>
        </div>
      ) : (
        !chargement && <p className="mt-4 text-sm text-muted-foreground">Choisis un mode pour afficher les consignes correspondantes.</p>
      )}
    </Carte>
  );
}
