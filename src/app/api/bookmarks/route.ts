import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's bookmarks
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'lesson', 'video', 'article', 'tool', 'all'
    const folder = searchParams.get('folder');
    const favorites = searchParams.get('favorites') === 'true';

    // Build where clause
    const where: any = { userId: user.id };
    if (type && type !== 'all') {
      where.contentType = type.toUpperCase();
    }
    if (folder) {
      where.folder = folder;
    }
    if (favorites) {
      where.isFavorite = true;
    }

    // In a full implementation, we'd have a Bookmark model
    // For now, simulate the response structure
    const bookmarks = [
      {
        id: 'b1',
        contentId: 'lesson-123',
        contentType: 'LESSON',
        title: 'Understanding Compound Interest',
        description: 'Learn how compound interest can grow your money over time',
        category: 'Investing Basics',
        folder: null,
        isFavorite: true,
        progress: 75,
        savedAt: new Date().toISOString(),
      },
      {
        id: 'b2',
        contentId: 'tool-456',
        contentType: 'TOOL',
        title: 'Budget Planning Calculator',
        description: 'Interactive calculator to plan your monthly budget',
        category: 'Financial Tools',
        folder: 'Tools',
        isFavorite: false,
        progress: null,
        savedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // Get unique folders
    const folders = [...new Set(bookmarks.filter(b => b.folder).map(b => b.folder))];

    // Stats
    const stats = {
      total: bookmarks.length,
      favorites: bookmarks.filter(b => b.isFavorite).length,
      folders: folders.length,
      byType: {
        lessons: bookmarks.filter(b => b.contentType === 'LESSON').length,
        videos: bookmarks.filter(b => b.contentType === 'VIDEO').length,
        articles: bookmarks.filter(b => b.contentType === 'ARTICLE').length,
        tools: bookmarks.filter(b => b.contentType === 'TOOL').length,
      },
    };

    return NextResponse.json({
      bookmarks,
      folders,
      stats,
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

// Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, contentType, title, description, category, folder } = body;

    if (!contentId || !contentType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, contentType, title' },
        { status: 400 }
      );
    }

    // In a full implementation, create the bookmark in database
    const bookmark = {
      id: `bookmark_${Date.now()}`,
      userId: user.id,
      contentId,
      contentType,
      title,
      description,
      category,
      folder: folder || null,
      isFavorite: false,
      savedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      bookmark,
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

// Update a bookmark (toggle favorite, move to folder)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookmarkId, isFavorite, folder } = body;

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    // In a full implementation, update the bookmark in database
    const updates: any = {};
    if (isFavorite !== undefined) {
      updates.isFavorite = isFavorite;
    }
    if (folder !== undefined) {
      updates.folder = folder;
    }

    return NextResponse.json({
      success: true,
      updates,
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    );
  }
}

// Delete a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('id');

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    // In a full implementation, delete the bookmark from database

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed',
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
