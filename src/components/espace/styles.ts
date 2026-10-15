export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const formatDateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
/** Date seule (AAAA-MM-JJ), lue en heure locale pour ne pas glisser d'un jour selon le fuseau. */
const jourLocal = (jour: string) => {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(a ?? 0, (m ?? 1) - 1, j ?? 1);
};
export const formatJour = (jour: string | null) =>
  jour ? jourLocal(jour).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" }) : "—";
/** Jours restants avant la date (négatif si dépassée, 0 le jour même). */
export const joursAvant = (jour: string) => Math.round((jourLocal(jour).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
/** Date du jour + n jours au format AAAA-MM-JJ (valeur d'un <input type="date">). */
export const jourDansNJours = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const formatPct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);

export const inputClass = "w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-50";
export const btnSecondary = "inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90 disabled:opacity-50";

