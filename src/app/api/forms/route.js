/**
 * Forms API Routes
 * GET /api/forms - Get all forms
 * POST /api/forms - Create form
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth, withPermission } from '@/lib/middleware/auth';

export async function GET(request) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const { searchParams } = new URL(request.url);
      const pageId = searchParams.get('pageId');

      let forms = await dal.findAll('forms');

      // Filter by pageId if specified
      if (pageId) {
        forms = forms.filter(form => form.pageId === pageId);
      }

      return NextResponse.json({ forms });
    } catch (error) {
      console.error('Get forms error:', error);
      return NextResponse.json(
        { error: 'Failed to get forms' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request) {
  return withPermission(request, 'forms.manage', async (user, role) => {
    try {
      const body = await request.json();
      const { pageId, title, description, sections = [], settings = {} } = body;

      if (!pageId || !title) {
        return NextResponse.json(
          { error: 'PageId and title are required' },
          { status: 400 }
        );
      }

      const dal = getDAL();

      // Verify page exists
      const page = await dal.findById('pages', pageId);
      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 400 }
        );
      }

      // Create form
      const form = await dal.create('forms', {
        pageId,
        title,
        description: description || '',
        sections,
        settings: {
          multiPage: settings.multiPage || false,
          showProgressBar: settings.showProgressBar !== false,
          allowSaveDraft: settings.allowSaveDraft !== false,
          ...settings
        },
        createdBy: user.id
      });

      return NextResponse.json(
        {
          message: 'Form created successfully',
          form
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create form error:', error);
      return NextResponse.json(
        { error: 'Failed to create form' },
        { status: 500 }
      );
    }
  });
}

