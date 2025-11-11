/**
 * Roles API Routes
 * GET /api/roles - Get all roles
 * POST /api/roles - Create role
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth, withRole } from '@/lib/middleware/auth';

export async function GET(request) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const roles = await dal.findAll('roles');

      return NextResponse.json({ roles });
    } catch (error) {
      console.error('Get roles error:', error);
      return NextResponse.json(
        { error: 'Failed to get roles' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const body = await request.json();
      const { name, displayName, description, permissions = [] } = body;

      if (!name || !displayName) {
        return NextResponse.json(
          { error: 'Name and displayName are required' },
          { status: 400 }
        );
      }

      const dal = getDAL();

      // Check if role already exists
      const existingRole = await dal.findOne('roles', { name });
      if (existingRole) {
        return NextResponse.json(
          { error: 'Role already exists' },
          { status: 400 }
        );
      }

      // Create role
      const newRole = await dal.create('roles', {
        name,
        displayName,
        description: description || '',
        permissions,
        isDefault: false
      });

      return NextResponse.json(
        {
          message: 'Role created successfully',
          role: newRole
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create role error:', error);
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      );
    }
  });
}

