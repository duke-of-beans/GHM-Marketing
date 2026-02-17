/**
 * User Permission Card Component
 * Expandable card for managing a single user's permissions
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { PermissionPresetSelector } from "./PermissionPresetSelector";
import { PermissionEditor } from "./PermissionEditor";
import {
  UserPermissions,
  PermissionPreset,
  getPreset,
  detectPreset,
} from "@/lib/permissions";
import { toast } from "sonner";

interface UserPermissionCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: UserPermissions;
    permissionPreset: PermissionPreset;
  };
  onUpdate: () => void;
}

export function UserPermissionCard({ user, onUpdate }: UserPermissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preset, setPreset] = useState<PermissionPreset>(user.permissionPreset);
  const [permissions, setPermissions] = useState<UserPermissions>(user.permissions);
  const [hasChanges, setHasChanges] = useState(false);

  function handlePresetChange(newPreset: PermissionPreset) {