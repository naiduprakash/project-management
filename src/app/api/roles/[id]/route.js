/**
 * Role by ID API Routes
 * GET /api/roles/:id - Get role by ID
 * PUT /api/roles/:id - Update role
 * DELETE /api/roles/:id - Delete role
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth, withRole } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const role = await dal.findById('roles', params.id);

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ role });
    } catch (error) {
      console.error('Get role error:', error);
      return NextResponse.json(
        { error: 'Failed to get role' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request, { params }) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const body = await request.json();
      const { displayName, description, permissions } = body;
      const dal = getDAL();

      const foundRole = await dal.findById('roles', params.id);
      if (!foundRole) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }

      // Prevent modifying default roles' core properties
      if (foundRole.isDefault && body.name) {
        return NextResponse.json(
          { error: 'Cannot change name of default roles' },
          { status: 400 }
        );
      }

      const updates = {};
      if (displayName) updates.displayName = displayName;
      if (description !== undefined) updates.description = description;
      if (permissions) updates.permissions = permissions;

      const updatedRole = await dal.updateById('roles', params.id, updates);

      return NextResponse.json({
        message: 'Role updated successfully',
        role: updatedRole
      });
    } catch (error) {
      console.error('Update role error:', error);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request, { params }) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const dal = getDAL();
      
      const foundRole = await dal.findById('roles', params.id);
      if (!foundRole) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }

      // Prevent deleting default roles
      if (foundRole.isDefault) {
        return NextResponse.json(
          { error: 'Cannot delete default roles' },
          { status: 400 }
        );
      }

      // Check if any users have this role
      const usersWithRole = await dal.findAll('users', { roleId: params.id });
      if (usersWithRole.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot delete role with assigned users',
            userCount: usersWithRole.length 
          },
          { status: 400 }
        );
      }

      await dal.deleteById('roles', params.id);

      return NextResponse.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Delete role error:', error);
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      );
    }
  });
}

