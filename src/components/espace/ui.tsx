import type { ReactNode } from "react";
import { formatPct } from "@/components/espace/styles";

export function Carte({ titre, action, children, className = "" }: { titre?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-card p-5 shadow-card md:p-6 ${className}`}>
      {(titre || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {titre && <h2 className="text-lg font-bold text-navy">{titre}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, valeur, aide }: { label: string; valeur: ReactNode; aide?: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="font-display text-2xl font-bold text-navy">{valeur}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {aide && <div className="mt-1 text-xs text-muted-foreground">{aide}</div>}
    </div>
  );
}

/** Barres horizontales d'un taux (0–100) ; une seule série, valeur écrite à droite. */
export function Barres({ lignes, vide = "Pas encore de données." }: { lignes: { cle: string; label: string; taux: number; detail?: string }[]; vide?: string }) {
  if (lignes.length === 0) return <p className="text-sm text-muted-foreground">{vide}</p>;
  return (
    <ul className="space-y-3">
      {lignes.map((l) => (
        <li key={l.cle} title={`${l.label} : ${formatPct(l.taux)}${l.detail ? ` (${l.detail})` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{l.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatPct(l.taux)}
              {l.detail && <span className="ml-1 text-xs">· {l.detail}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted" role="presentation">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, Number(l.taux)))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Message({ children, ton = "info" }: { children: ReactNode; ton?: "info" | "erreur" | "succes" }) {
  const cls = ton === "erreur" ? "bg-tint-rose text-tint-rose-fg" : ton === "succes" ? "bg-tint-green text-tint-green-fg" : "bg-muted text-foreground";
  return <p role={ton === "erreur" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${cls}`}>{children}</p>;
}
