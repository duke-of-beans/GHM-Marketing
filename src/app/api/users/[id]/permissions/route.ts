/**
 * API Route: Update user permissions
 * POST /api/users/[id]/permissions
 * 
 * Allows masters to update a user's permission settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMaster, handlePermissionError } from '@/lib/permissions';
import { 
  UserPermissions, 
  PermissionPreset,
  isUserPermissions,
  getPreset,
  detectPreset 
} from '@/lib/permissions';
import { z } from 'zod';

const updatePermissionsSchema = z.object({
  permissionPreset: z.enum(['sales_basic', 'sales_advanced', 'master_lite', 'master_full', 'custom']).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const user = session?.user;
    
    // Only masters can update permissions
    requireMaster(user);
    
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validation = updatePermissionsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error },
        { status: 400 }
      );
    }
    
    const { permissionPreset, permissions } = validation.data;
    
    // Determine final permissions and preset
    let finalPermissions: UserPermissions;
    let finalPreset: PermissionPreset;
    
    if (permissionPreset && permissionPreset !== 'custom') {
      // Use preset
      const presetPermissions = getPreset(permissionPreset);
      if (!presetPermissions) {
        return NextResponse.json(
          { error: 'Invalid preset' },
          { status: 400 }
        );
      }
      finalPermissions = presetPermissions;
      finalPreset = permissionPreset;
    } else if (permissions) {
      // Custom permissions
      if (!isUserPermissions(permissions)) {
        return NextResponse.json(
          { error: 'Invalid permissions object' },
          { status: 400 }
        );
      }
      finalPermissions = permissions;
      finalPreset = detectPreset(permissions);
    } else {
      return NextResponse.json(
        { error: 'Must provide either permissionPreset or permissions' },
        { status: 400 }
      );
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: finalPermissions,
        permissionPreset: finalPreset,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        permissionPreset: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
    
  } catch (error) {
    return handlePermissionError(error);
  }
}

/**
 * GET /api/users/[id]/permissions
 * Fetch a user's current permissions
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Masters can view anyone's permissions
    // Sales reps can only view their own
    if (user.role !== 'master' && user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        permissionPreset: true,
      },
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: targetUser,
    });
    
  } catch (error) {
    return handlePermissionError(error);
  }
}
