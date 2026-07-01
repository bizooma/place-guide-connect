# Plan: Build AI Assistant Training Document

Create a single Markdown file that captures everything on The PLACE site so it can be uploaded as chatbot training content.

## Steps

1. **Inventory all public routes** and read their source to extract on-page copy:
   - `/` (index)
   - `/about`
   - `/help`, `/help/index`, `/help/document`
   - `/resources` (including Congressman Ronny Jackson section)
   - `/schedule` (pull current events live from Supabase `schedule_items`)
   - `/donate` (mission copy, contact info, ways to give)
   - `/intake` (form purpose + fields)
   - `/privacy`, `/terms`
   - Footer content (hours, address, partners, copyright)

2. **Pull live database content** so the training reflects what visitors actually see:
   - `resources` (name, category, description, contact, hours)
   - `triage_categories` (help choices)
   - `schedule_items` (recurring + one-off events with times)
   - `languages` (supported list)
   - `training_docs` (existing knowledge base entries — include verbatim so nothing is lost)

3. **Extract locale strings** from `src/locales/en.json` for any UI copy not hard-coded in routes (nav labels, hours line, disclaimers).

4. **Compose `/mnt/documents/place-ai-training.md`** organized as:
   - About The PLACE (mission, partners, location, hours, contact)
   - Services & Programs (from schedule + resources + help categories)
   - Resources Directory (grouped by category, with contact details)
   - Weekly Schedule (day-by-day, 12-hour times)
   - How to Get Help (chatbot, document helper, intake form, in-person)
   - Donate & Volunteer (ways to give, PayPal link, volunteer signup)
   - Government Contacts (Congressman Jackson block)
   - Languages Supported
   - Policies (privacy + terms summaries)
   - FAQ seed (answers to the starter questions used in HeroChat)
   - Appendix: existing training_docs content verbatim

5. **Deliver** the file via a `<presentation-artifact>` tag so you can download it and paste/upload into the chatbot training editor.

## Notes

- Read-only: no site code changes.
- Schedule times will be normalized to 12-hour format to match the public view.
- If any route has dynamic/translated content, only the English source is captured (the assistant translates at runtime).
