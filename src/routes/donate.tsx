import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VolunteerSignupDialog } from "@/components/VolunteerSignupDialog";
import { DonateGallery } from "@/components/DonateGallery";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import financialImg from "@/assets/donate-financial.jpg";
import corporateImg from "@/assets/donate-corporate.jpg";
import volunteerImg from "@/assets/donate-volunteer.jpg";
import otherImg from "@/assets/donate-other.jpg";

function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={64}
      height={64}
      className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-primary/15"
    />
  );
}

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — The PLACE Online" },
      { name: "description", content: "Invest in belonging. Support The PLACE in Amarillo through financial giving, corporate sponsorship, or volunteering your time." },
      { property: "og:title", content: "Donate — The PLACE Online" },
      { property: "og:description", content: "Invest in belonging. Support The PLACE in Amarillo through financial giving, corporate sponsorship, or volunteering your time." },
    ],
  }),
  component: DonatePage,
});

const STRINGS = [
  "Invest in Belonging.",
  "Support We Find in Love.",
  "At the PLACE, we believe that everyone deserves a place to call home. When resettled and new refugees arrive in Amarillo, Texas, they aren't just looking for a new roof over their heads — they are looking for community, connection, and a chance to thrive.",
  "By partnering with us, you are directly investing in the language acquisition, artistic expression, cultural integration, and economic growth of our new neighbors.",
  "Financial Giving",
  "Your financial contributions go directly toward sustaining our multicultural community center and expanding vital programs for local refugees. Every dollar builds a stronger, more inclusive Amarillo.",
  "helps provide essential learning supplies for language classes.",
  "funds community art and cultural integration workshops.",
  "helps scale economic growth pathways and workforce mentorship programs.",
  "Give Now",
  "Corporate Sponsorship",
  "Are you a local business or organization looking to make a lasting difference? Partnering with the PLACE is a powerful way to invest in the economic and cultural future of our city. Corporate sponsors help us scale our infrastructure, bridge systemic gaps, and build a prosperous, diverse local economy.",
  "We offer custom sponsorship tiers to align with your organization's community impact goals.",
  "Contact Our Team to Learn More",
  "The PLACE",
  "Phone:",
  "Email:",
  "Volunteer",
  "Financial support keeps our doors open, but volunteers are the heartbeat of our community center. Whether you want to help practice English, mentor a family, or assist with cultural events, your time and friendship can change a life.",
  "Language Mentors:",
  "Help new neighbors build confidence in conversational English.",
  "Event Assistants:",
  "Support our cultural and community gatherings.",
  "Skill Sharing:",
  "Have a specific professional or artistic skill? Teach a workshop!",
  "Become a Volunteer",
  "Other Ways to Help",
  "Have questions about matching gifts, physical donations, or upcoming events? Check out our",
  "Calendar",
  "or get in touch with us directly on our",
  "Contact Page",
  "Thank you for helping us ensure everyone has a place.",
];

function DonatePage() {
  const tx = useTranslatedTexts(useMemo(() => STRINGS, []));
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      {/* Hero */}
      <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">
        {tx("Invest in Belonging.")}
        <br />
        {tx("Support We Find in Love.")}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-foreground/85">
        {tx("At the PLACE, we believe that everyone deserves a place to call home. When resettled and new refugees arrive in Amarillo, Texas, they aren't just looking for a new roof over their heads — they are looking for community, connection, and a chance to thrive.")}
      </p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        {tx("By partnering with us, you are directly investing in the language acquisition, artistic expression, cultural integration, and economic growth of our new neighbors.")}
      </p>

      {/* Auto-scrolling photo gallery */}
      <div className="mt-10">
        <DonateGallery />
      </div>

      {/* Row 1: Financial Giving + Corporate Sponsorship */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Financial Giving */}
        <section className="surface-card p-6 md:p-8">
          <div className="flex items-center gap-4">
            <CardImage src={financialImg} alt="Hands placing coins into a donation jar" />
            <h2 className="font-display text-2xl font-semibold text-primary-deep">{tx("Financial Giving")}</h2>
          </div>
          <p className="mt-3 text-base leading-relaxed text-foreground/85">
            {tx("Your financial contributions go directly toward sustaining our multicultural community center and expanding vital programs for local refugees. Every dollar builds a stronger, more inclusive Amarillo.")}
          </p>
          <ul className="mt-5 space-y-3">
            <li className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="text-foreground">$25</strong> {tx("helps provide essential learning supplies for language classes.")}
              </span>
            </li>
            <li className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="text-foreground">$100</strong> {tx("funds community art and cultural integration workshops.")}
              </span>
            </li>
            <li className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="text-foreground">$500+</strong> {tx("helps scale economic growth pathways and workforce mentorship programs.")}
              </span>
            </li>
          </ul>
          <div className="mt-6">
            <Button
              asChild
              className="rounded-full bg-primary text-primary-foreground hover:opacity-90"
            >
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=Q9X36H94W4PGS"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx("Give Now")} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        {/* Corporate Sponsorship */}
        <section className="surface-card p-6 md:p-8">
          <div className="flex items-center gap-4">
            <CardImage src={corporateImg} alt="Two professionals shaking hands in a community center" />
            <h2 className="font-display text-2xl font-semibold text-primary-deep">{tx("Corporate Sponsorship")}</h2>
          </div>
          <p className="mt-3 text-base leading-relaxed text-foreground/85">
            {tx("Are you a local business or organization looking to make a lasting difference? Partnering with the PLACE is a powerful way to invest in the economic and cultural future of our city. Corporate sponsors help us scale our infrastructure, bridge systemic gaps, and build a prosperous, diverse local economy.")}
          </p>
          <p className="mt-3 text-base leading-relaxed text-foreground/85">
            {tx("We offer custom sponsorship tiers to align with your organization's community impact goals.")}
          </p>
          <div className="mt-6">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-primary text-primary hover:bg-primary/5"
            >
              <a
                href="mailto:sara@wefindinlove.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx("Contact Our Team to Learn More")} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </div>

      {/* Row 2: Video + Volunteer */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="surface-card overflow-hidden p-2 flex flex-col">
          <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src="https://app.heygen.com/embeds/19f2b8d81e7f4b6b9f381457a335b23c"
              title="The Place Final"
              frameBorder={0}
              allow="encrypted-media; fullscreen;"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="mt-4 px-3 pb-3">
            <h3 className="font-display text-lg font-semibold text-primary-deep">{tx("The PLACE")}</h3>
            <p className="mt-1 text-sm text-foreground/80">3107 Plains Blvd Space 500,<br />Amarillo, TX 79102</p>
            <p className="mt-2 text-sm text-foreground/80">
              {tx("Phone:")} <a href="tel:+18065535155" className="text-primary underline hover:no-underline">(806) 553-5155</a>
            </p>
            <p className="mt-1 text-sm text-foreground/80">
              {tx("Email:")} <a href="mailto:sara@wefindinlove.org" className="text-primary underline hover:no-underline">sara@wefindinlove.org</a>
            </p>
          </div>
        </div>

        {/* Volunteer */}
        <section className="surface-card p-6 md:p-8">
          <div className="flex items-center gap-4">
            <CardImage src={volunteerImg} alt="Diverse volunteers smiling together" />
            <h2 className="font-display text-2xl font-semibold text-primary-deep">{tx("Volunteer")}</h2>
          </div>
          <p className="mt-3 text-base leading-relaxed text-foreground/85">
            {tx("Financial support keeps our doors open, but volunteers are the heartbeat of our community center. Whether you want to help practice English, mentor a family, or assist with cultural events, your time and friendship can change a life.")}
          </p>
          <ul className="mt-5 space-y-3">
            <li className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="text-foreground">{tx("Language Mentors:")}</strong> {tx("Help new neighbors build confidence in conversational English.")}
              </span>
            </li>
            <li className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="text-foreground">{tx("Event Assistants:")}</strong> {tx("Support our cultural and community gatherings.")}
              </span>
            </li>
            <li className="flex items-start gap-3 text-base text-foreground/85">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="text-foreground">{tx("Skill Sharing:")}</strong> {tx("Have a specific professional or artistic skill? Teach a workshop!")}
              </span>
            </li>
          </ul>
          <div className="mt-6">
            <VolunteerSignupDialog
              trigger={
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-primary/5"
                >
                  {tx("Become a Volunteer")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              }
            />
          </div>
        </section>
      </div>

      {/* Other Ways to Help */}
      <section className="mt-8 surface-card p-6 md:p-8">
        <div className="flex items-center gap-4">
          <CardImage src={otherImg} alt="Cardboard donation boxes filled with clothes and books" />
          <h2 className="font-display text-2xl font-semibold text-primary-deep">{tx("Other Ways to Help")}</h2>
        </div>
        <p className="mt-3 text-lg leading-relaxed text-foreground/85">
          {tx("Have questions about matching gifts, physical donations, or upcoming events? Check out our")}{" "}
          <Link to="/schedule" className="text-primary underline hover:no-underline inline-flex items-center gap-1">
            {tx("Calendar")} <CalendarDays className="h-4 w-4" />
          </Link>{" "}
          {tx("or get in touch with us directly on our")}{" "}
          <Link to="/help" className="text-primary underline hover:no-underline">
            {tx("Contact Page")}
          </Link>.
        </p>
        <p className="mt-4 text-lg font-medium text-primary-deep">
          {tx("Thank you for helping us ensure everyone has a place.")}
        </p>
      </section>
    </div>
  );
}
