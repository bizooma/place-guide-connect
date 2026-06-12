import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Responsible Use — The PLACE Online" }, { name: "description", content: "Terms and responsible use of The PLACE Online." }] }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-display text-4xl font-semibold text-primary-deep">Terms & Responsible Use</h1>
      <p className="mt-4 text-foreground/85">The PLACE Online is here to help explain and guide. It does not replace legal, medical, financial, or government advice.</p>
      <h2 className="mt-8 font-display text-2xl font-semibold text-primary-deep">AI can make mistakes</h2>
      <p className="mt-2 text-foreground/85">Always confirm important information with a qualified professional or trusted organization.</p>
      <h2 className="mt-8 font-display text-2xl font-semibold text-primary-deep">Be kind</h2>
      <p className="mt-2 text-foreground/85">Please use this tool to help yourself and people in your community. Don't upload other people's private documents without permission.</p>
    </div>
  ),
});
