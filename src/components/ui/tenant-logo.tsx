"use client";

/**
 * TenantLogo — renders the tenant's uploaded logo or falls back to COVOS wordmark.
 *
 * Sprint 35 / FEAT-018
 *
 * Safe to use anywhere: navbar, login, PDFs, emails.
 * Never throws — always renders something.
 */

type TenantLogoSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<TenantLogoSize, { height: number; maxWidth: number; className: string }> = {
  sm: { height: 24, maxWidth: 96, className: "h-6 max-w-24" },
  md: { height: 32, maxWidth: 160, className: "h-8 max-w-40" },
  lg: { height: 48, maxWidth: 192, className: "h-12 max-w-48" },
};

interface TenantLogoProps {
  logoUrl?: string | null;
  companyName?: string;
  size?: TenantLogoSize;
  className?: string;
}

export function TenantLogo({
  logoUrl,
  companyName = "COVOS",
  size = "md",
  className = "",
}: TenantLogoProps) {
  const dims = SIZE_MAP[size];

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${companyName} logo`}
        className={`${dims.className} object-contain ${className}`}
        style={{ height: dims.height, maxWidth: dims.maxWidth }}
        onError={(e) => {
          // Fallback: hide broken image, show sibling text fallback
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling;
          if (fallback) (fallback as HTMLElement).style.display = "flex";
        }}
      />
    );
  }

  // COVOS wordmark fallback — clean SVG text
  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      style={{ height: dims.height }}
    >
      <svg
        viewBox="0 0 120 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={dims.className}
        style={{ height: dims.height }}
      >
        <text
          x="0"
          y="22"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="22"
          letterSpacing="-0.02em"
          fill="currentColor"
        >
          COVOS
        </text>
      </svg>
    </div>
  );
}
