/**
 * API Route: Get available permission presets
 * GET /api/permissions/presets
 * 
 * Returns all available permission presets with their metadata
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isElevated } from '@/lib/auth/session';
import { 
  PERMISSION_PRESETS,
  PRESET_METADATA,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES,
  MASTER_ONLY_FEATURES
} from '@/lib/permissions';

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only masters can view preset configuration
    if (!isElevated(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
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
