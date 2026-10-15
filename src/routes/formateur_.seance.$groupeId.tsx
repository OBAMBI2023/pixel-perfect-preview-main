import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import type { ReactNode } from "react";
import { btnPrimary, btnSecondary, formatPct } from "@/components/espace/styles";
import { useGardeFormateur } from "@/lib/auth";
import { formationModules } from "@/lib/content";
import { construireFiltres, estPeriode, PERIODES, rpc, type PeriodeId } from "@/lib/formateur";
import { infoQuestion, labelNiveau, titreCategorie } from "@/lib/progression";
import { CATEGORIES, NIVEAUX, type Niveau } from "@/lib/qcm-comprendre-ia";
import { getSupabase } from "@/lib/supabase";

type Recherche = { periode?: PeriodeId; niveau?: Niveau };

export const Route = createFileRoute("/formateur_/seance/$groupeId")({
  validateSearch: (s: Record<string, unknown>): Recherche => ({
    ...(estPeriode(s["periode"]) && { periode: s["periode"] }),
    ...(NIVEAUX.some((n) => n.id === s["niveau"]) && { niveau: s["niveau"] as Niveau }),
  }),
  head: () => ({
    meta: [
      { title: "Fiche de séance — IA et la Recherche" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FicheSeance,
});

function FicheSeance() {
  const { status, user } = useGardeFormateur();
  if (!user) return <p className="p-10 text-muted-foreground">{status === "loading" ? "Chargement…" : "Redirection…"}</p>;
  return <Fiche />;
}

/** Lien vers le support de cours, avec l'adresse écrite en clair pour la version papier. */
function LienCours({ cours, children }: { cours: string; children: ReactNode }) {
  const url = `${window.location.origin}/formations/${cours}`;
  return (
    <a href={url} className="text-primary underline-offset-2 hover:underline print:text-black">
      {children} <span className="hidden text-xs text-muted-foreground print:inline">({url})</span>
    </a>
  );
}

function Fiche() {
  const { groupeId } = Route.useParams();
  const { periode = "tout", niveau } = Route.useSearch();
  const filtres = construireFiltres(groupeId, periode, niveau ?? "");

  const groupe = useQuery({
    queryKey: ["groupe", groupeId],
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("groupes").select("nom").eq("id", groupeId).single();
      if (error) throw error;
      return data;
    },
  });
  const categories = useQuery({ queryKey: ["reussite_par_categorie", filtres], queryFn: () => rpc("reussite_par_categorie", filtres) });
  const ratees = useQuery({ queryKey: ["questions_ratees", filtres], queryFn: () => rpc("questions_ratees", { ...filtres, p_min_reponses: 3 }) });

  const faibles = (categories.data ?? []).slice(0, 3); // triées du taux le plus faible au plus fort
  const questions = (ratees.data ?? []).slice(0, 5);
  const coursCites = [...new Set([...faibles.map((c) => CATEGORIES.find((x) => x.id === c.categorie)?.cours), ...questions.map((q) => infoQuestion(q.question_id)?.cours)].filter((c): c is string => !!c))];
  const chargement = groupe.isLoading || categories.isLoading || ratees.isLoading;
  const erreur = groupe.error ?? categories.error ?? ratees.error;
  const libellePeriode = PERIODES.find((p) => p.id === periode)?.label ?? "Tout";

  return (
    <div className="min-h-screen bg-muted py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <Link to="/formateur" className={btnSecondary}><ArrowLeft className="h-4 w-4" /> Espace formateur</Link>
        <button onClick={() => window.print()} disabled={chargement || !!erreur} className={btnPrimary}><Printer className="h-4 w-4" /> Imprimer</button>
      </div>

      <article className="mx-auto max-w-3xl bg-card p-8 text-foreground shadow-card md:rounded-2xl md:p-12 print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-navy pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fiche de séance · IA et la Recherche</p>
          <h1 className="mt-1 text-3xl font-bold text-navy">{groupe.data?.nom ?? "…"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}Période : {libellePeriode}{" · "}Niveau : {niveau ? labelNiveau(niveau) : "tous"}
          </p>
        </header>

        {erreur && <p role="alert" className="mt-6 text-destructive">Impossible de préparer la fiche : {erreur.message}</p>}
        {chargement && <p className="mt-6 text-muted-foreground">Préparation de la fiche…</p>}

        {!chargement && !erreur && (
          <>
            <section className="mt-8 break-inside-avoid">
              <h2 className="text-xl font-bold text-navy">1. Catégories à retravailler</h2>
              {faibles.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Pas encore de tentative sur cette période.</p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {faibles.map((c, i) => {
                    const cat = CATEGORIES.find((x) => x.id === c.categorie);
                    return (
                      <li key={c.categorie} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border-2 border-border px-4 py-3 print:rounded-none">
                        <span>
                          <strong>{i + 1}. {titreCategorie(c.categorie)}</strong>
                          {cat && <span className="block text-sm text-muted-foreground">{cat.description} — chapitre{cat.chapitres.includes("–") ? "s" : ""} {cat.chapitres}</span>}
                        </span>
                        <span className="tabular-nums">{formatPct(c.taux_reussite)} de réussite · {c.nb_tentatives} tent.</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-bold text-navy">2. Questions les plus ratées</h2>
              {questions.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Aucune question ratée avec au moins 3 réponses sur cette période.</p>
              ) : (
                <ol className="mt-3 space-y-4">
                  {questions.map((q, i) => {
                    const info = infoQuestion(q.question_id);
                    return (
                      <li key={q.question_id} className="break-inside-avoid border-l-4 border-primary pl-4">
                        <p className="font-semibold">{i + 1}. {info?.enonce ?? `Question inconnue (${q.question_id})`}</p>
                        {info && <p className="mt-1 text-sm"><strong>Bonne réponse :</strong> {info.bonneReponse}</p>}
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPct(q.taux_echec)} d'échec ({q.nb_echecs}/{q.nb_reponses})
                          {info && <> · {info.genre} · {titreCategorie(info.categorie)} · chapitre {info.chapitre} · <LienCours cours={info.cours}>support de cours</LienCours></>}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="mt-8 break-inside-avoid">
              <h2 className="text-xl font-bold text-navy">3. Pour revoir le cours</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {(coursCites.length ? coursCites : ["comprendre-ia"]).map((c) => (
                  <li key={c}><LienCours cours={c}>Support de cours « {formationModules.find((m) => m.slug === c)?.title ?? c} »</LienCours></li>
                ))}
                <li><a href={`${window.location.origin}/exercices`} className="text-primary hover:underline print:text-black">Exercices et QCM</a> <span className="hidden text-xs text-muted-foreground print:inline">({window.location.origin}/exercices)</span></li>
              </ul>
            </section>
          </>
        )}
      </article>
    </div>
  );
}
