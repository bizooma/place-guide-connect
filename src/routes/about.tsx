import { createFileRoute } from "@tanstack/react-router";
import { Disclaimer } from "@/components/Disclaimer";
import { useI18n } from "@/lib/i18n";
import rlpLogo from "@/assets/rlp-logo.png.asset.json";
import squareMileLogo from "@/assets/square-mile-logo.png.asset.json";
import wfilLogo from "@/assets/wfil-logo.webp.asset.json";

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
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">{t("about.heading")}</h1>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">{t("about.p1")}</p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">{t("about.p2")}</p>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">{t("about.collab.title")}</h2>
      <p className="mt-3 text-lg leading-relaxed text-foreground/85">{t("about.collab.p")}</p>

      <div className="mt-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-32 shrink-0 flex items-center justify-center">
            <img src={rlpLogo.url} alt="Refugee Language Project logo" className="h-16 w-auto object-contain" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-primary-deep">
              <a href="https://refugeelanguage.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:underline">
                Refugee Language Project
              </a>
            </h3>
            <p className="mt-1 text-base leading-relaxed text-foreground/85">{t("about.rlp.desc")}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-32 shrink-0 flex items-center justify-center">
            <img src={squareMileLogo.url} alt="Square Mile logo" className="h-16 w-auto object-contain" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-primary-deep">
              <a href="https://www.square-mile.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:underline">
                Square Mile
              </a>
            </h3>
            <p className="mt-1 text-base leading-relaxed text-foreground/85">{t("about.sm.desc")}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-32 shrink-0 flex items-center justify-center">
            <img src={wfilLogo.url} alt="We Find In Love logo" className="h-20 w-auto object-contain" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-primary-deep">
              <a href="https://wefindinlove.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:underline">
                We Find In Love
              </a>
            </h3>
            <p className="mt-1 text-base leading-relaxed text-foreground/85">{t("about.wfil.desc")}</p>
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">{t("about.vision.title")}</h2>
      <p className="mt-3 text-lg leading-relaxed text-foreground/85">{t("about.vision.p1")}</p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">{t("about.vision.p2")}</p>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">{t("about.notDo.title")}</h2>
      <Disclaimer className="mt-3">{t("about.notDo.body")}</Disclaimer>
    </div>
  );
}
