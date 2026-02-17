/**
 * Permission Preset Selector Component
 * Dropdown for selecting permission templates
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESET_METADATA, PermissionPreset } from "@/lib/permissions";

interface PermissionPresetSelectorProps {
  value: PermissionPreset;
  onChange: (preset: PermissionPreset) => void;
  disabled?: boolean;
}

export function PermissionPresetSelector({
  value,
  onChange,
  disabled = false,
}: PermissionPresetSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRESET_METADATA).map(([presetId, metadata]) => (
          <SelectItem key={presetId} value={presetId}>
            <div className="flex flex-col">
              <span className="font-medium">{metadata.label}</span>
              <span className="text-xs text-muted-foreground">
                {metadata.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
