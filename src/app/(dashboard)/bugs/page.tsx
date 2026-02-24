import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";
import { BugsPageClient } from "@/components/bugs/bugs-page-client";

export default async function BugsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });

  const admin = isElevated(user?.role ?? "");

  return <BugsPageClient isAdmin={admin} />;
}
