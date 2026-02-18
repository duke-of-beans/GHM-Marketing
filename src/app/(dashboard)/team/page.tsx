import { redirect } from "next/navigation";

// Team management moved to Settings > Team tab
export default function TeamPage() {
  redirect("/settings?tab=team");
}
