/**
 * Preset Selector
 * Dropdown to select permission presets
 */

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PRESET_OPTIONS = [
  {
    value: "sales_basic",
    label: "Sales Basic",
    description: "Minimal access for new sales representatives",
  },
  {
    value: "sales_advanced",
    label: "Sales Advanced",
    description: "Enhanced access for high-performing sales reps",
  },
  {
    value: "master_lite",
    label: "Master Lite",
    description: "Client management without full master privileges",
  },
  {
    value: "master_full",
    label: "Master Full",
    description: "Full manager access to all features",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Manually configured permissions",
  },
];

interface PresetSelectorProps {
  currentPreset: string;
  onChange: (preset: string) => void;
}

export function PresetSelector({ currentPreset, onChange }: PresetSelectorProps) {
  const selectedPreset = PRESET_OPTIONS.find(p => p.value === currentPreset);

  return (
    <div className="space-y-2">
      <Label>Permission Preset</Label>
      <Select value={currentPreset} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              <div className="flex flex-col">
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPreset && (
        <p className="text-xs text-muted-foreground">
          {selectedPreset.description}
        </p>
      )}
    </div>
  );
}
