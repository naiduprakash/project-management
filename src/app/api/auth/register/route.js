/**
 * User Registration API Route
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { hashPassword, generateToken, initializeDefaultRoles } from '@/lib/auth-helpers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const dal = getDAL();
    await dal.init();

    // Check if user already exists
    const existingUser = await dal.findOne('users', { email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Get default 'user' role
    let userRole = await dal.findOne('roles', { name: 'user' });
    
    // If no roles exist, create default roles
    if (!userRole) {
      await initializeDefaultRoles(dal);
      userRole = await dal.findOne('roles', { name: 'user' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await dal.create('users', {
      email,
      password: hashedPassword,
      name,
      roleId: userRole.id,
      active: true
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user.id);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userWithoutPassword,
        token
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

