"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageComposer } from "@/components/clients/website-studio/PageComposer";

export default function ComposerPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Number(params.id);
  const jobId = Number(params.jobId);

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/website-studio/${clientId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const found = json.data.buildJobs?.find((j: any) => j.id === jobId);
      if (!found) throw new Error("Build job not found");
      setJob(found);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load build job");
    } finally {
      setLoading(false);
    }
  }, [clientId, jobId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading composer...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-24 text-muted-foreground text-sm">
        Build job not found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageComposer
        clientId={clientId}
        job={job}
        initialPageId={null}
        onBack={() => router.push(`/clients/${clientId}`)}
        onRefresh={load}
      />
    </div>
  );
}
