import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclaimer({ children, tone = "info", className }: { children: React.ReactNode; tone?: "info" | "warn"; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed",
        tone === "warn"
          ? "border-accent/40 bg-accent/10 text-primary-deep"
          : "border-border bg-secondary/60 text-primary-deep",
        className,
      )}
      role="note"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
