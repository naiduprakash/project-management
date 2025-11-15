/**
 * Pages API Routes
 * GET /api/pages - Get all pages
 * POST /api/pages - Create page
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth, withPermission } from '@/lib/middleware/auth';

export async function GET(request) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const { searchParams } = new URL(request.url);
      const published = searchParams.get('published');

      let pages = await dal.findAll('pages');

      // Filter by published status if specified
      if (published !== undefined && published !== null) {
        const isPublished = published === 'true';
        pages = pages.filter(page => page.published === isPublished);
      }

      // Get forms for each page and add slug
      const pagesWithForms = await Promise.all(
        pages.map(async (page) => {
          const forms = await dal.findAll('forms', { pageId: page.id });
          // Generate slug from title if not exists
          const slug = page.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          // Ensure both published and isPublished fields exist for backward compatibility
          const pagePublished = page.published !== undefined ? page.published : page.isPublished;
          const isPublished = page.isPublished !== undefined ? page.isPublished : page.published;
          return { ...page, slug, forms, published: pagePublished, isPublished };
        })
      );

      return NextResponse.json(pagesWithForms);
    } catch (error) {
      console.error('Get pages error:', error);
      return NextResponse.json(
        { error: 'Failed to get pages' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request) {
  return withPermission(request, 'pages.manage', async (user, role) => {
    try {
      const body = await request.json();
      const { title, description, icon, published = false } = body;

      if (!title) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }

      const dal = getDAL();
      
      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Create page
      const page = await dal.create('pages', {
        title,
        slug,
        description: description || '',
        icon: icon || 'document',
        published,
        isPublished: published,
        createdBy: user.id
      });

      return NextResponse.json(
        {
          message: 'Page created successfully',
          page: { ...page, forms: [] }
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create page error:', error);
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }
  });
}

