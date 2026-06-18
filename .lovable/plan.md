# Proposal Document — The PLACE Website

I'll create a single Markdown file, `PROPOSAL.md`, at the project root that you can hand to stakeholders or paste into a doc. It's strictly a functionality write-up — no timelines, no pricing, no tech jargon unless it's user-visible.

## Document structure

### 1. Overview
One-paragraph summary of what the site is: a multilingual community information hub for The PLACE with an AI chatbot, document understanding, resource directory, schedule, donation flow, volunteer signup, and an admin dashboard for content and document management.

### 2. Public-facing features

- **Home page** with hero, branding, and the AI chatbot front-and-center.
- **Ask The PLACE chatbot**
  - Conversational Q&A grounded in admin-curated content.
  - Starter prompt suggestions.
  - Voice input (speak your question).
  - Read-aloud of bot answers (text-to-speech).
  - Responds in the user's selected language.
- **Multilingual support**
  - Language selector (English, Spanish, Arabic, Farsi, Pashto, Somali, plus expandable slots).
  - Entire UI translates on language change, including chatbot panel copy, navigation, buttons, and dynamic content.
  - Translations cached per language for instant repeat loads.
- **Document upload & AI understanding (Help with a Document)**
  - Visitor uploads a document (letter, notice, form, etc.).
  - AI returns a plain-language summary and explanation in the chosen language.
  - "Delete document" option removes the file and its record entirely.
  - All uploads are queued in the admin dashboard for staff review.
- **Resources directory** — categorized list of community resources, translated.
- **Schedule** — class/program schedule view.
- **Donate page** with gallery of community impact images and donation guidance.
- **Volunteer signup** dialog/form, captured for staff follow-up.
- **About, Privacy, Terms** pages.
- **Install as app (PWA)** — visitors can install the site to their phone/desktop home screen; works offline with an offline fallback page.
- **Mobile-optimized navigation** with bottom nav bar on phones.
- **Accessibility** — read-aloud, voice input, large tap targets, semantic structure.

### 3. Admin dashboard (staff-only, behind login)

- **Authentication** — secure staff sign-in.
- **Document uploads review**
  - List of all visitor-uploaded documents with status.
  - Filter and refresh controls.
  - Archive documents (hidden from the active list).
  - "View archived" toggle to review archived items, with the option to return to the active view.
  - Pending-uploads count indicator.
- **Resources editor** — add, edit, remove resource entries.
- **Resources translation manager** — review and manage translated versions of resources.
- **Schedule editor** — manage class/program schedule entries.
- **Triage categories editor** — manage the categories used to route and tag content.
- **Training documents editor** — manage the knowledge base the chatbot draws from.
- **Languages editor** — enable/configure supported languages.
- **Settings editor** — site-wide configuration.
- **Volunteer signups list** — review people who signed up to volunteer.
- **User profile** page for the signed-in admin.

### 4. AI capabilities (what the AI actually does for users)

- Answers questions about The PLACE using the admin-curated knowledge base.
- Translates the entire UI on demand into any supported language.
- Reads and explains uploaded documents in plain language.
- Speaks answers aloud (text-to-speech).
- Listens to spoken questions (speech-to-text).

### 5. Content & data management

- All chatbot knowledge, resources, schedule, categories, and languages are editable by staff — no developer needed for content changes.
- Visitor document uploads are stored centrally so staff can see what the community is asking about and follow up.
- Volunteer signups are captured to a reviewable list.

### 6. Reliability & reach

- Installable as a mobile/desktop app (PWA).
- Offline fallback page when a visitor loses connection.
- Responsive design across phone, tablet, and desktop.
- SEO-friendly pages (titles, descriptions, social share cards) so the site is discoverable.

### 7. Security & privacy

- Admin area requires authentication.
- Document uploads are scoped to a single shared, admin-reviewed area; not tied to visitor accounts (no visitor login required).
- Privacy and Terms pages published.

## Deliverable

A single file: `PROPOSAL.md` at the project root, organized with the sections above, written in plain language suitable for non-technical reviewers.
