import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import type { FormationModule } from "@/lib/content";

type PdfStatus = "checking" | "available" | "missing";

/** Vérifie que le PDF existe réellement (et n'est pas une page 404 HTML). */
function usePdfStatus(pdfUrl: string): PdfStatus {
  const [status, setStatus] = useState<PdfStatus>(pdfUrl ? "checking" : "missing");

  useEffect(() => {
    if (!pdfUrl) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    fetch(pdfUrl, { method: "HEAD" })
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        if (!cancelled) setStatus(res.ok && type.includes("pdf") ? "available" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  return status;
}

function BackLink() {
  return (
    <Link to="/formations" className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-navy shadow-card transition hover:-translate-y-0.5">
      <ArrowLeft className="h-4 w-4" /> Retour aux formations
    </Link>
  );
}

export function ModuleDetail({ module }: { module: FormationModule }) {
  const status = usePdfStatus(module.pdfUrl);
  const fileName = module.pdfUrl.split("/").pop() || `${module.slug}.pdf`;

  return (
    <SiteLayout>
      <PageHero badge="Module de formation" title={module.title} description={module.description} />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <BackLink />

        <section className="mt-8 rounded-2xl bg-card p-5 shadow-card md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <FileText className="h-5 w-5 text-primary" /> Support de cours
            </h2>
            {status === "available" && (
              <div className="flex flex-wrap gap-3">
                <a href={module.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90">
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans un nouvel onglet
                </a>
                <a href={module.pdfUrl} download={fileName} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90">
                  <Download className="h-4 w-4" /> Télécharger le PDF
                </a>
              </div>
            )}
          </div>

          {status === "checking" && <p className="mt-6 text-sm text-muted-foreground">Chargement du support de cours…</p>}

          {status === "missing" && (
            <div className="mt-6 rounded-xl bg-muted p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium text-navy">Le support de cours sera bientôt disponible</p>
            </div>
          )}

          {/* L'aperçu intégré est peu fiable sur mobile : on n'y garde que les boutons. */}
          {status === "available" && (
            <object data={module.pdfUrl} type="application/pdf" className="mt-6 hidden h-[80vh] w-full rounded-xl border md:block" aria-label={`Support de cours : ${module.title}`}>
              <iframe src={module.pdfUrl} title={`Support de cours : ${module.title}`} className="h-full w-full" />
            </object>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

export function ModuleNotFound() {
  return (
    <SiteLayout>
      <PageHero badge="Formations" title="Module introuvable" description="Ce module n'existe pas ou a été déplacé." />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <BackLink />
      </div>
    </SiteLayout>
  );
}
