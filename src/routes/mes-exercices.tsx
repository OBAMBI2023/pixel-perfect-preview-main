import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileSearch, FileText, ListChecks, PenLine, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { PageParticipant } from "@/components/espace/EspaceParticipant";
import { btnPrimary } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { ExercicePersonnalise } from "@/components/recherche/ExercicesPersonnalises";
import { EXERCICES_RECHERCHE, useProfilChercheur, useTravauxRecherche } from "@/lib/recherche";
import type { ExerciceRecherche } from "@/lib/supabase";

type Recherche = { exercice?: ExerciceRecherche };

export const Route = createFileRoute("/mes-exercices")({
  validateSearch: (s: Record<string, unknown>): Recherche =>
    EXERCICES_RECHERCHE.some((e) => e.id === s["exercice"]) ? { exercice: s["exercice"] as ExerciceRecherche } : {},
  head: () => ({
    meta: [
      { title: "Mes exercices — IA et la Recherche" },
      { name: "description", content: "Exercices personnalisés à partir de ton sujet de recherche." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PageParticipant titre="Mes exercices" description="Des exercices appliqués à ton propre sujet de recherche, et l'accès à tous les exercices de la formation.">
      {({ user }) => <MesExercices userId={user.id} />}
    </PageParticipant>
  ),
});

function MesExercices({ userId }: { userId: string }) {
  const { exercice } = Route.useSearch();
  const navigate = useNavigate({ from: "/mes-exercices" });
  const profil = useProfilChercheur(userId);
  const travaux = useTravauxRecherche(userId);
  const zone = useRef<HTMLDivElement>(null);

  const aller = (e: ExerciceRecherche) => void navigate({ search: { exercice: e } });
  useEffect(() => {
    if (exercice) zone.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [exercice]);

  const chargement = profil.isLoading || travaux.isLoading;
  const erreur = profil.isError || travaux.isError;

  return (
    <>
      <section aria-labelledby="perso-titre" className="space-y-4">
        <h2 id="perso-titre" className="flex items-center gap-2 text-2xl font-bold text-navy"><PenLine className="h-6 w-6 text-primary" /> Exercices personnalisés</h2>
        {chargement && <p className="text-muted-foreground">Chargement…</p>}
        {erreur && (
          <Message ton="erreur">
            Impossible de charger tes exercices. Vérifie ta connexion internet.{" "}
            <button type="button" onClick={() => { void profil.refetch(); void travaux.refetch(); }} className="font-semibold underline">Réessayer</button>
          </Message>
        )}
        {profil.isSuccess && !profil.data && (
          <Carte>
            <p className="text-muted-foreground">
              Ces exercices utilisent ton sujet de recherche. Renseigne d'abord ton profil chercheur : discipline, niveau, sujet et objectif.
            </p>
            <Link to="/profil-chercheur" className={`${btnPrimary} mt-4`}><UserRound className="h-4 w-4" /> Compléter mon profil chercheur</Link>
          </Carte>
        )}
        {profil.data && travaux.data && (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {EXERCICES_RECHERCHE.map((e, i) => {
                const t = travaux.data.get(e.id);
                const actif = e.id === exercice;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => aller(e.id)}
                      aria-current={actif ? "true" : undefined}
                      className={`flex h-full w-full flex-col rounded-2xl border-2 bg-card p-4 text-left shadow-card transition hover:border-primary ${actif ? "border-primary" : "border-transparent"}`}
                    >
                      <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                        Exercice {i + 1}
                        {t?.termine ? (
                          <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> Terminé</span>
                        ) : t ? (
                          <span>En cours</span>
                        ) : (
                          <span>À faire</span>
                        )}
                      </span>
                      <span className="mt-1 font-semibold text-navy">{e.titre}</span>
                      <span className="mt-1 text-sm text-muted-foreground">{e.description}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div ref={zone} className="scroll-mt-24">
              {exercice ? (
                <ExercicePersonnalise exercice={exercice} userId={userId} profil={profil.data} travaux={travaux.data} onAller={aller} />
              ) : (
                <Message>Choisis un exercice ci-dessus. Les exercices 2 et 3 se suivent : l'équation de recherche reprend tes mots-clés enregistrés.</Message>
              )}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="pertinence-titre" className="pt-4">
        <Link to="/mes-exercices/pertinence" className="flex flex-col gap-4 rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-card transition hover:border-primary sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-3">
            <FileSearch className="mt-1 h-7 w-7 shrink-0 text-primary" />
            <span>
              <span id="pertinence-titre" className="block text-xl font-bold text-navy">Évaluer la pertinence d'un article</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Juge un article critère par critère, reçois une correction détaillée et un score sur 100, puis compare ton analyse à celle d'une IA. Un mode te permet aussi de travailler sur ton propre sujet.
              </span>
            </span>
          </span>
          <span className={`${btnPrimary} shrink-0`}>Commencer <ArrowRight className="h-4 w-4" /></span>
        </Link>
      </section>

      <section aria-labelledby="formation-titre" className="space-y-4 pt-4">
        <h2 id="formation-titre" className="text-2xl font-bold text-navy">Exercices de la formation</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <LienExercices to="/exercices" hash="qcm" icone={ListChecks} titre="QCM" texte="Questions par catégorie et par niveau, corrigées immédiatement. Tes réponses sont enregistrées." />
          <LienExercices to="/exercices" hash="exercices-pratiques" icone={ClipboardCheck} titre="Exercices pratiques" texte="Mises en situation corrigées, à faire à ton rythme." />
          <LienExercices to="/exercices" search={{ onglet: "a-rendre" }} icone={FileText} titre="Exercices à rendre" texte="Copies envoyées à ton formateur, qui les corrige et les note." />
        </div>
      </section>
    </>
  );
}

function LienExercices({ to, hash, search, icone: Icone, titre, texte }: { to: "/exercices"; hash?: string; search?: { onglet: "a-rendre" }; icone: typeof ListChecks; titre: string; texte: string }) {
  return (
    <Link to={to} {...(hash && { hash })} search={search ?? {}} className="rounded-2xl bg-card p-5 shadow-card transition hover:ring-2 hover:ring-primary">
      <Icone className="h-6 w-6 text-primary" />
      <p className="mt-2 font-semibold text-navy">{titre}</p>
      <p className="mt-1 text-sm text-muted-foreground">{texte}</p>
    </Link>
  );
}
