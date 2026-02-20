"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Users, Sliders, Map, Shield, FileText, ArrowRight, Bug, Zap } from "lucide-react";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { TeamManagementTab } from "@/components/settings/TeamManagementTab";
import { BugReportsTab } from "@/components/settings/BugReportsTab";
import { WaveSettingsTab } from "@/components/settings/WaveSettingsTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Territories is a client component — safe to embed
const TerritoriesContent = dynamic(
  () => import("@/app/(dashboard)/territories/page"),
  { ssr: false, loading: () => <div className="animate-pulse h-32 bg-muted rounded-lg" /> }
);

const VALID_TABS = ["general", "team", "territories", "permissions", "audit", "bugs", "wave", "integrations"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role ?? "master";
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
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-4 w-4" />Team
          </TabsTrigger>
          <TabsTrigger value="territories" className="gap-1.5">
            <Map className="h-4 w-4" />Territories
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5">
            <Shield className="h-4 w-4" />Permissions
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
            <TabsTrigger value="wave" className="gap-1.5">
              💳 Wave
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="integrations" className="gap-1.5">
              <Zap className="h-4 w-4" />Integrations
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementTab currentUserRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="territories">
          <TerritoriesContent />
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Presets
              </CardTitle>
              <CardDescription>
                Manage role-based permission presets that control what each team member can see and do across the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/permissions">
                  Open Permissions Manager <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
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
          <TabsContent value="wave">
            <WaveSettingsTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
