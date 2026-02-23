import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { buildSearchSystemPrompt } from "@/lib/ai/search-prompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Fast local suggestions (no AI) ───────────────────────────────────────────

const NAV_ROUTES: Record<string, { label: string; url: string; icon: string; roles: string[] }> = {
  dashboard:    { label: "Dashboard",       url: "/master",           icon: "dashboard",    roles: ["admin","master"] },
  rep_dash:     { label: "Dashboard",       url: "/rep",              icon: "dashboard",    roles: ["admin","sales"] },
  leads:        { label: "Leads Pipeline",  url: "/leads",            icon: "leads",        roles: ["admin","master","sales"] },
  clients:      { label: "Client Roster",   url: "/clients",          icon: "clients",      roles: ["admin","master"] },
  tasks:        { label: "Task Queue",      url: "/clients",          icon: "tasks",        roles: ["admin","master"] },
  content:      { label: "Content Studio",  url: "/content",          icon: "content",      roles: ["admin","master"] },
  payments:     { label: "Payments",        url: "/payments",         icon: "payments",     roles: ["admin","master"] },
  reports:      { label: "Reports",         url: "/clients",          icon: "reports",      roles: ["admin","master"] },
  team:         { label: "Team Feed",       url: "/master",           icon: "team",         roles: ["admin","master","sales"] },
  vault:        { label: "Document Vault",  url: "/vault",            icon: "vault",        roles: ["admin","master","sales"] },
  settings:     { label: "Settings",        url: "/settings",         icon: "settings",     roles: ["admin","master"] },
  analytics:    { label: "Analytics",       url: "/master",           icon: "trending-up",  roles: ["admin","master"] },
};

function getAccessibleRoutes(role: string): string[] {
  return Object.keys(NAV_ROUTES).filter((k) => NAV_ROUTES[k].roles.includes(role));
}

interface LocalResult {
  label: string;
  url: string;
  description: string;
  icon: string;
}

async function localSearch(query: string, role: string, userId: number): Promise<LocalResult[]> {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results: LocalResult[] = [];

  // Nav route fuzzy match
  for (const [key, route] of Object.entries(NAV_ROUTES)) {
    if (!route.roles.includes(role)) continue;
    if (key.includes(q) || route.label.toLowerCase().includes(q)) {
      results.push({ label: route.label, url: route.url, description: "Navigate to " + route.label, icon: route.icon });
    }
  }

  // Client name match (top 3)
  if (["admin", "master"].includes(role)) {
    const clients = await prisma.clientProfile.findMany({
      where: { businessName: { contains: query, mode: "insensitive" }, status: "active" },
      select: { id: true, businessName: true, healthScore: true, leadId: true },
      take: 3,
    });
    for (const c of clients) {
      results.push({
        label: c.businessName,
        url: `/clients/${c.leadId}`,
        description: `Client · Health Score ${c.healthScore}`,
        icon: "clients",
      });
    }
  }

  // Lead name match (top 3)
  const leads = await prisma.lead.findMany({
    where: {
      businessName: { contains: query, mode: "insensitive" },
      ...(role === "sales" ? { assignedTo: userId } : {}),
    },
    select: { id: true, businessName: true, status: true },
    take: 3,
  });
  for (const l of leads) {
    results.push({
      label: l.businessName,
      url: `/leads`,
      description: `Lead · ${l.status}`,
      icon: "leads",
    });
  }

  return results.slice(0, 8);
}

// ── POST /api/search ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, scopedClientId, mode } = await req.json() as {
    query: string;
    scopedClientId?: number;
    mode?: "local" | "ai";
  };

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ navigational: [], answers: [], actions: [], source: "empty" });
  }

  const role = session.user.role as string;
  const userId = parseInt(session.user.id);

  // Phase 1: always return local results fast
  const localResults = await localSearch(query, role, userId);

  if (mode === "local") {
    return NextResponse.json({ navigational: localResults.map(r => ({ ...r })), answers: [], actions: [], source: "local" });
  }

  // Phase 2: AI semantic results
  let scopedClient: { id: number; name: string; healthScore: number; status: string } | undefined;
  if (scopedClientId) {
    const cp = await prisma.clientProfile.findUnique({
      where: { id: scopedClientId },
      select: { id: true, businessName: true, healthScore: true, status: true },
    });
    if (cp) scopedClient = { id: cp.id, name: cp.businessName, healthScore: cp.healthScore, status: cp.status };
  }

  const systemPrompt = buildSearchSystemPrompt({
    userRole: role as "admin" | "master" | "sales",
    userName: session.user.name ?? "User",
    scopedClient,
    accessibleRoutes: getAccessibleRoutes(role),
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let aiResult: { navigational?: unknown[]; answers?: unknown[]; actions?: unknown[] } = {};
    try { aiResult = JSON.parse(raw); } catch { /* malformed — use empty */ }

    // Merge: local results first, then AI navigational (deduplicated by url)
    const localUrls = new Set(localResults.map((r) => r.url));
    const aiNav = (aiResult.navigational ?? []) as LocalResult[];
    const merged = [
      ...localResults,
      ...aiNav.filter((n) => !localUrls.has(n.url)),
    ].slice(0, 8);

    return NextResponse.json({
      navigational: merged,
      answers: aiResult.answers ?? [],
      actions: aiResult.actions ?? [],
      source: "ai",
    });
  } catch (err) {
    // AI failed — return local results only
    return NextResponse.json({
      navigational: localResults,
      answers: [],
      actions: [],
      source: "local_fallback",
    });
  }
}
