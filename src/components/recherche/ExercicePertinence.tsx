import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpenCheck, Check, Copy, RotateCcw, Search, Send, ShieldCheck } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { btnPrimary, btnSecondary, inputClass } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import {
  APPRECIATIONS,
  CRITERES,
  PERTINENCES,
  POINTS_A_VERIFIER,
  scenarioPertinence,
  type Appreciation,
  type ArticleExemple,
  type CritereId,
  type Pertinence,
} from "@/data/articles-pertinence";
import {
  DECISIONS,
  noterAnalyse,
  POINTS_CRITERE,
  promptAnalyseIA,
  rechercherCrossref,
  REPONSES_VIDES,
  termesCommuns,
  useEnregistrerAnalyse,
  type ArticleAffiche,
  type ArticleCrossref,
  type ReponsesPertinence,
  type ResultatAnalyse,
  type StatutReponse,
} from "@/lib/pertinence";
import { normaliserDoi, verifierDoi, type VerificationDoi } from "@/lib/recherche";
import type { AnalysePertinence, ProfilChercheur } from "@/lib/supabase";

const ETAPES = ["Sujet", "Article", "Mon jugement", "Critères", "Correction", "Avec l'IA", "Conclusion"] as const;

const pts = (n: number) => n.toLocaleString("fr-FR");
const labelAppreciation = (a: Appreciation | undefined) => APPRECIATIONS.find((x) => x.id === a)?.label ?? "—";
const labelPertinence = (p: Pertinence | null | undefined) => PERTINENCES.find((x) => x.id === p)?.label ?? "—";

const versAffiche = (a: ArticleExemple): ArticleAffiche => ({
  titre: a.titre,
  auteurs: a.auteurs,
  annee: String(a.annee),
  revue: a.revue,
  resume: a.resume,
  motsCles: a.motsCles,
  doi: null,
});

/* ───────── Éléments communs ───────── */

function IndicateurEtapes({ etape, maxAtteinte, onAller }: { etape: number; maxAtteinte: number; onAller: (i: number) => void }) {
  return (
    <nav aria-label="Étapes de l'exercice">
      <p className="text-sm font-semibold text-navy">Étape {etape + 1} sur {ETAPES.length} : {ETAPES[etape]}</p>
      <ol className="mt-2 grid grid-cols-7 gap-1">
        {ETAPES.map((nom, i) => (
          <li key={nom}>
            <button
              type="button"
              onClick={() => onAller(i)}
              disabled={i > maxAtteinte}
              aria-current={i === etape ? "step" : undefined}
              title={nom}
              className={`h-2 w-full rounded-full transition ${i === etape ? "bg-primary" : i <= maxAtteinte ? "bg-primary/40 hover:bg-primary/60" : "bg-muted"}`}
            >
              <span className="sr-only">{`Étape ${i + 1} : ${nom}`}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Met en évidence les extraits dans un texte (après la correction). */
function Surligne({ texte, extraits }: { texte: string; extraits: string[] }) {
  const presents = extraits.filter((e) => e && texte.includes(e));
  if (presents.length === 0) return <>{texte}</>;
  const motif = new RegExp(`(${presents.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return (
    <>
      {texte.split(motif).map((morceau, i) =>
        presents.includes(morceau) ? <mark key={i} className="rounded bg-tint-amber px-0.5 text-foreground">{morceau}</mark> : <span key={i}>{morceau}</span>,
      )}
    </>
  );
}

export function FicheArticle({ article, fictif, extraits = [], verification }: { article: ArticleAffiche; fictif: boolean; extraits?: string[]; verification?: ReactNode }) {
  return (
    <article className="rounded-2xl border-2 border-border bg-card p-5">
      {fictif && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-tint-amber px-3 py-1 text-xs font-bold uppercase tracking-wide text-tint-amber-fg">
          <AlertTriangle className="h-3.5 w-3.5" /> Exemple fictif
        </p>
      )}
      <h3 className="text-lg font-bold text-navy"><Surligne texte={article.titre} extraits={extraits} /></h3>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline font-semibold">Auteur(s) : </dt><dd className="inline">{article.auteurs || "non indiqués"}</dd></div>
        <div><dt className="inline font-semibold">Année : </dt><dd className="inline">{article.annee || "non indiquée"}</dd></div>
        <div><dt className="inline font-semibold">Source : </dt><dd className="inline">{article.revue || "non indiquée"}</dd></div>
        <div>
          <dt className="inline font-semibold">DOI : </dt>
          <dd className="inline">
            {article.doi ? (
              <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{article.doi}</a>
            ) : fictif ? "aucun (exemple fictif)" : "non indiqué"}
          </dd>
        </div>
      </dl>
      {fictif && <p className="mt-2 text-xs text-muted-foreground">Article inventé pour l'exercice : les auteurs, la revue et le résumé sont fictifs. Ne le cite jamais comme une source réelle.</p>}
      {verification}
      <h4 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Résumé</h4>
      <p className="mt-1 text-sm leading-relaxed">{article.resume ? <Surligne texte={article.resume} extraits={extraits} /> : <em className="text-muted-foreground">Résumé non disponible : la pertinence sera difficile à juger sans lire l'article.</em>}</p>
      {article.motsCles.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="font-semibold">Mots-clés :</span>
          {article.motsCles.map((m) => <span key={m} className="rounded-full bg-muted px-2 py-0.5">{m}</span>)}
        </p>
      )}
    </article>
  );
}

function Choix<T extends string>({ nom, options, valeur, onChange, colonnes = "sm:grid-cols-3" }: { nom: string; options: readonly { id: T; label: string }[]; valeur: T | null | undefined; onChange: (v: T) => void; colonnes?: string }) {
  return (
    <div role="radiogroup" aria-label={nom} className={`grid gap-2 ${colonnes}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={valeur === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${valeur === o.id ? "border-primary bg-primary/10 text-navy" : "border-border hover:border-primary/50"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const COULEUR_STATUT: Record<StatutReponse, string> = {
  juste: "bg-tint-green text-tint-green-fg",
  proche: "bg-tint-amber text-tint-amber-fg",
  faux: "bg-tint-rose text-tint-rose-fg",
  absent: "bg-muted text-muted-foreground",
};
const LIBELLE_STATUT: Record<StatutReponse, string> = { juste: "Juste", proche: "Proche", faux: "À revoir", absent: "Sans réponse" };

function BoutonCopier({ texte }: { texte: string }) {
  const [copie, setCopie] = useState<"ok" | "echec" | null>(null);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie("ok");
    } catch {
      setCopie("echec");
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={() => void copier()} className={btnPrimary}>
        {copie === "ok" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copie === "ok" ? "Prompt copié" : "Copier le prompt"}
      </button>
      {copie === "echec" && <span className="text-xs text-tint-rose-fg">Copie impossible : sélectionne le texte et copie-le manuellement.</span>}
    </span>
  );
}

/* ───────── Étapes 3 et 4 : jugement et critères (communes aux deux modes) ───────── */

function EtapeJugement({ r, setR }: { r: ReponsesPertinence; setR: (f: (r: ReponsesPertinence) => ReponsesPertinence) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-navy">Selon toi, cet article est-il pertinent pour ton sujet de recherche ?</h3>
        <div className="mt-3"><Choix nom="Pertinence de l'article" options={PERTINENCES} valeur={r.jugement} onChange={(v) => setR((x) => ({ ...x, jugement: v }))} /></div>
      </div>
      <label className="block text-sm font-medium">
        Justifie ton choix en quelques phrases
        <span className="mt-1 block text-xs font-normal text-muted-foreground">Appuie-toi sur des éléments précis du titre et du résumé, et indique ce qui reste incertain.</span>
        <textarea rows={5} maxLength={3000} value={r.justification} onChange={(e) => setR((x) => ({ ...x, justification: e.target.value }))} className={`${inputClass} mt-1`} />
      </label>
    </div>
  );
}

function EtapeCriteres({ r, setR }: { r: ReponsesPertinence; setR: (f: (r: ReponsesPertinence) => ReponsesPertinence) => void }) {
  return (
    <div className="space-y-5">
      <Message>
        L'ancienneté d'un article ne le rend pas automatiquement inutile : un texte ancien peut définir un concept ou proposer une méthode toujours utilisés. La pertinence dépend de l'objectif de ta recherche.
      </Message>
      <ol className="space-y-4">
        {CRITERES.map((c, i) => (
          <li key={c.id} className="rounded-xl border-2 border-border p-4">
            <p className="font-semibold text-navy">{i + 1}. {c.titre}</p>
            <p className="text-sm text-muted-foreground">{c.question}</p>
            <div className="mt-3">
              <Choix nom={c.titre} options={APPRECIATIONS} valeur={r.criteres[c.id]} onChange={(v) => setR((x) => ({ ...x, criteres: { ...x.criteres, [c.id]: v } }))} colonnes="grid-cols-2 lg:grid-cols-4" />
            </div>
          </li>
        ))}
      </ol>
      <fieldset className="rounded-xl border-2 border-border p-4">
        <legend className="px-1 font-semibold text-navy">Que faudrait-il vérifier avant de décider ?</legend>
        <p className="text-sm text-muted-foreground">Coche seulement ce qui est vraiment utile pour cet article.</p>
        <div className="mt-2 space-y-1">
          {POINTS_A_VERIFIER.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={r.aVerifier.includes(p.id)}
                onChange={(e) => setR((x) => ({ ...x, aVerifier: e.target.checked ? [...x.aVerifier, p.id] : x.aVerifier.filter((v) => v !== p.id) }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/* ───────── Étapes 6 et 7 : IA puis comparaison ───────── */

function EtapeIA({ sujet, article }: { sujet: string; article: ArticleAffiche }) {
  const prompt = promptAnalyseIA(sujet, article);
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Copie ce prompt, colle-le dans un assistant d'IA (ChatGPT, Claude, Gemini…), puis lis attentivement sa réponse. Il reprend ton sujet et les informations de l'article.
      </p>
      <textarea readOnly rows={14} value={prompt} onFocus={(e) => e.currentTarget.select()} className={`${inputClass} font-mono text-xs`} aria-label="Prompt d'analyse de la pertinence" />
      <div className="flex flex-wrap items-center gap-3">
        <BoutonCopier texte={prompt} />
        <Link to="/outils-ia" className="text-sm font-semibold text-primary hover:underline">Voir les outils d'IA présentés dans la formation</Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Ne colle jamais de données confidentielles ou personnelles dans un outil d'IA. L'IA n'a généralement pas accès au texte intégral : elle ne peut pas confirmer ce que le résumé ne dit pas.
      </p>
    </div>
  );
}

function EtapeComparaison({ r, setR }: { r: ReponsesPertinence; setR: (f: (r: ReponsesPertinence) => ReponsesPertinence) => void }) {
  const champ = (cle: keyof Omit<ReponsesPertinence["comparaison"], "decision">, label: string) => (
    <label className="block text-sm font-medium">
      {label}
      <textarea rows={2} maxLength={1500} value={r.comparaison[cle]} onChange={(e) => setR((x) => ({ ...x, comparaison: { ...x.comparaison, [cle]: e.target.value } }))} className={`${inputClass} mt-1`} />
    </label>
  );
  return (
    <div className="space-y-4">
      <p className="text-sm">Compare ta première appréciation ({labelPertinence(r.jugement)}) avec l'analyse de l'IA.</p>
      {champ("oublis", "L'IA a-t-elle identifié un élément que tu avais oublié ?")}
      {champ("nonJustifie", "A-t-elle formulé une conclusion insuffisamment justifiée ?")}
      {champ("aVerifierTexte", "Quelles informations faudrait-il vérifier dans le texte intégral ?")}
      <div>
        <p className="text-sm font-medium">Quelle décision prends-tu finalement ?</p>
        <div className="mt-2">
          <Choix nom="Décision finale" options={DECISIONS} valeur={r.comparaison.decision || null} onChange={(v) => setR((x) => ({ ...x, comparaison: { ...x.comparaison, decision: v } }))} />
        </div>
      </div>
      {champ("pourquoi", "Pourquoi ?")}
    </div>
  );
}

function Reflexion() {
  return (
    <Carte titre={<span className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /> Esprit critique et responsabilité du chercheur</span>}>
      <p className="text-sm">
        L'IA peut t'aider à repérer des éléments et à structurer ton analyse, mais elle ne lit souvent que ce que tu lui donnes et peut affirmer avec assurance des choses non vérifiées.
        Le choix d'une source, et sa citation dans ton travail, restent ta responsabilité : appuie chaque décision sur le texte lui-même, vérifie la source et garde une trace de ton raisonnement.
      </p>
    </Carte>
  );
}

/* ───────── Correction (mode corrigé) ───────── */

function Correction({ article, r, resultat, analyse }: { article: ArticleExemple; r: ReponsesPertinence; resultat: ResultatAnalyse; analyse: AnalysePertinence | undefined }) {
  const premiere = analyse?.premier_score;
  const autres = analyse && analyse.nb_analyses > 1 && premiere !== null && premiere !== undefined;
  const satisfaits = CRITERES.filter((c) => article.criteres[c.id].attendu === "oui");
  const partiels = CRITERES.filter((c) => article.criteres[c.id].attendu === "partiel");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-muted p-5">
        <div>
          <p className="text-sm text-muted-foreground">Score de cette analyse</p>
          <p className="font-display text-4xl font-bold text-navy">{resultat.total} <span className="text-xl">/ 100</span></p>
        </div>
        <p className="max-w-md text-sm">
          {autres
            ? <>Nouvelle tentative sur cet article : elle n'est pas ajoutée à ta progression. Le score enregistré reste celui de ta première analyse : <strong>{premiere}/100</strong>.</>
            : <>Score enregistré dans ta progression (catégorie « Sélection et évaluation des sources ») sous la forme d'une note sur 10 : <strong>{Math.round(resultat.total / 10)}/10</strong>.</>}
        </p>
      </div>

      <div>
        <h3 className="font-bold text-navy">Appréciation indicative : {labelPertinence(article.pertinence)}</h3>
        <p className="mt-1 text-sm">Ton jugement : <strong>{labelPertinence(r.jugement)}</strong>. {article.explicationGlobale}</p>
      </div>

      <div>
        <h3 className="font-bold text-navy">Éléments du titre et du résumé qui justifient cette appréciation</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {article.extraits.map((e) => (
            <li key={e.texte} className="rounded-xl bg-muted p-3">
              <mark className="rounded bg-tint-amber px-1">« {e.texte} »</mark>
              <span className="mt-1 block text-muted-foreground">{e.commentaire}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-bold text-navy">Critère par critère</h3>
        <ul className="mt-2 divide-y rounded-xl border-2 border-border">
          {CRITERES.map((c) => {
            const a = article.criteres[c.id];
            const note = resultat.criteres[c.id];
            return (
              <li key={c.id} className="p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{c.titre}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEUR_STATUT[note.statut]}`}>
                    {LIBELLE_STATUT[note.statut]} · {pts(note.points)}/{POINTS_CRITERE[c.id]} pts
                  </span>
                </div>
                <p className="mt-1">
                  Ta réponse : <strong>{labelAppreciation(r.criteres[c.id])}</strong> · Réponse attendue : <strong>{labelAppreciation(a.attendu)}</strong>
                  {a.acceptables?.length ? <> (accepté aussi : {a.acceptables.map(labelAppreciation).join(", ")})</> : null}
                </p>
                <p className="mt-1 text-muted-foreground">{a.explication}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-muted p-4 text-sm">
          <h3 className="font-bold text-navy">Critères satisfaits</h3>
          <p className="mt-1">{satisfaits.length ? satisfaits.map((c) => c.titre).join(", ") : "Aucun pleinement."}</p>
          <h3 className="mt-3 font-bold text-navy">Critères partiellement satisfaits</h3>
          <p className="mt-1">{partiels.length ? partiels.map((c) => c.titre).join(", ") : "Aucun."}</p>
        </div>
        <div className="rounded-xl bg-muted p-4 text-sm">
          <h3 className="font-bold text-navy">Informations manquantes pour décider</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">{article.manquantes.map((m) => <li key={m}>{m}</li>)}</ul>
          {resultat.verifier.manques.length > 0 && (
            <p className="mt-2">Tu aurais pu cocher : {resultat.verifier.manques.map((id) => POINTS_A_VERIFIER.find((p) => p.id === id)?.label.toLowerCase()).join(" ; ")}.</p>
          )}
          {resultat.verifier.enTrop.length > 0 && (
            <p className="mt-2">Pas indispensable ici : {resultat.verifier.enTrop.map((id) => POINTS_A_VERIFIER.find((p) => p.id === id)?.label.toLowerCase()).join(" ; ")}.</p>
          )}
        </div>
      </div>

      <Message>
        <strong>Pertinence thématique ≠ fiabilité scientifique.</strong> Un article peut être parfaitement dans ton sujet et pourtant peu fiable (source invérifiable, méthode fragile), ou très solide mais hors sujet.
        La pertinence se juge par rapport à ta question de recherche ; la fiabilité se vérifie dans la source elle-même (revue, auteurs, DOI, méthode).
      </Message>

      <div>
        <h3 className="font-bold text-navy">Détail du score et conseils</h3>
        <ul className="mt-2 space-y-3">
          {resultat.sections.map((s) => (
            <li key={s.id} className="text-sm">
              <div className="flex justify-between gap-3"><span className="font-medium">{s.titre}</span><span className="shrink-0 tabular-nums">{pts(s.points)} / {s.max}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="presentation"><div className="h-full rounded-full bg-primary" style={{ width: `${(s.points / s.max) * 100}%` }} /></div>
              {s.points < s.max * 0.7 && <p className="mt-1 text-muted-foreground">Conseil : {s.conseil}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Les points de justification sont estimés automatiquement à partir d'indices : longueur ({resultat.justification.nbMots} mots), éléments de l'article cités
          ({resultat.justification.indicesTrouves.join(", ") || "aucun repéré"}) et limites évoquées ({resultat.justification.limite ? "oui" : "non"}).
          Ce calcul ne mesure pas la qualité réelle de ton raisonnement : il est indicatif. Pour une validation, présente ton analyse à ton formateur.
        </p>
      </div>
    </div>
  );
}

/* ───────── Mode corrigé ───────── */

export function ParcoursCorrige({
  userId,
  article,
  analyse,
  sujetProfil,
  onAutreArticle,
}: {
  userId: string;
  article: ArticleExemple;
  analyse: AnalysePertinence | undefined;
  sujetProfil: string | null;
  onAutreArticle: () => void;
}) {
  const scenario = scenarioPertinence(article.scenario)!;
  const enregistrer = useEnregistrerAnalyse(userId);
  const [etape, setEtape] = useState(0);
  const [maxAtteinte, setMaxAtteinte] = useState(0);
  const [r, setR] = useState<ReponsesPertinence>(REPONSES_VIDES);
  const [resultat, setResultat] = useState<ResultatAnalyse | null>(null);
  const [conclusion, setConclusion] = useState(false);
  const haut = useRef<HTMLDivElement>(null);

  const aller = (i: number) => {
    setEtape(i);
    setMaxAtteinte((m) => Math.max(m, i));
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const affiche = versAffiche(article);
  const criteresComplets = CRITERES.every((c) => r.criteres[c.id]);

  const soumettre = () => {
    const res = noterAnalyse(r, article);
    enregistrer.mutate(
      { p_article: article.id, p_mode: "corrige", p_sujet: scenario.sujet, p_article_info: null, p_analyse: r as unknown as Record<string, unknown>, p_score: res.total },
      { onSuccess: () => { setResultat(res); aller(4); } },
    );
  };
  const enregistrerConclusion = () => {
    if (!resultat) return;
    enregistrer.mutate(
      { p_article: article.id, p_mode: "corrige", p_sujet: scenario.sujet, p_article_info: null, p_analyse: r as unknown as Record<string, unknown>, p_score: resultat.total },
      { onSuccess: () => setConclusion(true) },
    );
  };

  return (
    <div ref={haut} className="scroll-mt-24 space-y-5">
      <IndicateurEtapes etape={etape} maxAtteinte={resultat ? maxAtteinte : Math.min(maxAtteinte, 3)} onAller={aller} />
      {analyse && etape === 0 && (
        <Message>Tu as déjà analysé cet article ({analyse.nb_analyses} fois). Ton score enregistré reste celui de ta première analyse : {analyse.premier_score}/100. Cette nouvelle analyse sert d'entraînement.</Message>
      )}

      <Carte titre={ETAPES[etape]}>
        {etape === 0 && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sujet de recherche du scénario</p>
              <p className="mt-1 text-base font-semibold text-navy">{scenario.sujet}</p>
              <p className="mt-2"><strong>Problématique :</strong> {scenario.problematique}</p>
              <p className="mt-2"><strong>Concepts clés :</strong> {scenario.concepts.join(" · ")}</p>
            </div>
            <p className="text-muted-foreground">
              Dans l'entraînement corrigé, tu travailles sur ce sujet de scénario : la correction a été préparée pour lui, c'est ce qui permet de te donner un score fiable.
              {sujetProfil
                ? <> Pour appliquer la méthode à ton propre sujet (« {sujetProfil} »), choisis ensuite le mode « Avec mon sujet ».</>
                : <> Pour appliquer la méthode à ton propre sujet, utilise le mode « Avec mon sujet ».</>}
            </p>
          </div>
        )}
        {etape === 1 && (
          <div className="space-y-3">
            <p className="text-sm">Lis attentivement l'article : tu devras juger sa pertinence pour le sujet du scénario.</p>
            <FicheArticle article={affiche} fictif />
          </div>
        )}
        {etape === 2 && <EtapeJugement r={r} setR={setR} />}
        {etape === 3 && <EtapeCriteres r={r} setR={setR} />}
        {etape === 4 && resultat && (
          <div className="space-y-5">
            <FicheArticle article={affiche} fictif extraits={article.extraits.map((e) => e.texte)} />
            <Correction article={article} r={r} resultat={resultat} analyse={analyse} />
          </div>
        )}
        {etape === 5 && <EtapeIA sujet={scenario.sujet} article={affiche} />}
        {etape === 6 && <EtapeComparaison r={r} setR={setR} />}

        {enregistrer.isError && <div className="mt-4"><Message ton="erreur">{enregistrer.error.message}</Message></div>}
        {etape === 6 && conclusion && <div className="mt-4"><Message ton="succes">Ta conclusion a bien été enregistrée.</Message></div>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          {etape > 0 && etape !== 4 ? (
            <button type="button" onClick={() => aller(etape - 1)} className={btnSecondary}><ArrowLeft className="h-4 w-4" /> Précédent</button>
          ) : <span />}
          {etape < 2 && <button type="button" onClick={() => aller(etape + 1)} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>}
          {etape === 2 && (
            <button type="button" onClick={() => aller(3)} disabled={!r.jugement || !r.justification.trim()} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>
          )}
          {etape === 3 && !resultat && (
            <button type="button" onClick={soumettre} disabled={!criteresComplets || enregistrer.isPending} className={btnPrimary}>
              <Send className="h-4 w-4" /> {enregistrer.isPending ? "Enregistrement…" : "Soumettre mon analyse"}
            </button>
          )}
          {etape === 3 && resultat && <button type="button" onClick={() => aller(4)} className={btnPrimary}>Revoir la correction <ArrowRight className="h-4 w-4" /></button>}
          {(etape === 4 || etape === 5) && <button type="button" onClick={() => aller(etape + 1)} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>}
          {etape === 6 && (
            <button type="button" onClick={enregistrerConclusion} disabled={!r.comparaison.decision || enregistrer.isPending} className={btnPrimary}>
              <Check className="h-4 w-4" /> {enregistrer.isPending ? "Enregistrement…" : "Enregistrer ma conclusion"}
            </button>
          )}
        </div>
        {etape === 3 && !criteresComplets && <p className="mt-2 text-right text-xs text-muted-foreground">Donne une appréciation pour les 7 critères pour soumettre ton analyse.</p>}
      </Carte>

      {(conclusion || etape === 6) && <Reflexion />}
      {resultat && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onAutreArticle} className={btnPrimary}><RotateCcw className="h-4 w-4" /> Recommencer avec un autre article</button>
          <Link to="/mes-exercices" className={btnSecondary}>Retour à mes exercices</Link>
        </div>
      )}
    </div>
  );
}

/* ───────── Mode « mon sujet » (non noté) ───────── */

function ChoixArticle({ sujet, onChoisir }: { sujet: string; onChoisir: (a: ArticleAffiche, id: string) => void }) {
  const [onglet, setOnglet] = useState<"crossref" | "saisie">("crossref");
  const [requete, setRequete] = useState(sujet);
  const [resultats, setResultats] = useState<ArticleCrossref[] | null>(null);
  const [etat, setEtat] = useState<"attente" | "erreur" | null>(null);
  const [erreur, setErreur] = useState("");
  const [saisie, setSaisie] = useState<ArticleAffiche>({ titre: "", auteurs: "", annee: "", revue: "", resume: "", motsCles: [], doi: null });
  const [motsCles, setMotsCles] = useState("");

  const chercher = async () => {
    setEtat("attente");
    try {
      setResultats(await rechercherCrossref(requete));
      setEtat(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La recherche a échoué.");
      setEtat("erreur");
    }
  };
  const valider = () => {
    const doi = saisie.doi ? normaliserDoi(saisie.doi) : null;
    const article = { ...saisie, doi, motsCles: motsCles.split(/[,;]/).map((m) => m.trim()).filter(Boolean) };
    onChoisir(article, doi ? `doi:${doi.toLowerCase()}` : `saisie:${saisie.titre.trim().toLowerCase().slice(0, 200)}`);
  };

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-1 rounded-full bg-muted p-1">
        {([["crossref", "Chercher un article réel"], ["saisie", "Saisir un article"]] as const).map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={onglet === id} onClick={() => setOnglet(id)} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${onglet === id ? "bg-card text-navy shadow-card" : "text-muted-foreground"}`}>{label}</button>
        ))}
      </div>

      {onglet === "crossref" ? (
        <>
          <p className="text-sm text-muted-foreground">
            La recherche interroge Crossref, le registre officiel des DOI : les métadonnées affichées sont celles publiées par les éditeurs. Les résultats ne sont pas triés selon leur pertinence pour ton sujet, et le résumé manque souvent. C'est justement à toi d'en juger.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); void chercher(); }} className="flex flex-col gap-2 sm:flex-row">
            <input aria-label="Mots de la recherche" value={requete} maxLength={300} onChange={(e) => setRequete(e.target.value)} className={inputClass} />
            <button type="submit" disabled={!requete.trim() || etat === "attente"} className={`${btnPrimary} shrink-0`}><Search className="h-4 w-4" /> {etat === "attente" ? "Recherche…" : "Chercher"}</button>
          </form>
          <p className="text-xs text-muted-foreground">Astuce : des mots-clés en anglais donnent souvent plus de résultats (voir ton exercice « Mots-clés »).</p>
          {etat === "erreur" && <Message ton="erreur">{erreur}</Message>}
          {resultats?.length === 0 && <Message>Aucun article trouvé : essaie d'autres mots-clés.</Message>}
          <ul className="space-y-2">
            {resultats?.map((a) => (
              <li key={a.doi} className="flex flex-col gap-2 rounded-xl border-2 border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-navy">{a.titre}</span>
                  <span className="block text-xs text-muted-foreground">{[a.auteurs, a.revue, a.annee].filter(Boolean).join(" · ")} {a.resume ? "" : "· sans résumé"}</span>
                </span>
                <button type="button" onClick={() => onChoisir(a, `doi:${a.doi.toLowerCase()}`)} className={`${btnSecondary} shrink-0`}>Analyser cet article</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Saisis un article que tu as trouvé (dans une base de données, sur Google Scholar ou proposé par une IA). Recopie exactement le titre et le résumé.</p>
          <label className="block text-sm font-medium">Titre *<input value={saisie.titre} maxLength={300} onChange={(e) => setSaisie({ ...saisie, titre: e.target.value })} className={`${inputClass} mt-1`} /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium sm:col-span-2">Auteur(s)<input value={saisie.auteurs} maxLength={300} onChange={(e) => setSaisie({ ...saisie, auteurs: e.target.value })} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-medium">Année<input value={saisie.annee} maxLength={4} inputMode="numeric" onChange={(e) => setSaisie({ ...saisie, annee: e.target.value.replace(/\D/g, "") })} className={`${inputClass} mt-1`} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Revue ou source<input value={saisie.revue} maxLength={200} onChange={(e) => setSaisie({ ...saisie, revue: e.target.value })} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-medium">DOI<input value={saisie.doi ?? ""} maxLength={200} placeholder="10.xxxx/…" onChange={(e) => setSaisie({ ...saisie, doi: e.target.value })} className={`${inputClass} mt-1`} /></label>
          </div>
          <label className="block text-sm font-medium">Résumé *<textarea rows={5} maxLength={4000} value={saisie.resume} onChange={(e) => setSaisie({ ...saisie, resume: e.target.value })} className={`${inputClass} mt-1`} /></label>
          <label className="block text-sm font-medium">Mots-clés (séparés par des virgules)<input value={motsCles} maxLength={300} onChange={(e) => setMotsCles(e.target.value)} className={`${inputClass} mt-1`} /></label>
          {saisie.doi && !normaliserDoi(saisie.doi) && <p className="text-xs text-tint-rose-fg">Ce DOI n'a pas un format valide : il sera ignoré.</p>}
          <button type="button" onClick={valider} disabled={!saisie.titre.trim() || !saisie.resume.trim()} className={btnPrimary}>Analyser cet article</button>
        </div>
      )}
    </div>
  );
}

function VerificationDoiArticle({ article }: { article: ArticleAffiche }) {
  const [v, setV] = useState<VerificationDoi | null>(null);
  const [etat, setEtat] = useState<"attente" | "erreur" | null>(null);
  if (!article.doi) return null;
  const verifier = async () => {
    setEtat("attente");
    try {
      setV(await verifierDoi(article.doi!));
      setEtat(null);
    } catch {
      setEtat("erreur");
    }
  };
  return (
    <div className="mt-3 text-sm">
      <button type="button" onClick={() => void verifier()} disabled={etat === "attente"} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
        <ShieldCheck className="h-4 w-4" /> {etat === "attente" ? "Vérification…" : "Vérifier le DOI auprès de Crossref"}
      </button>
      {etat === "erreur" && <span className="ml-2 text-xs text-tint-rose-fg">Crossref ne répond pas, réessaie plus tard.</span>}
      {v?.statut === "trouve" && <p className="mt-2 text-xs text-tint-green-fg">DOI enregistré chez Crossref : « {v.titre} »{v.revue && `, ${v.revue}`}{v.annee && ` (${v.annee})`}.</p>}
      {v && v.statut !== "trouve" && <p className="mt-2 text-xs text-tint-rose-fg">DOI introuvable chez Crossref : la référence est peut-être erronée ou inventée.</p>}
    </div>
  );
}

export function ParcoursMonSujet({ userId, sujetProfil }: { userId: string; sujetProfil: string | null }) {
  const enregistrer = useEnregistrerAnalyse(userId);
  const [etape, setEtape] = useState(0);
  const [maxAtteinte, setMaxAtteinte] = useState(0);
  const [sujet, setSujet] = useState(sujetProfil ?? "");
  const [choix, setChoix] = useState<{ article: ArticleAffiche; id: string } | null>(null);
  const [r, setR] = useState<ReponsesPertinence>(REPONSES_VIDES);
  const [soumis, setSoumis] = useState(false);
  const [conclusion, setConclusion] = useState(false);
  const haut = useRef<HTMLDivElement>(null);

  const aller = (i: number) => {
    setEtape(i);
    setMaxAtteinte((m) => Math.max(m, i));
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const sauver = (apres: () => void) => {
    if (!choix) return;
    enregistrer.mutate(
      { p_article: choix.id, p_mode: "mon-sujet", p_sujet: sujet.trim(), p_article_info: choix.article as unknown as Record<string, unknown>, p_analyse: r as unknown as Record<string, unknown>, p_score: null },
      { onSuccess: apres },
    );
  };
  const recommencer = () => {
    setChoix(null);
    setR(REPONSES_VIDES);
    setSoumis(false);
    setConclusion(false);
    setMaxAtteinte(1);
    aller(1);
  };
  const criteresComplets = CRITERES.every((c) => r.criteres[c.id]);
  const indices = choix ? termesCommuns(sujet, [choix.article.titre, choix.article.resume, ...choix.article.motsCles].join(" ")) : null;

  return (
    <div ref={haut} className="scroll-mt-24 space-y-5">
      <IndicateurEtapes etape={etape} maxAtteinte={soumis ? maxAtteinte : Math.min(maxAtteinte, choix ? 3 : 1)} onAller={aller} />
      <Carte titre={ETAPES[etape]}>
        {etape === 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Ton sujet de recherche
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {sujetProfil ? "Repris de ton profil chercheur. Tu peux le modifier pour cet exercice : ton profil ne sera pas changé." : "Tu n'as pas encore de profil chercheur : saisis ton sujet pour cet exercice."}
              </span>
              <textarea rows={3} maxLength={500} value={sujet} onChange={(e) => setSujet(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            {sujetProfil && sujet.trim() !== sujetProfil && (
              <button type="button" onClick={() => setSujet(sujetProfil)} className="text-sm font-semibold text-primary hover:underline">Revenir au sujet de mon profil</button>
            )}
            {!sujetProfil && <Link to="/profil-chercheur" className="block text-sm font-semibold text-primary hover:underline">Créer mon profil chercheur</Link>}
          </div>
        )}
        {etape === 1 && (choix ? (
          <div className="space-y-3">
            <FicheArticle article={choix.article} fictif={false} verification={<VerificationDoiArticle article={choix.article} />} />
            {!soumis && <button type="button" onClick={() => setChoix(null)} className="text-sm font-semibold text-primary hover:underline">Choisir un autre article</button>}
          </div>
        ) : (
          <ChoixArticle sujet={sujet} onChoisir={(article, id) => setChoix({ article, id })} />
        ))}
        {etape === 2 && <EtapeJugement r={r} setR={setR} />}
        {etape === 3 && <EtapeCriteres r={r} setR={setR} />}
        {etape === 4 && choix && indices && (
          <div className="space-y-4 text-sm">
            <Message>
              Pas de correction automatique ni de score ici : personne n'a annoté cet article pour ton sujet. Les indications ci-dessous t'aident à relire ton analyse ; l'étape suivante te propose de la confronter à celle d'une IA.
            </Message>
            <div className="rounded-xl bg-muted p-4">
              <h3 className="font-bold text-navy">Termes de ton sujet retrouvés dans l'article (indice automatique)</h3>
              <p className="mt-1">{indices.trouves.length} sur {indices.termes.length} : {indices.trouves.join(", ") || "aucun"}.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Limite : la comparaison ne reconnaît ni les synonymes ni les traductions (un article en anglais partage rarement les mots d'un sujet en français). Une correspondance de mots ne prouve pas la pertinence, et son absence ne prouve pas le contraire.
              </p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <h3 className="font-bold text-navy">Informations disponibles pour juger</h3>
              <ul className="mt-1 space-y-0.5">
                <li>Résumé : {choix.article.resume ? "disponible" : "absent, il faudra lire l'article"}</li>
                <li>DOI : {choix.article.doi ? "présent, vérifiable" : "absent, la source est plus difficile à vérifier"}</li>
                <li>Revue ou source : {choix.article.revue || "non indiquée"}</li>
                <li>Année : {choix.article.annee || "non indiquée"}</li>
              </ul>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <h3 className="font-bold text-navy">Relis ton analyse</h3>
              <p className="mt-1">Ton jugement : <strong>{labelPertinence(r.jugement)}</strong>.</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>As-tu cité des éléments précis du titre ou du résumé ?</li>
                <li>As-tu distingué le thème (de quoi parle l'article) de la problématique (aide-t-il à répondre à ta question) ?</li>
                <li>As-tu séparé la pertinence (lien avec ton sujet) de la fiabilité (source vérifiable) ?</li>
              </ul>
            </div>
          </div>
        )}
        {etape === 5 && choix && <EtapeIA sujet={sujet.trim()} article={choix.article} />}
        {etape === 6 && <EtapeComparaison r={r} setR={setR} />}

        {enregistrer.isError && <div className="mt-4"><Message ton="erreur">{enregistrer.error.message}</Message></div>}
        {etape === 4 && soumis && <div className="mt-4"><Message ton="succes">Ton analyse a bien été enregistrée (non notée).</Message></div>}
        {etape === 6 && conclusion && <div className="mt-4"><Message ton="succes">Ta conclusion a bien été enregistrée.</Message></div>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          {etape > 0 ? <button type="button" onClick={() => aller(etape - 1)} className={btnSecondary}><ArrowLeft className="h-4 w-4" /> Précédent</button> : <span />}
          {etape === 0 && <button type="button" onClick={() => aller(1)} disabled={sujet.trim().length < 5} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>}
          {etape === 1 && <button type="button" onClick={() => aller(2)} disabled={!choix} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>}
          {etape === 2 && <button type="button" onClick={() => aller(3)} disabled={!r.jugement || !r.justification.trim()} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>}
          {etape === 3 && (
            <button type="button" onClick={() => sauver(() => { setSoumis(true); aller(4); })} disabled={!criteresComplets || enregistrer.isPending} className={btnPrimary}>
              <Send className="h-4 w-4" /> {enregistrer.isPending ? "Enregistrement…" : soumis ? "Mettre à jour mon analyse" : "Soumettre mon analyse"}
            </button>
          )}
          {(etape === 4 || etape === 5) && <button type="button" onClick={() => aller(etape + 1)} className={btnPrimary}>Suivant <ArrowRight className="h-4 w-4" /></button>}
          {etape === 6 && (
            <button type="button" onClick={() => sauver(() => setConclusion(true))} disabled={!r.comparaison.decision || enregistrer.isPending} className={btnPrimary}>
              <Check className="h-4 w-4" /> {enregistrer.isPending ? "Enregistrement…" : "Enregistrer ma conclusion"}
            </button>
          )}
        </div>
      </Carte>
      {(conclusion || etape === 6) && <Reflexion />}
      {soumis && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={recommencer} className={btnPrimary}><RotateCcw className="h-4 w-4" /> Recommencer avec un autre article</button>
          <Link to="/mes-exercices" className={btnSecondary}>Retour à mes exercices</Link>
        </div>
      )}
    </div>
  );
}
