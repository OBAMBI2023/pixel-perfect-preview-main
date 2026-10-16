import { ArrowDown, ArrowRight, Bot, ShieldCheck, UserRound } from "lucide-react";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { ElementInfographie, EtapeTrio, Infographie as TypeInfographie, LigneMatrice } from "@/data/chapitres.types";

/** Apparition progressive (désactivée si l'utilisateur réduit les animations). */
const apparition = (i: number): { className: string; style: CSSProperties } => ({
  className: "animate-rise motion-reduce:animate-none",
  style: { animationDelay: `${i * 70}ms`, animationFillMode: "both" },
});
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Infographie interactive : chaque élément s'active au clic ou au clavier, son détail s'affiche dessous. */
export function Infographie({ infographie }: { infographie: TypeInfographie }) {
  return (
    <figure className="rounded-2xl bg-card p-5 shadow-card md:p-7">
      <h3 className="text-lg font-bold text-navy">{infographie.titre}</h3>
      <figcaption className="mt-1 text-sm text-muted-foreground">{infographie.legende}</figcaption>
      <div className="mt-5">
        {infographie.type === "matrix" ? (
          <Matrice colonnes={infographie.colonnes} lignes={infographie.lignes} fictif={infographie.donneesFictives ?? false} />
        ) : infographie.type === "trio" ? (
          <Trio etapes={infographie.items} />
        ) : infographie.type === "pairs" ? (
          <Couples items={infographie.items} />
        ) : (
          <Elements type={infographie.type} items={infographie.items} />
        )}
      </div>
    </figure>
  );
}

/* ───────── Panneau de détail ───────── */

function Panneau({ id, titre, children }: { id: string; titre: string; children: ReactNode }) {
  return (
    <div id={id} role="region" aria-live="polite" aria-label={`Détail : ${titre}`} className="mt-4 rounded-xl border-2 border-primary/30 bg-secondary/40 p-4">
      <p className="font-semibold text-navy">{titre}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

const Detail = ({ el }: { el: ElementInfographie }) => (
  <>
    <p>{el.detail}</p>
    {el.exemple && <p className="mt-2"><span className="font-semibold">Exemple : </span>{el.exemple}</p>}
  </>
);

/** Version imprimée : tous les détails à la suite. */
const ListeImpression = ({ items }: { items: ElementInfographie[] }) => (
  <dl className="mt-4 hidden space-y-1 text-sm print:block">
    {items.map((el) => (
      <div key={el.id}><dt className="inline font-semibold">{el.label} : </dt><dd className="inline">{el.detail}{el.exemple ? ` (${el.exemple})` : ""}</dd></div>
    ))}
  </dl>
);

/* ───────── Frise, étapes, grille, entonnoir ───────── */

function Elements({ type, items }: { type: "timeline" | "flow" | "grid" | "funnel"; items: ElementInfographie[] }) {
  const [actif, setActif] = useState(items[0]?.id ?? "");
  const panneau = useId();
  const el = items.find((x) => x.id === actif) ?? items[0];
  const bouton = (x: ElementInfographie, classe: string, contenu: ReactNode) => (
    <button
      type="button"
      onClick={() => setActif(x.id)}
      aria-pressed={x.id === actif}
      aria-controls={panneau}
      className={`${classe} ${focus} transition ${x.id === actif ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-background text-navy hover:border-primary/60"}`}
    >
      {contenu}
    </button>
  );

  let liste: ReactNode;
  if (type === "grid") {
    liste = (
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((x, i) => {
          const a = apparition(i);
          return (
            <li key={x.id} className={a.className} style={a.style}>
              {bouton(x, "flex h-full min-h-14 w-full items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center text-sm font-semibold leading-snug", x.label)}
            </li>
          );
        })}
      </ul>
    );
  } else if (type === "funnel") {
    // Du plus large au plus étroit : la largeur diminue régulièrement, sans descendre sous 55 %.
    const pas = items.length > 1 ? 45 / (items.length - 1) : 0;
    liste = (
      <ol className="flex flex-col items-center gap-1.5">
        {items.map((x, i) => {
          const a = apparition(i);
          return (
            <li key={x.id} className={`w-full ${a.className}`} style={{ ...a.style, maxWidth: `${100 - i * pas}%` }}>
              {bouton(
                x,
                "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold leading-snug",
                <><span className="tabular-nums opacity-70">{i + 1}.</span> {x.label}</>,
              )}
            </li>
          );
        })}
      </ol>
    );
  } else if (type === "flow") {
    // En colonne sur téléphone, en ligne à partir de la tablette ; numérotation visible.
    liste = (
      <ol className="flex flex-col items-stretch gap-1 md:flex-row md:items-stretch md:gap-1.5">
        {items.map((x, i) => {
          const a = apparition(i);
          return (
            <li key={x.id} className={`flex flex-col items-stretch md:flex-1 md:flex-row md:items-center ${a.className}`} style={a.style}>
              {bouton(
                x,
                "flex min-h-12 w-full flex-1 items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold leading-snug md:h-full md:flex-col md:justify-center md:text-center",
                <>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy/10 text-xs font-bold tabular-nums">{i + 1}</span>
                  {x.label}
                </>,
              )}
              {i < items.length - 1 && (
                <span className="grid place-items-center py-0.5 text-navy md:px-0.5 md:py-0" aria-hidden="true">
                  <ArrowDown className="h-4 w-4 md:hidden" />
                  <ArrowRight className="hidden h-4 w-4 md:block" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
  } else {
    // Frise : verticale sur téléphone, horizontale à partir de la tablette.
    liste = (
      <ol className="relative flex flex-col gap-2 pl-7 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-border md:flex-row md:gap-2 md:pl-0 md:pt-7 md:before:bottom-auto md:before:left-3 md:before:right-3 md:before:top-[11px] md:before:h-0.5 md:before:w-auto">
        {items.map((x, i) => {
          const a = apparition(i);
          return (
            <li key={x.id} className={`relative md:flex-1 ${a.className}`} style={a.style}>
              <span
                className={`absolute -left-7 top-3 h-6 w-6 rounded-full border-4 border-card md:left-1/2 md:-top-7 md:-translate-x-1/2 ${x.id === actif ? "bg-primary" : "bg-navy/30"}`}
                aria-hidden="true"
              />
              {bouton(x, "flex min-h-12 w-full items-center justify-center rounded-xl border-2 px-2 py-2 text-center text-sm font-bold tabular-nums leading-snug", x.label)}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <>
      <div className="print:hidden">
        {liste}
        {el && <Panneau id={panneau} titre={el.label}><Detail el={el} /></Panneau>}
      </div>
      <ListeImpression items={items} />
    </>
  );
}

/* ───────── Couples risque → mesure ───────── */

function Couples({ items }: { items: ElementInfographie[] }) {
  const [actif, setActif] = useState<string | null>(items[0]?.id ?? null);
  return (
    <>
      <ul className="space-y-2.5 print:hidden">
        {items.map((x, i) => {
          const ouvert = x.id === actif;
          const a = apparition(i);
          return (
            <li key={x.id} className={`grid gap-2 md:grid-cols-2 md:items-stretch ${a.className}`} style={a.style}>
              <button
                type="button"
                onClick={() => setActif(ouvert ? null : x.id)}
                aria-expanded={ouvert}
                className={`flex min-h-12 items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold leading-snug transition ${focus} ${ouvert ? "border-destructive/60 bg-tint-rose text-tint-rose-fg" : "border-border bg-background text-navy hover:border-destructive/40"}`}
              >
                <span aria-hidden="true">⚠</span> <span className="sr-only">Risque : </span>{x.label}
                <ArrowRight className="ml-auto hidden h-4 w-4 shrink-0 md:block" aria-hidden="true" />
              </button>
              {ouvert && (
                <div aria-live="polite" className="origin-top rounded-xl border-2 border-success/50 bg-tint-green p-3 text-sm leading-snug text-tint-green-fg animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">
                  <p className="font-semibold"><span aria-hidden="true">✓</span> Mesure</p>
                  <p className="mt-0.5">{x.detail}</p>
                  {x.exemple && <p className="mt-1.5"><span className="font-semibold">Exemple : </span>{x.exemple}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <dl className="hidden space-y-1 text-sm print:block">
        {items.map((x) => <div key={x.id}><dt className="inline font-semibold">{x.label} → </dt><dd className="inline">{x.detail}</dd></div>)}
      </dl>
    </>
  );
}

/* ───────── Tableau ───────── */

function Matrice({ colonnes, lignes, fictif }: { colonnes: string[]; lignes: LigneMatrice[]; fictif: boolean }) {
  const [actif, setActif] = useState<string | null>(null);
  return (
    <>
      {/* Seul le tableau défile horizontalement ; la première colonne reste visible. */}
      <div className="overflow-x-auto rounded-xl border-2 border-border" role="region" aria-label="Tableau (défilement horizontal possible)" tabIndex={0}>
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {colonnes.map((c, i) => (
                <th key={c} scope="col" className={`px-3 py-2.5 font-semibold text-navy ${i === 0 ? "sticky left-0 z-10 bg-muted" : ""}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const ouvert = l.id === actif;
              const a = apparition(i);
              const fond = ouvert ? "bg-secondary" : "bg-card";
              return (
                <tr key={l.id} className={`border-t border-border ${fond} ${a.className}`} style={a.style}>
                  <th scope="row" className={`sticky left-0 z-10 p-0 font-semibold ${fond}`}>
                    <button
                      type="button"
                      onClick={() => setActif(ouvert ? null : l.id)}
                      aria-pressed={ouvert}
                      className={`flex min-h-11 w-full items-center px-3 py-2 text-left text-navy ${focus} ${ouvert ? "text-primary" : ""}`}
                    >
                      {l.label}
                    </button>
                  </th>
                  {l.cellules.map((c, j) => <td key={j} className="px-3 py-2 align-top leading-snug">{c}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {fictif && <p className="mt-2 text-xs font-semibold text-muted-foreground">Données fictives, à titre d'illustration.</p>}
    </>
  );
}

/* ───────── Trio : chercheur / IA / contrôle humain ───────── */

const BLOCS_TRIO = [
  { cle: "chercheur", titre: "Le chercheur", icone: UserRound, classe: "border-tint-blue-fg/30 bg-tint-blue text-tint-blue-fg" },
  { cle: "ia", titre: "L'IA peut…", icone: Bot, classe: "border-tint-purple-fg/30 bg-tint-purple text-tint-purple-fg" },
  { cle: "controle", titre: "Contrôle humain", icone: ShieldCheck, classe: "border-tint-green-fg/30 bg-tint-green text-tint-green-fg" },
] as const;

function Trio({ etapes }: { etapes: EtapeTrio[] }) {
  const [actif, setActif] = useState(etapes[0]?.id ?? "");
  const panneau = useId();
  const e = etapes.find((x) => x.id === actif) ?? etapes[0];
  const blocs = (x: EtapeTrio) => (
    <div className="grid gap-2 sm:grid-cols-3">
      {BLOCS_TRIO.map(({ cle, titre, icone: Icone, classe }) => (
        <div key={cle} className={`rounded-xl border-2 p-3 ${classe}`}>
          <p className="flex items-center gap-1.5 text-sm font-bold"><Icone className="h-4 w-4" aria-hidden="true" /> {titre}</p>
          <p className="mt-1 text-sm leading-snug">{x[cle]}</p>
        </div>
      ))}
    </div>
  );
  return (
    <>
      <div className="print:hidden">
        <ol className="flex flex-wrap gap-2">
          {etapes.map((x, i) => {
            const a = apparition(i);
            return (
              <li key={x.id} className={a.className} style={a.style}>
                <button
                  type="button"
                  onClick={() => setActif(x.id)}
                  aria-pressed={x.id === actif}
                  aria-controls={panneau}
                  className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${focus} ${x.id === actif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-navy hover:border-primary/60"}`}
                >
                  <span className="tabular-nums opacity-70">{i + 1}.</span> {x.label}
                </button>
              </li>
            );
          })}
        </ol>
        {e && <Panneau id={panneau} titre={e.label}>{blocs(e)}</Panneau>}
      </div>
      <div className="hidden space-y-3 print:block">
        {etapes.map((x, i) => <div key={x.id}><p className="font-semibold">{i + 1}. {x.label}</p>{blocs(x)}</div>)}
      </div>
    </>
  );
}
