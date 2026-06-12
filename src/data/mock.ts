/**
 * Mock data layer. Mirrors the future Supabase schema so swapping to
 * real queries means changing the data source, not call sites.
 *
 * Tables to create when Supabase is connected:
 *   triage_categories, triage_questions, schedule_items,
 *   resources, resource_categories, languages, app_settings.
 */

export interface TriageCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string; // lucide name
  order: number;
  active: boolean;
}

export const triageCategories: TriageCategory[] = [
  { id: "1", slug: "bill", title: "Pay a bill", description: "Understand what you owe and explore options.", icon: "Receipt", order: 1, active: true },
  { id: "2", slug: "job", title: "Find a job", description: "Get help with applications, resumes, and work search.", icon: "Briefcase", order: 2, active: true },
  { id: "3", slug: "document", title: "What does this document mean?", description: "Upload a letter, form, or photo to get a plain-English explanation.", icon: "FileText", order: 3, active: true },
  { id: "4", slug: "english", title: "Learn English", description: "Find classes and practice that fit your level.", icon: "Languages", order: 4, active: true },
  { id: "5", slug: "needs", title: "Find food, housing, or transportation help", description: "Local programs and community resources.", icon: "HeartHandshake", order: 5, active: true },
  { id: "6", slug: "unsure", title: "I'm not sure", description: "That's okay. We'll ask a few simple questions.", icon: "HelpCircle", order: 6, active: true },
];

export interface ScheduleItem {
  id: string;
  title: string;
  category: string;
  day: string; // human label
  date: string; // ISO
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  language: string;
  registrationRequired: boolean;
}

const today = new Date();
const addDays = (n: number) => new Date(today.getTime() + n * 86400000).toISOString().slice(0, 10);

export const scheduleItems: ScheduleItem[] = [
  { id: "s1", title: "Beginner English Class", category: "English Language Classes", day: "Monday", date: addDays(0), startTime: "10:00 AM", endTime: "11:30 AM", location: "The PLACE — Room A", description: "Basic conversation, reading, and writing for new learners.", language: "English", registrationRequired: false },
  { id: "s2", title: "Resume & Job Help Drop-in", category: "Job Help", day: "Tuesday", date: addDays(1), startTime: "1:00 PM", endTime: "3:00 PM", location: "The PLACE — Computer Lab", description: "Get help writing or updating your resume and applying online.", language: "English", registrationRequired: false },
  { id: "s3", title: "Document Help Hour", category: "Document Help", day: "Wednesday", date: addDays(2), startTime: "2:00 PM", endTime: "4:00 PM", location: "The PLACE — Front Desk", description: "Bring any letter or form you don't understand.", language: "English", registrationRequired: false },
  { id: "s4", title: "Intermediate English Class", category: "English Language Classes", day: "Thursday", date: addDays(3), startTime: "10:00 AM", endTime: "11:30 AM", location: "The PLACE — Room A", description: "Build conversation confidence and grammar.", language: "English", registrationRequired: true },
  { id: "s5", title: "Cooking on a Budget", category: "Life Skills Classes", day: "Friday", date: addDays(4), startTime: "11:00 AM", endTime: "12:30 PM", location: "The PLACE — Kitchen", description: "Easy recipes that stretch your grocery budget.", language: "English", registrationRequired: true },
  { id: "s6", title: "Community Welcome Lunch", category: "Community Events", day: "Saturday", date: addDays(5), startTime: "12:00 PM", endTime: "2:00 PM", location: "The PLACE — Main Hall", description: "Free lunch, meet neighbors and learn about services.", language: "English", registrationRequired: false },
];

export const scheduleCategories = [
  "All",
  "English Language Classes",
  "Life Skills Classes",
  "Job Help",
  "Document Help",
  "Community Events",
  "Volunteer Opportunities",
];

export interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  phone?: string;
  website?: string;
  address?: string;
  languages: string[];
  hours?: string;
  eligibility?: string;
  cost: "Free" | "Low cost" | "Varies" | "Unknown";
  tags: string[];
}

export const resourceCategories = [
  "Food",
  "Housing",
  "Jobs",
  "Transportation",
  "Health",
  "Legal Help",
  "Immigration Help",
  "Education",
  "English Classes",
  "Child and Family Support",
  "Emergency Help",
  "Government Services",
  "Other Community Resources",
];

export const resources: Resource[] = [
  { id: "r1", name: "High Plains Food Bank", category: "Food", description: "Free groceries and meal programs for families in need.", phone: "(806) 555-0100", website: "https://example.org", address: "815 Ross St, Amarillo, TX", languages: ["English", "Spanish"], hours: "Mon–Fri 9am–5pm", cost: "Free", tags: ["pantry", "groceries"] },
  { id: "r2", name: "Amarillo Housing Assistance", category: "Housing", description: "Help with rent, utilities, and finding stable housing.", phone: "(806) 555-0200", website: "https://example.org", address: "Amarillo, TX", languages: ["English"], cost: "Free", tags: ["rent", "utilities"], eligibility: "Income-based" },
  { id: "r3", name: "Workforce Solutions Panhandle", category: "Jobs", description: "Free job search, resume help, and training.", phone: "(806) 555-0300", website: "https://example.org", languages: ["English", "Spanish"], cost: "Free", tags: ["resume", "training"] },
  { id: "r4", name: "Refugee Services of Texas", category: "Immigration Help", description: "Support for refugees and new immigrants.", phone: "(806) 555-0400", website: "https://example.org", languages: ["English", "Spanish", "Arabic"], cost: "Free", tags: ["refugee", "newcomer"] },
  { id: "r5", name: "Amarillo City Transit", category: "Transportation", description: "Bus routes and discounted passes.", phone: "(806) 555-0500", website: "https://example.org", languages: ["English"], cost: "Low cost", tags: ["bus"] },
  { id: "r6", name: "Legal Aid of NorthWest Texas", category: "Legal Help", description: "Free civil legal help for low-income residents.", phone: "(806) 555-0600", website: "https://example.org", languages: ["English", "Spanish"], cost: "Free", tags: ["legal"], eligibility: "Income-based" },
  { id: "r7", name: "Texas Health & Human Services", category: "Government Services", description: "SNAP, Medicaid, and other state benefits.", phone: "211", website: "https://example.org", languages: ["English", "Spanish"], cost: "Free", tags: ["benefits", "snap"] },
];

// Guided question flows per triage slug.
export interface TriageFlow {
  intro: string;
  questions: { id: string; label: string; type: "text" | "choice"; options?: string[] }[];
  summary: (answers: Record<string, string>) => { summary: string; nextSteps: string[]; relatedTags: string[] };
}

export const triageFlows: Record<string, TriageFlow> = {
  bill: {
    intro: "Tell us a little about the bill. We'll explain what it usually means and what you can do.",
    questions: [
      { id: "kind", label: "What kind of bill is it?", type: "choice", options: ["Electric or gas", "Water", "Rent", "Phone or internet", "Medical", "Other"] },
      { id: "amount", label: "About how much is the bill?", type: "text" },
      { id: "due", label: "When is it due? (You can guess if you're not sure)", type: "text" },
    ],
    summary: (a) => ({
      summary: `It sounds like you have a ${a.kind ?? "bill"} for about ${a.amount ?? "an unknown amount"}, due ${a.due ?? "soon"}.`,
      nextSteps: [
        "Bring the bill to The PLACE during Document Help Hour and we can review it together.",
        "If you can't pay the full amount, many companies will accept a smaller payment if you call them.",
        "Ask about hardship or assistance programs — many utilities and hospitals have them.",
      ],
      relatedTags: ["utilities", "rent", "benefits"],
    }),
  },
  job: {
    intro: "A few quick questions so we can point you to the right help.",
    questions: [
      { id: "experience", label: "What kind of work have you done before?", type: "text" },
      { id: "english", label: "How comfortable are you reading English?", type: "choice", options: ["Beginner", "Some", "Comfortable"] },
      { id: "transport", label: "Do you have a way to get to work?", type: "choice", options: ["Yes", "Sometimes", "No"] },
    ],
    summary: (a) => ({
      summary: `Based on your answers, we can connect you with job help that fits your English level (${a.english ?? "unspecified"}) and transportation (${a.transport ?? "unspecified"}).`,
      nextSteps: [
        "Visit the Resume & Job Help Drop-in this week.",
        "Workforce Solutions Panhandle offers free training and job placement.",
        "Bring a photo ID and any past work history you can remember.",
      ],
      relatedTags: ["resume", "training", "bus"],
    }),
  },
  document: {
    intro: "Use the Document Helper to upload or photograph a document. We'll explain it in plain English.",
    questions: [],
    summary: () => ({ summary: "", nextSteps: [], relatedTags: [] }),
  },
  english: {
    intro: "Tell us about your English level so we can suggest the right class.",
    questions: [
      { id: "level", label: "How would you describe your English right now?", type: "choice", options: ["Just starting", "I know some words", "I can have a basic conversation", "I want to improve writing"] },
      { id: "when", label: "When is best for classes?", type: "choice", options: ["Mornings", "Afternoons", "Evenings", "Weekends"] },
    ],
    summary: (a) => ({
      summary: `We recommend ${a.level === "Just starting" ? "the Beginner English Class" : "the Intermediate English Class"} that meets in the ${a.when?.toLowerCase() ?? "morning"}.`,
      nextSteps: ["Check the Schedule page for class times.", "Walk in — most classes do not require registration.", "Bring a notebook and pen."],
      relatedTags: ["english"],
    }),
  },
  needs: {
    intro: "What kind of help do you need most right now?",
    questions: [
      { id: "kind", label: "Pick what's closest", type: "choice", options: ["Food", "A place to stay", "Help getting around", "Clothing or household items", "Something else"] },
    ],
    summary: (a) => ({
      summary: `We have community partners that can help with ${a.kind ?? "your needs"}.`,
      nextSteps: ["See the Resources page and filter by category.", "Call 2-1-1 in Texas for 24/7 help finding services.", "Visit The PLACE in person and we'll walk you through options."],
      relatedTags: ["pantry", "rent", "bus"],
    }),
  },
  unsure: {
    intro: "That's okay — most people start here. A few questions will help.",
    questions: [
      { id: "urgent", label: "Is this urgent today?", type: "choice", options: ["Yes, today", "This week", "Not urgent"] },
      { id: "area", label: "What part of life is this about?", type: "choice", options: ["Money", "Family", "Work", "Health", "Paperwork", "Something else"] },
    ],
    summary: (a) => ({
      summary: `We hear you. ${a.urgent === "Yes, today" ? "Because this is urgent, we recommend calling The PLACE or 2-1-1 right away." : "Here are some places to start."}`,
      nextSteps: ["Call The PLACE during open hours.", "Browse Resources to see what's available.", "Come by in person — a staff member can sit with you."],
      relatedTags: ["benefits", "newcomer"],
    }),
  },
};
