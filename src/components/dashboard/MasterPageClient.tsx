"use client";

type Props = {
  children: React.ReactNode;
  heading: React.ReactNode;
};

/**
 * MasterPageClient — wraps master dashboard content with a page heading.
 * TeamFeed is now handled globally by DashboardLayoutClient in layout.tsx.
 */
export function MasterPageClient({ children, heading }: Props) {
  return (
    <div className="space-y-6">
      <div>{heading}</div>
      {children}
    </div>
  );
}
