# ABC Tutoring — visual prototype

Four responsive, static pages built from Dana’s conversation. No build step or application dependencies.

## Review locally

Run `node preview.mjs` from this directory, then open:

- Home: http://localhost:4173/
- Tutors: http://localhost:4173/tutors.html
- Booking: http://localhost:4173/booking.html
- Dana’s bookings: http://localhost:4173/admin.html

The staff page is intentionally absent from public navigation. It is a **public prototype, not an authenticated admin area**. Use fictional details only.

## Try the flow

1. Filter tutors by subject and grade, then open a sample profile.
2. Choose “Book a session,” pick an available future day and time, and enter fictional family details.
3. Submit the practice booking. Open Dana’s page in the same browser to see and search it.
4. The selected time is unavailable for that tutor in this browser. Dana’s “Clear practice bookings” action resets practice data.

Sample schedules use the browser’s local time zone. All names, subject assignments, grades, rates, and availability are placeholders. Six portraits use CSS positioning on the supplied `assets/tutor-portraits.png`; the original image is unmodified. Google Fonts supplies DM Sans and Manrope with system fallbacks.

## Current scope

Home introduces ABC Tutoring, K–12 support, math/English/science, and two primary actions. Tutors appear in a scrollable grid. Booking collects parent name/email, student first name/grade, subject, tutor, and an available future one-hour slot. Dana’s page shows parent/student information, tutor, subject, date/time, and field-specific search. No parent accounts or booking-history page.

Practice bookings use localStorage only. This does not provide shared availability or reliable protection against concurrent bookings. No real sessions, payments, emails, backend, authentication, or analytics are implemented.

## After visual approval

- Replace placeholder tutor details and confirm service time zone, actual availability, and session location/format with Dana.
- Add server-side booking storage, atomic slot reservations, and authenticated staff access before collecting real family data.
- Add parent/tutor confirmation notifications, Dana’s booking notification, and parent/tutor reminders one day before sessions; tutor contact details are still needed.
- Implement analytics only after the page review: page visits, explicit tutor profile opens (not hover), booking conversion/abandonment, and Facebook referral attribution with consistent event definitions.

## GitHub Pages

The folder is connected to `https://github.com/tex-upport/tex-upport.github.io.git`. All links are relative; `index.html` is the root home page. The implementation is pushed to `main`. GitHub rejected Pages setup with HTTP 422 because the current plan does not support Pages for this private repository. Publishing requires the owner's decision to make the repository public or use a supporting GitHub plan. Repository visibility has not been changed. The local token file is excluded from Git and never loaded by the website.

## Verification

Browser checks passed in headless Microsoft Edge: all four desktop pages, responsive layouts at 320/390/768 pixels without page overflow, subject/grade filters, tutor profile dialogs, preselected tutors, grade restrictions, missing-time validation, practice booking persistence, occupied-slot exclusion, calendar navigation, all staff search fields, empty results, and practice-data reset/cancel. No JavaScript runtime errors occurred. The preview server also returns 404 for the local token file.
