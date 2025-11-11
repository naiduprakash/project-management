/**
 * Users API Routes
 * GET /api/users - Get all users
 * POST /api/users - Create user
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withRole } from '@/lib/middleware/auth';
import { hashPassword } from '@/lib/auth-helpers';

export async function GET(request) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const dal = getDAL();
      const users = await dal.findAll('users');
      
      // Remove passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      // Get roles for each user
      const usersWithRoles = await Promise.all(
        usersWithoutPasswords.map(async (user) => {
          const role = await dal.findById('roles', user.roleId);
          return { ...user, role };
        })
      );

      return NextResponse.json({ users: usersWithRoles });
    } catch (error) {
      console.error('Get users error:', error);
      return NextResponse.json(
        { error: 'Failed to get users' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request) {
  return withRole(request, ['admin'], async (user, role) => {
    try {
      const body = await request.json();
      const { email, password, name, roleId, active = true } = body;

      if (!email || !password || !name || !roleId) {
        return NextResponse.json(
          { error: 'Email, password, name, and roleId are required' },
          { status: 400 }
        );
      }

      const dal = getDAL();

      // Check if user already exists
      const existingUser = await dal.findOne('users', { email });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }

      // Verify role exists
      const userRole = await dal.findById('roles', roleId);
      if (!userRole) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await dal.create('users', {
        email,
        password: hashedPassword,
        name,
        roleId,
        active
      });

      const { password: _, ...userWithoutPassword } = newUser;

      return NextResponse.json(
        {
          message: 'User created successfully',
          user: { ...userWithoutPassword, role: userRole }
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create user error:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  });
}

