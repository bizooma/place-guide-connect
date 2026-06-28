Add a "Weekdays (Mon–Fri)" option to the Repeats dropdown in the admin event editor, so a single event can generate occurrences for every Monday through Friday up to the chosen end date.

## Changes

`src/components/admin/ScheduleEditor.tsx`
- Extend `Recurrence` type to include `"weekdays"`.
- Add `{ value: "weekdays", label: "Every weekday (Mon–Fri)" }` to `RECURRENCE_OPTIONS` (between Weekly and Every 2 weeks).
- Update `generateOccurrenceDates`: when `rec === "weekdays"`, advance by 1 day and skip Saturday/Sunday (getDay() 0 and 6) when pushing dates.
- No DB or schema change needed — occurrences are materialized as individual rows linked by `series_id`, same as existing weekly/biweekly/monthly flows. Edit/delete "entire series" already works via `series_id`.

## Notes
- The existing "Day of week" field becomes informational for weekday recurrence (each generated row gets its actual weekday label based on the date), matching how weekly already behaves.