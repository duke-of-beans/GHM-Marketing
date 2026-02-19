/**
 * API Route: Get available permission presets
 * GET /api/permissions/presets
 * 
 * Returns all available permission presets with their metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-permissions';
import { 
  PERMISSION_PRESETS,
  PRESET_METADATA,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES,
  MASTER_ONLY_FEATURES
} from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const permissionError = await withPermission(req, "manage_team");
    if (permissionError) return permissionError;
    
    return NextResponse.json({
      success: true,
      presets: PERMISSION_PRESETS,
      metadata: PRESET_METADATA,
      permissionLabels: PERMISSION_LABELS,
      permissionDescriptions: PERMISSION_DESCRIPTIONS,
      permissionCategories: PERMISSION_CATEGORIES,
      masterOnlyFeatures: MASTER_ONLY_FEATURES,
    });
    
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
