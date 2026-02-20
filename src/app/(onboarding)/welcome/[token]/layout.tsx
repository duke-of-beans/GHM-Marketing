import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Onboarding — GHM Digital",
  description: "Complete your GHM SEO campaign onboarding",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
