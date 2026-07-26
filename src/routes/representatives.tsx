import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import {
  lookupRepresentatives,
  type LookupResponse,
} from "@/lib/representatives.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Phone, Globe, Mail, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

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

type Person = LookupResponse["districts"][number]["representative"];

function partyBadgeClass(party: string | null | undefined) {
  const p = (party ?? "").toLowerCase();
  if (p.startsWith("democrat")) return "bg-blue-600 text-white";
  if (p.startsWith("republican")) return "bg-red-600 text-white";
  return "bg-muted text-muted-foreground";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [errored, setErrored] = useState(false);
  const show = photoUrl && !errored;
  return (
    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
      {show ? (
        <img
          src={photoUrl!}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="text-xl font-semibold text-muted-foreground">
          {initials(name) || "?"}
        </span>
      )}
    </div>
  );
}

function PersonCard({
  person,
  role,
  districtLabel,
}: {
  person: Person;
  role: "Representative" | "Senator";
  districtLabel?: string;
}) {
  if (!person) return null;
  return (
    <Card className="p-5">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <Avatar name={person.name} photoUrl={person.photoUrl} />
          {person.photoAttribution && (
            <p className="text-[10px] leading-tight text-muted-foreground text-center max-w-[6rem] break-words overflow-hidden">
              {person.photoAttribution.replace(/\s*\(https?:\/\/[^)]+\)\s*/g, "")}
            </p>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {role}
            {role === "Representative" && districtLabel ? ` · ${districtLabel}` : ""}
          </p>
          <h3 className="text-lg font-semibold mt-0.5">{person.name}</h3>
          {person.party && (
            <span
              className={cn(
                "inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                partyBadgeClass(person.party),
              )}
            >
              {person.party}
            </span>
          )}
          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            {person.phone && (
              <a
                href={`tel:${person.phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {person.phone}
              </a>
            )}
            {person.websiteUrl && (
              <a
                href={person.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="h-4 w-4" aria-hidden />
                Visit website
              </a>
            )}
            {person.contactFormUrl && (
              <a
                href={person.contactFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Contact form
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded mt-3" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RepresentativesPage() {
  const lookup = useServerFn(lookupRepresentatives);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedDistricts = useMemo(
    () => (result?.districts ?? []).slice().sort((a, b) => b.proportion - a.proportion),
    [result],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await lookup({ data: { address } });
      setResult(res);
    } catch (err: any) {
      // useServerFn surfaces thrown Responses; try to read status
      const status = err?.status ?? err?.response?.status;
      if (status === 429) {
        setError("Too many lookups from this connection. Please try again in a few minutes.");
      } else if (status === 400) {
        setError("Please enter a full street address (5–200 characters).");
      } else {
        setError("Lookup is temporarily unavailable. Please try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  }

  const showEmpty = result && result.districts.length === 0;
  const multi = sortedDistricts.length > 1;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Find Your Representative
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your home address to see your U.S. House representative and two U.S. senators.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mb-8">
        <label htmlFor="rep-address" className="sr-only">
          Home address
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="rep-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Springfield, IL 62701"
            autoComplete="street-address"
            maxLength={200}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || address.trim().length < 5}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Looking up
              </>
            ) : (
              "Find representatives"
            )}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your full street address. ZIP codes alone can span more than one district.
        </p>
      </form>

      {error && (
        <div
          role="status"
          className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <section aria-live="polite">
        {loading && <LoadingSkeleton />}

        {showEmpty && (
          <div
            role="status"
            className="rounded-lg border bg-muted/30 p-4 text-sm"
          >
            We couldn&apos;t find that address. Try including your city and state or ZIP code.
          </div>
        )}

        {result && result.districts.length > 0 && (
          <div className="space-y-6">
            {result.matchedAddress && (
              <p className="text-sm text-muted-foreground">
                Matched address:{" "}
                <span className="text-foreground font-medium">{result.matchedAddress}</span>
              </p>
            )}

            {result.approximate && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  We could only match your address approximately. Double-check the district below.
                </span>
              </div>
            )}

            {multi && (
              <h2 className="text-lg font-semibold">
                Your address may fall in more than one district
              </h2>
            )}

            {sortedDistricts.map((d, i) => (
              <div key={`${d.districtLabel}-${i}`} className="space-y-3">
                {multi && (
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-semibold">
                      {d.districtLabel}
                      {d.congress ? ` · ${d.congress} Congress` : ""}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Match: {(d.proportion * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <PersonCard
                    person={d.representative}
                    role="Representative"
                    districtLabel={d.districtLabel}
                  />
                  {d.senators.map((s, si) => (
                    <PersonCard key={si} person={s} role="Senator" />
                  ))}
                </div>
              </div>
            ))}

            <p className="pt-2 text-xs text-muted-foreground">
              District and legislator data via Geocodio and the @unitedstates project.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
