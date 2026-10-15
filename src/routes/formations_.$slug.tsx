import { createFileRoute } from "@tanstack/react-router";
import { ModuleDetail, ModuleNotFound } from "@/components/ModuleDetail";
import { getFormationModule } from "@/lib/content";

// `formations_` : route sœur de /formations (pas imbriquée), l'URL reste /formations/$slug.
export const Route = createFileRoute("/formations_/$slug")({
  loader: ({ params }) => ({ module: getFormationModule(params.slug) }),
  head: ({ loaderData }) => {
    const m = loaderData?.module;
    const title = m ? `${m.title} — Formations — IA et la Recherche` : "Module introuvable — IA et la Recherche";
    return {
      meta: [
        { title },
        ...(m ? [{ name: "description", content: m.description }, { property: "og:title", content: title }, { property: "og:description", content: m.description }] : []),
      ],
    };
  },
  component: FormationModulePage,
});

function FormationModulePage() {
  const { module } = Route.useLoaderData();
  return module ? <ModuleDetail module={module} /> : <ModuleNotFound />;
}
