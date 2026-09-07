export const projectId = 596111;
export const appHost = "https://us.posthog.com";
export const dashboardName = "ABC Tutoring · Website & bookings";
export const managedTag = "abc-tutoring-v1";
export const dashboardDescription =
  "Website traffic, tutor interest, and practice-booking conversion. Last 30 days by default. Production visits only; automated/test traffic and staff-page activity excluded. Bookings are browser-only practice bookings, not paid or confirmed tutoring sessions. Unique visitors are anonymous browser identities. Funnels allow one hour to complete; recent drop-offs may still convert. Tracking begins with this installation; earlier visits are unavailable.";

const property = (key, value) => ({
  key,
  value: [value],
  operator: "exact",
  type: "event",
});
export const productionProperties = [
  property("site", "abc_tutoring"),
  property("environment", "production"),
  property("is_test", false),
  property("booking_mode", "practice"),
];
const event = (name, customName, properties = [], math = "total") => ({
  kind: "EventsNode",
  event: name,
  name,
  custom_name: customName,
  math,
  properties,
});
const pageEvent = (page, name) =>
  event("$pageview", name, [property("page_name", page)]);
const base = {
  dateRange: { date_from: "-30d" },
  filterTestAccounts: false,
  properties: productionProperties,
};
const trend = (series, breakdown, display = "ActionsBarValue") => ({
  kind: "TrendsQuery",
  ...base,
  interval: "day",
  series,
  trendsFilter: { display, showLegend: true },
  ...(breakdown
    ? {
        breakdownFilter: {
          breakdown,
          breakdown_type: "event",
          breakdown_limit: 12,
        },
      }
    : {}),
});
const funnel = (series, breakdown) => ({
  kind: "FunnelsQuery",
  ...base,
  series,
  funnelsFilter: {
    funnelVizType: "steps",
    funnelOrderType: "ordered",
    funnelWindowInterval: 1,
    funnelWindowIntervalUnit: "hour",
  },
  ...(breakdown
    ? {
        breakdownFilter: {
          breakdown,
          breakdown_type: "event",
          breakdown_limit: 8,
        },
      }
    : {}),
});
const insight = (name, description, source) => ({
  name,
  description,
  tags: [managedTag],
  query: { kind: "InsightVizNode", source },
});
export const insights = [
  insight(
    "Daily website visitors",
    "Unique anonymous browsers visiting any public page each day. One browser may appear on multiple days. Staff activity and tests are excluded.",
    trend(
      [event("$pageview", "Unique visitors", [], "dau")],
      null,
      "ActionsLineGraph",
    ),
  ),
  insight(
    "Page views · Home, tutors & booking",
    "One pageview per public page load or browser back/forward restoration. Home aliases are combined. Profile modals and tutor dropdown changes do not create pageviews.",
    trend([event("$pageview", "Page views")], "page_name"),
  ),
  insight(
    "Most-opened tutor profiles",
    "Counts explicit profile opens from the Meet Tutor button, including keyboard activation. Hovering, scrolling past a card, and booking-page defaults do not count. Reopening a profile counts as another open.",
    trend([event("tutor_profile_viewed", "Profile opens")], "tutor_name"),
  ),
  insight(
    "Booking-page interest by tutor",
    "Unique browsers that saw each tutor selected on the booking page. Includes the initially selected tutor (Tutor A when no tutor link is supplied) and deliberate tutor changes. This is separate from profile popularity.",
    trend(
      [event("booking_tutor_viewed", "Interested visitors", [], "dau")],
      "tutor_name",
    ),
  ),
  insight(
    "Visitor → booking conversion by source",
    "All public-page visitors, including direct booking-page arrivals. Shows who starts and completes a practice booking within one hour; non-converters are funnel drop-offs. Uses anonymous browsers, not session counts.",
    funnel(
      [
        event("$pageview", "Visited the website"),
        event("booking_started", "Started booking"),
        event("booking_completed", "Practice booking saved"),
      ],
      "traffic_source",
    ),
  ),
  insight(
    "Home → tutors → booking journey",
    "The browsing route through all three pages, then a saved practice booking within one hour. Visitors who book directly are intentionally excluded from this path; use the overall conversion funnel for all visitors.",
    funnel([
      pageEvent("home", "Home"),
      pageEvent("tutors", "Our tutors"),
      pageEvent("booking", "Booking"),
      event("booking_completed", "Practice booking saved"),
    ]),
  ),
  insight(
    "Facebook visitors → practice bookings",
    "Starts with Facebook-attributed website visits, then booking starts and completions within one hour. Campaign breakdown distinguishes tagged posts. Attribution is retained through internal page navigation.",
    funnel(
      [
        event("$pageview", "Facebook visit", [
          property("traffic_source", "facebook"),
        ]),
        event("booking_started", "Started booking"),
        event("booking_completed", "Practice booking saved"),
      ],
      "traffic_campaign",
    ),
  ),
  insight(
    "Practice bookings by tutor",
    "Counts successful local saves only. Failed validation, failed storage writes, clicks on the submit button, and the six example admin rows are not completions. These are not real reservations or revenue.",
    trend(
      [event("booking_completed", "Practice bookings saved")],
      "tutor_name",
    ),
  ),
  insight(
    "Where visitors came from",
    "Unique browsers by visit source across public pages. Tagged campaign source takes priority; Facebook referrers are recognized automatically. A browser can appear under more than one source across separate visits.",
    trend(
      [event("$pageview", "Visitors", [], "dau")],
      "traffic_source",
      "ActionsTable",
    ),
  ),
  insight(
    "Booking problems to fix",
    "Validation and local-save failures, grouped by reason code. No field values, names, emails, student grades, or appointment times are sent.",
    trend(
      [event("booking_validation_failed", "Validation failures")],
      "reason",
    ),
  ),
];
