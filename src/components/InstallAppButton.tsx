import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function InstallAppButton() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed || !deferred) return null;

  return (
    <Button
      variant="outline"
      onClick={async () => {
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setDeferred(null);
      }}
      className="gap-2 rounded-full"
    >
      <Download className="h-4 w-4" />
      {t("cta.install")}
    </Button>
  );
}
