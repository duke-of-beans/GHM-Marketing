"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Users, Sliders, Map, FileText, ArrowRight, Bug, Zap, Activity, Paintbrush, DollarSign, Database } from "lucide-react";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { CompensationTab } from "@/components/settings/CompensationTab";
import { TeamManagementTab } from "@/components/settings/TeamManagementTab";
import { BugReportsTab } from "@/components/settings/BugReportsTab";
import { UserActivityTab } from "@/components/settings/UserActivityTab";
import { WaveSettingsTab } from "@/components/settings/WaveSettingsTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { DataImportTab } from "@/components/settings/DataImportTab";
import { BrandingTab } from "@/components/settings/BrandingTab";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Import the client component directly — avoids server-only headers() call that occurs
// when importing the territories page (which is a server component).
const TerritoriesContent = dynamic(
  () => import("@/components/territories/territories-client").then((m) => ({ default: m.TerritoriesClient })),
  { ssr: false, loading: () => <div className="animate-pulse h-32 bg-muted rounded-lg" /> }
);

// "positions" and "permissions" are now sub-sections inside the "team" tab
const VALID_TABS = ["general", "compensation", "branding", "team", "territories", "audit", "bugs", "activity", "wave", "integrations", "data-import"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role ?? "manager";
  const isAdmin = currentUserRole === "admin";
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && VALID_TABS.includes(tab)) setActiveTab(tab);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your platform, manage your team, and control access
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5">
            <Sliders className="h-4 w-4" />General
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="compensation" className="gap-1.5">
              <DollarSign className="h-4 w-4" />Compensation
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="branding" className="gap-1.5">
              <Paintbrush className="h-4 w-4" />Branding
            </TabsTrigger>
          )}
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-4 w-4" />Team
          </TabsTrigger>
          <TabsTrigger value="territories" className="gap-1.5">
            <Map className="h-4 w-4" />Territories
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <FileText className="h-4 w-4" />Audit Log
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="bugs" className="gap-1.5">
              <Bug className="h-4 w-4" />Bug Reports
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-4 w-4" />User Activity
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="wave" className="gap-1.5">
              💳 Wave
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="integrations" className="gap-1.5">
              <Zap className="h-4 w-4" />Integrations
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="data-import" className="gap-1.5">
              <Database className="h-4 w-4" />Data Import
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="compensation">
            <CompensationTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="branding">
            <BrandingTab />
          </TabsContent>
        )}

        <TabsContent value="team">
          <TeamManagementTab currentUserRole={currentUserRole} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="territories">
          <TerritoriesContent />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Full history of changes made across the platform — user actions, permission changes, client updates, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/audit">
                  Open Audit Log <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="bugs">
            <BugReportsTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="activity">
            <UserActivityTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="wave">
            <WaveSettingsTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="data-import">
            <DataImportTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

