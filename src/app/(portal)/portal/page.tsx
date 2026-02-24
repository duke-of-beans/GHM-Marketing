import { prisma } from "@/lib/db";
import { ClientPortalDashboard } from "@/components/portal/client-portal-dashboard";

export default async function ClientPortalPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Required</h1>
          <p className="text-muted-foreground">
            Please use the portal link provided in your email.
          </p>
        </div>
      </div>
    );
  }

  // Verify token and get client
  const client = await prisma.clientProfile.findFirst({
    where: { portalToken: token },
    include: {
      lead: {
        select: {
          businessName: true,
          phone: true,
          email: true,
          website: true,
        },
      },
      scans: {
        orderBy: { scanDate: "desc" },
        take: 10,
      },
      tasks: {
        where: {
          status: { in: ["approved", "deployed", "measured"] },
        },
        orderBy: { completedAt: "desc" },
        take: 20,
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Access Token</h1>
          <p className="text-muted-foreground">
            This portal link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // Serialize data
  const serialized = JSON.parse(JSON.stringify(client));

  return <ClientPortalDashboard client={serialized} />;
}
