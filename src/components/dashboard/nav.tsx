"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import type { UserPermissions } from "@/lib/auth/permissions";
import { isElevated } from "@/lib/auth/roles";
import { HelpMenu } from "@/components/onboarding/help-menu";

type NavUser = {
  name: string;
  email: string;
  role: UserRole;
};

type NavLink = {
  href: string;
  label: string;
  icon: string;
  permission?: keyof UserPermissions; // Optional permission required to see this link
};

const allLinks: NavLink[] = [
  // Core workflow — everyone
  { href: "/master", label: "Dashboard", icon: "📊", permission: "view_analytics" },
  { href: "/sales", label: "Dashboard", icon: "📊" },
  { href: "/discovery", label: "Find Leads", icon: "🔍", permission: "view_all_leads" },
  { href: "/leads", label: "Sales Pipeline", icon: "👥", permission: "manage_leads" },
  { href: "/clients", label: "Client Portfolio", icon: "🏢", permission: "view_all_clients" },
  { href: "/review", label: "Content Review", icon: "✍️", permission: "manage_clients" },
  { href: "/analytics", label: "Analytics", icon: "📈", permission: "view_analytics" },
  { href: "/products", label: "Service Catalog", icon: "📦", permission: "manage_products" },
  // Admin items live in Settings tabs — not separate nav items
];

export function DashboardNav({ 
  user, 
  permissions = {} 
}: { 
  user: NavUser; 
  permissions?: UserPermissions;
}) {
  const pathname = usePathname();
  
  // Filter links based on permissions
  const links = allLinks.filter((link) => {
    // Special handling for dashboard links
    if (link.href === "/master") {
      return isElevated(user.role) && (!link.permission || permissions[link.permission]);
    }
    if (link.href === "/sales") {
      return user.role === "sales";
    }
    
    // If link has no permission requirement, show it
    if (!link.permission) {
      return true;
    }
    
    // Check if user has the required permission
    return permissions[link.permission] === true;
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:h-screen border-r bg-gray-50/50 dark:bg-gray-950 p-4 overflow-hidden">
        <div className="mb-3 flex-shrink-0">
          <Link href={isElevated(user.role) ? "/master" : "/sales"}>
            <Image
              src="/logo.png"
              alt="GHM Digital Marketing"
              width={180}
              height={59}
              className="mb-1 dark:brightness-0 dark:invert hover:opacity-80 transition-opacity"
              priority
            />
          </Link>
          <p className="text-xs text-muted-foreground">{user.name}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto min-h-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
              )}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-shrink-0 space-y-1 border-t pt-3 mt-3">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === "/profile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
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
                pathname.startsWith("/settings")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
              )}
            >
              <span>⚙️</span>
              Settings
            </Link>
          )}
          <HelpMenu />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground transition-colors w-full"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex justify-around py-2 safe-area-bottom">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs touch-target justify-center",
              pathname === link.href
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
