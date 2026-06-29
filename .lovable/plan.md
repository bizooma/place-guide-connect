# Intake Page Plan

Create a new route `/intake` that renders the full Job In-take Form from the PDF as a web form. This first pass focuses purely on **structure and fields** — no required-field validation and no submission destination yet (submit button will be disabled or show a placeholder toast).

## File to create

- `src/routes/intake.tsx` — TanStack Start route with `createFileRoute("/intake")`, site header/footer inherited from `__root.tsx`.

## Sections & fields (mirrors the PDF exactly)

1. **Applicant Information** — Full legal name, Preferred name, Date of birth, SSN
2. **Contact Information** — Street, City, State, ZIP, County (optional), Primary phone, Alternate phone, Email, Preferred contact method (Phone/Email/Text)
3. **Employment Eligibility** — Authorized to work in US (Y/N), Need sponsorship (Y/N), At least 18 (Y/N)
4. **Position Preferences** — Desired job title(s), Employment type (FT/PT/Temp/Contract), Preferred shifts (Day/Evening/Night/Rotating/Flexible — multi), Desired pay range, Earliest start date
5. **Employment History (past 7 years)** — Three employer blocks (Employer #1, #2, #3), each with: Company, Job title, Supervisor name & title, Address, Phone, Start date, End date, Starting pay, Ending pay, Duties, Reason for leaving
6. **Education & Training** — Highest level, School name, City & state, Degree/diploma/certificate, Field of study, Graduation date
7. **Additional Training, Certifications, or Licenses** — Name, Issuing org, License #, Expiration date
8. **Skills & Qualifications** — Languages spoken & proficiency, Computer/technical skills, Machinery/equipment experience, Other relevant skills
9. **References (3)** — Three blocks, each: Name, Relationship, Company, Phone, Email
10. **Availability** — Days available, Hours available, Willing to work overtime (Y/N), Willing to work weekends (Y/N)
11. **Transportation** — Reliable transportation (Y/N)
12. **Criminal History (optional)** — Convicted of felony/misdemeanor not sealed (Y/N), Explanation textarea
13. **Voluntary Self-Identification (EEO)** — Sex, Ethnicity, Race (multi-select)
14. **Emergency Contact** — Name, Relationship, Phone

(Office-use-only block from the PDF is omitted — that belongs in admin, not the public form.)

## Technical details

- Use existing shadcn primitives: `Input`, `Textarea`, `Label`, `Checkbox`, `RadioGroup`, `Select`, `Button`, `Card`/`CardHeader`/`CardContent` for section grouping.
- Single-page form, sections rendered as stacked cards with clear headings. Two-column responsive grid (`md:grid-cols-2`) for short fields; full-width for textareas.
- Local React state via `useState` holding one flat object; no Zod / no `required` attributes in this pass.
- Submit button present but wired to a no-op `toast.info("Form submission wiring coming next")` so the UI is testable.
- No nav link added yet — page reachable directly at `/intake`. We can add nav placement after the submission destination is decided.

## Out of scope (next steps after you review)

- Required-field rules
- Submission destination (Supabase table + admin tab vs. email vs. PDF export)
- Nav/menu placement
- Translation wrapping (`tx()` / `useTranslatedTexts`)
