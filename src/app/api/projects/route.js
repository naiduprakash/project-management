/**
 * Projects API Routes
 * GET /api/projects - Get all projects with filtering, sorting, and pagination
 * POST /api/projects - Create project
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const { searchParams } = new URL(request.url);
      
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const search = searchParams.get('search') || '';
      const formId = searchParams.get('formId');
      const status = searchParams.get('status');
      const createdBy = searchParams.get('createdBy');

      // Build filter
      const filter = {};
      if (formId) filter.formId = formId;
      if (status) filter.status = status;
      
      // Check user permissions
      const userRole = await dal.findById('roles', user.roleId);
      const canViewAll = userRole.permissions.includes('*') || 
                        userRole.permissions.includes('projects.read.all');
      
      // If user can't view all, only show their own projects
      if (!canViewAll) {
        filter.createdBy = user.id;
      } else if (createdBy) {
        filter.createdBy = createdBy;
      }

      // Build sort
      const sort = { [sortBy]: sortOrder };

      // Build search
      const searchFilter = search ? { title: search, description: search } : {};

      // Get paginated results
      const result = await dal.paginate('projects', {
        filter,
        page,
        limit,
        sort,
        search: searchFilter
      });

      // Populate creator and form information
      const projectsWithDetails = await Promise.all(
        result.data.map(async (project) => {
          const creator = await dal.findById('users', project.createdBy);
          const form = await dal.findById('forms', project.formId);
          const { password, ...creatorWithoutPassword } = creator || {};
          
          return {
            ...project,
            creator: creatorWithoutPassword,
            form: form ? { id: form.id, title: form.title } : null
          };
        })
      );

      return NextResponse.json({
        projects: projectsWithDetails,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get projects error:', error);
      return NextResponse.json(
        { error: 'Failed to get projects' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { formId, title, description, data, status = 'draft' } = body;

      if (!formId || !title || !data) {
        return NextResponse.json(
          { error: 'FormId, title, and data are required' },
          { status: 400 }
        );
      }

      const dal = getDAL();

      // Verify form exists
      const form = await dal.findById('forms', formId);
      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 400 }
        );
      }

      // Create project
      const project = await dal.create('projects', {
        formId,
        title,
        description: description || '',
        data,
        status,
        createdBy: user.id
      });

      // Get form details for response
      const creator = await dal.findById('users', project.createdBy);
      const { password, ...creatorWithoutPassword } = creator;

      return NextResponse.json(
        {
          message: 'Project created successfully',
          project: {
            ...project,
            creator: creatorWithoutPassword,
            form: { id: form.id, title: form.title }
          }
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create project error:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }
  });
}

