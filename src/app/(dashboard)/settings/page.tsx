"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, Sliders } from "lucide-react";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { TeamManagementTab } from "@/components/settings/TeamManagementTab";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role ?? "master";
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    // Read ?tab=team from URL without useSearchParams (avoids Suspense/session conflict)
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "team") {
      setActiveTab("team");
    }
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure global settings and manage your team
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Sliders className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementTab currentUserRole={currentUserRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
