/**
 * Form by ID API Routes
 * GET /api/forms/:id - Get form by ID
 * PUT /api/forms/:id - Update form
 * DELETE /api/forms/:id - Delete form
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth, withPermission } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const form = await dal.findById('forms', params.id);

      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ form });
    } catch (error) {
      console.error('Get form error:', error);
      return NextResponse.json(
        { error: 'Failed to get form' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request, { params }) {
  return withPermission(request, 'forms.manage', async (user, role) => {
    try {
      const body = await request.json();
      const { title, description, sections, pages, settings, published } = body;
      const dal = getDAL();

      console.log('Form update request received for ID:', params.id);
      console.log('Request body keys:', Object.keys(body));
      console.log('Has pages:', !!pages);
      console.log('Has sections:', !!sections);
      if (pages) {
        console.log('Pages count:', pages.length);
        console.log('First page sections count:', pages[0]?.sections?.length);
      }

      const form = await dal.findById('forms', params.id);
      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 404 }
        );
      }

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (sections) updates.sections = sections;
      if (pages) updates.pages = pages; // Support new pages structure
      if (settings) updates.settings = { ...form.settings, ...settings };
      if (published !== undefined) updates.published = published;

      console.log('Updating form with:', Object.keys(updates));

      const updatedForm = await dal.updateById('forms', params.id, updates);
      
      console.log('Form updated successfully');

      return NextResponse.json({
        message: 'Form updated successfully',
        form: updatedForm
      });
    } catch (error) {
      console.error('Update form error:', error);
      return NextResponse.json(
        { error: 'Failed to update form' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request, { params }) {
  return withPermission(request, 'forms.manage', async (user, role) => {
    try {
      const dal = getDAL();
      
      const form = await dal.findById('forms', params.id);
      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 404 }
        );
      }

      // Check if there are projects using this form
      const projects = await dal.findAll('projects', { formId: params.id });
      if (projects.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot delete form with existing projects',
            projectCount: projects.length 
          },
          { status: 400 }
        );
      }

      await dal.deleteById('forms', params.id);

      return NextResponse.json({ message: 'Form deleted successfully' });
    } catch (error) {
      console.error('Delete form error:', error);
      return NextResponse.json(
        { error: 'Failed to delete form' },
        { status: 500 }
      );
    }
  });
}

