/**
 * Page by ID API Routes
 * GET /api/pages/:id - Get page by ID
 * PUT /api/pages/:id - Update page
 * DELETE /api/pages/:id - Delete page
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth, withPermission } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const page = await dal.findById('pages', params.id);

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }

      // Get forms for this page
      const forms = await dal.findAll('forms', { pageId: page.id });
      
      // Generate slug if not exists
      const slug = page.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Ensure both published and isPublished fields exist for backward compatibility
      const published = page.published !== undefined ? page.published : page.isPublished;
      const isPublished = page.isPublished !== undefined ? page.isPublished : page.published;

      return NextResponse.json({ 
        ...page, 
        slug, 
        forms, 
        published, 
        isPublished 
      });
    } catch (error) {
      console.error('Get page error:', error);
      return NextResponse.json(
        { error: 'Failed to get page' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request, { params }) {
  return withPermission(request, 'pages.manage', async (user, role) => {
    try {
      const body = await request.json();
      const { title, description, icon, published } = body;
      const dal = getDAL();

      const page = await dal.findById('pages', params.id);
      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }

      const updates = {};
      if (title) {
        updates.title = title;
        // Update slug when title changes
        updates.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      if (description !== undefined) updates.description = description;
      if (icon) updates.icon = icon;
      if (typeof published !== 'undefined') {
        updates.published = published;
        updates.isPublished = published;
      }

      const updatedPage = await dal.updateById('pages', params.id, updates);

      return NextResponse.json({
        message: 'Page updated successfully',
        page: updatedPage
      });
    } catch (error) {
      console.error('Update page error:', error);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request, { params }) {
  return withPermission(request, 'pages.manage', async (user, role) => {
    try {
      const dal = getDAL();
      
      const page = await dal.findById('pages', params.id);
      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }

      // Delete all forms associated with this page
      const forms = await dal.findAll('forms', { pageId: params.id });
      for (const form of forms) {
        await dal.deleteById('forms', form.id);
      }

      // Delete the page
      await dal.deleteById('pages', params.id);

      return NextResponse.json({ 
        message: 'Page and associated forms deleted successfully' 
      });
    } catch (error) {
      console.error('Delete page error:', error);
      return NextResponse.json(
        { error: 'Failed to delete page' },
        { status: 500 }
      );
    }
  });
}

