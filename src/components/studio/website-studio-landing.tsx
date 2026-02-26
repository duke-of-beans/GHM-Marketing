"use client";

import { Suspense } from "react";
import { StudioClientPicker } from "./studio-client-picker";
import { WebsiteStudioTab } from "@/components/clients/website-studio/WebsiteStudioTab";
import { Skeleton } from "@/components/ui/skeleton";

export function WebsiteStudioLanding() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <StudioClientPicker
        studioName="Website Studio"
        studioIcon=""
        renderStudio={(client) => (
          <WebsiteStudioTab
            clientId={client.id}
            businessName={client.businessName}
          />
        )}
      />
    </Suspense>
  );
}
