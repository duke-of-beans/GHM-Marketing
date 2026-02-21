import { redirect } from "next/navigation";

/**
 * /review is retired — content review queue lives at /tasks?tab=approvals.
 * Permanent redirect preserves any direct links.
 */
export default function ReviewPage() {
  redirect("/tasks?tab=approvals");
}
