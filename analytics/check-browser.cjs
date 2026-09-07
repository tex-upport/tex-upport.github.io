// Browser integration test. Requires Playwright (via NODE_PATH or local install)
// and `node preview.mjs`. PostHog ingestion is intercepted: no test data is sent.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.ABC_TEST_URL || "http://127.0.0.1:4173";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const timeout = async (condition, message) => {
  for (let i = 0; i < 100; i++) {
    if (condition()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(condition(), message);
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(edge) ? { executablePath: edge } : {}),
  });
  try {
    const context = await browser.newContext();
    const received = [],
      errors = [];
    await context.route("https://us.i.posthog.com/**", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        const payload = JSON.parse(request.postData());
        received.push(...(payload.batch || [payload]));
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"status":1}',
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const count = (name) =>
      received.filter((event) => event.event === name).length;
    const waitForEvent = (name, expected) =>
      timeout(() => count(name) >= expected, `Missing ${name} #${expected}`);
    await page.goto(
      `${base}/?analytics_test=1&utm_source=facebook&utm_medium=social&utm_campaign=local_parents&utm_content=monthly_2026_09&email=private-url@example.com&fbclid=never-send-this`,
    );
    await waitForEvent("$pageview", 1);
    assert.equal(count("$pageview"), 1);
    assert.equal(received[0].properties.traffic_source, "facebook");
    assert.equal(received[0].properties.page_path, "/");
    await page
      .getByRole("link", { name: "Meet our tutors", exact: false })
      .click();
    await waitForEvent("$pageview", 2);
    await page
      .getByRole("button", { name: "Meet Tutor B", exact: true })
      .hover();
    assert.equal(
      count("tutor_profile_viewed"),
      0,
      "Hover must not count as a view",
    );
    await page
      .getByRole("button", { name: "Meet Tutor B", exact: true })
      .click();
    await waitForEvent("tutor_profile_viewed", 1);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Meet Tutor B", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await waitForEvent("tutor_profile_viewed", 2);
    await page
      .getByRole("link", { name: "Book with Tutor B", exact: false })
      .click();
    await waitForEvent("$pageview", 3);
    await waitForEvent("booking_tutor_viewed", 1);
    assert.equal(
      count("booking_started"),
      0,
      "Loading the booking page isn't a booking start",
    );
    await page.locator("#tutor-select").selectOption("c");
    await waitForEvent("booking_started", 1);
    await waitForEvent("booking_tutor_viewed", 2);
    assert.equal(
      received.find((event) => event.event === "booking_started").properties
        .tutor_id,
      "c",
    );
    await page.locator("#tutor-select").selectOption("b");
    await waitForEvent("booking_tutor_viewed", 3);
    await page.locator("[name=parent]").fill("Private Parent Unique");
    await page.locator("[name=email]").fill("private-family@example.com");
    await page.locator("[name=student]").fill("Private Student Unique");
    await page.locator("#student-grade").selectOption("9");
    await page
      .getByRole("button", { name: "Book session", exact: false })
      .click();
    await waitForEvent("booking_validation_failed", 1);
    assert.equal(count("booking_completed"), 0);
    if (!(await page.locator(".calendar-day:enabled").count()))
      await page.locator("#next-month").click();
    await page.locator(".calendar-day:enabled").first().click();
    await page.locator(".time-slot").first().click();
    await page
      .getByRole("button", { name: "Book session", exact: false })
      .click();
    await page
      .getByRole("heading", { name: "Your practice booking is saved." })
      .waitFor();
    await waitForEvent("booking_completed", 1);
    assert.equal(
      count("booking_started"),
      1,
      "One start per booking-page instance",
    );
    assert.equal(
      count("$pageview"),
      3,
      "No duplicate pageviews for tutor changes or success state",
    );
    const completion = received.find(
      (event) => event.event === "booking_completed",
    );
    assert.equal(completion.properties.tutor_id, "b");
    assert.equal(completion.properties.booking_mode, "practice");
    const visitorIds = new Set(
      received.map((event) => event.properties.distinct_id),
    );
    assert.equal(
      visitorIds.size,
      1,
      "Same anonymous identity across all three pages",
    );
    const sessionIds = new Set(
      received.map((event) => event.properties.$session_id),
    );
    assert.equal(sessionIds.size, 1, "Same SDK session across page navigation");
    for (const event of received) {
      assert.equal(event.properties.is_test, true);
      assert.equal(event.properties.traffic_source, "facebook");
      assert.equal(event.properties.traffic_campaign, "local_parents");
      assert.equal(event.properties.$process_person_profile, false);
      assert.ok(!event.properties.$current_url.includes("?"));
      for (const key of [
        "parent",
        "email",
        "student",
        "grade",
        "date",
        "hour",
        "$set",
        "$set_once",
        "$elements",
        "$session_entry_url",
      ])
        assert.ok(!(key in event.properties), `Forbidden property ${key}`);
    }
    const payloads = JSON.stringify(received);
    for (const secret of [
      "Private Parent Unique",
      "Private Student Unique",
      "private-family@example.com",
      "private-url@example.com",
      "never-send-this",
    ])
      assert.ok(
        !payloads.includes(secret),
        "Private data found in analytics payload",
      );
    await page.goto(`${base}/admin.html`);
    const beforeAdmin = received.length;
    await page.locator("#search-term").fill("Private Parent Unique");
    await page.getByRole("button", { name: "Search", exact: false }).click();
    assert.equal(await page.evaluate(() => typeof window.posthog), "undefined");
    assert.equal(received.length, beforeAdmin);

    // Clean local previews don't load analytics. The test flag isn't implicit locally.
    const normal = await browser.newContext();
    const normalPage = await normal.newPage();
    await normalPage.goto(`${base}/`);
    assert.equal(
      await normalPage.evaluate(() => typeof window.posthog),
      "undefined",
    );
    await normal.close();

    // Browser privacy preferences disable SDK loading even with test mode requested.
    const privacy = await browser.newContext();
    await privacy.addInitScript(() =>
      Object.defineProperty(navigator, "globalPrivacyControl", {
        get: () => true,
      }),
    );
    const privacyPage = await privacy.newPage();
    await privacyPage.goto(`${base}/?analytics_test=1`);
    assert.equal(
      await privacyPage.evaluate(() => typeof window.posthog),
      "undefined",
    );
    await privacy.close();

    // Analytics CDN failure cannot prevent the application and form from rendering.
    const blocked = await browser.newContext();
    await blocked.route("**/*posthog.com/**", (route) => route.abort());
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(`${base}/booking.html?analytics_test=1`);
    assert.ok(await blockedPage.locator("#booking-form").isVisible());
    assert.equal(await blockedPage.locator("#tutor-select option").count(), 6);
    await blocked.close();

    // A failed booking-storage write must never emit completion.
    await page.goto(`${base}/booking.html?analytics_test=1&tutor=c`);
    await waitForEvent("booking_tutor_viewed", 4);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "abc-tutoring-preview-bookings-v1")
          throw new Error("Test quota failure");
        return original.call(this, key, value);
      };
    });
    await page.locator("[name=parent]").fill("Example Parent");
    await page.locator("[name=email]").fill("example@example.com");
    await page.locator("[name=student]").fill("Example Student");
    await page.locator("#student-grade").selectOption("4");
    if (!(await page.locator(".calendar-day:enabled").count()))
      await page.locator("#next-month").click();
    await page.locator(".calendar-day:enabled").first().click();
    await page.locator(".time-slot").first().click();
    await page
      .getByRole("button", { name: "Book session", exact: false })
      .click();
    await timeout(
      () =>
        received.some(
          (event) => event.properties.reason === "browser_storage_unavailable",
        ),
      "Missing save-failure event",
    );
    assert.equal(count("booking_completed"), 1);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: Real SDK event delivery (intercepted), exact pageview counts, clicks vs hover, keyboard profiles, booking starts/completion/errors, attribution and identity across pages, private data excluded, admin excluded, tests labelled, local previews off, GPC, blocked CDN, failed saves.",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message.replace(/ph[ctx]_[A-Za-z0-9_-]+/g, "[redacted]"));
  process.exit(1);
});
