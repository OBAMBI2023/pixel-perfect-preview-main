import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MailCheck, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { btnPrimary, inputClass } from "@/components/espace/styles";
import { Message } from "@/components/espace/ui";
import { sInscrire, useAuth } from "@/lib/auth";
import { lireInvitation, rechercheInvitation } from "@/lib/invitation";

export const Route = createFileRoute("/inscription")({
  validateSearch: rechercheInvitation,
  head: () => ({
    meta: [
      { title: "Créer un compte — IA et la Recherche" },
      { name: "description", content: "Créez votre compte apprenant pour suivre votre progression." },
      { property: "og:title", content: "Créer un compte — IA et la Recherche" },
      { property: "og:description", content: "Créez votre compte apprenant." },
    ],
  }),
  component: Inscription,
});

const MIN_MDP = 8;

function Inscription() {
  const { status, configured, user } = useAuth();
  const { invitation } = Route.useSearch();
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [aConfirmer, setAConfirmer] = useState(false);

  // Compte créé sans confirmation par e-mail : session ouverte, on rejoint le groupe en attente s'il y en a un.
  useEffect(() => {
    if (status !== "ready" || !user) return;
    const code = invitation ?? lireInvitation();
    if (code) void navigate({ to: "/rejoindre/$code", params: { code }, replace: true });
    else void navigate({ to: "/mon-espace" });
  }, [status, user, invitation, navigate]);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    if (motDePasse.length < MIN_MDP) return setErreur(`Le mot de passe doit contenir au moins ${MIN_MDP} caractères.`);
    if (motDePasse !== confirmation) return setErreur("Les deux mots de passe ne correspondent pas.");
    setEnvoi(true);
    const res = await sInscrire(nom.trim(), email.trim(), motDePasse, invitation);
    setEnvoi(false);
    setErreur(res.erreur ?? null);
    if (res.confirmation) setAConfirmer(true);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-card p-8 shadow-card">
          {aConfirmer ? (
            <div className="text-center">
              <MailCheck className="mx-auto h-10 w-10 text-success" />
              <h1 className="mt-4 text-2xl font-bold text-navy">Vérifie ta boîte mail</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Un lien de confirmation a été envoyé à <strong>{email}</strong>. Clique dessus, puis connecte-toi
                {invitation ? " : tu rejoindras ensuite le groupe de ton formateur automatiquement." : "."}
              </p>
              <Link to="/connexion" search={invitation ? { invitation } : {}} className={`${btnPrimary} mt-6`}>Aller à la connexion</Link>
            </div>
          ) : (
            <>
              <UserPlus className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 text-center text-2xl font-bold text-navy">Créer un compte</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {invitation
                  ? "Ton compte est un compte apprenant. Une fois créé, tu rejoindras automatiquement le groupe de ton formateur."
                  : "Ton compte est un compte apprenant. Ton formateur te donnera un lien ou un code pour rejoindre son groupe."}
              </p>
              {!configured ? (
                <div className="mt-6"><Message>La création de compte n'est pas encore configurée sur ce site.</Message></div>
              ) : (
                <form onSubmit={soumettre} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium">
                    Nom complet
                    <input required maxLength={120} autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                  <label className="block text-sm font-medium">
                    Adresse e-mail
                    <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                  <label className="block text-sm font-medium">
                    Mot de passe <span className="font-normal text-muted-foreground">({MIN_MDP} caractères minimum)</span>
                    <input type="password" required minLength={MIN_MDP} autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                  <label className="block text-sm font-medium">
                    Confirmer le mot de passe
                    <input type="password" required autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                  {erreur && <Message ton="erreur">{erreur}</Message>}
                  <button type="submit" disabled={envoi} className={`${btnPrimary} w-full`}>
                    <UserPlus className="h-4 w-4" /> {envoi ? "Création…" : "Créer mon compte"}
                  </button>
                  <p className="text-center text-sm text-muted-foreground">
                    Déjà inscrit ? <Link to="/connexion" search={invitation ? { invitation } : {}} className="font-semibold text-primary hover:underline">Se connecter</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
