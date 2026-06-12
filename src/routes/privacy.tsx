import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — The PLACE Online" }, { name: "description", content: "How The PLACE Online handles your information." }] }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16 prose prose-stone">
      <h1 className="font-display text-4xl font-semibold text-primary-deep">Privacy</h1>
      <p className="mt-4 text-foreground/85">We respect your privacy. You can use The PLACE Online without creating an account.</p>
      <h2 className="mt-8 font-display text-2xl font-semibold text-primary-deep">What we collect</h2>
      <ul className="mt-2 space-y-2">
        <li>· Your answers in the guided help flow (you can leave blank).</li>
        <li>· Documents you upload — only if you check the consent box. You can delete them at any time.</li>
        <li>· Basic, non-identifying usage information to improve the app.</li>
      </ul>
      <h2 className="mt-8 font-display text-2xl font-semibold text-primary-deep">Your choices</h2>
      <ul className="mt-2 space-y-2">
        <li>· Delete an uploaded document and AI result on the Document Helper page.</li>
        <li>· Use the app without uploading anything.</li>
        <li>· Contact The PLACE to ask about your data.</li>
      </ul>
    </div>
  ),
});
