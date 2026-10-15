import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, LogIn } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { btnPrimary, inputClass } from "@/components/espace/styles";
import { Message } from "@/components/espace/ui";
import { seConnecter, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Se connecter — IA et la Recherche" },
      { name: "description", content: "Connectez-vous pour enregistrer votre progression et la partager avec votre formateur." },
      { property: "og:title", content: "Se connecter — IA et la Recherche" },
      { property: "og:description", content: "Accédez à votre espace apprenant ou formateur." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const { status, configured, user, profile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Une fois connecté (et le profil chargé), direction l'espace adapté au rôle.
  useEffect(() => {
    if (status === "ready" && user) void navigate({ to: profile?.role === "formateur" ? "/formateur" : "/mon-espace" });
  }, [status, user, profile, navigate]);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(await seConnecter(email.trim(), motDePasse));
    setEnvoi(false);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-center text-2xl font-bold text-navy">Se connecter</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Enregistre ta progression et partage-la avec ton formateur.</p>

          {!configured ? (
            <div className="mt-6">
              <Message>La connexion n'est pas encore configurée sur ce site. Les exercices restent accessibles sans compte.</Message>
              <Link to="/exercices" className={`${btnPrimary} mt-4 w-full`}>Accéder aux exercices</Link>
            </div>
          ) : (
            <form onSubmit={soumettre} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Adresse e-mail
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="block text-sm font-medium">
                Mot de passe
                <input type="password" required autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              {erreur && <Message ton="erreur">{erreur}</Message>}
              <button type="submit" disabled={envoi || status === "loading"} className={`${btnPrimary} w-full`}>
                <LogIn className="h-4 w-4" /> {envoi ? "Connexion…" : "Se connecter"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Pas encore de compte ? <Link to="/inscription" className="font-semibold text-primary hover:underline">Créer un compte</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
