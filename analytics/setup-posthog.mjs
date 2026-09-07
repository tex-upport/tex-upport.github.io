// Run locally: node analytics/setup-posthog.mjs [--check-access]
// A personal API key is read from the environment or the ignored local text file.
import { readFile, writeFile } from "node:fs/promises";
import {
  projectId,
  appHost,
  dashboardName,
  managedTag,
  dashboardDescription,
  insights,
} from "./dashboard-spec.mjs";

const root = new URL("../", import.meta.url);
const personalKey = (
  process.env.POSTHOG_PERSONAL_API_KEY ||
  (await readFile(new URL("PostHog Personal API Key.txt", root), "utf8").catch(
    () => "",
  ))
).trim();
if (!/^phx_[A-Za-z0-9_-]+$/.test(personalKey)) {
  console.error(
    "A personal API key beginning phx_ is required in PostHog Personal API Key.txt. The public phc_ token can only send events.",
  );
  process.exit(1);
}
const prefix = `/api/projects/${projectId}/`;
async function api(endpoint, method = "GET", body) {
  const url = new URL(endpoint, appHost);
  if (url.origin !== appHost || !url.pathname.startsWith(prefix))
    throw new Error("Unexpected PostHog project endpoint.");
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${personalKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(90000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = String(
      data.detail || data.error || data.code || "Request failed",
    )
      .replace(/ph[ctx]_[A-Za-z0-9_-]+/g, "[redacted]")
      .slice(0, 350);
    throw new Error(
      `PostHog ${response.status} on ${method} ${url.pathname}: ${detail}`,
    );
  }
  return data;
}
async function list(endpoint) {
  let next = endpoint;
  const all = [];
  while (next) {
    const response = await api(next);
    all.push(...response.results);
    next = response.next;
  }
  return all;
}

try {
  const project = await api(prefix);
  const configText = await readFile(
    new URL("analytics-config.js", root),
    "utf8",
  );
  const publicToken = configText.match(/phc_[A-Za-z0-9_-]+/)?.[0];
  if (!publicToken || project.api_token !== publicToken)
    throw new Error(
      "The website token does not match the selected project. No dashboard was changed.",
    );
  console.log(
    `Project read verified: ${project.id} (${project.name}). Website token matches.`,
  );
  const dashboards = await list(`${prefix}dashboards/`);
  const existingInsights = await list(
    `${prefix}insights/?search=${encodeURIComponent(managedTag)}`,
  );
  await api(`${prefix}query/`, "POST", {
    query: { kind: "HogQLQuery", query: "SELECT 1 AS access_check" },
  });
  console.log("Dashboard read, insight read, and query access verified.");
  if (process.argv.includes("--check-access")) {
    console.log(
      "Write access will be verified by creating the requested dashboard and insights.",
    );
    process.exit(0);
  }
  for (const definition of insights) {
    await api(`${prefix}query/`, "POST", { query: definition.query.source });
    console.log(`Query validated: ${definition.name}`);
  }
  let dashboard = dashboards.find(
    (item) => item.name === dashboardName && item.tags?.includes(managedTag),
  );
  if (!dashboard)
    dashboard = await api(`${prefix}dashboards/`, "POST", {
      name: dashboardName,
      description: dashboardDescription,
      tags: [managedTag],
      pinned: true,
    });
  else
    dashboard = await api(`${prefix}dashboards/${dashboard.id}/`, "PATCH", {
      description: dashboardDescription,
    });
  console.log(`Dashboard write verified: ${dashboard.id}`);
  const saved = [];
  const attached = await api(`${prefix}dashboards/${dashboard.id}/`);
  const managedInsights = [
    ...existingInsights,
    ...(attached.tiles || []).map((tile) => tile.insight).filter(Boolean),
  ];
  for (const [index, definition] of insights.entries()) {
    const existing = managedInsights.find(
      (item) =>
        item.name === definition.name && item.tags?.includes(managedTag),
    );
    const body = {
      ...definition,
      order: index,
      dashboards: [...new Set([...(existing?.dashboards || []), dashboard.id])],
    };
    const savedInsight = await api(
      existing ? `${prefix}insights/${existing.id}/` : `${prefix}insights/`,
      existing ? "PATCH" : "POST",
      body,
    );
    saved.push({
      name: savedInsight.name,
      id: savedInsight.id,
      short_id: savedInsight.short_id,
    });
    console.log(`Insight saved: ${savedInsight.name}`);
  }
  const verified = await api(`${prefix}dashboards/${dashboard.id}/`);
  const attachedIds = new Set(
    (verified.tiles || [])
      .filter((tile) => !tile.deleted)
      .map((tile) => tile.insight?.id),
  );
  if (saved.some((insight) => !attachedIds.has(insight.id)))
    throw new Error(
      "Some insights were saved but dashboard membership could not be verified.",
    );
  const result = {
    project_id: projectId,
    dashboard_id: dashboard.id,
    url: `${appHost}/project/${projectId}/dashboard/${dashboard.id}`,
    insights: saved,
  };
  await writeFile(
    new URL("dashboard-links.json", import.meta.url),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(`Verified ${saved.length} dashboard insights: ${result.url}`);
} catch (error) {
  console.error(error.message.replace(/ph[ctx]_[A-Za-z0-9_-]+/g, "[redacted]"));
  process.exitCode = 1;
}
