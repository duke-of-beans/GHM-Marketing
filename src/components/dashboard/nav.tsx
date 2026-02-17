"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import type { UserPermissions } from "@/lib/auth/permissions";
import { HelpMenu } from "@/components/onboarding/help-menu";
import { BugReportButton } from "@/components/bug-report/BugReportButton";

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
  { href: "/master", label: "Dashboard", icon: "📊", permission: "view_analytics" },
  { href: "/sales", label: "Dashboard", icon: "📊" }, // Sales dashboard (no permission needed)
  { href: "/discovery", label: "Find Leads", icon: "🔍", permission: "view_all_leads" },
  { href: "/leads", label: "Sales Pipeline", icon: "👥", permission: "manage_leads" },
  { href: "/clients", label: "Client Portfolio", icon: "🏢", permission: "view_all_clients" },
  { href: "/review", label: "Content Review", icon: "✍️", permission: "manage_clients" },
  { href: "/analytics", label: "Analytics", icon: "📈", permission: "view_analytics" },
  { href: "/products", label: "Service Catalog", icon: "📦", permission: "manage_products" },
  { href: "/territories", label: "Territories", icon: "🗺️", permission: "manage_territories" },
  { href: "/team", label: "Team", icon: "🧑‍💼", permission: "manage_team" },
  { href: "/bugs", label: "Bug Reports", icon: "🐛" }, // Available to all
  { href: "/settings", label: "Settings", icon: "⚙️", permission: "manage_settings" },
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
      return user.role === "master" && (!link.permission || permissions[link.permission]);
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
      <aside className="hidden md:flex md:flex-col md:w-56 border-r bg-gray-50/50 p-4">
        <div className="mb-3">
          <Image
            src="/logo.png"
            alt="GHM Digital Marketing"
            width={180}
            height={59}
            className="mb-1"
            priority
          />
          <p className="text-xs text-muted-foreground">{user.name}</p>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
              )}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1">
          <HelpMenu />
          <BugReportButton 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground hover:bg-gray-100 hover:text-foreground"
          />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors w-full"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around py-2 safe-area-bottom">
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
          Out
        </button>
      </nav>
    </>
  );
}
