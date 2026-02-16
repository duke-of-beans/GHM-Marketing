"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

type NavUser = {
  name: string;
  email: string;
  role: UserRole;
};

const masterLinks = [
  { href: "/master", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/clients", label: "Clients", icon: "🏢" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/territories", label: "Territories", icon: "🗺️" },
  { href: "/team", label: "Team", icon: "🧑‍💼" },
];

const salesLinks = [
  { href: "/sales", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "👥" },
];

export function DashboardNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const links = user.role === "master" ? masterLinks : salesLinks;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 border-r bg-gray-50/50 p-4">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-primary">GHM Marketing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{user.name}</p>
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

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors mt-auto"
        >
          <span>🚪</span>
          Sign Out
        </button>
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
