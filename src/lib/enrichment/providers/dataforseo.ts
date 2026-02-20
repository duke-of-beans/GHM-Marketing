/**
 * DataForSEO Provider — Local SERP Rank Tracking
 *
 * Standard queue:  $0.0006/request, ~5 min turnaround
 * Live mode:       $0.002/request,  ~6 sec
 *
 * Flow:
 *   postSerpTasks()  →  DataForSEO queues tasks, returns task IDs
 *   getSerpResults() →  Call when ready, returns SerpResult[]
 */

const API_BASE = "https://api.dataforseo.com/v3";

function getAuth(): string | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const pass = process.env.DATAFORSEO_PASSWORD;
  if (!login || !pass) return null;
  return "Basic " + Buffer.from(`${login}:${pass}`).toString("base64");
}

// ============================================================================
// Types
// ============================================================================

export interface LocalPackEntry {
  position: number;
  title: string;
  rating?: number;
  reviews?: number;
}

export interface SerpResult {
  keyword: string;
  taskId: string;
  organicPosition: number | null;
  localPackPosition: number | null;
  rankingUrl: string | null;
  localPackEntries: LocalPackEntry[];
  serpFeatures: string[];
}

interface DataForSeoTask {
  keyword: string;
  zipCode: string;
  domain: string;
  tag: string;         // "clientId_keywordId" for matching on poll
  languageCode?: string;
  device?: "mobile" | "desktop";
}

// ============================================================================
// Location code lookup — DataForSEO uses numeric location codes for zip codes
// We use their /locations/search endpoint to resolve zip → location_code
// ============================================================================

const zipCodeCache = new Map<string, number>();

export async function resolveZipToLocationCode(zipCode: string): Promise<number | null> {
  if (zipCodeCache.has(zipCode)) return zipCodeCache.get(zipCode)!;

  const auth = getAuth();
  if (!auth) return null;

  try {
    const res = await fetch(
      `${API_BASE}/serp/google/locations?country_code=US`,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Find exact zip match
    const match = data.tasks?.[0]?.result?.find(
      (loc: { location_code: number; location_name: string }) =>
        loc.location_name === zipCode || loc.location_name.startsWith(zipCode)
    );

    if (match) {
      zipCodeCache.set(zipCode, match.location_code);
      return match.location_code;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Post tasks to standard queue
// Returns array of DataForSEO task IDs
// ============================================================================

export async function postSerpTasks(tasks: DataForSeoTask[]): Promise<string[]> {
  const auth = getAuth();
  if (!auth) {
    console.warn("[dataforseo] credentials not set, skipping");
    return [];
  }

  // Resolve all zip codes to location codes
  const locationCodes = await Promise.all(
    tasks.map((t) => resolveZipToLocationCode(t.zipCode))
  );

  const payload = tasks.map((task, i) => ({
    keyword: task.keyword,
    location_code: locationCodes[i] ?? 1023191, // fallback: Beverly Hills 90210 area
    language_code: task.languageCode ?? "en",
    device: task.device ?? "mobile",
    os: "android",
    depth: 20,
    tag: task.tag,
  }));

  try {
    const res = await fetch(`${API_BASE}/serp/google/organic/task_post`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error(`[dataforseo] postSerpTasks error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const taskIds: string[] = [];

    for (const task of data.tasks ?? []) {
      if (task.id) taskIds.push(task.id);
    }

    return taskIds;
  } catch (err) {
    console.error("[dataforseo] postSerpTasks failed:", err);
    return [];
  }
}

// ============================================================================
// Get completed results for a set of task IDs
// ============================================================================

export async function getSerpResults(taskIds: string[]): Promise<SerpResult[]> {
  const auth = getAuth();
  if (!auth || taskIds.length === 0) return [];

  const results: SerpResult[] = [];

  // DataForSEO: fetch results one task at a time via /task_get endpoint
  for (const taskId of taskIds) {
    try {
      const res = await fetch(
        `${API_BASE}/serp/google/organic/task_get/regular/${taskId}`,
        {
          headers: { Authorization: auth },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const task = data.tasks?.[0];
      if (!task || task.status_code !== 20000) continue;

      const result = task.result?.[0];
      if (!result) continue;

      const keyword = task.data?.keyword ?? "";
      const items: Array<{ type: string; rank_absolute?: number; url?: string; title?: string; rating?: { value?: number; votes_count?: number }; items?: Array<{ type: string; rank_absolute?: number; title?: string; rating?: { value?: number; votes_count?: number } }> }> = result.items ?? [];

      // Parse organic position
      const organic = items.find((i) => i.type === "organic");
      const organicPosition = organic?.rank_absolute ?? null;
      const rankingUrl = organic?.url ?? null;

      // Parse local pack
      const localPackItem = items.find((i) => i.type === "local_pack");
      let localPackPosition: number | null = null;
      let localPackBusiness: string | null = null;
      const localPackEntries: LocalPackEntry[] = [];

      if (localPackItem?.items) {
        for (const entry of localPackItem.items) {
          if (entry.type === "local_pack_element") {
            localPackEntries.push({
              position: entry.rank_absolute ?? localPackEntries.length + 1,
              title: entry.title ?? "",
              rating: entry.rating?.value,
              reviews: entry.rating?.votes_count,
            });
          }
        }
        localPackBusiness = localPackEntries[0]?.title ?? null;
        // Find client's position — we can't know without domain matching here,
        // so localPackPosition will be resolved in the cron after domain comparison
        localPackPosition = null; // resolved in rank-poll cron
      }

      // SERP features present
      const serpFeatures = items
        .filter((i) => !["organic", "paid"].includes(i.type))
        .map((i) => i.type)
        .filter((v, idx, arr) => arr.indexOf(v) === idx);

      results.push({
        keyword,
        taskId,
        organicPosition,
        localPackPosition,
        rankingUrl,
        localPackEntries,
        serpFeatures,
      });
    } catch (err) {
      console.error(`[dataforseo] getSerpResults task ${taskId} failed:`, err);
    }
  }

  return results;
}

// ============================================================================
// Live mode — for on-demand sales audit generation (~6 sec)
// ============================================================================

export async function fetchLocalRankingsLive(params: {
  keywords: string[];
  zipCode: string;
  domain: string;
}): Promise<SerpResult[]> {
  const auth = getAuth();
  if (!auth) return [];

  const locationCode = await resolveZipToLocationCode(params.zipCode);

  const payload = params.keywords.map((kw, i) => ({
    keyword: kw,
    location_code: locationCode ?? 1023191,
    language_code: "en",
    device: "mobile",
    os: "android",
    depth: 20,
    tag: `live_${i}`,
  }));

  try {
    const res = await fetch(`${API_BASE}/serp/google/organic/live/regular`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data.tasks ?? []).map((task: { data?: { keyword?: string }; id?: string; result?: Array<{ items?: unknown[] }> }) => {
      const result = task.result?.[0];
      const items = (result?.items ?? []) as Array<{ type: string; rank_absolute?: number; url?: string; items?: Array<{ type: string; rank_absolute?: number; title?: string; rating?: { value?: number; votes_count?: number } }> }>;
      const organic = items.find((i) => i.type === "organic");
      const localPackItem = items.find((i) => i.type === "local_pack");

      const localPackEntries: LocalPackEntry[] = (localPackItem?.items ?? [])
        .filter((i) => i.type === "local_pack_element")
        .map((e) => ({
          position: e.rank_absolute ?? 0,
          title: e.title ?? "",
          rating: e.rating?.value,
          reviews: e.rating?.votes_count,
        }));

      return {
        keyword: task.data?.keyword ?? "",
        taskId: task.id ?? "",
        organicPosition: organic?.rank_absolute ?? null,
        localPackPosition: null,
        rankingUrl: organic?.url ?? null,
        localPackEntries,
        serpFeatures: items.map((i) => i.type).filter((v: string, idx: number, arr: string[]) => arr.indexOf(v) === idx),
      } as SerpResult;
    });
  } catch (err) {
    console.error("[dataforseo] fetchLocalRankingsLive failed:", err);
    return [];
  }
}
