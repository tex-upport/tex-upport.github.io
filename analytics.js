/* Explicit, anonymous product analytics. Event definitions: analytics/README.md. */
(() => {
  "use strict";
  const config = window.ABC_POSTHOG_CONFIG;
  const pageName = document.body.dataset.page;
  const publicPages = {
    home: "/",
    tutors: "/tutors.html",
    booking: "/booking.html",
  };
  const noop = Object.freeze({ track() {} });
  window.ABCAnalytics = noop;
  if (!config || !publicPages[pageName]) return;

  function read(storage, key) {
    try {
      return JSON.parse(window[storage].getItem(key) || "null");
    } catch {
      return null;
    }
  }
  function write(storage, key, value) {
    try {
      window[storage].setItem(key, JSON.stringify(value));
    } catch {
      /* Optional analytics storage. */
    }
  }

  const params = new URLSearchParams(location.search);
  const testKey = "abc-analytics-test-v1";
  if (params.get("analytics_test") === "1")
    write("sessionStorage", testKey, true);
  if (params.get("analytics_test") === "0")
    write("sessionStorage", testKey, false);
  const isTest =
    read("sessionStorage", testKey) === true || navigator.webdriver === true;
  const isProduction = location.hostname === config.productionHost;
  // Local previews don't send data unless deliberately placed in test mode.
  if (
    (!isProduction &&
      params.get("analytics_test") !== "1" &&
      read("sessionStorage", testKey) !== true) ||
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.globalPrivacyControl === true
  )
    return;

  const sessionKey = "abc-analytics-attribution-v1";
  const firstKey = "abc-analytics-first-touch-v1";
  const sessionLifetime = 30 * 60 * 1000;
  const firstLifetime = 90 * 24 * 60 * 60 * 1000;
  function label(value) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,79}$/.test(normalized) ? normalized : "";
  }
  let referringDomain = "";
  try {
    referringDomain = new URL(document.referrer).hostname;
  } catch {
    /* Direct visit. */
  }
  const externalReferral =
    referringDomain && referringDomain !== location.hostname;
  const facebookReferral = /(^|\.)(facebook\.com|fb\.com)$/.test(
    referringDomain,
  );
  let utmSource = label(params.get("utm_source"));
  if (["fb", "facebook", "facebook_group"].includes(utmSource))
    utmSource = "facebook";

  function validAttribution(value, lifetime) {
    return (
      value &&
      typeof value.updated === "number" &&
      Date.now() - value.updated < lifetime &&
      Date.now() >= value.updated &&
      ["source", "medium", "campaign", "content"].every(
        (key) =>
          typeof value[key] === "string" &&
          (value[key] === "" || label(value[key]) === value[key]),
      ) &&
      Object.values(publicPages).includes(value.landing_page) &&
      typeof value.referring_domain === "string" &&
      /^[a-z0-9.-]*$/.test(value.referring_domain)
    );
  }
  const storedSession = read("sessionStorage", sessionKey);
  let attribution =
    !utmSource &&
    !externalReferral &&
    validAttribution(storedSession, sessionLifetime)
      ? storedSession
      : {
          source:
            utmSource ||
            (facebookReferral
              ? "facebook"
              : externalReferral
                ? "referral"
                : "direct"),
          medium:
            label(params.get("utm_medium")) ||
            (facebookReferral
              ? "social"
              : externalReferral
                ? "referral"
                : "none"),
          campaign: label(params.get("utm_campaign")),
          content: label(params.get("utm_content")),
          referring_domain: externalReferral ? referringDomain : "",
          landing_page: publicPages[pageName],
          updated: Date.now(),
        };
  write("sessionStorage", sessionKey, attribution);
  let firstTouch = read("localStorage", firstKey);
  if (!validAttribution(firstTouch, firstLifetime)) {
    firstTouch = { ...attribution };
    write("localStorage", firstKey, firstTouch);
  }

  const events = new Set([
    "$pageview",
    "cta_clicked",
    "tutor_filters_changed",
    "tutor_profile_viewed",
    "booking_tutor_viewed",
    "booking_started",
    "booking_time_selected",
    "booking_submitted",
    "booking_validation_failed",
    "booking_completed",
  ]);
  const eventProperties = new Set([
    "tutor_id",
    "tutor_name",
    "subject",
    "subject_filter",
    "grade_filter",
    "trigger",
    "placement",
    "destination",
    "reason",
    "booking_attempt_id",
    "session_duration_minutes",
  ]);
  const commonProperties = new Set([
    "site",
    "schema_version",
    "environment",
    "is_test",
    "booking_mode",
    "page_name",
    "page_path",
    "traffic_source",
    "traffic_medium",
    "traffic_campaign",
    "traffic_content",
    "referring_domain",
    "landing_page",
    "first_touch_source",
    "first_touch_medium",
    "first_touch_campaign",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
  ]);
  const sdkProperties = new Set([
    "token",
    "distinct_id",
    "$device_id",
    "$session_id",
    "$window_id",
    "$insert_id",
    "$lib",
    "$lib_version",
    "$browser",
    "$browser_version",
    "$os",
    "$os_version",
    "$device_type",
    "$screen_width",
    "$screen_height",
    "$viewport_width",
    "$viewport_height",
    "$browser_language",
    "$browser_language_prefix",
    "$timezone",
    "$timezone_offset",
    "$is_identified",
    "$event_type",
    "$session_entry_referring_domain",
  ]);
  const cleanUrl = () => `${location.origin}${publicPages[pageName]}`;

  function beforeSend(event) {
    if (!event || !events.has(event.event)) return null;
    const properties = {};
    for (const [key, value] of Object.entries(event.properties || {})) {
      if (
        (eventProperties.has(key) ||
          commonProperties.has(key) ||
          sdkProperties.has(key)) &&
        ["string", "number", "boolean"].includes(typeof value)
      )
        properties[key] = value;
    }
    // Never forward raw URLs, referrer paths, form values, or SDK person updates.
    properties.$current_url = cleanUrl();
    properties.$pathname = publicPages[pageName];
    properties.$host = location.host;
    properties.$referrer = attribution.referring_domain
      ? `https://${attribution.referring_domain}/`
      : "$direct";
    properties.$referring_domain = attribution.referring_domain || "$direct";
    properties.$process_person_profile = false;
    properties.$geoip_disable = true;
    event.properties = properties;
    return event;
  }

  // The small queue is compatible with the official async PostHog HTML loader.
  // It lets the site work immediately, even if the analytics CDN is slow or blocked.
  const posthog = (window.posthog = window.posthog || []);
  if (!posthog.__loaded) {
    posthog._i = [];
    posthog.__SV = 1;
    posthog.capture = (...args) => {
      if (posthog.length < 100) posthog.push(["capture", ...args]);
    };
    posthog.init = (token, options) =>
      posthog._i.push([token, options, "posthog"]);
  }
  posthog.init(config.token, {
    api_host: config.apiHost,
    ui_host: config.uiHost,
    defaults: "2026-05-30",
    persistence: "localStorage",
    person_profiles: "never",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    capture_exceptions: false,
    rageclick: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    advanced_disable_decide: true,
    save_campaign_params: false,
    save_referrer: false,
    mask_all_text: true,
    mask_all_element_attributes: true,
    respect_dnt: true,
    get_current_url: cleanUrl,
    before_send: beforeSend,
    request_batching: !isTest,
    disable_compression: isTest,
    opt_out_useragent_filter: isTest,
  });

  function track(event, details = {}) {
    if (!events.has(event)) return;
    try {
      if (Date.now() - attribution.updated >= sessionLifetime) {
        attribution = {
          source: "direct",
          medium: "none",
          campaign: "",
          content: "",
          referring_domain: "",
          landing_page: publicPages[pageName],
          updated: Date.now(),
        };
      }
      attribution.updated = Date.now();
      write("sessionStorage", sessionKey, attribution);
      const properties = {};
      for (const [key, value] of Object.entries(details)) {
        if (
          eventProperties.has(key) &&
          ["string", "number", "boolean"].includes(typeof value)
        )
          properties[key] = value;
      }
      Object.assign(properties, {
        site: "abc_tutoring",
        schema_version: 1,
        environment: isProduction ? "production" : "development",
        is_test: isTest,
        booking_mode: "practice",
        page_name: pageName,
        page_path: publicPages[pageName],
        traffic_source: attribution.source,
        traffic_medium: attribution.medium,
        traffic_campaign: attribution.campaign,
        traffic_content: attribution.content,
        referring_domain: attribution.referring_domain,
        landing_page: attribution.landing_page,
        first_touch_source: firstTouch.source,
        first_touch_medium: firstTouch.medium,
        first_touch_campaign: firstTouch.campaign,
        utm_source: attribution.source,
        utm_medium: attribution.medium,
        utm_campaign: attribution.campaign,
        utm_content: attribution.content,
      });
      window.posthog.capture(event, properties, { timestamp: new Date() });
    } catch {
      /* Analytics must never interfere with navigation or booking. */
    }
  }
  window.ABCAnalytics = Object.freeze({ track });
  track("$pageview");
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) track("$pageview");
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const destination = new URL(link.href, location.href);
    if (
      destination.origin !== location.origin ||
      !["/", "/index.html", "/tutors.html", "/booking.html"].includes(
        destination.pathname,
      )
    )
      return;
    const tutorId = destination.searchParams.get("tutor");
    track("cta_clicked", {
      destination:
        destination.pathname === "/index.html" ? "/" : destination.pathname,
      placement: link.closest(".site-header")
        ? "header"
        : link.closest(".tutor-card")
          ? "tutor_card"
          : link.closest("dialog")
            ? "tutor_profile"
            : link.closest(".hero-actions")
              ? "primary_actions"
              : "page_content",
      ...(/^[a-f]$/.test(tutorId || "")
        ? { tutor_id: tutorId, tutor_name: `Tutor ${tutorId.toUpperCase()}` }
        : {}),
    });
  });
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `${config.apiHost.replace(".i.posthog.com", "-assets.i.posthog.com")}/static/array.js`;
  document.head.appendChild(script);
})();
