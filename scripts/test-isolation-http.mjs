// Test d'isolation RLS par l'API HTTP de Supabase, avec de VRAIES sessions et la clé PUBLIQUE.
// Complète supabase/tests/isolation_rls.sql (qui couvre aussi groupes, formateurs et retours).
//
// Prérequis : deux comptes de test dédiés (jamais des comptes de participants), sans groupe.
//   SUPABASE_URL=… SUPABASE_PUBLISHABLE_KEY=sb_publishable_… \
//   TEST_A_EMAIL=… TEST_A_PASSWORD=… TEST_B_EMAIL=… TEST_B_PASSWORD=… \
//   node scripts/test-isolation-http.mjs
// (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY peuvent aussi venir de VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.)
//
// ATTENTION : B enregistre des données marquées TEST_ISOLATION_B (profil chercheur, exercice, tentative,
// accueil) qui restent en base : la requête de nettoyage à exécuter ensuite est affichée à la fin.
// A modifie ses métadonnées (role=formateur) pour tester l'escalade de privilèges.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const cle = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const { TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD } = process.env;

if (!url || !cle || !TEST_A_EMAIL || !TEST_A_PASSWORD || !TEST_B_EMAIL || !TEST_B_PASSWORD) {
  console.error("Variables manquantes : voir l'en-tête du script.");
  process.exit(2);
}
// Une clé secrète contournerait la RLS : le test ne prouverait rien.
const roleJwt = (() => {
  try {
    return JSON.parse(Buffer.from(cle.split(".")[1] ?? "", "base64url").toString()).role;
  } catch {
    return undefined;
  }
})();
if (cle.startsWith("sb_secret_") || roleJwt === "service_role") {
  console.error("Refus : clé secrète / service_role détectée. Utilise la clé publique (sb_publishable_… ou anon).");
  process.exit(2);
}

const client = () => createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } });
const resultats = [];
const noter = (table, operation, identite, attendu, obtenu, ok, preuve) =>
  resultats.push({ table, operation, identite, attendu, obtenu, verdict: ok ? "PASS" : "FAIL", preuve });

async function connecter(email, motDePasse) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw new Error(`Connexion impossible pour ${email} : ${error.message}`);
  return { c, id: data.user.id };
}

const A = await connecter(TEST_A_EMAIL, TEST_A_PASSWORD);
const B = await connecter(TEST_B_EMAIL, TEST_B_PASSWORD);
if (A.id === B.id) throw new Error("A et B doivent être deux comptes différents.");
const anon = client();

// ───── Données de B (créées par B lui-même, avec ses propres droits) ─────
const ecritures = await Promise.all([
  B.c.from("profils_chercheur").upsert({ discipline: "TEST", niveau_etudes: "master", sujet: "TEST_ISOLATION_B sujet", objectif: "TEST_ISOLATION_B objectif", etablissement: null, problematique: null }, { onConflict: "user_id" }),
  B.c.from("travaux_recherche").upsert({ exercice: "prompt", sujet: "TEST_ISOLATION_B", contenu: { marqueur: "TEST_ISOLATION_B" }, termine: false }, { onConflict: "user_id,exercice" }),
  B.c.rpc("enregistrer_tentatives", { p_tentatives: [{ cours: "comprendre-ia", type: "qcm", categorie: "fondements", niveau: "debutant", score: 0, total: 1, reponses: [{ question_id: "f2", correcte: false, reponse_donnee: "TEST_ISOLATION_B" }] }] }),
  B.c.rpc("enregistrer_accueil", { p_etape: "site" }),
]);
const erreurEcriture = ecritures.find((r) => r.error)?.error;
if (erreurEcriture) throw new Error(`B n'a pas pu créer ses données de test : ${erreurEcriture.message}`);

const TABLES = [
  ["profiles", "id"], ["profils_chercheur", "user_id"], ["travaux_recherche", "user_id"], ["tentatives", "user_id"],
  ["accueil_participant", "user_id"], ["analyses_pertinence", "user_id"], ["soumissions", "apprenant_id"],
  ["retours_formateur", "apprenant_id"], ["membres_groupe", "apprenant_id"],
];
async function instantane(session) {
  const etat = {};
  for (const [t, col] of TABLES) {
    const { data, error } = await session.c.from(t).select("*").eq(col, session.id);
    etat[t] = error ? `erreur ${error.code}` : JSON.stringify(data);
  }
  const { data: tent } = await session.c.from("tentatives").select("id").eq("user_id", session.id);
  const { data: rep } = await session.c.from("reponses").select("*").in("tentative_id", (tent ?? []).map((x) => x.id));
  etat.reponses = JSON.stringify(rep);
  return etat;
}
const avantB = await instantane(B);
const { data: tentB } = await B.c.from("tentatives").select("id").eq("user_id", B.id);
const idTentativeB = tentB?.[0]?.id;

// ───── 1. Lectures de A ─────
for (const [t, col] of TABLES) {
  const autre = await A.c.from(t).select("*").eq(col, B.id);
  noter(t, "SELECT lignes de B", "A (session réelle)", "0 ligne", autre.error ? `erreur ${autre.error.code}` : `${autre.data.length} ligne(s)`, !autre.error && autre.data.length === 0, autre.error?.message ?? "HTTP 200, résultat filtré par la RLS");
}
for (const [t, col] of [["profiles", "id"], ["tentatives", "user_id"]]) {
  const soi = await A.c.from(t).select("*").eq(col, A.id);
  noter(t, "SELECT ses propres lignes", "A (session réelle)", "≥ 1 ligne (profil) / accès autorisé", soi.error ? `erreur ${soi.error.code}` : `${soi.data.length} ligne(s)`, !soi.error && (t !== "profiles" || soi.data.length === 1), soi.error?.message ?? "HTTP 200");
}
if (idTentativeB) {
  const r = await A.c.from("reponses").select("*").eq("tentative_id", idTentativeB);
  noter("reponses", "SELECT réponses de B (id connu)", "A (session réelle)", "0 ligne", r.error ? `erreur ${r.error.code}` : `${r.data.length} ligne(s)`, !r.error && r.data.length === 0, r.error?.message ?? "HTTP 200, filtré");
}
{
  const r = await A.c.rpc("progression_apprenant", { p_apprenant: B.id });
  noter("progression_apprenant()", "RPC avec p_apprenant = B", "A (session réelle)", "refus", r.error ? `refusé (${r.error.code})` : `${r.data?.length ?? 0} ligne(s)`, Boolean(r.error) || (r.data?.length ?? 0) === 0, r.error?.message ?? "");
}

// ───── 2. Écritures de A visant B ─────
const tentatives = [
  ["profiles", "UPDATE nom de B", () => A.c.from("profiles").update({ nom_complet: "PIRATE" }).eq("id", B.id).select()],
  ["profils_chercheur", "UPDATE sujet de B", () => A.c.from("profils_chercheur").update({ sujet: "PIRATE" }).eq("user_id", B.id).select()],
  ["travaux_recherche", "UPDATE travail de B", () => A.c.from("travaux_recherche").update({ contenu: {} }).eq("user_id", B.id).select()],
  ["tentatives", "UPDATE score de B", () => A.c.from("tentatives").update({ score: 1 }).eq("user_id", B.id).select()],
  ["profils_chercheur", "INSERT avec user_id = B", () => A.c.from("profils_chercheur").insert({ user_id: B.id, discipline: "X", niveau_etudes: "master", sujet: "PIRATE", objectif: "PIRATE" }).select()],
  ["travaux_recherche", "INSERT avec user_id = B", () => A.c.from("travaux_recherche").insert({ user_id: B.id, exercice: "equation", sujet: "PIRATE", contenu: {} }).select()],
  ["tentatives", "INSERT avec user_id = B", () => A.c.from("tentatives").insert({ user_id: B.id, type: "qcm", score: 1, total: 1 }).select()],
  ["profils_chercheur", "DELETE profil de B", () => A.c.from("profils_chercheur").delete().eq("user_id", B.id).select()],
  ["travaux_recherche", "DELETE travail de B", () => A.c.from("travaux_recherche").delete().eq("user_id", B.id).select()],
  ["tentatives", "DELETE tentatives de B", () => A.c.from("tentatives").delete().eq("user_id", B.id).select()],
  ["retours_formateur", "RPC enregistrer_retour(B)", () => A.c.rpc("enregistrer_retour", { p_apprenant: B.id, p_objet: "travail_recherche", p_objet_id: "prompt", p_note: 0, p_note_sur: 20, p_appreciation: "PIRATE", p_points_acquis: "", p_points_a_ameliorer: "", p_statut: "corrige" })],
];
if (idTentativeB) tentatives.push(["reponses", "INSERT dans la tentative de B", () => A.c.from("reponses").insert({ tentative_id: idTentativeB, question_id: "f3", correcte: true }).select()]);
for (const [t, op, f] of tentatives) {
  const r = await f();
  const n = Array.isArray(r.data) ? r.data.length : r.data ? 1 : 0;
  noter(t, op, "A (session réelle)", "refus ou 0 ligne", r.error ? `refusé (${r.error.code})` : `${n} ligne(s)`, Boolean(r.error) || n === 0, r.error?.message ?? "HTTP 2xx sans ligne affectée");
}
// Usurpation via le JSON envoyé par le navigateur.
await A.c.rpc("enregistrer_tentatives", { p_tentatives: [{ user_id: B.id, cours: "comprendre-ia", type: "qcm", categorie: "fondements", niveau: "debutant", score: 1, total: 1, reponses: [{ question_id: "f4", correcte: true, reponse_donnee: "USURPATION" }] }] });

// ───── 3. Escalade par les métadonnées utilisateur ─────
{
  const maj = await A.c.auth.updateUser({ data: { role: "formateur", is_admin: true } });
  await A.c.auth.refreshSession();
  const profil = await A.c.from("profiles").select("role").eq("id", A.id).single();
  const estF = await A.c.rpc("est_formateur");
  noter("profiles / est_formateur()", "updateUser({ role: formateur }) puis vérification", "A (session réelle)", "rôle apprenant, est_formateur = false",
    `rôle ${profil.data?.role ?? "?"}, est_formateur = ${estF.data}`, !maj.error && profil.data?.role === "apprenant" && estF.data === false, maj.error?.message ?? "métadonnées modifiées, rôle applicatif inchangé");
  const role = await A.c.from("profiles").update({ role: "formateur" }).eq("id", A.id).select();
  noter("profiles", "UPDATE profiles.role = formateur", "A (session réelle)", "refus", role.error ? `refusé (${role.error.code})` : `${role.data?.length ?? 0} ligne(s)`, Boolean(role.error) || (role.data?.length ?? 0) === 0, role.error?.message ?? "");
  await A.c.auth.updateUser({ data: { role: null, is_admin: null } }); // remise en état
}

// ───── 4. Utilisateur déconnecté ─────
for (const [t] of TABLES) {
  const r = await anon.from(t).select("*").limit(1);
  noter(t, "SELECT *", "Déconnecté (clé publique seule)", "refus ou 0 ligne", r.error ? `refusé (${r.error.code})` : `${r.data.length} ligne(s)`, Boolean(r.error) || r.data.length === 0, r.error?.message ?? "HTTP 200 vide");
}

// ───── 5. Intégrité des données de B ─────
const apresB = await instantane(B);
const modifiees = Object.keys(avantB).filter((t) => avantB[t] !== apresB[t]);
noter("(toutes tables)", "Données de B identiques avant / après", "B (session réelle)", "aucune différence", modifiees.length ? `modifiées : ${modifiees.join(", ")}` : "identiques", modifiees.length === 0, "comparaison des lignes lues par B");
const usurpee = await B.c.from("reponses").select("id").eq("reponse_donnee", "USURPATION");
noter("tentatives", "Tentative envoyée par A avec user_id = B", "B (session réelle)", "invisible pour B (enregistrée au nom de A)", `${usurpee.data?.length ?? "?"} ligne(s)`, !usurpee.error && usurpee.data.length === 0, "user_id fixé par auth.uid()");

console.table(resultats);
const echecs = resultats.filter((r) => r.verdict === "FAIL").length;
console.log(`\n${resultats.length - echecs} PASS, ${echecs} FAIL`);
console.log(`\nNettoyage (SQL Editor, en administrateur) :
  delete from public.reponses where tentative_id in (select id from public.tentatives where user_id in ('${A.id}', '${B.id}'));
  delete from public.tentatives where user_id in ('${A.id}', '${B.id}');
  delete from public.travaux_recherche where user_id = '${B.id}';
  delete from public.profils_chercheur where user_id = '${B.id}';
  delete from public.accueil_participant where user_id = '${B.id}';`);
process.exit(echecs ? 1 : 0);
