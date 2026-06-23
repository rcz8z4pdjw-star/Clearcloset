import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';

// Get resources
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const saved = searchParams.get('saved');
    const search = searchParams.get('search');

    // Get user's age band
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ageBand = getAgeBand(userData.dateOfBirth, userData.ageBandOverride);

    // Build where clause
    const where: any = {
      isActive: true,
      ageBands: { has: ageBand },
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (type && type !== 'All') {
      where.type = type;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get resources
    const resources = await prisma.resource.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { downloads: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Get user's saved resources
    const savedResources = await prisma.savedResource.findMany({
      where: { userId: user.id },
      select: { resourceId: true },
    });

    const savedIds = new Set(savedResources.map(s => s.resourceId));

    // Filter by saved if requested
    let filteredResources = resources;
    if (saved === 'true') {
      filteredResources = resources.filter(r => savedIds.has(r.id));
    }

    const formattedResources = filteredResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      downloadUrl: resource.downloadUrl,
      externalUrl: resource.externalUrl,
      fileSize: resource.fileSize,
      duration: resource.duration,
      downloads: resource.downloads,
      featured: resource.featured,
      rating: resource.rating,
      isSaved: savedIds.has(resource.id),
    }));

    // Stats
    const stats = {
      total: resources.length,
      featured: resources.filter(r => r.featured).length,
      totalDownloads: resources.reduce((sum, r) => sum + (r.downloads || 0), 0),
      saved: savedResources.length,
    };

    return NextResponse.json({
      resources: formattedResources,
      stats,
    });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// Save/unsave resource or track download
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, action } = body;

    if (!resourceId || !action) {
      return NextResponse.json({ error: 'Resource ID and action are required' }, { status: 400 });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (action === 'save') {
      // Save resource
      const existing = await prisma.savedResource.findUnique({
        where: {
          userId_resourceId: {
            userId: user.id,
            resourceId,
          },
        },
      });

      if (!existing) {
        await prisma.savedResource.create({
          data: {
            userId: user.id,
            resourceId,
          },
        });
      }

      return NextResponse.json({ success: true, saved: true });
    } else if (action === 'unsave') {
      // Unsave resource
      await prisma.savedResource.deleteMany({
        where: {
          userId: user.id,
          resourceId,
        },
      });

      return NextResponse.json({ success: true, saved: false });
    } else if (action === 'download') {
      // Track download
      await prisma.resource.update({
        where: { id: resourceId },
        data: {
          downloads: { increment: 1 },
        },
      });

      // Log the download
      await prisma.resourceDownload.create({
        data: {
          userId: user.id,
          resourceId,
        },
      });

      return NextResponse.json({
        success: true,
        downloadUrl: resource.downloadUrl,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Resource action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

// Rate resource
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, rating } = body;

    if (!resourceId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid resource ID and rating (1-5) are required' }, { status: 400 });
    }

    // Create or update rating
    const existingRating = await prisma.resourceRating.findUnique({
      where: {
        userId_resourceId: {
          userId: user.id,
          resourceId,
        },
      },
    });

    if (existingRating) {
      await prisma.resourceRating.update({
        where: { id: existingRating.id },
        data: { rating },
      });
    } else {
      await prisma.resourceRating.create({
        data: {
          userId: user.id,
          resourceId,
          rating,
        },
      });
    }

    // Update average rating
    const avgRating = await prisma.resourceRating.aggregate({
      where: { resourceId },
      _avg: { rating: true },
    });

    await prisma.resource.update({
      where: { id: resourceId },
      data: { rating: avgRating._avg.rating || rating },
    });

    return NextResponse.json({
      success: true,
      newRating: avgRating._avg.rating,
    });
  } catch (error) {
    console.error('Rate resource error:', error);
    return NextResponse.json({ error: 'Failed to rate resource' }, { status: 500 });
  }
}
