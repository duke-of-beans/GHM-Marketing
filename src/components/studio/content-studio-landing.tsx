"use client";

import { Suspense } from "react";
import { StudioClientPicker } from "./studio-client-picker";
import { ContentStudioTab } from "@/components/content/ContentStudioTab";
import { Skeleton } from "@/components/ui/skeleton";

export function ContentStudioLanding() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <StudioClientPicker
        studioName="Content Studio"
        studioIcon="✍️"
        renderStudio={(client) => (
          <ContentStudioTab clientId={client.id} />
        )}
      />
    </Suspense>
  );
}
