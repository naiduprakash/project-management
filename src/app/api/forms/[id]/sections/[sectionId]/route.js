/**
 * Form Section by ID API Routes
 * PUT /api/forms/:id/sections/:sectionId - Update section
 * DELETE /api/forms/:id/sections/:sectionId - Delete section
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withPermission } from '@/lib/middleware/auth';

export async function PUT(request, { params }) {
  return withPermission(request, 'forms.manage', async (user, role) => {
    try {
      const body = await request.json();
      const { title, description, fields, order } = body;
      const dal = getDAL();
      
      const form = await dal.findById('forms', params.id);
      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 404 }
        );
      }

      const sectionIndex = form.sections.findIndex(s => s.id === params.sectionId);
      if (sectionIndex === -1) {
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }

      const updatedSection = {
        ...form.sections[sectionIndex],
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(fields && { fields }),
        ...(order !== undefined && { order })
      };

      const updatedSections = [...form.sections];
      updatedSections[sectionIndex] = updatedSection;

      const updatedForm = await dal.updateById('forms', params.id, { 
        sections: updatedSections 
      });

      return NextResponse.json({
        message: 'Section updated successfully',
        form: updatedForm
      });
    } catch (error) {
      console.error('Update section error:', error);
      return NextResponse.json(
        { error: 'Failed to update section' },
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

      const updatedSections = form.sections.filter(s => s.id !== params.sectionId);
      
      if (updatedSections.length === form.sections.length) {
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }

      const updatedForm = await dal.updateById('forms', params.id, { 
        sections: updatedSections 
      });

      return NextResponse.json({
        message: 'Section deleted successfully',
        form: updatedForm
      });
    } catch (error) {
      console.error('Delete section error:', error);
      return NextResponse.json(
        { error: 'Failed to delete section' },
        { status: 500 }
      );
    }
  });
}

