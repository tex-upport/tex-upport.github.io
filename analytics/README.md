# ABC Tutoring analytics

PostHog US project: [596111](https://us.posthog.com/project/596111/home).

## What is measured

| Event                       | Exact trigger                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`                 | Once per load of Home, Our tutors, or Booking; also once on a back/forward-cache restoration. `/` and `/index.html` both count as Home.                                                        |
| `tutor_profile_viewed`      | After a parent explicitly opens a tutor profile. Hovering and scrolling do not count. Reopening a profile counts again.                                                                        |
| `booking_tutor_viewed`      | Booking page loads with a selected tutor, or the parent changes the tutor dropdown. `trigger` distinguishes these cases. The default Tutor A selection is included here, not in profile views. |
| `booking_started`           | First deliberate form interaction, date/time selection, or submission attempt. Once per booking-page instance.                                                                                 |
| `booking_time_selected`     | An available one-hour slot is selected. Does not include the date/time itself.                                                                                                                 |
| `booking_submitted`         | The browser-valid form reaches the submit handler. This is not a completed booking.                                                                                                            |
| `booking_validation_failed` | Required details/slot missing, slot unavailable, or local storage save fails. Contains a reason code only.                                                                                     |
| `booking_completed`         | Only after the practice booking is successfully saved in localStorage. Includes tutor and subject, not family details.                                                                         |
| `cta_clicked`               | An internal navigation link is activated; records destination and placement.                                                                                                                   |
| `tutor_filters_changed`     | Subject or grade-range browsing filter changes. Does not record the student's entered grade.                                                                                                   |

Common properties identify this website (`site=abc_tutoring`), schema version, page, environment, test traffic, and `booking_mode=practice`. Booking events carry a random attempt ID that is separate from the stored booking ID.

## Dashboard and interpretation

`dashboard-spec.mjs` defines ten charts: daily visitors, page views, tutor profile opens, booking-page interest, overall conversion by source, the Home → Tutors → Booking journey, Facebook conversion, practice bookings by tutor, traffic sources, and booking validation problems.

All charts filter to this site's production, non-test, practice traffic. Unique visitors mean anonymous browser identities, not known people. Shared browsers, cleared storage, blocked tracking, and multiple devices affect counts. Funnels use unique browsers and a **one-hour conversion window**. Funnel drop-off is the measure of non-completion; no unreliable “abandoned” event is fired when a user switches tabs or closes a page. Visitors whose window is still open can convert later.

The overall funnel includes people landing directly on any of the three public pages. The separate four-step browsing funnel requires Home → Tutors → Booking → Completion and intentionally excludes direct booking routes. Repeated submissions and reloads do not generate completions unless a new practice booking actually saves. Example rows on Dana's page never become booking events.

There is no historical backfill: analytics starts when tracking is published. Do not present the sample admin rows or QA test activity as visitor data. Practice conversions are not actual scheduled sessions, payments, or revenue.

## Facebook attribution

Use this link in the local parents' Facebook group:

https://tex-upport.github.io/?utm_source=facebook&utm_medium=social&utm_campaign=local_parents&utm_content=monthly_2026_09

Change `utm_content` for each monthly post; use a different `utm_campaign` if comparing campaigns. Campaign labels accept letters, numbers, hyphens, and underscores, up to 80 characters. Do not put people's names or contact information in campaign parameters.

An explicit UTM source takes priority. Facebook referrer domains are recognized even without tags. Other external domains become `referral`; no source becomes `direct`. Visit attribution persists in the same tab across internal navigation, with a 30-minute inactivity limit. The first observed source is also retained for up to 90 days when browser storage is available. Referrer URLs are reduced to domains; `fbclid` and other raw query parameters are not sent. Tracking across tabs and devices is not guaranteed.

## Data handling

Only explicit events and an allowlist of properties are sent. Autocapture, session replay, heatmaps, surveys, exception capture, and person profiles are disabled. No parent names/emails, student names/grades, form values, booking records, appointment dates/times, or raw URL queries are sent. Analytics is absent from Dana's page. The SDK stores an anonymous browser ID in localStorage. Do Not Track and Global Privacy Control disable analytics on page load. Blocking PostHog does not block the site or bookings.

`analytics-config.js` contains the **public ingestion token** required by browser analytics. This token is meant to be visible to clients and cannot read analytics or manage dashboards. The original local token text file and all personal API key files are excluded from Git. Never put a `phx_` key in website code.

## Saved dashboard setup

Save a scoped personal key into the ignored `PostHog Personal API Key.txt` in the project root, or set `POSTHOG_PERSONAL_API_KEY` in your environment. Required scopes: `project:read`, `dashboard:read`, `dashboard:write`, `insight:read`, `insight:write`, `query:read`, with access to project 596111.

```powershell
node analytics/setup-posthog.mjs --check-access
node analytics/setup-posthog.mjs
```

Setup validates that the website token matches the project, validates chart queries, creates the dashboard/insights, and verifies membership. Reruns update only this integration's tagged dashboard/insights. Dashboard URLs are recorded in `dashboard-links.json` after a successful setup. The setup script runs locally, never in the browser.

## Verification

Normal localhost previews send no analytics. Append `?analytics_test=1` to explicitly enable QA tracking; the flag remains for that tab, including internal navigation. `?analytics_test=0` turns it off. Automated browser visits are marked as tests as well. Test events carry `is_test=true` and are excluded from all ten dashboard charts.

With Playwright installed and the preview server running, execute `node analytics/check-browser.cjs` to check real SDK behavior with intercepted ingestion requests. The test does not send events to PostHog. On Windows it uses installed Microsoft Edge; on other systems it uses Playwright's Chromium.

To inspect test events in PostHog's activity view, filter `site=abc_tutoring` and `is_test=true`. Production traffic uses `environment=production`; localhost QA uses `environment=development`. The project's event-ingestion API accepting data is a delivery check; querying the events in PostHog verifies they were stored.

PostHog references: [JavaScript configuration](https://posthog.com/docs/libraries/js/config), [personal keys](https://posthog.com/docs/api/personal-api-keys), [dashboards API](https://posthog.com/docs/api/dashboards), [insights API](https://posthog.com/docs/api/insights), [funnels](https://posthog.com/docs/product-analytics/funnels).
