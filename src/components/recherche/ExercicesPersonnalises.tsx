import { CheckCircle2, ExternalLink, Plus, RotateCcw, Save, Search, ShieldCheck, Trash2, Wand2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { btnPrimary, btnSecondary, formatDateHeure, inputClass } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import {
  construireEquation,
  EXERCICES_RECHERCHE,
  labelNiveauEtudes,
  lienGoogleScholar,
  lireContenu,
  normaliserDoi,
  ressemblanceTitres,
  termesDuSujet,
  useEnregistrerTravail,
  verifierDoi,
  type Concept,
  type Reference,
} from "@/lib/recherche";
import type { ExerciceRecherche, ProfilChercheur, TravailRecherche } from "@/lib/supabase";

type Props = {
  userId: string;
  profil: ProfilChercheur;
  travaux: Map<ExerciceRecherche, TravailRecherche>;
  onAller: (e: ExerciceRecherche) => void;
};

/** Exercice choisi ; `key` sur l'exercice pour repartir du contenu enregistré à chaque changement. */
export function ExercicePersonnalise({ exercice, ...props }: Props & { exercice: ExerciceRecherche }) {
  switch (exercice) {
    case "prompt":
      return <ExercicePrompt key="prompt" {...props} />;
    case "mots-cles":
      return <ExerciceMotsCles key="mots-cles" {...props} />;
    case "equation":
      return <ExerciceEquation key="equation" {...props} />;
    case "references":
      return <ExerciceReferences key="references" {...props} />;
  }
}

/* ───────── Cadre commun : consigne, contenu, enregistrement ───────── */

function Cadre({
  exercice,
  props,
  consigne,
  contenu,
  peutTerminer,
  conditionTerminer,
  children,
}: {
  exercice: ExerciceRecherche;
  props: Props;
  consigne: ReactNode;
  contenu: Record<string, unknown>;
  peutTerminer: boolean;
  conditionTerminer: string;
  children: ReactNode;
}) {
  const enregistrer = useEnregistrerTravail(props.userId);
  const travail = props.travaux.get(exercice);
  const [action, setAction] = useState<"enregistrer" | "terminer" | "rouvrir" | null>(null);
  const meta = EXERCICES_RECHERCHE.find((e) => e.id === exercice)!;

  const sauver = (termine: boolean, a: NonNullable<typeof action>) => {
    setAction(a);
    enregistrer.mutate({ exercice, sujet: props.profil.sujet, contenu, termine });
  };
  const termine = travail?.termine ?? false;

  return (
    <Carte
      titre={meta.titre}
      action={termine ? <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-green px-3 py-1 text-sm font-semibold text-tint-green-fg"><CheckCircle2 className="h-4 w-4" /> Terminé</span> : undefined}
    >
      <div className="rounded-xl bg-muted p-4 text-sm">
        <p className="font-semibold text-navy">Ton sujet : « {props.profil.sujet} »</p>
        <p className="mt-1 text-muted-foreground">
          {props.profil.discipline} · {labelNiveauEtudes(props.profil.niveau_etudes)}
          {travail && travail.sujet !== props.profil.sujet && <> · ce travail a été commencé sur un ancien sujet : « {travail.sujet} »</>}
        </p>
      </div>
      <div className="mt-4 text-sm">{consigne}</div>
      <div className="mt-5 space-y-5">{children}</div>

      <div className="mt-6 space-y-3 border-t pt-5">
        {enregistrer.isError && <Message ton="erreur">{enregistrer.error.message}</Message>}
        {enregistrer.isSuccess && !enregistrer.isPending && (
          <Message ton="succes">
            {action === "terminer" ? "Exercice enregistré et marqué comme terminé." : action === "rouvrir" ? "Exercice rouvert : tu peux le modifier." : "Ton travail a bien été enregistré."}
          </Message>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => sauver(termine, "enregistrer")} disabled={enregistrer.isPending} className={btnSecondary}>
            <Save className="h-4 w-4" /> {enregistrer.isPending && action === "enregistrer" ? "Enregistrement…" : "Enregistrer"}
          </button>
          {termine ? (
            <button type="button" onClick={() => sauver(false, "rouvrir")} disabled={enregistrer.isPending} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">
              <RotateCcw className="h-4 w-4" /> Rouvrir l'exercice
            </button>
          ) : (
            <button type="button" onClick={() => sauver(true, "terminer")} disabled={!peutTerminer || enregistrer.isPending} className={btnPrimary}>
              <CheckCircle2 className="h-4 w-4" /> Enregistrer et terminer
            </button>
          )}
          {travail && <span className="text-xs text-muted-foreground">Dernier enregistrement : {formatDateHeure(travail.updated_at)}</span>}
        </div>
        {!termine && !peutTerminer && <p className="text-xs text-muted-foreground">Pour terminer : {conditionTerminer}</p>}
      </div>
    </Carte>
  );
}

function CaseACocher({ coche, onChange, children }: { coche: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 text-sm hover:bg-muted">
      <input type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]" />
      <span>{children}</span>
    </label>
  );
}

const basculer = (liste: string[], id: string, v: boolean) => (v ? [...new Set([...liste, id])] : liste.filter((x) => x !== id));

/* ───────── 1. Formuler un prompt ───────── */

const ELEMENTS_PROMPT = [
  { id: "role", label: "Rôle : je dis à l'IA quel expert jouer." },
  { id: "contexte", label: "Contexte : ma discipline, mon niveau et mon sujet sont précisés." },
  { id: "objectif", label: "Objectif : je dis clairement ce que j'attends." },
  { id: "consignes", label: "Consignes : je fixe des limites (nombre, période, langue, sources…)." },
  { id: "format", label: "Format : j'indique la forme de la réponse (liste, tableau, plan…)." },
  { id: "criteres", label: "Critères de qualité : je demande de signaler les incertitudes et de ne rien inventer." },
];

const PHRASE_NIVEAU: Record<string, string> = {
  licence: "étudiant(e) en licence",
  master: "étudiant(e) en master",
  doctorat: "doctorant(e)",
  postdoc: "chercheur(se) post-doctorant(e)",
  enseignant: "enseignant(e)-chercheur(se)",
  autre: "chercheur(se)",
};

function modelePrompt(p: ProfilChercheur) {
  return [
    `Agis comme un méthodologue spécialisé en ${p.discipline}.`,
    `Je suis ${PHRASE_NIVEAU[p.niveau_etudes] ?? "chercheur(se)"} et je travaille sur le sujet suivant : « ${p.sujet} ».`,
    p.problematique ? `Ma problématique est : ${p.problematique}` : "",
    "Objectif : [ce que tu attends de l'IA, par exemple proposer trois angles d'approche de ce sujet].",
    "Consignes : [limites à respecter : période, terrain, nombre de propositions…].",
    "Format : [forme de la réponse : tableau, liste numérotée…].",
    "Signale tes incertitudes et ne cite aucune référence que tu ne peux pas vérifier.",
  ]
    .filter(Boolean)
    .join("\n");
}

function ExercicePrompt(props: Props) {
  const initial = lireContenu.prompt(props.travaux.get("prompt")?.contenu);
  const [prompt, setPrompt] = useState(initial.prompt);
  const [criteres, setCriteres] = useState(initial.criteres);

  const termesSujet = termesDuSujet(props.profil.sujet);
  const presents = termesSujet.filter((t) => prompt.toLowerCase().includes(t));
  const nbMots = (prompt.trim().match(/\S+/g) ?? []).length;
  const crochets = /\[[^\]]*\]/.test(prompt);
  const peutTerminer = nbMots >= 20 && !crochets && criteres.length === ELEMENTS_PROMPT.length;

  return (
    <Cadre
      exercice="prompt"
      props={props}
      contenu={{ prompt, criteres }}
      peutTerminer={peutTerminer}
      conditionTerminer="un prompt d'au moins 20 mots, sans partie entre crochets, et les 6 éléments cochés."
      consigne={<p>Rédige un prompt qui demande à une IA de t'aider sur <strong>ton</strong> sujet. Pars du modèle si tu veux, puis complète chaque partie entre crochets.</p>}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-navy">Modèle construit à partir de ton profil</h3>
          <button type="button" onClick={() => setPrompt(modelePrompt(props.profil))} disabled={prompt.trim().length > 0} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline" title={prompt.trim() ? "Vide ton prompt pour réutiliser le modèle" : undefined}>
            <Wand2 className="h-4 w-4" /> Partir de ce modèle
          </button>
        </div>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border-2 border-dashed border-border p-4 font-sans text-sm text-muted-foreground">{modelePrompt(props.profil)}</pre>
      </div>
      <label className="block text-sm font-medium">
        Mon prompt
        <textarea rows={8} maxLength={4000} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <div className="rounded-xl bg-muted p-4 text-sm">
        <p className="font-semibold text-navy">Indices automatiques</p>
        <ul className="mt-2 space-y-1">
          <li>{nbMots} mot{nbMots > 1 ? "s" : ""}{nbMots < 20 && " : un bon prompt de recherche en compte en général davantage."}</li>
          <li>
            Termes de ton sujet repris : {presents.length} sur {termesSujet.length}
            {termesSujet.length > 0 && presents.length < termesSujet.length && <> (absents : {termesSujet.filter((t) => !presents.includes(t)).join(", ")})</>}
          </li>
          {crochets && <li className="font-medium text-tint-rose-fg">Il reste des parties entre crochets à compléter.</li>}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-navy">Auto-évaluation : les 6 éléments d'un prompt efficace</h3>
        <div className="mt-2 space-y-1">
          {ELEMENTS_PROMPT.map((c) => (
            <CaseACocher key={c.id} coche={criteres.includes(c.id)} onChange={(v) => setCriteres((l) => basculer(l, c.id, v))}>{c.label}</CaseACocher>
          ))}
        </div>
      </div>
    </Cadre>
  );
}

/* ───────── 2. Mots-clés français et anglais ───────── */

const CONCEPT_VIDE: Concept = { fr: "", en: "", synonymes: "" };

function ExerciceMotsCles(props: Props) {
  const initial = lireContenu.motsCles(props.travaux.get("mots-cles")?.contenu);
  const [concepts, setConcepts] = useState<Concept[]>(initial.concepts.length ? initial.concepts : [CONCEPT_VIDE, CONCEPT_VIDE]);
  const candidats = termesDuSujet(props.profil.sujet, props.profil.problematique);
  const dejaPris = new Set(concepts.map((c) => c.fr.trim().toLowerCase()));
  const complets = concepts.filter((c) => c.fr.trim() && c.en.trim());

  const majConcept = (i: number, cle: keyof Concept, v: string) => setConcepts((l) => l.map((c, j) => (j === i ? { ...c, [cle]: v } : c)));
  const ajouter = (fr = "") =>
    setConcepts((l) => {
      const vide = l.findIndex((c) => !c.fr.trim() && !c.en.trim() && !c.synonymes.trim());
      if (fr && vide >= 0) return l.map((c, j) => (j === vide ? { ...c, fr } : c));
      return l.length < 6 ? [...l, { ...CONCEPT_VIDE, fr }] : l;
    });

  return (
    <Cadre
      exercice="mots-cles"
      props={props}
      contenu={{ concepts: concepts.filter((c) => c.fr.trim() || c.en.trim() || c.synonymes.trim()) }}
      peutTerminer={complets.length >= 2}
      conditionTerminer="au moins 2 concepts avec leur terme français et leur équivalent anglais."
      consigne={
        <p>
          Découpe ton sujet en 2 à 6 concepts. Pour chacun, note le terme français, son équivalent anglais (la plupart des articles scientifiques sont en anglais) et des synonymes éventuels.
          Vérifie chaque traduction dans un dictionnaire spécialisé ou dans les mots-clés d'articles publiés en anglais : une traduction mot à mot est souvent fausse.
        </p>
      }
    >
      {candidats.length > 0 && (
        <div>
          <h3 className="font-semibold text-navy">Termes repérés dans ton sujet</h3>
          <p className="text-xs text-muted-foreground">Clique sur un terme pour en faire un concept, puis reformule-le si besoin.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {candidats.map((t) => (
              <button key={t} type="button" onClick={() => ajouter(t)} disabled={dejaPris.has(t)} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground transition hover:opacity-80 disabled:opacity-40">
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {concepts.map((c, i) => (
          <fieldset key={i} className="grid gap-2 rounded-xl border-2 border-border p-3 sm:grid-cols-[1fr_1fr_1.3fr_auto] sm:items-end">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">Concept {i + 1}</legend>
            <label className="text-xs font-medium">Français<input value={c.fr} maxLength={80} onChange={(e) => majConcept(i, "fr", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs font-medium">Anglais<input value={c.en} maxLength={80} onChange={(e) => majConcept(i, "en", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs font-medium">Synonymes (séparés par des virgules)<input value={c.synonymes} maxLength={200} onChange={(e) => majConcept(i, "synonymes", e.target.value)} className={`${inputClass} mt-1`} /></label>
            <button type="button" onClick={() => setConcepts((l) => l.filter((_, j) => j !== i))} disabled={concepts.length <= 1} aria-label={`Supprimer le concept ${i + 1}`} className="justify-self-end rounded-full p-2.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-30">
              <Trash2 className="h-4 w-4" />
            </button>
          </fieldset>
        ))}
      </div>
      <button type="button" onClick={() => ajouter()} disabled={concepts.length >= 6} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:text-muted-foreground">
        <Plus className="h-4 w-4" /> Ajouter un concept
      </button>
    </Cadre>
  );
}

/* ───────── 3. Équation de recherche ───────── */

const parenthesesEquilibrees = (s: string) => {
  let n = 0;
  for (const ch of s) {
    n += ch === "(" ? 1 : ch === ")" ? -1 : 0;
    if (n < 0) return false;
  }
  return n === 0;
};

function ExerciceEquation(props: Props) {
  const concepts = lireContenu.motsCles(props.travaux.get("mots-cles")?.contenu).concepts.filter((c) => c.fr.trim() || c.en.trim());
  const generee = construireEquation(concepts);
  const [equation, setEquation] = useState(lireContenu.equation(props.travaux.get("equation")?.contenu).equation || generee);
  const equilibree = parenthesesEquilibrees(equation);

  if (concepts.length === 0) {
    return (
      <Carte titre="Équation de recherche">
        <Message>L'équation se construit à partir de tes mots-clés. Fais d'abord l'exercice « Mots-clés français et anglais » et enregistre-le.</Message>
        <button type="button" onClick={() => props.onAller("mots-cles")} className={`${btnPrimary} mt-4`}>Aller aux mots-clés</button>
      </Carte>
    );
  }

  return (
    <Cadre
      exercice="equation"
      props={props}
      contenu={{ equation: equation.trim() }}
      peutTerminer={equation.trim().length > 0 && equilibree}
      conditionTerminer="une équation non vide avec des parenthèses équilibrées."
      consigne={
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>OR</strong> relie les synonymes d'un même concept (élargit la recherche).</li>
          <li><strong>AND</strong> relie des concepts différents (resserre la recherche).</li>
          <li>Les <strong>guillemets</strong> cherchent une expression exacte ; l'astérisque (<strong>econom*</strong>) cherche toutes les terminaisons, dans les bases qui l'acceptent.</li>
        </ul>
      }
    >
      <div>
        <h3 className="font-semibold text-navy">Équation générée à partir de tes mots-clés enregistrés</h3>
        <code className="mt-2 block break-words rounded-xl bg-muted p-4 text-sm">{generee}</code>
      </div>
      <label className="block text-sm font-medium">
        Mon équation (modifie-la : ajoute une troncature, retire un terme trop large…)
        <textarea rows={4} maxLength={1000} value={equation} onChange={(e) => setEquation(e.target.value)} className={`${inputClass} mt-1 font-mono`} />
      </label>
      {!equilibree && <Message ton="erreur">Les parenthèses ne sont pas équilibrées.</Message>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setEquation(generee)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <RotateCcw className="h-4 w-4" /> Repartir de l'équation générée
        </button>
        {equation.trim() && (
          <a href={lienGoogleScholar(equation)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <Search className="h-4 w-4" /> Tester sur Google Scholar <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Le test ouvre Google Scholar dans un nouvel onglet : ton équation est alors envoyée à Google. Note le nombre de résultats, puis ajuste l'équation s'il y en a trop ou trop peu.</p>
    </Cadre>
  );
}

/* ───────── 4. Recherche et vérification de références ───────── */

const CRITERES_REFERENCE = [
  { id: "auteurs", label: "Les auteurs existent et publient sur ce thème." },
  { id: "source", label: "La revue, l'éditeur ou l'institution est identifié et reconnu." },
  { id: "annee", label: "L'année et les informations de publication sont cohérentes." },
  { id: "contenu", label: "J'ai lu au moins le résumé : la source dit bien ce qu'on lui attribue." },
];
const REFERENCE_VIDE: Reference = { titre: "", auteurs: "", annee: "", doi: "", criteres: [] };

const referenceVerifiee = (r: Reference) => r.criteres.length === CRITERES_REFERENCE.length;

function ExerciceReferences(props: Props) {
  const initial = lireContenu.references(props.travaux.get("references")?.contenu);
  const [refs, setRefs] = useState<Reference[]>(initial.references.length ? initial.references : [REFERENCE_VIDE]);
  const equation = lireContenu.equation(props.travaux.get("equation")?.contenu).equation;
  const majRef = (i: number, patch: Partial<Reference>) => setRefs((l) => l.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Cadre
      exercice="references"
      props={props}
      contenu={{ references: refs.filter((r) => r.titre.trim() || r.doi.trim()) }}
      peutTerminer={refs.filter((r) => r.titre.trim() && referenceVerifiee(r)).length >= 2}
      conditionTerminer="au moins 2 références avec un titre et les 4 critères de vérification cochés."
      consigne={
        <p>
          Trouve des références sur ton sujet (avec ton équation de recherche, ou parmi celles qu'une IA t'a proposées), puis vérifie chacune.
          Une IA peut inventer des références très crédibles : seul un contrôle dans une source fiable permet de les garder.
        </p>
      }
    >
      <div className="flex flex-wrap gap-3">
        <a href={lienGoogleScholar(equation || props.profil.sujet)} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
          <Search className="h-4 w-4" /> Chercher sur Google Scholar {equation ? "avec mon équation" : "avec mon sujet"} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="space-y-4">
        {refs.map((r, i) => (
          <CarteReference key={i} index={i} reference={r} onChange={(p) => majRef(i, p)} onSupprimer={refs.length > 1 ? () => setRefs((l) => l.filter((_, j) => j !== i)) : undefined} />
        ))}
      </div>
      <button type="button" onClick={() => setRefs((l) => [...l, REFERENCE_VIDE])} disabled={refs.length >= 5} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:text-muted-foreground">
        <Plus className="h-4 w-4" /> Ajouter une référence
      </button>
    </Cadre>
  );
}

function CarteReference({ index, reference: r, onChange, onSupprimer }: { index: number; reference: Reference; onChange: (p: Partial<Reference>) => void; onSupprimer?: (() => void) | undefined }) {
  const [verification, setVerification] = useState<"attente" | "erreur" | null>(null);
  const [erreur, setErreur] = useState("");
  const v = r.verification;

  const verifier = async () => {
    setVerification("attente");
    try {
      onChange({ verification: await verifierDoi(r.doi) });
      setVerification(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La vérification a échoué.");
      setVerification("erreur");
    }
  };

  return (
    <fieldset className="rounded-xl border-2 border-border p-4">
      <legend className="px-1 text-xs font-semibold text-muted-foreground">Référence {index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium sm:col-span-2">Titre<input value={r.titre} maxLength={300} onChange={(e) => onChange({ titre: e.target.value })} className={`${inputClass} mt-1`} /></label>
        <label className="text-xs font-medium">Auteurs<input value={r.auteurs} maxLength={200} onChange={(e) => onChange({ auteurs: e.target.value })} className={`${inputClass} mt-1`} /></label>
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <label className="text-xs font-medium">Année<input value={r.annee} maxLength={4} inputMode="numeric" onChange={(e) => onChange({ annee: e.target.value.replace(/\D/g, "") })} className={`${inputClass} mt-1`} /></label>
          <label className="text-xs font-medium">DOI (si connu)<input value={r.doi} maxLength={200} placeholder="10.xxxx/…" onChange={(e) => onChange({ doi: e.target.value, verification: undefined })} className={`${inputClass} mt-1`} /></label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void verifier()} disabled={!r.doi.trim() || verification === "attente"} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
          <ShieldCheck className="h-4 w-4" /> {verification === "attente" ? "Vérification…" : "Vérifier le DOI (Crossref)"}
        </button>
        {r.titre.trim() && (
          <a href={lienGoogleScholar(`"${r.titre.trim()}"`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Rechercher le titre sur Google Scholar <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {onSupprimer && (
          <button type="button" onClick={onSupprimer} className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /> Retirer</button>
        )}
      </div>
      {r.doi.trim() && !normaliserDoi(r.doi) && <p className="mt-2 text-xs text-tint-rose-fg">Un DOI commence par « 10. » suivi d'un préfixe et d'une barre oblique.</p>}
      {verification === "erreur" && <div className="mt-3"><Message ton="erreur">{erreur}</Message></div>}
      {v && (
        <div className="mt-3">
          {v.statut === "trouve" ? (
            <Message ton={r.titre.trim() && ressemblanceTitres(r.titre, v.titre) < 0.5 ? "erreur" : "succes"}>
              DOI enregistré chez Crossref : « {v.titre} »{v.revue && <>, {v.revue}</>}{v.annee && <> ({v.annee})</>}.
              {r.titre.trim() && (ressemblanceTitres(r.titre, v.titre) < 0.5
                ? " Ce titre ne correspond pas à celui que tu as noté : la référence est peut-être erronée ou inventée."
                : " Le titre correspond à celui que tu as noté.")}
            </Message>
          ) : (
            <Message ton="erreur">
              {v.statut === "invalide" ? "Ce DOI n'a pas un format valide." : "Ce DOI est inconnu de Crossref : vérifie-le, la référence est peut-être inventée."}
            </Message>
          )}
        </div>
      )}
      <div className="mt-3 space-y-0.5">
        {CRITERES_REFERENCE.map((c) => (
          <CaseACocher key={c.id} coche={r.criteres.includes(c.id)} onChange={(val) => onChange({ criteres: basculer(r.criteres, c.id, val) })}>{c.label}</CaseACocher>
        ))}
      </div>
    </fieldset>
  );
}
