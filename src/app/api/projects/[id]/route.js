/**
 * Project by ID API Routes
 * GET /api/projects/:id - Get project by ID
 * PUT /api/projects/:id - Update project
 * DELETE /api/projects/:id - Delete project
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const project = await dal.findById('projects', params.id);

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Check permissions
      const userRole = await dal.findById('roles', user.roleId);
      const canViewAll = userRole.permissions.includes('*') || 
                        userRole.permissions.includes('projects.read.all');
      
      if (!canViewAll && project.createdBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get form and creator details
      const creator = await dal.findById('users', project.createdBy);
      const form = await dal.findById('forms', project.formId);
      const { password, ...creatorWithoutPassword } = creator || {};

      return NextResponse.json({
        project: {
          ...project,
          creator: creatorWithoutPassword,
          form
        }
      });
    } catch (error) {
      console.error('Get project error:', error);
      return NextResponse.json(
        { error: 'Failed to get project' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request, { params }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { title, description, data, status } = body;
      const dal = getDAL();

      const project = await dal.findById('projects', params.id);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Check permissions
      const userRole = await dal.findById('roles', user.roleId);
      const canUpdateAll = userRole.permissions.includes('*') || 
                          userRole.permissions.includes('projects.update.all');
      const canUpdateOwn = userRole.permissions.includes('projects.update.own');
      
      if (!canUpdateAll && (!canUpdateOwn || project.createdBy !== user.id)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const updates = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (data) updates.data = data;
      if (status) updates.status = status;

      const updatedProject = await dal.updateById('projects', params.id, updates);

      // Get details for response
      const creator = await dal.findById('users', updatedProject.createdBy);
      const form = await dal.findById('forms', updatedProject.formId);
      const { password, ...creatorWithoutPassword } = creator;

      return NextResponse.json({
        message: 'Project updated successfully',
        project: {
          ...updatedProject,
          creator: creatorWithoutPassword,
          form: { id: form.id, title: form.title }
        }
      });
    } catch (error) {
      console.error('Update project error:', error);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request, { params }) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      
      const project = await dal.findById('projects', params.id);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Check permissions
      const userRole = await dal.findById('roles', user.roleId);
      const canDeleteAll = userRole.permissions.includes('*') || 
                          userRole.permissions.includes('projects.delete.all');
      const canDeleteOwn = userRole.permissions.includes('projects.delete.own');
      
      if (!canDeleteAll && (!canDeleteOwn || project.createdBy !== user.id)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      await dal.deleteById('projects', params.id);

      return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }
  });
}

