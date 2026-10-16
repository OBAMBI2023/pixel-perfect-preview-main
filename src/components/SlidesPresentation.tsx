import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Cog,
  Database,
  ExternalLink,
  FileQuestion,
  Library,
  Lightbulb,
  Link2,
  Lock,
  Maximize,
  Minimize,
  Presentation,
  Scale,
  ScanFace,
  Search,
  Signpost,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { PAGES_PDF, type Slide, type VisuelSlide } from "@/data/slides-comprendre-ia";

/**
 * Présentation en diapositives (16:9 à partir de la tablette) : flèches, touches ← →, glissement
 * du doigt, plein écran pour la projection, explication repliable et lien vers la page du PDF.
 */
export function SlidesPresentation({ titre, slides, pdfUrl }: { titre: string; slides: Slide[]; pdfUrl: string }) {
  const [index, setIndex] = useState(0);
  const [explication, setExplication] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [pleinEcranPossible, setPleinEcranPossible] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const toucher = useRef<{ x: number; y: number } | null>(null);

  const slide = slides[index]!;
  const total = slides.length;
  const page = PAGES_PDF[slide.chapitre];
  const borner = (i: number) => Math.max(0, Math.min(total - 1, i));
  const aller = (i: number) => setIndex(borner(i));
  // Mise à jour fonctionnelle : plusieurs appuis rapprochés avancent bien d'autant de diapositives.
  const deplacer = (pas: number) => setIndex((i) => borner(i + pas));

  useEffect(() => {
    setPleinEcranPossible(!!document.fullscreenEnabled);
    const maj = () => setPleinEcran(document.fullscreenElement === zone.current);
    document.addEventListener("fullscreenchange", maj);
    return () => document.removeEventListener("fullscreenchange", maj);
  }, []);

  const basculerPleinEcran = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void zone.current?.requestFullscreen().then(() => zone.current?.focus());
  };

  const clavier = (e: KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      ArrowRight: () => deplacer(1),
      ArrowLeft: () => deplacer(-1),
      Home: () => aller(0),
      End: () => aller(total - 1),
    };
    const action = actions[e.key];
    if (action && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      action();
    }
  };

  const debutToucher = (e: TouchEvent) => {
    const t = e.touches[0];
    toucher.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const finToucher = (e: TouchEvent) => {
    const debut = toucher.current;
    const t = e.changedTouches[0];
    toucher.current = null;
    if (!debut || !t) return;
    const dx = t.clientX - debut.x;
    // Glissement horizontal net (pas un défilement vertical de la page).
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(t.clientY - debut.y)) deplacer(dx < 0 ? 1 : -1);
  };

  const btnRond = "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-navy shadow-card transition hover:bg-muted aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-card";
  const btnTexte = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition";

  return (
    <section aria-labelledby="slides-titre" className="mt-8 rounded-2xl bg-card p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="slides-titre" className="flex items-center gap-2 text-xl font-bold text-navy">
            <Presentation className="h-5 w-5 text-primary" /> {titre}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} diapositives · <span className="hidden md:inline">touches ← → pour naviguer</span>
            <span className="md:hidden">glisse le doigt pour naviguer</span>
          </p>
        </div>
        {pleinEcranPossible && (
          <button onClick={basculerPleinEcran} className={`${btnTexte} bg-secondary text-secondary-foreground hover:opacity-90`}>
            <Maximize className="h-4 w-4" /> Plein écran
          </button>
        )}
      </div>

      {/* Zone mise en plein écran : diapositive, commandes et explication. */}
      <div
        ref={zone}
        tabIndex={0}
        onKeyDown={clavier}
        role="region"
        aria-roledescription="carrousel"
        aria-label={titre}
        className={pleinEcran ? "flex h-full w-full flex-col gap-3 bg-background p-4 outline-none md:p-6" : "mt-5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"}
      >
        {/* Plein écran : la diapositive occupe la hauteur laissée par les commandes, en restant en 16:9. */}
        <div className={pleinEcran ? "flex min-h-0 w-full flex-1 items-center justify-center [container-type:size]" : undefined}>
          <div
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${total} : ${slide.titre}`}
            onTouchStart={debutToucher}
            onTouchEnd={finToucher}
            style={pleinEcran ? { width: "min(100cqw, calc(100cqh * 16 / 9))" } : undefined}
            className={`@container relative overflow-hidden rounded-xl border-2 border-border bg-background ${pleinEcran ? "aspect-video" : "md:aspect-video"}`}
          >
            <ContenuSlide key={slide.id} slide={slide} numero={index + 1} pdfUrl={pdfUrl} />
          </div>
        </div>

        <div className={pleinEcran ? "mx-auto w-full max-w-6xl shrink-0" : undefined}>
          <div className={`${pleinEcran ? "" : "mt-3 "}h-1.5 overflow-hidden rounded-full bg-muted`} aria-hidden="true">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* aria-disabled plutôt que disabled : le bouton garde le focus (et les flèches du clavier) en bout de présentation. */}
              <button onClick={() => deplacer(-1)} aria-disabled={index === 0} aria-label="Diapositive précédente" className={btnRond}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-14 text-center text-sm font-semibold tabular-nums text-navy" aria-hidden="true">
                {index + 1} / {total}
              </span>
              <button onClick={() => deplacer(1)} aria-disabled={index === total - 1} aria-label="Diapositive suivante" className={btnRond}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setExplication(!explication)}
                aria-expanded={explication}
                aria-controls="slides-explication"
                className={`${btnTexte} ${explication ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary"}`}
              >
                <Lightbulb className="h-4 w-4" /> Explication
              </button>
              {page && (
                <a href={`${pdfUrl}#page=${page}`} target="_blank" rel="noopener noreferrer" className={`${btnTexte} text-primary hover:bg-muted`}>
                  <BookOpen className="h-4 w-4" /> Approfondir : chapitre {slide.chapitre}
                  <span className="sr-only"> (PDF, page {page}, nouvel onglet)</span>
                </a>
              )}
              {pleinEcran && (
                <button onClick={basculerPleinEcran} className={`${btnTexte} bg-secondary text-secondary-foreground hover:opacity-90`}>
                  <Minimize className="h-4 w-4" /> Quitter le plein écran
                </button>
              )}
            </div>
          </div>

          {explication && (
            <div id="slides-explication" className="mt-3 flex gap-3 rounded-xl bg-tint-amber p-4 text-sm leading-relaxed text-tint-amber-fg">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{slide.explication}</p>
            </div>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          Diapositive {index + 1} sur {total} : {slide.titre}
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── Diapositive ───────────────────────── */

function ContenuSlide({ slide, numero, pdfUrl }: { slide: Slide; numero: number; pdfUrl: string }) {
  const entete = (
    <p className="text-xs font-semibold uppercase tracking-wide text-primary md:text-[1.3cqw]">
      {numero === 1 ? "Module 1 · L'essentiel" : `Chapitre ${slide.chapitre}`}
    </p>
  );
  const titre = (
    <h3 className={`mt-1 font-display font-bold leading-tight text-navy md:mt-[0.8cqw] ${numero === 1 ? "text-3xl md:text-[5cqw]" : "text-2xl md:text-[3.5cqw]"}`}>
      {slide.titre}
    </h3>
  );

  // Dernière diapositive : les 3 points en cartes, puis les deux suites possibles.
  if (slide.visuel.type === "retenir") {
    return (
      <div className="flex h-full flex-col justify-center p-5 md:p-[4cqw]">
        {entete}
        {titre}
        <ol className="mt-4 grid gap-3 md:mt-[2.5cqw] md:grid-cols-3 md:gap-[2cqw]" aria-label={slide.visuel.alt}>
          {slide.points.map((p, i) => (
            <li key={p} className="rounded-xl bg-card p-4 shadow-card md:rounded-[1.4cqw] md:p-[2cqw]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground md:h-[4.4cqw] md:w-[4.4cqw] md:text-[2.4cqw]">
                {i + 1}
              </span>
              <p className="mt-2 font-semibold leading-snug text-navy md:mt-[1.2cqw] md:text-[1.9cqw]">{p}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-[3cqw] md:gap-[1.5cqw]">
          <Link
            to="/exercices"
            search={{ type: "qcm" }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 md:px-[2.4cqw] md:py-[1.2cqw] md:text-[1.6cqw]"
          >
            <Target className="h-4 w-4 md:h-[2cqw] md:w-[2cqw]" /> Tester mes connaissances
          </Link>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90 md:px-[2.4cqw] md:py-[1.2cqw] md:text-[1.6cqw]"
          >
            <ExternalLink className="h-4 w-4 md:h-[2cqw] md:w-[2cqw]" /> Lire le cours complet
            <span className="sr-only"> (PDF, nouvel onglet)</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full items-center gap-5 p-5 md:grid-cols-[1.05fr_1fr] md:gap-[3.5cqw] md:p-[4cqw]">
      <div>
        {entete}
        {titre}
        <ul className="mt-4 space-y-2.5 md:mt-[2.5cqw] md:space-y-[1.5cqw]">
          {slide.points.map((p) => (
            <li key={p} className="flex gap-3 leading-snug text-foreground md:gap-[1.2cqw] md:text-[1.95cqw]">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary md:mt-[0.75cqw] md:h-[0.9cqw] md:w-[0.9cqw]" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex h-full min-h-0 items-center justify-center">
        <Visuel visuel={slide.visuel} />
      </div>
    </div>
  );
}

/* ───────────────────────── Visuels ───────────────────────── */

function Visuel({ visuel }: { visuel: VisuelSlide }) {
  switch (visuel.type) {
    case "image":
      return (
        <img
          src={visuel.src}
          alt={visuel.alt}
          width={visuel.largeur}
          height={visuel.hauteur}
          loading="lazy"
          decoding="async"
          className="max-h-full w-full rounded-lg bg-white object-contain p-2 md:p-[1cqw]"
        />
      );
    case "titre":
      return (
        <Svg alt={visuel.alt} viewBox="0 0 480 280">
          <circle cx={180} cy={150} r={100} className="fill-tint-blue" />
          <circle cx={330} cy={150} r={76} className="fill-tint-green" />
          <Icone icone={Brain} x={180} y={150} taille={110} className="text-tint-blue-fg" />
          <Icone icone={Search} x={330} y={150} taille={84} className="text-tint-green-fg" />
          <Icone icone={Sparkles} x={418} y={52} taille={40} className="text-primary" />
        </Svg>
      );
    case "principe": {
      const etapes = [
        { icone: Sparkles, lignes: ["L'IA", "propose"], fond: "fill-tint-blue", texte: "text-tint-blue-fg" },
        { icone: Search, lignes: ["Le chercheur", "vérifie"], fond: "fill-tint-green", texte: "text-tint-green-fg" },
        { icone: Check, lignes: ["Le chercheur", "décide"], fond: "fill-tint-green", texte: "text-tint-green-fg" },
      ];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 480 240">
          {etapes.map((e, i) => {
            const x = i * 168;
            return (
              <g key={i}>
                <rect x={x + 2} y={20} width={140} height={190} rx={18} className={`${e.fond} stroke-navy`} strokeWidth={2} />
                <Icone icone={e.icone} x={x + 72} y={78} taille={46} className={e.texte} />
                <Lignes x={x + 72} y={150} lignes={e.lignes} taille={18} gras />
                {i < 2 && <Fleche x1={x + 146} y1={115} x2={x + 166} y2={115} />}
              </g>
            );
          })}
        </Svg>
      );
    }
    case "capacites": {
      const capacites = [
        { icone: BookOpen, label: "Apprendre", fond: "fill-tint-blue", texte: "text-tint-blue-fg" },
        { icone: ScanFace, label: "Reconnaître", fond: "fill-tint-purple", texte: "text-tint-purple-fg" },
        { icone: TrendingUp, label: "Prédire", fond: "fill-tint-green", texte: "text-tint-green-fg" },
        { icone: Signpost, label: "Décider", fond: "fill-tint-amber", texte: "text-tint-amber-fg" },
      ];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 480 320">
          {capacites.map((c, i) => {
            const cx = i % 2 === 0 ? 120 : 360;
            const cy = i < 2 ? 78 : 226;
            return (
              <g key={c.label}>
                <circle cx={cx} cy={cy} r={50} className={c.fond} />
                <Icone icone={c.icone} x={cx} y={cy} taille={48} className={c.texte} />
                <Lignes x={cx} y={cy + 78} lignes={[c.label]} taille={19} gras />
              </g>
            );
          })}
        </Svg>
      );
    }
    case "frise": {
      const reperes = [
        { annee: "1950", lignes: ["Turing"] },
        { annee: "1956", lignes: ["Dartmouth"] },
        { annee: "1970-90", lignes: ["Hivers", "de l'IA"], hiver: true },
        { annee: "2010", lignes: ["Apprentissage", "profond"] },
        { annee: "2017", lignes: ["Transformer"] },
        { annee: "2022", lignes: ["Assistants", "grand public"] },
      ];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 480 300">
          <line x1={14} y1={150} x2={466} y2={150} className="stroke-navy" strokeWidth={3} strokeLinecap="round" />
          {reperes.map((r, i) => {
            const x = 40 + i * 80;
            const haut = i % 2 === 0;
            return (
              <g key={r.annee}>
                <line x1={x} y1={150} x2={x} y2={haut ? 118 : 182} className="stroke-border" strokeWidth={2} />
                <circle cx={x} cy={150} r={9} className={r.hiver ? "fill-muted-foreground" : "fill-primary"} />
                <Lignes x={x} y={haut ? 106 : 204} lignes={[r.annee]} taille={17} gras className={r.hiver ? "fill-muted-foreground" : "fill-navy"} />
                <Lignes
                  x={x}
                  y={haut ? 82 - (r.lignes.length - 1) * 17 : 228}
                  lignes={r.lignes}
                  taille={14}
                  className="fill-muted-foreground"
                />
              </g>
            );
          })}
        </Svg>
      );
    }
    case "chaine": {
      const blocs = [
        { icone: Database, label: "Données", fond: "fill-tint-blue", texte: "text-tint-blue-fg" },
        { icone: Cog, label: "Algorithmes", fond: "fill-tint-purple", texte: "text-tint-purple-fg" },
        { icone: Brain, label: "Modèle", fond: "fill-tint-green", texte: "text-tint-green-fg" },
        { icone: Sparkles, label: "Résultat", fond: "fill-tint-amber", texte: "text-tint-amber-fg" },
      ];
      return (
        <Svg alt={visuel.alt} viewBox="-2 0 486 200">
          {blocs.map((b, i) => {
            const x = i * 126;
            return (
              <g key={b.label}>
                <rect x={x + 1} y={30} width={102} height={130} rx={16} className={`${b.fond} stroke-navy`} strokeWidth={2} />
                <Icone icone={b.icone} x={x + 52} y={78} taille={40} className={b.texte} />
                <Lignes x={x + 52} y={132} lignes={[b.label]} taille={14} gras />
                {i < 3 && <Fleche x1={x + 106} y1={95} x2={x + 124} y2={95} />}
              </g>
            );
          })}
        </Svg>
      );
    }
    case "prompt": {
      const elements = [["Rôle"], ["Contexte"], ["Objectif"], ["Consignes"], ["Format"], ["Critères", "de qualité"]];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 472 300">
          {elements.map((lignes, i) => {
            const x = (i % 3) * 162;
            const y = i < 3 ? 6 : 156;
            return (
              <g key={lignes[0]}>
                <rect x={x + 1} y={y} width={146} height={136} rx={16} className="fill-card stroke-navy" strokeWidth={2} />
                <circle cx={x + 74} cy={y + 42} r={22} className="fill-primary" />
                <Lignes x={x + 74} y={y + 49} lignes={[String(i + 1)]} taille={20} gras className="fill-primary-foreground" />
                <Lignes x={x + 74} y={y + (lignes.length > 1 ? 94 : 104)} lignes={lignes} taille={17} gras />
              </g>
            );
          })}
        </Svg>
      );
    }
    case "alertes": {
      const alertes = [
        { icone: FileQuestion, label: "Hallucinations" },
        { icone: Scale, label: "Biais" },
        { icone: Unplug, label: "Dépendance" },
        { icone: Lock, label: "Confidentialité" },
      ];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 464 316">
          {alertes.map((a, i) => {
            const x = (i % 2) * 240;
            const y = i < 2 ? 6 : 164;
            return (
              <g key={a.label}>
                <rect x={x + 1} y={y} width={222} height={144} rx={16} className="fill-tint-rose stroke-navy" strokeWidth={2} />
                <Icone icone={a.icone} x={x + 112} y={y + 54} taille={48} className="text-tint-rose-fg" />
                <Lignes x={x + 112} y={y + 116} lignes={[a.label]} taille={18} gras />
              </g>
            );
          })}
        </Svg>
      );
    }
    case "declaration": {
      const lignes = ["Outil", "Date", "Tâche", "Contrôle exercé"];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 400 320">
          <path d="M110 18 h146 l44 44 v236 a10 10 0 0 1 -10 10 h-180 a10 10 0 0 1 -10 -10 v-270 a10 10 0 0 1 10 -10 z" className="fill-card stroke-navy" strokeWidth={2} />
          <path d="M256 18 v34 a10 10 0 0 0 10 10 h34" className="fill-none stroke-navy" strokeWidth={2} />
          <Lignes x={190} y={60} lignes={["Usage de l'IA"]} taille={17} gras />
          {lignes.map((l, i) => (
            <g key={l}>
              <circle cx={134} cy={98 + i * 40} r={11} className="fill-tint-green" />
              <Icone icone={Check} x={134} y={98 + i * 40} taille={15} className="text-tint-green-fg" />
              <text x={154} y={104 + i * 40} fontSize={16} className="fill-foreground">{l}</text>
            </g>
          ))}
          <circle cx={306} cy={274} r={36} className="fill-success" />
          <Icone icone={Check} x={306} y={274} taille={42} className="text-white" />
        </Svg>
      );
    }
    case "verifier": {
      const etapes = [
        { icone: Link2, lignes: ["Vérifier", "le DOI"], fond: "fill-tint-blue", texte: "text-tint-blue-fg" },
        { icone: Library, lignes: ["Gérer avec", "Zotero"], fond: "fill-tint-purple", texte: "text-tint-purple-fg" },
        { icone: Table2, lignes: ["Matrice", "de lecture"], fond: "fill-tint-green", texte: "text-tint-green-fg" },
      ];
      return (
        <Svg alt={visuel.alt} viewBox="0 0 480 240">
          {etapes.map((e, i) => {
            const cx = 70 + i * 170;
            return (
              <g key={e.lignes[1]}>
                <circle cx={cx} cy={90} r={62} className={e.fond} />
                <Icone icone={e.icone} x={cx} y={90} taille={54} className={e.texte} />
                <Lignes x={cx} y={186} lignes={e.lignes} taille={17} gras />
                {i < 2 && <Fleche x1={cx + 70} y1={90} x2={cx + 100} y2={90} />}
              </g>
            );
          })}
        </Svg>
      );
    }
    case "equation":
      return <Equation alt={visuel.alt} />;
    case "retenir":
      return null; // affichée par ContenuSlide
  }
}

/** Équation de recherche en police monospace, opérateurs mis en évidence. */
function Equation({ alt }: { alt: string }) {
  const op = (t: string) => <span className="font-bold text-tint-amber">{t}</span>;
  const expr = (t: string) => <span className="text-tint-green">{t}</span>;
  return (
    <div role="img" aria-label={alt} className="w-full">
      <div aria-hidden="true" className="rounded-xl bg-navy p-4 font-mono text-sm leading-relaxed text-navy-foreground md:rounded-[1.4cqw] md:p-[2.4cqw] md:text-[1.9cqw]">
        <p className="text-xs uppercase tracking-wide opacity-70 md:text-[1.2cqw]">Concept 1</p>
        <p>({expr("\"Artificial Intelligence\"")}</p>
        <p className="pl-4 md:pl-[2cqw]">{op("OR")} {expr("\"Generative AI\"")})</p>
        <p className="my-2 md:my-[1cqw]">{op("AND")}</p>
        <p className="text-xs uppercase tracking-wide opacity-70 md:text-[1.2cqw]">Concept 2</p>
        <p>({expr("\"Higher Education\"")}</p>
        <p className="pl-4 md:pl-[2cqw]">{op("OR")} University)</p>
      </div>
    </div>
  );
}

/* ───────── Briques SVG ───────── */

function Svg({ alt, viewBox, children }: { alt: string; viewBox: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={alt} className="h-auto max-h-full w-full max-w-md font-sans md:max-w-none">
      {children}
    </svg>
  );
}

/** Icône lucide centrée sur (x, y). */
function Icone({ icone: I, x, y, taille, className }: { icone: LucideIcon; x: number; y: number; taille: number; className: string }) {
  return <I x={x - taille / 2} y={y - taille / 2} width={taille} height={taille} className={className} aria-hidden="true" />;
}

/** Texte centré sur plusieurs lignes ; `y` est la ligne de base de la première. */
function Lignes({ x, y, lignes, taille, gras = false, className = "fill-navy" }: {
  x: number;
  y: number;
  lignes: string[];
  taille: number;
  gras?: boolean;
  className?: string;
}) {
  return (
    <text x={x} y={y} fontSize={taille} fontWeight={gras ? 700 : 500} textAnchor="middle" className={className}>
      {lignes.map((l, i) => (
        <tspan key={l} x={x} dy={i === 0 ? 0 : taille * 1.2}>{l}</tspan>
      ))}
    </text>
  );
}

function Fleche({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <g className="fill-navy stroke-navy">
      <line x1={x1} y1={y1} x2={x2 - 4} y2={y2} strokeWidth={3} strokeLinecap="round" />
      <path d="M0 0 L-10 -6.5 L-10 6.5 Z" transform={`translate(${x2} ${y2}) rotate(${angle})`} stroke="none" />
    </g>
  );
}
