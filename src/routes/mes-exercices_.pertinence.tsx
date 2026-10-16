import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Shuffle, UserRound } from "lucide-react";
import { PageParticipant } from "@/components/espace/EspaceParticipant";
import { btnSecondary, formatDate } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { CarteRetour } from "@/components/espace/RetourFormateur";
import { ParcoursCorrige, ParcoursMonSujet } from "@/components/recherche/ExercicePertinence";
import { ARTICLES, articlePertinence, scenarioPertinence } from "@/data/articles-pertinence";
import { DECISIONS, useAnalysesPertinence } from "@/lib/pertinence";
import { useProfilChercheur } from "@/lib/recherche";
import { useMesRetours } from "@/lib/suivi";

type Mode = "corrige" | "mon-sujet";
type Recherche = { mode?: Mode; article?: string };

// `mes-exercices_` : route sœur de /mes-exercices (pas imbriquée), l'URL reste /mes-exercices/pertinence.
export const Route = createFileRoute("/mes-exercices_/pertinence")({
  validateSearch: (s: Record<string, unknown>): Recherche => ({
    ...(s["mode"] === "corrige" || s["mode"] === "mon-sujet" ? { mode: s["mode"] } : {}),
    ...(typeof s["article"] === "string" && articlePertinence(s["article"]) ? { article: s["article"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Évaluer la pertinence d'un article — IA et la Recherche" },
      { name: "description", content: "Apprendre à juger si un article scientifique est pertinent pour son sujet de recherche." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PageParticipant
      badge="Mes exercices"
      titre="Évaluer la pertinence d'un article"
      description="Juge si un article est utile pour un sujet de recherche, critère par critère, puis compare ton analyse à celle d'une IA."
    >
      {({ user }) => <Pertinence userId={user.id} />}
    </PageParticipant>
  ),
});

function Pertinence({ userId }: { userId: string }) {
  const { mode, article: articleId } = Route.useSearch();
  const navigate = useNavigate({ from: "/mes-exercices/pertinence" });
  const profil = useProfilChercheur(userId);
  const analyses = useAnalysesPertinence(userId);
  const retours = useMesRetours(userId);
  const parArticle = new Map((analyses.data ?? []).map((a) => [a.article_id, a]));
  const sujetProfil = profil.data?.sujet ?? null;

  const choisirArticle = (exclure?: string) => {
    const candidats = ARTICLES.filter((a) => a.id !== exclure);
    const nouveaux = candidats.filter((a) => !parArticle.has(a.id));
    const liste = nouveaux.length ? nouveaux : candidats;
    const a = liste[Math.floor(Math.random() * liste.length)]!;
    void navigate({ search: { mode: "corrige", article: a.id } });
  };

  if (profil.isLoading || analyses.isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  const article = articleId ? articlePertinence(articleId) : undefined;
  const dejaCorriges = ARTICLES.filter((a) => parArticle.get(a.id)?.premier_score != null);

  return (
    <>
      <Link to="/mes-exercices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Mes exercices</Link>
      {(profil.isError || analyses.isError) && <Message ton="erreur">Une partie de tes données n'a pas pu être chargée. Vérifie ta connexion internet, puis recharge la page.</Message>}

      <div role="tablist" aria-label="Mode de l'exercice" className="grid gap-3 sm:grid-cols-2">
        {([
          { id: "corrige", icone: ClipboardCheck, titre: "Entraînement corrigé et noté", texte: `${ARTICLES.length} articles d'exemple sur deux sujets de scénario, avec correction détaillée et score sur 100.` },
          { id: "mon-sujet", icone: UserRound, titre: "Avec mon sujet", texte: "Analyse un article réel (Crossref) ou que tu as trouvé, pour ton propre sujet. Non noté." },
        ] as const).map(({ id, icone: Icone, titre, texte }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={(mode ?? "corrige") === id}
            onClick={() => void navigate({ search: { mode: id } })}
            className={`rounded-2xl border-2 bg-card p-4 text-left shadow-card transition hover:border-primary ${(mode ?? "corrige") === id ? "border-primary" : "border-transparent"}`}
          >
            <Icone className="h-6 w-6 text-primary" />
            <span className="mt-2 block font-semibold text-navy">{titre}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{texte}</span>
          </button>
        ))}
      </div>

      {mode === "mon-sujet" ? (
        <ParcoursMonSujet key="mon-sujet" userId={userId} sujetProfil={sujetProfil} />
      ) : article ? (
        <ParcoursCorrige key={article.id} userId={userId} article={article} analyse={parArticle.get(article.id)} sujetProfil={sujetProfil} onAutreArticle={() => choisirArticle(article.id)} />
      ) : (
        <Carte titre="Choisis un article à analyser" action={<button type="button" onClick={() => choisirArticle()} className={btnSecondary}><Shuffle className="h-4 w-4" /> Au hasard</button>}>
          <p className="text-sm text-muted-foreground">
            Tous ces articles sont des exemples fictifs, écrits pour l'exercice. Ton score sur un article est enregistré une seule fois, à ta première analyse ; tu peux ensuite le refaire pour t'entraîner.
            {dejaCorriges.length > 0 && ` Articles déjà analysés : ${dejaCorriges.length} sur ${ARTICLES.length}.`}
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {ARTICLES.map((a, i) => {
              const an = parArticle.get(a.id);
              return (
                <li key={a.id}>
                  <Link to="/mes-exercices/pertinence" search={{ mode: "corrige", article: a.id }} className="flex h-full flex-col rounded-xl border-2 border-border p-4 transition hover:border-primary">
                    <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                      Article {i + 1} · {scenarioPertinence(a.scenario)?.libelle}
                      {an?.premier_score != null && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> {an.premier_score}/100</span>}
                    </span>
                    <span className="mt-1 text-sm font-medium text-navy">{a.titre}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Carte>
      )}

      {(analyses.data?.length ?? 0) > 0 && (
        <Carte titre="Mes analyses enregistrées">
          <ul className="divide-y text-sm">
            {analyses.data!.map((a) => {
              const titre = a.mode === "corrige" ? articlePertinence(a.article_id)?.titre : (a.article?.["titre"] as string | undefined);
              const decision = DECISIONS.find((d) => d.id === (a.contenu["comparaison"] as { decision?: string } | undefined)?.decision)?.label;
              return (
                <li key={a.article_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-medium">{titre ?? a.article_id}</span>
                    <span className="block text-xs text-muted-foreground">
                      {a.mode === "corrige" ? "Entraînement corrigé" : `Mon sujet : ${a.sujet}`} · {formatDate(a.updated_at)}
                      {decision && ` · Décision : ${decision.toLowerCase()}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    {a.mode === "corrige" ? (
                      <>
                        <span className="block font-semibold tabular-nums">Score enregistré : {a.premier_score}/100</span>
                        {a.nb_analyses > 1 && <span className="block text-muted-foreground">Dernière analyse : {a.score}/100</span>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Non noté</span>
                    )}
                  </span>
                  {(() => {
                    const r = retours.data?.find((x) => x.objet === "analyse_pertinence" && x.objet_id === a.article_id);
                    return r ? <div className="w-full"><CarteRetour userId={userId} retour={r} perime={a.updated_at > r.updated_at} /></div> : null;
                  })()}
                </li>
              );
            })}
          </ul>
        </Carte>
      )}
    </>
  );
}
