import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only master users can view bug reports
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== 'master') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const bugs = await prisma.bugReport.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    return NextResponse.json({ bugs });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bug reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      title,
      description,
      category,
      severity,
      pageUrl,
      userAgent,
      screenResolution,
      browserInfo,
      consoleErrors,
      networkErrors,
      recentActions,
      sessionData,
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Get user info from session
    let userId = null;
    let userEmail = null;
    let userName = null;
    
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true },
      });
      
      if (user) {
        userId = user.id;
        userEmail = user.email;
        userName = user.name;
      }
    }

    // Auto-categorize if not provided
    const autoCategory = category || detectCategory(pageUrl, description);

    // Find David Kirsch's user ID (master user)
    const davidKirsch = await prisma.user.findFirst({
      where: { 
        role: 'master',
      },
      select: { id: true },
    });

    // Create bug report
    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        category: autoCategory,
        severity: severity || 'medium',
        status: 'new',
        priority: determinePriority(severity, autoCategory),
        
        userId,
        userEmail,
        userName,
        
        pageUrl: pageUrl || 'unknown',
        userAgent: userAgent || 'unknown',
        screenResolution: screenResolution || 'unknown',
        
        browserInfo: browserInfo || {},
        consoleErrors: consoleErrors || [],
        networkErrors: networkErrors || [],
        recentActions: recentActions || [],
        sessionData: sessionData || {},
        
        assignedTo: davidKirsch?.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      bugReport: {
        id: bugReport.id,
        title: bugReport.title,
        category: bugReport.category,
      },
    });

  } catch (error) {
    console.error('Error creating bug report:', error);
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    );
  }
}

// Helper: Auto-detect category based on URL and description
function detectCategory(url: string, description: string): string {
  const urlLower = url.toLowerCase();
  const descLower = description.toLowerCase();
  
  if (urlLower.includes('/content') || descLower.includes('content') || descLower.includes('blog') || descLower.includes('social')) {
    return 'content';
  }
  if (urlLower.includes('/compensation') || descLower.includes('commission') || descLower.includes('residual')) {
    return 'compensation';
  }
  if (urlLower.includes('/scan') || descLower.includes('scan') || descLower.includes('competitive')) {
    return 'scans';
  }
  if (urlLower.includes('/client') || descLower.includes('client profile')) {
    return 'clients';
  }
  if (urlLower.includes('/lead') || descLower.includes('lead')) {
    return 'leads';
  }
  if (descLower.includes('slow') || descLower.includes('performance') || descLower.includes('loading')) {
    return 'performance';
  }
  if (descLower.includes('button') || descLower.includes('layout') || descLower.includes('display')) {
    return 'ui';
  }
  
  return 'other';
}

// Helper: Determine priority
function determinePriority(severity: string | undefined, category: string): string {
  if (severity === 'critical') return 'top';
  if (severity === 'high') return 'high';
  if (category === 'compensation' || category === 'clients') return 'high';
  return 'high';
}
