import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function HeaderUser() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function load(userId: string | undefined, email: string | undefined) {
      if (!userId) {
        if (active) {
          setAvatarUrl(null);
          setInitial("");
          setLoaded(true);
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      setAvatarUrl(data?.avatar_url ?? null);
      const name = data?.display_name || email || "";
      setInitial(name ? name.charAt(0).toUpperCase() : "?");
      setLoaded(true);
    }
    supabase.auth.getUser().then(({ data }) => load(data.user?.id, data.user?.email ?? undefined));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user?.id, session?.user?.email ?? undefined);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!loaded || !initial) return null;

  return (
    <Link
      to="/profile"
      aria-label="Your profile"
      className="rounded-full ring-2 ring-white/20 hover:ring-white/60 transition"
    >
      <Avatar className="h-10 w-10">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="Your avatar" /> : null}
        <AvatarFallback className="bg-white/10 text-white text-base font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
