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
      <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">Welcome to the PLACE Online</h1>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        The PLACE is more than just a building—it is a vibrant community hub designed to empower, connect, and uplift individuals in the Amarillo area. To ensure our community has access to essential support whenever and wherever they need it, we have expanded our reach into the digital world with our new Progressive Web App (PWA).
      </p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        Through this platform, vital resources, community connections, and support systems are now available 24/7, from anywhere, breaking down physical barriers and meeting you right where you are.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">Powered by Collaboration</h2>
      <p className="mt-3 text-lg leading-relaxed text-foreground/85">
        The PLACE exists and thrives thanks to the shared vision, funding, and dedication of three incredible local non-profit organizations. Together, they combine their unique strengths to create a holistic ecosystem of support:
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-primary-deep">
            <a href="https://refugeelanguage.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:underline">
              Refugee Language Project
            </a>
          </h3>
          <p className="mt-1 text-base leading-relaxed text-foreground/85">
            Dedicated to helping individuals from refugee communities flourish. By removing language barriers, honoring diverse cultural heritages, and fostering community leaders, they help our neighbors confidently interact with the world around them.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-primary-deep">Square Mile</h3>
          <p className="mt-1 text-base leading-relaxed text-foreground/85">
            Focused on holistic and innovative neighborhood revitalization. Using an empowerment-based model of community engagement, Square Mile builds networks of entrepreneurs, small businesses, and residents to bring renewal and restoration to under-resourced areas.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-primary-deep">We Find In Love</h3>
          <p className="mt-1 text-base leading-relaxed text-foreground/85">
            An organization that empowers through art, service, and community. They focus on creating collaborative, creative learning environments that foster independence and help refugee neighbors in the Texas Panhandle (and abroad) live out their dreams.
          </p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">Our Digital Vision</h2>
      <p className="mt-3 text-lg leading-relaxed text-foreground/85">
        By bringing the physical heart of the PLACE into a 24/7 digital space, we are making it easier than ever to access language resources, community development tools, and creative empowerment opportunities.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        Whether you are walking through our physical doors or tapping on your phone screen, you belong at the PLACE.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold text-primary-deep">What we don't do</h2>
      <Disclaimer className="mt-3">
        The PLACE Online does not replace legal, medical, financial, immigration, or government advice. For those
        decisions, please talk to a qualified professional or a trusted organization.
      </Disclaimer>
    </div>
  );
}
