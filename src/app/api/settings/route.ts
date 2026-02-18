import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-permissions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_settings");
  if (permissionError) return permissionError;

  try {
    // Get or create settings
    let settings = await prisma.globalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {},
      });
    }

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_settings");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();

    // Get or create settings
    let settings = await prisma.globalSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {},
      });
    }

    // Update settings
    const updated = await prisma.globalSettings.update({
      where: { id: settings.id },
      data: body,
    });

    return NextResponse.json({ success: true, settings: updated });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
