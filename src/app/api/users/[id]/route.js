/**
 * User by ID API Routes
 * GET /api/users/:id - Get user by ID
 * PUT /api/users/:id - Update user
 * DELETE /api/users/:id - Delete user
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withRole } from '@/lib/middleware/auth';
import { hashPassword } from '@/lib/auth-helpers';

export async function GET(request, { params }) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const dal = getDAL();
      const foundUser = await dal.findById('users', params.id);

      if (!foundUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { password, ...userWithoutPassword } = foundUser;
      const userRole = await dal.findById('roles', foundUser.roleId);

      return NextResponse.json({ 
        user: { ...userWithoutPassword, role: userRole } 
      });
    } catch (error) {
      console.error('Get user error:', error);
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request, { params }) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const body = await request.json();
      const { email, name, roleId, active, password } = body;
      const dal = getDAL();

      const foundUser = await dal.findById('users', params.id);
      if (!foundUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const updates = {};
      if (email) updates.email = email;
      if (name) updates.name = name;
      if (roleId) updates.roleId = roleId;
      if (typeof active !== 'undefined') updates.active = active;
      
      if (password) {
        updates.password = await hashPassword(password);
      }

      const updatedUser = await dal.updateById('users', params.id, updates);
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      const userRole = await dal.findById('roles', updatedUser.roleId);

      return NextResponse.json({
        message: 'User updated successfully',
        user: { ...userWithoutPassword, role: userRole }
      });
    } catch (error) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request, { params }) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const dal = getDAL();
      
      // Prevent deleting yourself
      if (params.id === user.id) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      await dal.deleteById('users', params.id);

      return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  });
}

