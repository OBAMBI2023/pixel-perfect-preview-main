import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, GripVertical, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { CLE_EXERCICES, enregistrerTentatives } from "@/lib/progression";
import { CATEGORIES, NIVEAUX, type Niveau } from "@/lib/qcm-comprendre-ia";
import {
  ELEMENTS_PROMPT,
  TYPES_EXERCICE,
  exercicesComprendreIA,
  filtrerExercices,
  type ElementPrompt,
  type Exercice,
  type ExoAssociation,
  type ExoEquation,
  type ExoEtudeCas,
  type ExoOrdre,
  type ExoPrompt,
  type ExoVraiFaux,
} from "@/lib/exercices-comprendre-ia";

const KEY = CLE_EXERCICES;

/* ───────── Utilitaires ───────── */

/** Mélange déterministe (même résultat côté serveur et navigateur pour une même graine). */
function melanger<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  // On évite de présenter les éléments déjà dans le bon ordre.
  if (a.length > 1 && a.every((x, i) => x === items[i])) a.push(a.shift()!);
  return a;
}

const OK = "border-success bg-tint-green";
const KO = "border-destructive bg-tint-rose";
/** Style d'une option à choix : sélection avant validation, bonne/mauvaise réponse après. */
const choixClass = (checked: boolean, estBonne: boolean, estChoisie: boolean) =>
  checked ? (estBonne ? OK : estChoisie ? KO : "border-border") : estChoisie ? "border-primary bg-secondary" : "border-border hover:bg-muted";
const selectClass = "w-full rounded-lg border-2 border-border bg-background p-2 text-sm disabled:opacity-100";
const btnPrimary = "rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50";
const chipClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card hover:bg-muted"}`;
const niveauBadge: Record<string, string> = { green: "bg-tint-green text-tint-green-fg", orange: "bg-tint-amber text-tint-amber-fg", red: "bg-tint-rose text-tint-rose-fg" };

type Props<T> = { exo: T; seed: string; onResult: (ok: number, total: number, resume: string) => void };

function Correction({ exo, ok, total }: { exo: Exercice; ok: number; total: number }) {
  const reussi = ok === total;
  return (
    <div className="mt-5 space-y-2 rounded-xl bg-muted p-5 text-sm">
      <p className={`flex items-center gap-2 font-bold ${reussi ? "text-success" : "text-destructive"}`}>
        {reussi ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        {reussi ? "Bravo, tout est juste !" : `${ok} bonne(s) réponse(s) sur ${total}`}
      </p>
      <p><strong>Pourquoi :</strong> {exo.explication}</p>
      <p className="flex flex-wrap items-center gap-1">
        <strong>Pour approfondir :</strong> chapitre {exo.chapitre} du
        <Link to="/formations/$slug" params={{ slug: exo.cours }} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          <BookOpen className="h-4 w-4" />support de cours
        </Link>
      </p>
    </div>
  );
}

/** Bouton « Valider » avant correction, puis le bloc de correction. */
function Pied({ exo, checked, pret, ok, total, onValider }: { exo: Exercice; checked: boolean; pret: boolean; ok: number; total: number; onValider: () => void }) {
  if (checked) return <Correction exo={exo} ok={ok} total={total} />;
  return (
    <div className="mt-6">
      <button onClick={onValider} disabled={!pret} className={btnPrimary}>Valider</button>
      {!pret && <p className="mt-2 text-xs text-muted-foreground">Réponds à toutes les parties pour valider.</p>}
    </div>
  );
}

/* ───────── Types d'exercices ───────── */

function VraiFaux({ exo, seed, onResult }: Props<ExoVraiFaux>) {
  const [rep, setRep] = useState<boolean | null>(null);
  const [just, setJust] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ordre = melanger(exo.justifications.map((_, i) => i), seed);
  const ok = Number(rep === exo.reponse) + Number(just === exo.justificationCorrecte);
  const valider = () => { setChecked(true); onResult(ok, 2, `${rep ? "Vrai" : "Faux"} · ${exo.justifications[just ?? -1] ?? ""}`); };

  return (
    <>
      <blockquote className="mt-4 rounded-xl border-l-4 border-primary bg-muted p-4 font-medium text-navy">« {exo.affirmation} »</blockquote>
      <div className="mt-4 flex gap-3">
        {[true, false].map((v) => (
          <button key={String(v)} disabled={checked} onClick={() => setRep(v)} className={`flex-1 rounded-xl border-2 p-3 font-semibold transition sm:flex-none sm:px-10 ${choixClass(checked, v === exo.reponse, v === rep)}`}>
            {v ? "Vrai" : "Faux"}
          </button>
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold text-navy">Justification</p>
      <div className="mt-2 grid gap-2">
        {ordre.map((i) => (
          <button key={i} disabled={checked} onClick={() => setJust(i)} className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${choixClass(checked, i === exo.justificationCorrecte, i === just)}`}>
            {exo.justifications[i]}
          </button>
        ))}
      </div>
      <Pied exo={exo} checked={checked} pret={rep !== null && just !== null} ok={ok} total={2} onValider={valider} />
    </>
  );
}

function Association({ exo, seed, onResult }: Props<ExoAssociation>) {
  const droites = melanger(exo.paires.map((p) => p.droite), seed);
  const [choix, setChoix] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const ok = exo.paires.filter((p, i) => choix[i] === p.droite).length;
  const valider = () => { setChecked(true); onResult(ok, exo.paires.length, exo.paires.flatMap((p, i) => (choix[i] === p.droite ? [] : [`${p.gauche} → ${choix[i] ?? "?"}`])).join(" ; ")); };

  return (
    <>
      <div className="mt-4 grid gap-3">
        {exo.paires.map((p, i) => (
          <div key={p.gauche} className={`grid gap-2 rounded-xl border-2 p-3 sm:grid-cols-2 sm:items-center ${checked ? (choix[i] === p.droite ? OK : KO) : "border-border"}`}>
            <span className="font-semibold text-navy">{p.gauche}</span>
            <select aria-label={`Associer : ${p.gauche}`} value={choix[i] ?? ""} disabled={checked} onChange={(e) => setChoix({ ...choix, [i]: e.target.value })} className={selectClass}>
              <option value="" disabled>Choisir…</option>
              {droites.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {checked && choix[i] !== p.droite && <p className="text-xs sm:col-span-2"><strong>Bonne réponse :</strong> {p.droite}</p>}
          </div>
        ))}
      </div>
      <Pied exo={exo} checked={checked} pret={exo.paires.every((_, i) => choix[i])} ok={ok} total={exo.paires.length} onValider={valider} />
    </>
  );
}

function Ordre({ exo, seed, onResult }: Props<ExoOrdre>) {
  const [items, setItems] = useState(() => melanger(exo.elements, seed));
  const [drag, setDrag] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = items.filter((el, i) => el === exo.elements[i]).length;
  const valider = () => { setChecked(true); onResult(ok, items.length, items.join(" > ")); };
  const deplacer = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const a = [...items];
    const [x] = a.splice(from, 1);
    a.splice(to, 0, x!);
    setItems(a);
  };

  return (
    <>
      <p className="mt-3 text-xs text-muted-foreground">Glisse les éléments, ou utilise les flèches.</p>
      <ol className="mt-3 grid gap-2">
        {items.map((el, i) => (
          <li
            key={el}
            draggable={!checked}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag !== null) deplacer(drag, i); setDrag(null); }}
            onDragEnd={() => setDrag(null)}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 transition ${checked ? (el === exo.elements[i] ? OK : KO) : "cursor-grab border-border bg-card"} ${drag === i ? "opacity-50" : ""}`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
            {!checked && <GripVertical className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />}
            <span className="flex-1 text-sm font-medium">{el}</span>
            {!checked && (
              <span className="flex shrink-0 gap-1">
                <button aria-label="Monter" disabled={i === 0} onClick={() => deplacer(i, i - 1)} className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button aria-label="Descendre" disabled={i === items.length - 1} onClick={() => deplacer(i, i + 1)} className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {checked && ok < items.length && (
        <div className="mt-4 rounded-xl border-2 border-border p-4 text-sm">
          <p className="font-semibold text-navy">Ordre correct</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">{exo.elements.map((el) => <li key={el}>{el}</li>)}</ol>
        </div>
      )}
      <Pied exo={exo} checked={checked} pret ok={ok} total={items.length} onValider={valider} />
    </>
  );
}

function ConstruirePrompt({ exo, seed, onResult }: Props<ExoPrompt>) {
  const morceaux = melanger(exo.morceaux, seed);
  const [choix, setChoix] = useState<Record<string, ElementPrompt>>({});
  const [checked, setChecked] = useState(false);
  const ok = exo.morceaux.filter((m) => choix[m.texte] === m.element).length;
  const valider = () => { setChecked(true); onResult(ok, exo.morceaux.length, exo.morceaux.filter((m) => choix[m.texte] !== m.element).map((m) => `« ${m.texte.slice(0, 40)}… » → ${labelDe(choix[m.texte]!)}`).join(" ; ")); };
  const labelDe = (id: ElementPrompt) => ELEMENTS_PROMPT.find((e) => e.id === id)?.label ?? id;

  return (
    <>
      <p className="mt-4 rounded-xl bg-muted p-4 text-sm"><strong>Prompt de départ, trop vague :</strong> « {exo.promptVague} »</p>
      <div className="mt-4 grid gap-3">
        {morceaux.map((m) => (
          <div key={m.texte} className={`grid gap-2 rounded-xl border-2 p-3 sm:grid-cols-[1fr_16rem] sm:items-center ${checked ? (choix[m.texte] === m.element ? OK : KO) : "border-border"}`}>
            <span className="text-sm font-medium">{m.texte}</span>
            <select aria-label={`Élément du prompt : ${m.texte}`} value={choix[m.texte] ?? ""} disabled={checked} onChange={(e) => setChoix({ ...choix, [m.texte]: e.target.value as ElementPrompt })} className={selectClass}>
              <option value="" disabled>Choisir l'élément…</option>
              {ELEMENTS_PROMPT.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
            {checked && choix[m.texte] !== m.element && <p className="text-xs sm:col-span-2"><strong>Bonne réponse :</strong> {labelDe(m.element)}</p>}
          </div>
        ))}
      </div>
      {checked && (
        <div className="mt-4 rounded-xl border-2 border-primary p-4 text-sm">
          <p className="font-semibold text-navy">Prompt reconstruit</p>
          <p className="mt-2">{exo.morceaux.filter((m) => m.element !== "a-exclure").map((m) => m.texte).join(" ")}</p>
        </div>
      )}
      <Pied exo={exo} checked={checked} pret={exo.morceaux.every((m) => choix[m.texte])} ok={ok} total={exo.morceaux.length} onValider={valider} />
    </>
  );
}

function Equation({ exo, onResult }: Props<ExoEquation>) {
  const [choix, setChoix] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const parts = exo.gabarit.split(/\{(\d+)\}/); // indices impairs = numéros des trous
  const ok = exo.trous.filter((t, i) => choix[i] === t.reponse).length;
  const valider = () => { setChecked(true); onResult(ok, exo.trous.length, parts.map((p, k) => (k % 2 ? exo.trous[Number(p)]!.options[choix[Number(p)]!] ?? "?" : p)).join("")); };
  const correcte = parts.map((p, k) => (k % 2 ? exo.trous[Number(p)]!.options[exo.trous[Number(p)]!.reponse] : p)).join("");

  return (
    <>
      <p className="mt-4 rounded-xl bg-muted p-4 text-sm"><strong>Sujet :</strong> {exo.sujet}</p>
      <div className="mt-4 rounded-xl bg-navy p-4 font-mono text-sm leading-[2.6] text-navy-foreground">
        {parts.map((p, k) => {
          if (k % 2 === 0) return <span key={k}>{p}</span>;
          const t = Number(p);
          const trou = exo.trous[t]!;
          return (
            <select
              key={k}
              aria-label={`Trou ${t + 1}`}
              value={choix[t] ?? ""}
              disabled={checked}
              onChange={(e) => setChoix({ ...choix, [t]: Number(e.target.value) })}
              className={`mx-1 rounded-md border-2 bg-card px-2 py-1 font-semibold text-navy disabled:opacity-100 ${checked ? (choix[t] === trou.reponse ? "border-success" : "border-destructive") : "border-sky"}`}
            >
              <option value="" disabled>?</option>
              {trou.options.map((o, i) => <option key={o} value={i}>{o}</option>)}
            </select>
          );
        })}
      </div>
      {checked && ok < exo.trous.length && <p className="mt-3 text-sm"><strong>Équation correcte :</strong> <code className="rounded bg-muted px-2 py-1">{correcte}</code></p>}
      <Pied exo={exo} checked={checked} pret={exo.trous.every((_, i) => choix[i] !== undefined)} ok={ok} total={exo.trous.length} onValider={valider} />
    </>
  );
}

function EtudeCas({ exo, onResult }: Props<ExoEtudeCas>) {
  const [choix, setChoix] = useState<Record<number, boolean>>({}); // true = garder
  const [checked, setChecked] = useState(false);
  const ok = exo.references.filter((r, i) => choix[i] === r.fiable).length;
  const valider = () => { setChecked(true); onResult(ok, exo.references.length, exo.references.filter((r, i) => choix[i] !== r.fiable).map((r) => `${r.fiable ? "Rejetée" : "Gardée"} : ${r.texte.slice(0, 50)}…`).join(" ; ")); };

  return (
    <>
      <p className="mt-4 rounded-xl bg-muted p-4 text-sm"><strong>Situation :</strong> {exo.contexte}</p>
      <div className="mt-4 grid gap-3">
        {exo.references.map((r, i) => (
          <div key={r.texte} className={`rounded-xl border-2 p-4 ${checked ? (choix[i] === r.fiable ? OK : KO) : "border-border"}`}>
            <p className="text-sm">{r.texte}</p>
            <div className="mt-3 flex gap-2">
              {[true, false].map((garder) => (
                <button key={String(garder)} disabled={checked} onClick={() => setChoix({ ...choix, [i]: garder })} className={`flex-1 rounded-full border-2 px-4 py-2 text-sm font-semibold transition sm:flex-none ${choixClass(checked, garder === r.fiable, choix[i] === garder)}`}>
                  {garder ? "Garder" : "Rejeter"}
                </button>
              ))}
            </div>
            {checked && (
              <p className="mt-3 text-sm">
                <strong>{r.fiable ? "Référence fiable" : "À rejeter"} :</strong> {r.analyse}
              </p>
            )}
          </div>
        ))}
      </div>
      {checked && <p className="mt-3 text-xs text-muted-foreground">Les références à rejeter sont fictives ou erronées, créées pour l'exercice : ne les citez pas.</p>}
      <Pied exo={exo} checked={checked} pret={exo.references.every((_, i) => choix[i] !== undefined)} ok={ok} total={exo.references.length} onValider={valider} />
    </>
  );
}

function ExerciceCorps({ exo, seed, onResult }: Props<Exercice>) {
  switch (exo.type) {
    case "vrai-faux": return <VraiFaux exo={exo} seed={seed} onResult={onResult} />;
    case "association": return <Association exo={exo} seed={seed} onResult={onResult} />;
    case "ordre": return <Ordre exo={exo} seed={seed} onResult={onResult} />;
    case "construire-prompt": return <ConstruirePrompt exo={exo} seed={seed} onResult={onResult} />;
    case "equation": return <Equation exo={exo} seed={seed} onResult={onResult} />;
    case "etude-cas": return <EtudeCas exo={exo} seed={seed} onResult={onResult} />;
  }
}

/* ───────── Rubrique ───────── */

export function ExercicesPratiques({ categorieInitiale, niveauInitial }: { categorieInitiale?: string | undefined; niveauInitial?: Niveau | undefined } = {}) {
  const [type, setType] = useState<Exercice["type"] | undefined>(undefined);
  const [niveau, setNiveau] = useState<Niveau | undefined>(niveauInitial);
  const [cat, setCat] = useState<string | undefined>(categorieInitiale);
  const [idx, setIdx] = useState(0);
  const [essai, setEssai] = useState(0);
  const [reussis, setReussis] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setReussis(JSON.parse(s)); } catch { /* ignore */ }
  }, []);

  const list = filtrerExercices({ ...(type && { type }), ...(cat && { categorie: cat }), ...(niveau && { niveau }) });
  const exo = list[idx];
  const nbReussis = exercicesComprendreIA.filter((e) => reussis[e.id]).length;
  const typeInfo = exo && TYPES_EXERCICE.find((t) => t.id === exo.type);
  const niveauInfo = exo && NIVEAUX.find((n) => n.id === exo.niveau);

  const aller = (i: number) => { setIdx(i); setEssai(0); };
  const filtrer = (f: () => void) => { f(); aller(0); };
  const onResult = (ok: number, total: number, resume: string) => {
    if (!exo) return;
    // Un exercice = une tentative ; sa réponse est « correcte » seulement si tout est juste.
    void enregistrerTentatives([{
      cours: exo.cours, type: "exercice", categorie: exo.categorie, niveau: exo.niveau, score: ok, total,
      reponses: [{ question_id: exo.id, correcte: ok === total, reponse_donnee: ok === total ? null : resume.slice(0, 2000) || null }],
    }]);
    if (ok !== total) return;
    const next = { ...reussis, [exo.id]: true };
    setReussis(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => filtrer(() => setType(undefined))} className={chipClass(type === undefined)}>Tous les types</button>
        {TYPES_EXERCICE.map((t) => (
          <button key={t.id} onClick={() => filtrer(() => setType(t.id))} title={t.description} className={chipClass(t.id === type)}>{t.label}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => filtrer(() => setNiveau(undefined))} className={chipClass(niveau === undefined)}>Tous les niveaux</button>
        {NIVEAUX.map((n) => (
          <button key={n.id} onClick={() => filtrer(() => setNiveau(n.id))} title={n.description} className={chipClass(n.id === niveau)}>{n.label}</button>
        ))}
        <select aria-label="Catégorie" value={cat ?? ""} onChange={(e) => filtrer(() => setCat(e.target.value || undefined))} className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card">
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">{nbReussis} / {exercicesComprendreIA.length} exercices réussis</span>
      </div>

      <div className="mt-6 rounded-2xl bg-card p-6 shadow-card md:p-8">
        {!exo ? (
          <p className="py-10 text-center text-muted-foreground">Aucun exercice pour cette combinaison de filtres.</p>
        ) : (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {list.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => aller(i)}
                  aria-label={`Exercice ${i + 1} : ${e.titre}`}
                  title={e.titre}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${i === idx ? "bg-primary text-primary-foreground" : reussis[e.id] ? "bg-tint-green text-tint-green-fg" : "bg-muted hover:bg-secondary"}`}
                >
                  {reussis[e.id] && i !== idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{typeInfo?.label}</span>
              <span className={`rounded-full px-3 py-1 ${niveauBadge[niveauInfo?.couleur ?? ""] ?? "bg-muted"}`}>{niveauInfo?.label}</span>
              <span className="rounded-full bg-muted px-3 py-1">{CATEGORIES.find((c) => c.id === exo.categorie)?.titre}</span>
              <span className="ml-auto text-muted-foreground">Exercice {idx + 1} / {list.length}</span>
            </div>
            <h3 className="mt-4 text-xl font-bold text-navy md:text-2xl">{exo.titre}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{exo.consigne}</p>

            <ExerciceCorps key={`${exo.id}-${essai}`} exo={exo} seed={`${exo.id}-${essai}`} onResult={onResult} />

            <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">
              <button onClick={() => aller(idx - 1)} disabled={idx === 0} className="inline-flex items-center gap-1 rounded-full px-4 py-2 font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button onClick={() => setEssai(essai + 1)} className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-semibold text-secondary-foreground">
                <RotateCcw className="h-4 w-4" /> Recommencer
              </button>
              <button onClick={() => aller(idx + 1)} disabled={idx >= list.length - 1} className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-40">
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
