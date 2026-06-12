import { createFileRoute, Link } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/offline")({
  head: () => ({ meta: [{ title: "Offline — The PLACE Online" }, { name: "description", content: "You are offline." }] }),
  component: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary-deep mx-auto"><WifiOff className="h-7 w-7" /></span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-primary-deep">You're offline</h1>
      <p className="mt-3 text-muted-foreground">Some pages are saved for offline use. Document upload needs an internet connection.</p>
      <Button asChild className="mt-6 rounded-full bg-primary hover:bg-primary-deep"><Link to="/">Try home</Link></Button>
    </div>
  ),
});
