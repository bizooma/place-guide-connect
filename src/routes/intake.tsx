import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { sendIntakeSubmission } from "@/lib/intake.functions";


export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Job Intake Form — The PLACE" },
      {
        name: "description",
        content:
          "Employment application and job search intake form for The PLACE community center.",
      },
    ],
  }),
  component: IntakePage,
});

type EmployerBlock = {
  company: string;
  jobTitle: string;
  supervisor: string;
  address: string;
  phone: string;
  startDate: string;
  endDate: string;
  startingPay: string;
  endingPay: string;
  duties: string;
  reasonForLeaving: string;
};

type ReferenceBlock = {
  name: string;
  relationship: string;
  company: string;
  phone: string;
  email: string;
};

const emptyEmployer: EmployerBlock = {
  company: "",
  jobTitle: "",
  supervisor: "",
  address: "",
  phone: "",
  startDate: "",
  endDate: "",
  startingPay: "",
  endingPay: "",
  duties: "",
  reasonForLeaving: "",
};

const emptyReference: ReferenceBlock = {
  name: "",
  relationship: "",
  company: "",
  phone: "",
  email: "",
};

const initialState = {
  // Applicant
  fullLegalName: "",
  preferredName: "",
  dateOfBirth: "",
  ssn: "",
  // Contact
  street: "",
  city: "",
  state: "",
  zip: "",
  county: "",
  primaryPhone: "",
  alternatePhone: "",
  email: "",
  preferredContact: "",
  // Eligibility
  authorizedToWork: "",
  needsSponsorship: "",
  atLeast18: "",
  // Position preferences
  desiredJobTitles: "",
  employmentType: "",
  preferredShifts: [] as string[],
  desiredPay: "",
  earliestStartDate: "",
  // Employment history
  employer1: { ...emptyEmployer },
  employer2: { ...emptyEmployer },
  employer3: { ...emptyEmployer },
  // Education
  highestEducation: "",
  schoolName: "",
  schoolCityState: "",
  degree: "",
  fieldOfStudy: "",
  graduationDate: "",
  // Cert
  certName: "",
  certIssuer: "",
  certNumber: "",
  certExpiration: "",
  // Skills
  languages: "",
  computerSkills: "",
  machinerySkills: "",
  otherSkills: "",
  // References
  reference1: { ...emptyReference },
  reference2: { ...emptyReference },
  reference3: { ...emptyReference },
  // Availability
  daysAvailable: "",
  hoursAvailable: "",
  willingOvertime: "",
  willingWeekends: "",
  // Transportation
  reliableTransportation: "",
  // Criminal history
  hasConviction: "",
  convictionExplanation: "",
  // EEO
  sex: "",
  ethnicity: "",
  races: [] as string[],
  // Emergency contact
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
};

type FormState = typeof initialState;

const SHIFTS = ["Day", "Evening", "Night", "Rotating", "Flexible"];
const RACES = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or More Races",
  "Prefer Not to Say",
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl text-primary-deep">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function YesNo({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="flex gap-6">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="yes" id={`${name}-yes`} />
        <Label htmlFor={`${name}-yes`} className="font-normal">Yes</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="no" id={`${name}-no`} />
        <Label htmlFor={`${name}-no`} className="font-normal">No</Label>
      </div>
    </RadioGroup>
  );
}

function EmployerSection({
  index,
  value,
  onChange,
}: {
  index: number;
  value: EmployerBlock;
  onChange: (next: EmployerBlock) => void;
}) {
  const prefix = `employer${index}`;
  const set = <K extends keyof EmployerBlock>(k: K, v: EmployerBlock[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <Section title={`Employer #${index}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={`${prefix}-company`} label="Company name">
          <Input id={`${prefix}-company`} value={value.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field id={`${prefix}-title`} label="Job title">
          <Input id={`${prefix}-title`} value={value.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </Field>
        <Field id={`${prefix}-supervisor`} label="Supervisor name & title" className="md:col-span-2">
          <Input id={`${prefix}-supervisor`} value={value.supervisor} onChange={(e) => set("supervisor", e.target.value)} />
        </Field>
        <Field id={`${prefix}-address`} label="Company address" className="md:col-span-2">
          <Input id={`${prefix}-address`} value={value.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field id={`${prefix}-phone`} label="Phone number">
          <Input id={`${prefix}-phone`} type="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <div className="hidden md:block" />
        <Field id={`${prefix}-start`} label="Start date">
          <Input id={`${prefix}-start`} type="date" value={value.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field id={`${prefix}-end`} label="End date">
          <Input id={`${prefix}-end`} type="date" value={value.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
        <Field id={`${prefix}-startPay`} label="Starting pay">
          <Input id={`${prefix}-startPay`} value={value.startingPay} onChange={(e) => set("startingPay", e.target.value)} />
        </Field>
        <Field id={`${prefix}-endPay`} label="Ending pay">
          <Input id={`${prefix}-endPay`} value={value.endingPay} onChange={(e) => set("endingPay", e.target.value)} />
        </Field>
        <Field id={`${prefix}-duties`} label="Job duties & responsibilities" className="md:col-span-2">
          <Textarea id={`${prefix}-duties`} rows={3} value={value.duties} onChange={(e) => set("duties", e.target.value)} />
        </Field>
        <Field id={`${prefix}-reason`} label="Reason for leaving" className="md:col-span-2">
          <Textarea id={`${prefix}-reason`} rows={2} value={value.reasonForLeaving} onChange={(e) => set("reasonForLeaving", e.target.value)} />
        </Field>
      </div>
    </Section>
  );
}

function ReferenceSection({
  index,
  value,
  onChange,
}: {
  index: number;
  value: ReferenceBlock;
  onChange: (next: ReferenceBlock) => void;
}) {
  const prefix = `ref${index}`;
  const set = <K extends keyof ReferenceBlock>(k: K, v: ReferenceBlock[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-display text-lg text-primary-deep">Reference #{index}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={`${prefix}-name`} label="Name">
          <Input id={`${prefix}-name`} value={value.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field id={`${prefix}-rel`} label="Relationship">
          <Input id={`${prefix}-rel`} value={value.relationship} onChange={(e) => set("relationship", e.target.value)} />
        </Field>
        <Field id={`${prefix}-company`} label="Company">
          <Input id={`${prefix}-company`} value={value.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field id={`${prefix}-phone`} label="Phone number">
          <Input id={`${prefix}-phone`} type="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field id={`${prefix}-email`} label="Email address" className="md:col-span-2">
          <Input id={`${prefix}-email`} type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function IntakePage() {
  const [form, setForm] = useState<FormState>(initialState);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleArray(key: "preferredShifts" | "races", value: string) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  const sendIntake = useServerFn(sendIntakeSubmission);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const t = toast.loading("Submitting your application…");
    try {
      await sendIntake({ data: { submission: form as unknown as Record<string, unknown> } });
      toast.success("Application submitted. Thank you!", { id: t });
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.", {
        id: t,
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        <header className="mb-8 space-y-2">
          <h1 className="font-display text-3xl text-primary-deep md:text-4xl">
            Friends, please fill out this form so we can best serve your needs.
          </h1>
          <p className="text-muted-foreground">
            Please complete the form below. All sections help our team match you with the right opportunity.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Applicant Information">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="fullLegalName" label="Full legal name">
                <Input id="fullLegalName" value={form.fullLegalName} onChange={(e) => update("fullLegalName", e.target.value)} />
              </Field>
              <Field id="preferredName" label="Preferred name (if different)">
                <Input id="preferredName" value={form.preferredName} onChange={(e) => update("preferredName", e.target.value)} />
              </Field>
              <Field id="dob" label="Date of birth">
                <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
              </Field>
              <Field id="ssn" label="Social Security Number">
                <Input id="ssn" value={form.ssn} onChange={(e) => update("ssn", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Contact Information">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="street" label="Street address" className="md:col-span-2">
                <Input id="street" value={form.street} onChange={(e) => update("street", e.target.value)} />
              </Field>
              <Field id="city" label="City">
                <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field id="state" label="State">
                <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} />
              </Field>
              <Field id="zip" label="ZIP code">
                <Input id="zip" value={form.zip} onChange={(e) => update("zip", e.target.value)} />
              </Field>
              <Field id="county" label="County (optional)">
                <Input id="county" value={form.county} onChange={(e) => update("county", e.target.value)} />
              </Field>
              <Field id="primaryPhone" label="Primary phone number">
                <Input id="primaryPhone" type="tel" value={form.primaryPhone} onChange={(e) => update("primaryPhone", e.target.value)} />
              </Field>
              <Field id="altPhone" label="Alternate phone number">
                <Input id="altPhone" type="tel" value={form.alternatePhone} onChange={(e) => update("alternatePhone", e.target.value)} />
              </Field>
              <Field id="email" label="Email address">
                <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
              <Field id="preferredContact" label="Preferred method of contact">
                <RadioGroup
                  value={form.preferredContact}
                  onValueChange={(v) => update("preferredContact", v)}
                  className="flex flex-wrap gap-4 pt-1"
                >
                  {["Phone", "Email", "Text"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`contact-${opt}`} />
                      <Label htmlFor={`contact-${opt}`} className="font-normal">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
            </div>
          </Section>

          <Section title="Employment Eligibility">
            <Field id="authorized" label="Are you legally authorized to work in the United States?">
              <YesNo name="authorized" value={form.authorizedToWork} onChange={(v) => update("authorizedToWork", v)} />
            </Field>
            <Field id="sponsorship" label="Will you now or in the future require employer sponsorship for work authorization?">
              <YesNo name="sponsorship" value={form.needsSponsorship} onChange={(v) => update("needsSponsorship", v)} />
            </Field>
            <Field id="age18" label="Are you at least 18 years old?">
              <YesNo name="age18" value={form.atLeast18} onChange={(v) => update("atLeast18", v)} />
            </Field>
          </Section>

          <Section title="Position Preferences">
            <Field id="desiredJobTitles" label="Desired job title(s)">
              <Input id="desiredJobTitles" value={form.desiredJobTitles} onChange={(e) => update("desiredJobTitles", e.target.value)} />
            </Field>
            <Field id="employmentType" label="Type of employment sought">
              <RadioGroup
                value={form.employmentType}
                onValueChange={(v) => update("employmentType", v)}
                className="flex flex-wrap gap-4"
              >
                {["Full-Time", "Part-Time", "Temporary", "Contract"].map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`emp-${opt}`} />
                    <Label htmlFor={`emp-${opt}`} className="font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </Field>
            <Field id="shifts" label="Preferred shift(s)">
              <div className="flex flex-wrap gap-4">
                {SHIFTS.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <Checkbox
                      id={`shift-${s}`}
                      checked={form.preferredShifts.includes(s)}
                      onCheckedChange={() => toggleArray("preferredShifts", s)}
                    />
                    <Label htmlFor={`shift-${s}`} className="font-normal">{s}</Label>
                  </div>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="pay" label="Desired pay range (hourly or salary)">
                <Input id="pay" value={form.desiredPay} onChange={(e) => update("desiredPay", e.target.value)} />
              </Field>
              <Field id="start" label="Earliest available start date">
                <Input id="start" type="date" value={form.earliestStartDate} onChange={(e) => update("earliestStartDate", e.target.value)} />
              </Field>
            </div>
          </Section>

          <div className="space-y-2">
            <h2 className="font-display text-2xl text-primary-deep">Employment History</h2>
            <p className="text-sm text-muted-foreground">Past 7 years — most recent positions first.</p>
          </div>
          <EmployerSection index={1} value={form.employer1} onChange={(v) => update("employer1", v)} />
          <EmployerSection index={2} value={form.employer2} onChange={(v) => update("employer2", v)} />
          <EmployerSection index={3} value={form.employer3} onChange={(v) => update("employer3", v)} />

          <Section title="Education & Training">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="highestEd" label="Highest level of education completed" className="md:col-span-2">
                <Input id="highestEd" value={form.highestEducation} onChange={(e) => update("highestEducation", e.target.value)} />
              </Field>
              <Field id="schoolName" label="School name">
                <Input id="schoolName" value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} />
              </Field>
              <Field id="schoolCityState" label="City & state">
                <Input id="schoolCityState" value={form.schoolCityState} onChange={(e) => update("schoolCityState", e.target.value)} />
              </Field>
              <Field id="degree" label="Degree / diploma / certificate earned">
                <Input id="degree" value={form.degree} onChange={(e) => update("degree", e.target.value)} />
              </Field>
              <Field id="field" label="Field of study">
                <Input id="field" value={form.fieldOfStudy} onChange={(e) => update("fieldOfStudy", e.target.value)} />
              </Field>
              <Field id="gradDate" label="Graduation date (or expected)">
                <Input id="gradDate" type="date" value={form.graduationDate} onChange={(e) => update("graduationDate", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Additional Training, Certifications, or Licenses">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="certName" label="Certification / license name">
                <Input id="certName" value={form.certName} onChange={(e) => update("certName", e.target.value)} />
              </Field>
              <Field id="certIssuer" label="Issuing organization">
                <Input id="certIssuer" value={form.certIssuer} onChange={(e) => update("certIssuer", e.target.value)} />
              </Field>
              <Field id="certNumber" label="License / certificate number (if applicable)">
                <Input id="certNumber" value={form.certNumber} onChange={(e) => update("certNumber", e.target.value)} />
              </Field>
              <Field id="certExp" label="Expiration date">
                <Input id="certExp" type="date" value={form.certExpiration} onChange={(e) => update("certExpiration", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Skills & Qualifications">
            <Field id="languages" label="Languages spoken (and proficiency level)">
              <Textarea id="languages" rows={2} value={form.languages} onChange={(e) => update("languages", e.target.value)} />
            </Field>
            <Field id="computerSkills" label="Computer / technical skills">
              <Textarea id="computerSkills" rows={2} value={form.computerSkills} onChange={(e) => update("computerSkills", e.target.value)} />
            </Field>
            <Field id="machinery" label="Machinery or equipment experience">
              <Textarea id="machinery" rows={2} value={form.machinerySkills} onChange={(e) => update("machinerySkills", e.target.value)} />
            </Field>
            <Field id="otherSkills" label="Other relevant skills">
              <Textarea id="otherSkills" rows={2} value={form.otherSkills} onChange={(e) => update("otherSkills", e.target.value)} />
            </Field>
          </Section>

          <Section title="References" description="Three references required.">
            <ReferenceSection index={1} value={form.reference1} onChange={(v) => update("reference1", v)} />
            <ReferenceSection index={2} value={form.reference2} onChange={(v) => update("reference2", v)} />
            <ReferenceSection index={3} value={form.reference3} onChange={(v) => update("reference3", v)} />
          </Section>

          <Section title="Availability">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="daysAvail" label="Days available to work">
                <Input id="daysAvail" value={form.daysAvailable} onChange={(e) => update("daysAvailable", e.target.value)} />
              </Field>
              <Field id="hoursAvail" label="Hours available">
                <Input id="hoursAvail" value={form.hoursAvailable} onChange={(e) => update("hoursAvailable", e.target.value)} />
              </Field>
            </div>
            <Field id="overtime" label="Willing to work overtime?">
              <YesNo name="overtime" value={form.willingOvertime} onChange={(v) => update("willingOvertime", v)} />
            </Field>
            <Field id="weekends" label="Willing to work weekends?">
              <YesNo name="weekends" value={form.willingWeekends} onChange={(v) => update("willingWeekends", v)} />
            </Field>
          </Section>

          <Section title="Transportation">
            <Field id="transport" label="Do you have reliable transportation to and from work?">
              <YesNo name="transport" value={form.reliableTransportation} onChange={(v) => update("reliableTransportation", v)} />
            </Field>
          </Section>

          <Section
            title="Criminal History"
            description="Optional / when job-related. Convictions will not automatically disqualify you."
          >
            <Field id="conviction" label="Have you ever been convicted of a felony or misdemeanor that has not been sealed or expunged?">
              <YesNo name="conviction" value={form.hasConviction} onChange={(v) => update("hasConviction", v)} />
            </Field>
            <Field id="convictionExp" label="If yes, please explain">
              <Textarea id="convictionExp" rows={3} value={form.convictionExplanation} onChange={(e) => update("convictionExplanation", e.target.value)} />
            </Field>
          </Section>

          <Section
            title="Voluntary Self-Identification (EEO)"
            description="Completion of this section is voluntary and will not affect employment opportunities."
          >
            <Field id="sex" label="Sex">
              <RadioGroup
                value={form.sex}
                onValueChange={(v) => update("sex", v)}
                className="flex flex-wrap gap-4"
              >
                {["Male", "Female", "Non-Binary", "Prefer Not to Say"].map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`sex-${opt}`} />
                    <Label htmlFor={`sex-${opt}`} className="font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </Field>
            <Field id="ethnicity" label="Ethnicity">
              <RadioGroup
                value={form.ethnicity}
                onValueChange={(v) => update("ethnicity", v)}
                className="flex flex-wrap gap-4"
              >
                {["Hispanic or Latino", "Not Hispanic or Latino", "Prefer Not to Say"].map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`eth-${opt}`} />
                    <Label htmlFor={`eth-${opt}`} className="font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </Field>
            <Field id="race" label="Race (check all that apply)">
              <div className="grid gap-2 md:grid-cols-2">
                {RACES.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox
                      id={`race-${r}`}
                      checked={form.races.includes(r)}
                      onCheckedChange={() => toggleArray("races", r)}
                    />
                    <Label htmlFor={`race-${r}`} className="font-normal">{r}</Label>
                  </div>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Emergency Contact">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="emName" label="Name">
                <Input id="emName" value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} />
              </Field>
              <Field id="emRel" label="Relationship">
                <Input id="emRel" value={form.emergencyRelationship} onChange={(e) => update("emergencyRelationship", e.target.value)} />
              </Field>
              <Field id="emPhone" label="Phone number" className="md:col-span-2">
                <Input id="emPhone" type="tel" value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="rounded-full bg-primary text-primary-foreground hover:opacity-90"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
