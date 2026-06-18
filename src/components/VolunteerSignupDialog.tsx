import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(200),
  email: z.string().trim().email("Please enter a valid email").max(320),
  phone: z.string().trim().min(3, "Please enter your phone number").max(50),
  availability: z
    .string()
    .trim()
    .min(1, "Tell us when you can volunteer")
    .max(2000),
});

export function VolunteerSignupDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", availability: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("volunteer_signups").insert(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit", { description: error.message });
      return;
    }
    toast.success("Thank you for volunteering!", {
      description: "We'll be in touch soon.",
    });
    setForm({ name: "", email: "", phone: "", availability: "" });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary-deep">
            Become a Volunteer
          </DialogTitle>
          <DialogDescription>
            Share your info and we&apos;ll reach out to match you with an opportunity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vs-name">Full name</Label>
            <Input
              id="vs-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoComplete="name"
              maxLength={200}
              required
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vs-email">Email</Label>
            <Input
              id="vs-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
              maxLength={320}
              required
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vs-phone">Phone number</Label>
            <Input
              id="vs-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              autoComplete="tel"
              maxLength={50}
              required
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vs-availability">When can you volunteer?</Label>
            <Textarea
              id="vs-availability"
              value={form.availability}
              onChange={(e) => update("availability", e.target.value)}
              placeholder="e.g. Tuesday & Thursday evenings, Saturday mornings"
              rows={3}
              maxLength={2000}
              required
            />
            {errors.availability && (
              <p className="text-xs text-destructive">{errors.availability}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-primary text-primary-foreground hover:opacity-90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
