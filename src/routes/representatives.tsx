import { createFileRoute } from "@tanstack/react-router";
import { RepresentativeFinder } from "@/components/RepresentativeFinder";

export const Route = createFileRoute("/representatives")({
  head: () => ({
    meta: [
      { title: "Find Your Representative — We Find Online" },
      {
        name: "description",
        content:
          "Enter your address to find your U.S. House representative and two U.S. senators.",
      },
      { property: "og:title", content: "Find Your Representative — We Find Online" },
      {
        property: "og:description",
        content:
          "Enter your address to find your U.S. House representative and two U.S. senators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RepresentativesPage,
});

function RepresentativesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <RepresentativeFinder
        heading={
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Find Your Representative
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter your home address to see your U.S. House representative and two U.S. senators.
            </p>
          </header>
        }
      />
    </main>
  );
}

