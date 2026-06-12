import { createFileRoute } from "@tanstack/react-router";
import { Disclaimer } from "@/components/Disclaimer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The PLACE Online" },
      { name: "description", content: "About The PLACE Online and our mission to bring in-person support to anyone with a phone." },
      { property: "og:title", content: "About — The PLACE Online" },
      { property: "og:description", content: "Online support inspired by The PLACE in Amarillo." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">About The PLACE Online</h1>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        The PLACE Online takes the in-person support offered by The PLACE in Amarillo and makes it available
        online. Our audience includes refugees, immigrants, English-language learners, and any community member
        who needs help understanding a document, finding services, or getting connected to the right resource.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        We built this app to feel like a kind person sitting next to you — patient, plain-language, and never
        in a rush. It works on your phone, and it can read things to you out loud.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">What we do</h2>
      <ul className="mt-3 space-y-2 text-base">
        <li>· Explain documents in plain English</li>
        <li>· Help you find food, housing, jobs, transportation, and health resources</li>
        <li>· Show classes, English lessons, and community events</li>
        <li>· Connect you to a real person at The PLACE when you want one</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">What we don't do</h2>
      <Disclaimer className="mt-3">
        The PLACE Online does not replace legal, medical, financial, immigration, or government advice. For those
        decisions, please talk to a qualified professional or a trusted organization.
      </Disclaimer>
    </div>
  );
}
