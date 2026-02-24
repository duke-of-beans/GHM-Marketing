import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isElevated } from "@/lib/auth/roles";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (isElevated(session.user.role)) {
    redirect("/manager");
  }

  redirect("/sales");
}
