"use client";

/**
 * DashboardNav — grouped, collapsible sidebar navigation.
 *
 * UX-003 (Feb 21, 2026): Replaced flat link list with collapsible groups.
 * Groups reflect the actual workflow model. State persisted to localStorage
 * per-group. Active route auto-expands its parent group.
 *
 * Groups:
 *   Prospects  — Discovery, Sales Pipeline
 *   Clients    — Client Portfolio, My Tasks, Content Studio*, Website Studio*
 *   Insights   — Analytics
 *   Finance    — Payments
 *   Team       — Service Catalog, Document Vault  (elevated only for some)
 *
 * * = UX-002 entries, added here as placeholders pending route creation
 *
 * Dashboard link stays pinned above the groups (role-specific, not a group).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, Search, Users, Building2, CheckSquare, Repeat, PenTool, Globe, TrendingUp, CreditCard, Package, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import type { UserPermissions } from "@/lib/auth/permissions";
import { isElevated } from "@/lib/auth/roles";
import { HelpMenu } from "@/components/onboarding/help-menu";

// ── Types ──────────────────────────────────────────────────────────────────

type NavUser = {
  name: string;
  email: string;
  role: UserRole;
};

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: keyof UserPermissions;
  elevatedOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  elevatedOnly?: boolean;   // entire group hidden for non-elevated users
  defaultExpanded?: boolean;
  links: NavLink[];
};

// ── Nav structure ──────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    id: "prospects",
    label: "Prospects",
    defaultExpanded: true,
    links: [
      { href: "/discovery", label: "Find Leads",       icon: <Search className="h-4 w-4 shrink-0" />, permission: "view_all_leads" },
      { href: "/leads",     label: "Sales Pipeline",   icon: <Users className="h-4 w-4 shrink-0" />, permission: "manage_leads" },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    defaultExpanded: true,
    links: [
      { href: "/clients",        label: "Client Portfolio", icon: <Building2 className="h-4 w-4 shrink-0" />, permission: "view_all_clients" },
      { href: "/tasks",          label: "My Tasks",         icon: <CheckSquare className="h-4 w-4 shrink-0" /> },
      { href: "/recurring-tasks",label: "Recurring Tasks",  icon: <Repeat className="h-4 w-4 shrink-0" />, permission: "manage_clients" },
      // UX-002 entries — routes created in UX-002 sprint
      { href: "/content-studio", label: "Content Studio",   icon: <PenTool className="h-4 w-4 shrink-0" />, permission: "manage_clients" },
      { href: "/website-studio", label: "Website Studio",   icon: <Globe className="h-4 w-4 shrink-0" />, permission: "manage_clients" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    defaultExpanded: false,
    links: [
      { href: "/analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4 shrink-0" />, permission: "view_analytics" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    defaultExpanded: false,
    links: [
      { href: "/payments", label: "Payments", icon: <CreditCard className="h-4 w-4 shrink-0" />, permission: "manage_payments" },
    ],
  },
  {
    id: "team",
    label: "Resources",
    defaultExpanded: false,
    links: [
      { href: "/products", label: "Service Catalog", icon: <Package className="h-4 w-4 shrink-0" />, permission: "manage_products" },
      { href: "/vault",    label: "Document Vault",  icon: <Archive className="h-4 w-4 shrink-0" /> },
    ],
  },
];

// Bottom nav links (mobile) — flat, most important only
const MOBILE_NAV_LINKS: NavLink[] = [
  { href: "/tasks",    label: "Tasks",    icon: <CheckSquare className="h-4 w-4 shrink-0" /> },
  { href: "/clients",  label: "Clients",  icon: <Building2 className="h-4 w-4 shrink-0" />, permission: "view_all_clients" },
  { href: "/leads",    label: "Pipeline", icon: <Users className="h-4 w-4 shrink-0" />, permission: "manage_leads" },
  { href: "/analytics",label: "Analytics",icon: <TrendingUp className="h-4 w-4 shrink-0" />, permission: "view_analytics" },
];

// ── localStorage helpers ────────────────────────────────────────────────────

const LS_KEY = (groupId: string) => `sidebar_group_${groupId}_expanded`;

function readExpanded(groupId: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const stored = window.localStorage.getItem(LS_KEY(groupId));
  if (stored === null) return defaultValue;
  return stored === "true";
}

function writeExpanded(groupId: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY(groupId), String(value));
}

// ── NavGroupSection ─────────────────────────────────────────────────────────

function NavGroupSection({
  group,
  pathname,
  permissions,
  elevated,
  isActivePath,
}: {
  group: NavGroup;
  pathname: string;
  permissions: UserPermissions;
  elevated: boolean;
  isActivePath: (href: string) => boolean;
}) {
  // Filter links by permission
  const visibleLinks = group.links.filter((link) => {
    if (link.elevatedOnly && !elevated) return false;
    if (!link.permission) return true;
    return permissions[link.permission] === true;
  });

  // Auto-expand if any child is active — always override stored state
  const hasActive = visibleLinks.some((l) => isActivePath(l.href));

  const [open, setOpen] = useState<boolean>(() => {
    if (hasActive) return true;
    return readExpanded(group.id, group.defaultExpanded ?? false);
  });

  const groupRef = useRef<HTMLDivElement>(null);

  // If the active route changes and lands in this group, auto-open
  useEffect(() => {
    if (hasActive && !open) {
      setOpen(true);
      writeExpanded(group.id, true);
    }
  }, [hasActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (visibleLinks.length === 0) return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    writeExpanded(group.id, next);
    // On expand, scroll the last item into view if group is near bottom of panel
    if (next && groupRef.current) {
      setTimeout(() => {
        const links = groupRef.current?.querySelectorAll("a");
        if (links && links.length > 0) {
          links[links.length - 1].scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100); // wait for render
    }
  }

  return (
    <div ref={groupRef}>
      {/* Group header */}
      <button
        onClick={toggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors",
          "text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted dark:hover:bg-card"
        )}
        aria-expanded={open}
      >
        {group.label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open ? "rotate-0" : "-rotate-90")}
        />
      </button>

      {/* Group links */}
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActivePath(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
              )}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

export function DashboardNav({
  user,
  permissions = {},
  logoUrl = null,
  companyName = null,
}: {
  user: NavUser;
  permissions?: UserPermissions;
  logoUrl?: string | null;
  companyName?: string | null;
}) {
  const pathname = usePathname();
  const elevated = isElevated(user.role);

  const dashboardHref = elevated ? "/manager" : "/sales";

  // Active path: exact match OR prefix match for nested routes (/clients/123)
  const isActivePath = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  // Mobile nav: filter by permission
  const mobileLinks = MOBILE_NAV_LINKS.filter((link) => {
    if (!link.permission) return true;
    return permissions[link.permission] === true;
  });

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:h-screen border-r bg-muted/50 p-4 overflow-hidden">
        {/* Logo + user */}
        <div className="mb-4 flex-shrink-0">
          <Link href={dashboardHref}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName ?? "Company logo"}
                className="mb-1 max-h-12 max-w-[180px] object-contain hover:opacity-80 transition-opacity"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="GHM Digital Marketing"
                width={180}
                height={59}
                className="mb-1 dark:brightness-0 dark:invert hover:opacity-80 transition-opacity"
                priority
              />
            )}
          </Link>
          <p className="text-xs text-muted-foreground">{user.name}</p>
        </div>

        {/* Dashboard pinned link (role-specific, outside groups) */}
        <div className="mb-3 flex-shrink-0">
          <Link
            href={dashboardHref}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActivePath(dashboardHref)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
            )}
          >
            <span>📊</span>
            Dashboard
          </Link>
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 space-y-2 overflow-y-auto min-h-0">
          {NAV_GROUPS.filter((g) => !g.elevatedOnly || elevated).map((group) => (
            <NavGroupSection
              key={group.id}
              group={group}
              pathname={pathname}
              permissions={permissions}
              elevated={elevated}
              isActivePath={isActivePath}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="flex-shrink-0 space-y-1 border-t pt-3 mt-3">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isActivePath("/profile")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
            )}
          >
            <span>👤</span>
            My Profile
          </Link>
          {permissions.manage_settings && (
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActivePath("/settings")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
              )}
            >
              <span>⚙️</span>
              Settings
            </Link>
          )}
          <HelpMenu />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground transition-colors w-full"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex justify-around py-2 safe-area-bottom">
        {mobileLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs touch-target justify-center",
              isActivePath(link.href)
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground touch-target justify-center"
        >
          <span className="text-lg">🚪</span>
          Exit
        </button>
      </nav>
    </>
  );
}
