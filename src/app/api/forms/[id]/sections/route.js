/**
 * Form Sections API Routes
 * POST /api/forms/:id/sections - Add section to form
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withPermission } from '@/lib/middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
  return withPermission(request, 'forms.manage', async (user, role) => {
    try {
      const body = await request.json();
      const { title, description, fields = [], order } = body;

      if (!title) {
        return NextResponse.json(
          { error: 'Section title is required' },
          { status: 400 }
        );
      }

      const dal = getDAL();
      const form = await dal.findById('forms', params.id);
      
      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 404 }
        );
      }

      const newSection = {
        id: uuidv4(),
        title,
        description: description || '',
        fields,
        order: order !== undefined ? order : form.sections.length
      };

      const updatedSections = [...form.sections, newSection];
      const updatedForm = await dal.updateById('forms', params.id, { 
        sections: updatedSections 
      });

      return NextResponse.json(
        {
          message: 'Section added successfully',
          form: updatedForm
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Add section error:', error);
      return NextResponse.json(
        { error: 'Failed to add section' },
        { status: 500 }
      );
    }
  });
}

