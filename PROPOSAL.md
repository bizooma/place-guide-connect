# The PLACE — Website Proposal

## 1. Overview

The PLACE website is a multilingual community information hub designed to make it easy for community members to get answers, understand documents, find resources, and connect with the organization in their own language. It pairs a friendly public-facing experience with a staff-only admin dashboard so The PLACE's team can manage everything — content, languages, schedule, volunteers, and incoming document requests — without needing a developer.

At its core, the site combines:

- An **AI chatbot** that answers questions about The PLACE in any supported language.
- A **document helper** where visitors upload a letter, notice, or form and get a plain-language explanation.
- A **resource directory, schedule, donation page, and volunteer signup** for day-to-day community use.
- A complete **admin dashboard** for staff to manage content and review what the community is asking for.

---

## 2. Public-Facing Features

### Home page
- Clean, welcoming landing page with The PLACE's branding.
- The AI chatbot is front-and-center so visitors can get help immediately.
- Clear paths to all other sections of the site (Resources, Schedule, Donate, Help with a Document, About).

### Ask The PLACE — AI Chatbot
- Conversational question-and-answer experience grounded in content curated by staff.
- Suggested starter questions so visitors know what they can ask.
- **Voice input** — visitors can tap a microphone button and speak their question instead of typing.
- **Read-aloud** — the bot's answers can be played back as audio for visitors who prefer listening or have low literacy in the selected language.
- Responds in whatever language the visitor has selected.

### Multilingual support
- Language selector available throughout the site.
- Supported languages include English, Spanish, Arabic, Farsi, Pashto, and Somali, with additional expandable language slots that staff can configure.
- When a visitor picks a language, the **entire UI translates** — navigation, buttons, chatbot panel copy, page content, and dynamic content all swap.
- Translations are cached per language so repeat visits are instant.
- Right-to-left languages (Arabic, Farsi, Pashto) display correctly.

### Help with a Document
- A visitor uploads a document — a letter from a landlord, a school notice, a government form, a medical bill, etc.
- The AI reads the document and returns a **plain-language summary and explanation** in the visitor's chosen language.
- The visitor can **delete the document** if they decide they don't want it kept.
- Every upload is queued in the admin dashboard so staff can see what the community is asking about and follow up directly when needed.

### Resources directory
- Browseable, categorized list of community resources (food, housing, legal help, education, health, etc.).
- Each resource is translatable, so it appears in the visitor's chosen language.

### Schedule
- Public view of classes, programs, and events offered by The PLACE.
- Managed by staff from the admin dashboard.

### Donate
- Dedicated donation page with a gallery of community impact images.
- Clear guidance on how to give and why it matters.

### Volunteer signup
- Visitors can sign up to volunteer via a simple form.
- Their submission is captured and shown to staff in the admin dashboard for follow-up.

### Standard pages
- About — the organization's story and mission.
- Privacy and Terms — published for transparency and compliance.

### Mobile & installable app
- Fully responsive — works on phone, tablet, and desktop.
- **Mobile bottom navigation** for one-thumb use on phones.
- **Install as an app (PWA)** — visitors can add the site to their home screen and launch it like a native app.
- **Offline fallback** — if a visitor loses connection, they see a graceful offline page instead of a browser error.

### Accessibility
- Read-aloud audio for chatbot answers.
- Voice input for typing-averse or low-literacy users.
- Large tap targets and mobile-first layout.
- Semantic structure so screen readers work properly.

---

## 3. Admin Dashboard (Staff Only)

The admin area is protected by staff login. Once signed in, staff have a full set of tools to run the site without writing code.

### Authentication
- Secure staff sign-in.
- Per-staff profile page.

### Document uploads review
- A list of every document a visitor has uploaded through the "Help with a Document" tool.
- Filter and refresh controls.
- **Archive** any document to hide it from the active list.
- **"View archived" toggle** to review previously archived documents, and switch back to the active view at any time.
- A pending-uploads indicator so staff can see at a glance how many new submissions are waiting.

### Resources editor
- Add, edit, and remove resource entries.
- Organize them by category.

### Resources translation manager
- Review and manage the translated versions of resources to make sure they read well in every supported language.

### Schedule editor
- Manage class and program schedule entries that appear on the public Schedule page.

### Triage categories editor
- Manage the categories used to organize and route content (e.g. for documents and resources).

### Training documents editor
- Manage the **knowledge base** that the AI chatbot draws from when answering questions.
- Add, update, or remove training content so the bot's answers stay accurate as programs and policies change.

### Languages editor
- Enable, disable, or configure the languages offered across the site.

### Settings editor
- Site-wide configuration options in one place.

### Volunteer signups list
- Review everyone who has signed up to volunteer, so staff can follow up.

---

## 4. AI Capabilities (What the AI Actually Does for Users)

- **Answers questions** about The PLACE using the staff-curated knowledge base.
- **Translates the entire UI** on demand into any supported language.
- **Reads and explains uploaded documents** in plain language, in the visitor's chosen language.
- **Speaks answers aloud** (text-to-speech) for accessibility.
- **Listens to spoken questions** (speech-to-text) so visitors can talk instead of type.

---

## 5. Content & Data Management

- All chatbot knowledge, resources, schedule, categories, languages, and settings are **editable by staff** — no developer required for ongoing content changes.
- Visitor document uploads are **stored centrally** so staff can see what the community is asking about, spot trends, and follow up.
- Volunteer signups are captured to a reviewable list for outreach.

---

## 6. Reliability & Reach

- **Installable** as a mobile or desktop app via PWA support.
- **Offline fallback page** when a visitor's connection drops.
- **Responsive design** across phone, tablet, and desktop.
- **SEO-friendly** pages — proper titles, descriptions, and social share cards — so the site is discoverable on Google and looks polished when shared on social media or messaging apps.

---

## 7. Security & Privacy

- The admin dashboard is gated behind staff authentication.
- Document uploads do **not** require visitors to create an account — uploads go into a single shared, admin-reviewed area. This lowers the barrier for community members while keeping all submissions visible to staff.
- Published Privacy and Terms pages.

---

## 8. Summary

The PLACE website is a complete, multilingual, AI-powered community platform: visitors get instant answers and document help in their own language and can engage with programs, donations, and volunteering; staff get a single dashboard to manage every piece of content and every incoming request. The result is a site that scales the organization's reach without scaling its workload.
