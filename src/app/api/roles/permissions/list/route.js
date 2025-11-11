/**
 * Permissions List API Route
 * GET /api/roles/permissions/list - Get available permissions
 */

import { NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware/auth';

export async function GET(request) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      // Define available permissions
      const permissions = [
        { key: '*', description: 'All permissions (admin only)' },
        { key: 'projects.create', description: 'Create new projects' },
        { key: 'projects.read', description: 'View projects' },
        { key: 'projects.read.all', description: 'View all projects (not just own)' },
        { key: 'projects.update.own', description: 'Update own projects' },
        { key: 'projects.update.all', description: 'Update any project' },
        { key: 'projects.delete.own', description: 'Delete own projects' },
        { key: 'projects.delete.all', description: 'Delete any project' },
        { key: 'forms.read', description: 'View published forms' },
        { key: 'forms.manage', description: 'Create and manage forms' },
        { key: 'pages.read', description: 'View published pages' },
        { key: 'pages.manage', description: 'Create and manage pages' },
        { key: 'users.read', description: 'View users' },
        { key: 'users.manage', description: 'Manage users' },
        { key: 'roles.read', description: 'View roles' },
        { key: 'roles.manage', description: 'Manage roles' }
      ];

      return NextResponse.json({ permissions });
    } catch (error) {
      console.error('Get permissions error:', error);
      return NextResponse.json(
        { error: 'Failed to get permissions' },
        { status: 500 }
      );
    }
  });
}

