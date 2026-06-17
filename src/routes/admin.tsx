import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Shield, Users, FileText, CalendarDays, BookOpen, Languages as LangIcon, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { triageCategories, scheduleItems, resources, SUPPORTED_LANGUAGES_LIST } from "@/data/adminSeed";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — The PLACE Online" },
      { name: "description", content: "Admin dashboard for managing triage choices, schedule, resources, and settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  // Placeholder gate. Real auth wires through Supabase later.
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="surface-card p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-primary-deep">Admin sign in</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Connect Supabase to enable real authentication. This is a preview view.</p>
          <form onSubmit={(e) => { e.preventDefault(); setSignedIn(true); }} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 mt-1" required />
            </div>
            <div>
              <Label htmlFor="pwd">Password</Label>
              <Input id="pwd" type="password" className="h-11 mt-1" required />
            </div>
            <Button type="submit" className="w-full h-11 rounded-full bg-primary hover:bg-primary-deep">Sign in</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary-deep">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Preview only — data is read-only until Supabase is connected.</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setSignedIn(false)}>Sign out</Button>
      </header>

      <Tabs defaultValue="triage" className="mt-8">
        <TabsList className="flex flex-wrap h-auto bg-warm border border-border rounded-full p-1">
          <TabsTrigger value="triage" className="gap-1.5 rounded-full"><FileText className="h-4 w-4" />Help choices</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 rounded-full"><CalendarDays className="h-4 w-4" />Schedule</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 rounded-full"><BookOpen className="h-4 w-4" />Resources</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 rounded-full"><Users className="h-4 w-4" />Requests</TabsTrigger>
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
          <CrudTable
            title="Schedule items"
            rows={scheduleItems.map((s) => [s.title, s.category, `${s.day} ${s.startTime}`, s.location])}
            head={["Title", "Category", "When", "Location"]}
          />
        </TabsContent>
        <TabsContent value="resources" className="mt-6">
          <CrudTable
            title="Resources"
            rows={resources.map((r) => [r.name, r.category, r.phone ?? "—", r.languages.join(", ")])}
            head={["Name", "Category", "Phone", "Languages"]}
          />
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
          <EmptyState title="Document uploads" desc="Anonymous document uploads are stored in the Supabase 'document-uploads' bucket and the 'document_uploads' table. Review them from your Supabase dashboard." />
        </TabsContent>
        <TabsContent value="languages" className="mt-6">
          <CrudTable
            title="Languages"
            rows={SUPPORTED_LANGUAGES_LIST.map((l) => [l.code, l.name, l.nativeName, l.active ? "Active" : "Inactive"])}
            head={["Code", "Name", "Native name", "Status"]}
          />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <div className="surface-card p-6 space-y-5">
            <h2 className="font-display text-xl font-semibold text-primary-deep">Global settings</h2>
            <div>
              <Label>Homepage alert / banner</Label>
              <Input className="mt-1 h-11" placeholder="Optional message shown at the top of the homepage" />
            </div>
            <div>
              <Label>Global disclaimer text</Label>
              <Input className="mt-1 h-11" defaultValue="The PLACE Online does not replace legal, medical, financial, or government advice." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Document retention (days)</Label>
                <Input className="mt-1 h-11" type="number" defaultValue={30} />
              </div>
              <div>
                <Label>Default language</Label>
                <Input className="mt-1 h-11" defaultValue="en" />
              </div>
            </div>
            <Button className="rounded-full bg-primary hover:bg-primary-deep">Save (preview)</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CrudTable({ title, head, rows }: { title: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
        <h2 className="font-display text-xl font-semibold text-primary-deep">{title}</h2>
        <Button size="sm" className="rounded-full bg-primary hover:bg-primary-deep gap-1.5"><Plus className="h-4 w-4" />Add</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{head.map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}<th className="px-5 py-3" /></tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((c, j) => <td key={j} className="px-5 py-3">{c}</td>)}
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" className="gap-1"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="surface-card p-10 text-center">
      <h2 className="font-display text-xl font-semibold text-primary-deep">{title}</h2>
      <p className="mt-2 text-muted-foreground">{desc}</p>
    </div>
  );
}
