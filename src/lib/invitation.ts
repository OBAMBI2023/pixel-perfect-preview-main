/** Liens d'invitation /rejoindre/:code et code en attente pendant la connexion ou l'inscription. */

const CLE = "iar-invitation";

export const normaliserCode = (code: string) => code.trim().toUpperCase();
export const codeValide = (code: string) => /^[A-Z0-9]{6}$/.test(code);

/** validateSearch de /connexion et /inscription : ?invitation=CODE, ignoré s'il est mal formé. */
export function rechercheInvitation(s: Record<string, unknown>): { invitation?: string } {
  const code = typeof s["invitation"] === "string" ? normaliserCode(s["invitation"]) : "";
  return codeValide(code) ? { invitation: code } : {};
}

export const lienInvitation = (code: string) => `${window.location.origin}/rejoindre/${code}`;

export const lienWhatsApp = (nomGroupe: string, code: string) =>
  `https://wa.me/?text=${encodeURIComponent(
    `Bonjour ! Rejoins mon groupe « ${nomGroupe} » sur IA et la Recherche pour suivre ta progression : ${lienInvitation(code)}`,
  )}`;

/** Message lisible pour une erreur de la RPC rejoindre_groupe. */
export function erreurRejoindre(message: string): string {
  if (/inconnu/i.test(message)) return "Code d'invitation inconnu. Il a peut-être été renouvelé : demande le nouveau lien à ton formateur.";
  if (/archiv/i.test(message)) return "Ce groupe est archivé : il n'accepte plus de nouveaux membres.";
  return "Impossible de rejoindre le groupe. Réessaie dans un instant.";
}

/** Garde le code si l'apprenant doit d'abord se connecter (repris par /connexion et /inscription). */
export function memoriserInvitation(code: string) {
  try { localStorage.setItem(CLE, code); } catch { /* stockage indisponible : le code reste dans l'URL */ }
}

export function lireInvitation(): string | null {
  try {
    const code = localStorage.getItem(CLE);
    return code && codeValide(code) ? code : null;
  } catch {
    return null;
  }
}

export function oublierInvitation() {
  try { localStorage.removeItem(CLE); } catch { /* ignore */ }
}
