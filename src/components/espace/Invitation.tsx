import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Link2, MessageCircle, QrCode, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Confirmer } from "@/components/espace/Confirmer";
import { btnSecondary } from "@/components/espace/styles";
import { Message } from "@/components/espace/ui";
import { rpc } from "@/lib/formateur";
import { lienInvitation, lienWhatsApp } from "@/lib/invitation";
import type { Groupe } from "@/lib/supabase";

/** Code et lien d'invitation du groupe, avec les moyens de les partager. */
export function Invitation({ groupe }: { groupe: Groupe }) {
  const qc = useQueryClient();
  const [copie, setCopie] = useState(false);
  const [qr, setQr] = useState(false);
  const lien = lienInvitation(groupe.code_invitation);

  const regenerer = useMutation({
    mutationFn: () => rpc("regenerer_code_invitation", { p_groupe: groupe.id }),
    onSuccess: (code) =>
      qc.setQueryData<Groupe[]>(["groupes-formateur", groupe.formateur_id], (l) => l?.map((g) => (g.id === groupe.id ? { ...g, code_invitation: code } : g))),
  });

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch { /* presse-papiers indisponible : le lien reste affiché */ }
  };

  return (
    <div className="rounded-2xl bg-muted p-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="text-xs text-muted-foreground">Code d'invitation</div>
          <div className="font-mono text-2xl font-bold tracking-[0.3em] text-navy">{groupe.code_invitation}</div>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="text-xs text-muted-foreground">Lien d'invitation</div>
          <div className="truncate text-sm font-medium" title={lien}>{lien}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={copier} className={btnSecondary}>
          {copie ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copie ? "Lien copié" : "Copier le lien"}
        </button>
        <a href={lienWhatsApp(groupe.nom, groupe.code_invitation)} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
          <MessageCircle className="h-4 w-4" /> Partager sur WhatsApp
        </a>
        <button onClick={() => setQr(true)} className={btnSecondary}><QrCode className="h-4 w-4" /> Afficher le QR code</button>
        <Confirmer
          declencheur={
            <button disabled={regenerer.isPending} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${regenerer.isPending ? "animate-spin" : ""}`} /> Générer un nouveau code
            </button>
          }
          titre="Générer un nouveau code ?"
          description={<>L'ancien code <strong className="font-mono">{groupe.code_invitation}</strong> et son lien ne fonctionneront plus. Les membres actuels restent dans le groupe.</>}
          libelle="Générer un nouveau code"
          onConfirmer={() => regenerer.mutate()}
        />
      </div>
      {regenerer.isError && <div className="mt-3"><Message ton="erreur">Impossible de générer un nouveau code.</Message></div>}
      {regenerer.isSuccess && <div className="mt-3"><Message ton="succes">Nouveau code généré. Partage le nouveau lien à tes apprenants.</Message></div>}
      {qr && <QrPleinEcran lien={lien} nom={groupe.nom} code={groupe.code_invitation} onFermer={() => setQr(false)} />}
    </div>
  );
}

/** QR code en plein écran, à projeter en séance. */
function QrPleinEcran({ lien, nom, code, onFermer }: { lien: string; nom: string; code: string; onFermer: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let actif = true;
    // Chargée à la demande : la bibliothèque n'alourdit pas le reste de la page.
    import("qrcode")
      .then((m) => m.default.toDataURL(lien, { width: 1024, margin: 1, errorCorrectionLevel: "M" }))
      .then((url) => actif && setImage(url))
      .catch(() => actif && setErreur(true));
    return () => { actif = false; };
  }, [lien]);

  const fermerRef = useRef(onFermer);
  fermerRef.current = onFermer;
  const fermer = () => fermerRef.current();

  useEffect(() => {
    ref.current?.requestFullscreen?.().catch(() => undefined); // refusé ou indisponible : l'overlay couvre déjà la page
    // En plein écran, Échap quitte d'abord le plein écran ; un second appui ferme l'overlay.
    const touche = (e: KeyboardEvent) => e.key === "Escape" && !document.fullscreenElement && fermerRef.current();
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("keydown", touche);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`QR code d'invitation du groupe ${nom}`} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-auto bg-white p-6 text-center text-black">
      <button onClick={fermer} autoFocus className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm font-semibold hover:bg-black/10">
        <X className="h-4 w-4" /> Fermer
      </button>
      <p className="text-lg">Scanne pour rejoindre le groupe</p>
      <h2 className="text-3xl font-bold md:text-4xl">{nom}</h2>
      {image ? (
        <img src={image} alt={`QR code menant à ${lien}`} className="aspect-square w-[min(60vh,85vw)]" />
      ) : (
        <div className="grid aspect-square w-[min(60vh,85vw)] place-items-center rounded-2xl bg-black/5 text-sm">{erreur ? "QR code indisponible : utilise le lien ci-dessous." : "Génération du QR code…"}</div>
      )}
      <p className="font-mono text-4xl font-bold tracking-[0.3em] md:text-5xl">{code}</p>
      <p className="break-all text-base md:text-lg">{lien}</p>
    </div>
  );
}
