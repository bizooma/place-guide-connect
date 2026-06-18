import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Shield, Users, FileText, CalendarDays, BookOpen, Languages as LangIcon, Settings, UserCircle, Brain, HeartHandshake } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { triageCategories } from "@/data/adminSeed";
import { ScheduleEditor } from "@/components/admin/ScheduleEditor";
import { ResourcesTranslateList } from "@/components/admin/ResourcesTranslateList";
import { DocumentUploadsList } from "@/components/admin/DocumentUploadsList";
import { LanguagesEditor } from "@/components/admin/LanguagesEditor";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { TrainingDocsEditor } from "@/components/admin/TrainingDocsEditor";
import { VolunteerSignupsList } from "@/components/admin/VolunteerSignupsList";
import { usePendingUploadsCount } from "@/hooks/usePendingUploadsCount";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — The PLACE Online" },
      { name: "description", content: "Admin dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const pendingCount = usePendingUploadsCount();

  useEffect(() => {
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(Boolean(data));
    });
  }, [user.id]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === null) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-primary-deep">Not an admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have admin access. You can still manage your profile.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild className="rounded-full"><Link to="/profile">Go to profile</Link></Button>
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary-deep">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-full gap-2"><Link to="/profile"><UserCircle className="h-4 w-4" />Profile</Link></Button>
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>Sign out</Button>
        </div>
      </header>

      <Tabs defaultValue="triage" className="mt-8">
        <TabsList className="flex flex-wrap h-auto bg-warm border border-border rounded-full p-1">
          <TabsTrigger value="triage" className="gap-1.5 rounded-full"><FileText className="h-4 w-4" />Help choices</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 rounded-full"><CalendarDays className="h-4 w-4" />Schedule</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 rounded-full"><BookOpen className="h-4 w-4" />Resources</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 rounded-full">
            <Users className="h-4 w-4" />Requests
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-semibold leading-none">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5 rounded-full"><Brain className="h-4 w-4" />Chatbot training</TabsTrigger>
          <TabsTrigger value="volunteers" className="gap-1.5 rounded-full"><HeartHandshake className="h-4 w-4" />Volunteers</TabsTrigger>
          <TabsTrigger value="languages" className="gap-1.5 rounded-full"><LangIcon className="h-4 w-4" />Languages</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 rounded-full"><Settings className="h-4 w-4" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="triage" className="mt-6">
          <CrudTable
            title="Help choices (triage categories)"
            rows={triageCategories.map((c) => [c.order, c.title, c.description, c.active ? "Active" : "Hidden"])}
            head={["Order", "Title", "Description", "Status"]}
          />
        </TabsContent>
        <TabsContent value="schedule" className="mt-6">
          <ScheduleEditor />
        </TabsContent>
        <TabsContent value="resources" className="mt-6">
          <ResourcesTranslateList />
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
          <DocumentUploadsList />
        </TabsContent>
        <TabsContent value="training" className="mt-6">
          <TrainingDocsEditor />
        </TabsContent>
        <TabsContent value="volunteers" className="mt-6">
          <VolunteerSignupsList />
        </TabsContent>
        <TabsContent value="languages" className="mt-6">
          <LanguagesEditor />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CrudTable({ title, rows, head }: { title: string; rows: (string | number)[][]; head: string[] }) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-primary-deep">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-warm">
            <tr>{head.map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>)}<th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => <td key={j} className="px-4 py-2">{c}</td>)}
                <td className="px-4 py-2 text-right"><Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="surface-card p-8 text-center">
      <h2 className="font-semibold text-primary-deep">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </section>
  );
}
