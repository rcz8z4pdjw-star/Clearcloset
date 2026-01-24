import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's notes
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const tag = searchParams.get('tag');
    const favorites = searchParams.get('favorites') === 'true';
    const search = searchParams.get('search');

    // In a full implementation, we'd have a Note model in Prisma
    // For now, simulate the response
    const notes = [
      {
        id: 'n1',
        title: 'Compound Interest Formula',
        content: 'A = P(1 + r/n)^(nt)\n\nWhere:\n- A = Final amount\n- P = Principal\n- r = Annual interest rate\n- n = Times compounded per year\n- t = Time in years',
        lessonId: 'lesson-1',
        lessonTitle: 'Understanding Compound Interest',
        tags: ['investing', 'formulas', 'important'],
        isFavorite: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'n2',
        title: '50/30/20 Budget Rule',
        content: '- 50% for Needs\n- 30% for Wants\n- 20% for Savings',
        lessonId: 'lesson-2',
        lessonTitle: 'Building Your First Budget',
        tags: ['budgeting', 'rules'],
        isFavorite: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    // Apply filters
    let filteredNotes = notes;

    if (lessonId) {
      filteredNotes = filteredNotes.filter((n) => n.lessonId === lessonId);
    }
    if (tag) {
      filteredNotes = filteredNotes.filter((n) => n.tags.includes(tag));
    }
    if (favorites) {
      filteredNotes = filteredNotes.filter((n) => n.isFavorite);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotes = filteredNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.content.toLowerCase().includes(searchLower)
      );
    }

    // Get all unique tags
    const allTags = [...new Set(notes.flatMap((n) => n.tags))];

    return NextResponse.json({
      notes: filteredNotes,
      tags: allTags,
      stats: {
        total: notes.length,
        favorites: notes.filter((n) => n.isFavorite).length,
        lessons: new Set(notes.map((n) => n.lessonId)).size,
      },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, lessonId, lessonTitle, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const note = {
      id: `note_${Date.now()}`,
      userId: user.id,
      title,
      content,
      lessonId: lessonId || null,
      lessonTitle: lessonTitle || 'General Notes',
      tags: tags || [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Award XP for creating notes (encouraging learning behavior)
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: 5 } },
    });

    return NextResponse.json({
      success: true,
      note,
      xpEarned: 5,
    });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// Update a note
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, title, content, tags, isFavorite } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const updates: any = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (isFavorite !== undefined) updates.isFavorite = isFavorite;

    return NextResponse.json({
      success: true,
      updates,
    });
  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
