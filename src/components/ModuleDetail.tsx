import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Download, ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { SlidesPresentation } from "@/components/SlidesPresentation";
import { slidesComprendreIA } from "@/data/slides-comprendre-ia";
import type { FormationModule } from "@/lib/content";

/** Présentations en diapositives affichées au-dessus du support PDF, par module. */
const PRESENTATIONS: Record<string, { titre: string; slides: typeof slidesComprendreIA }> = {
  "comprendre-ia": { titre: "L'IA et la recherche — l'essentiel", slides: slidesComprendreIA },
};

type FileStatus = "checking" | "available" | "missing";

/** Vérifie que le fichier existe réellement (le serveur renvoie une page HTML 404 sinon). */
function useFileStatus(url: string | undefined): FileStatus {
  const [status, setStatus] = useState<FileStatus>(url ? "checking" : "missing");

  useEffect(() => {
    if (!url) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    fetch(url, { method: "HEAD" })
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        if (!cancelled) setStatus(res.ok && !type.includes("text/html") ? "available" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}

const fileNameOf = (url: string, fallback: string) => url.split("/").pop() || fallback;

const btnPrimary = "w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 sm:w-auto";
const btnSecondary = "w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90 sm:w-auto";

function BackLink() {
  return (
    <Link to="/formations" className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-navy shadow-card transition hover:-translate-y-0.5">
      <ArrowLeft className="h-4 w-4" /> Retour aux formations
    </Link>
  );
}

function ManuelSection({ module, pdfStatus }: { module: FormationModule; pdfStatus: FileStatus }) {
  const manuelStatus = useFileStatus(module.manuelUrl);
  const pdfReady = pdfStatus === "available";
  const docxReady = manuelStatus === "available" && !!module.manuelUrl;
  const checking = pdfStatus === "checking" || manuelStatus === "checking";

  return (
    <section className="mt-8 rounded-2xl bg-card p-5 shadow-card md:p-7">
      <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">Manuel officiel</span>
      <div className="mt-4 flex items-start gap-4">
        <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-tint-green sm:grid">
          <BookOpen className="h-7 w-7 text-tint-green-fg" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-navy md:text-2xl">{module.manuelTitle}</h2>
          {module.manuelSubtitle && <p className="mt-1 text-sm text-muted-foreground">{module.manuelSubtitle}</p>}
        </div>
      </div>

      {(pdfReady || docxReady) && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {pdfReady && (
            <>
              {/* Ordinateur : défile jusqu'à la visionneuse. Mobile (visionneuse masquée) : ouvre le PDF. */}
              <a href="#visionneuse" className={`${btnPrimary} hidden md:inline-flex`}>
                <BookOpen className="h-4 w-4" /> Lire le manuel
              </a>
              <a href={module.pdfUrl} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} inline-flex md:hidden`}>
                <BookOpen className="h-4 w-4" /> Lire le manuel
              </a>
            </>
          )}
          {docxReady && (
            <a href={module.manuelUrl} download={module.manuelFileName ?? fileNameOf(module.manuelUrl!, `${module.slug}.docx`)} className={`${btnSecondary} inline-flex`}>
              <Download className="h-4 w-4" /> Télécharger (Word)
            </a>
          )}
          {pdfReady && (
            <a href={module.pdfUrl} download={fileNameOf(module.pdfUrl, `${module.slug}.pdf`)} className={`${btnSecondary} inline-flex`}>
              <Download className="h-4 w-4" /> Télécharger (PDF)
            </a>
          )}
        </div>
      )}

      {checking && !pdfReady && !docxReady && <p className="mt-6 text-sm text-muted-foreground">Chargement du manuel…</p>}
      {!checking && !pdfReady && !docxReady && <p className="mt-6 text-sm text-muted-foreground">Le manuel sera bientôt disponible.</p>}
    </section>
  );
}

export function ModuleDetail({ module }: { module: FormationModule }) {
  const status = useFileStatus(module.pdfUrl);
  const presentation = PRESENTATIONS[module.slug];

  return (
    <SiteLayout>
      <PageHero badge="Module de formation" title={module.title} description={module.description} />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink />
          <Link to="/outils-ia" className="text-sm font-semibold text-primary hover:underline">Comparer les outils de recherche →</Link>
        </div>

        {module.manuelTitle &&<ManuelSection module={module} pdfStatus={status} />}

        {presentation && <SlidesPresentation titre={presentation.titre} slides={presentation.slides} pdfUrl={module.pdfUrl} />}

        <section id="visionneuse" className="mt-8 scroll-mt-24 rounded-2xl bg-card p-5 shadow-card md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
              <FileText className="h-5 w-5 text-primary" /> Support de cours
            </h2>
            {status === "available" && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={module.pdfUrl} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} inline-flex`}>
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans un nouvel onglet
                </a>
                <a href={module.pdfUrl} download={fileNameOf(module.pdfUrl, `${module.slug}.pdf`)} className={`${btnPrimary} inline-flex`}>
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
