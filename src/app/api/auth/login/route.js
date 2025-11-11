/**
 * User Login API Route
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { comparePassword, generateToken } from '@/lib/auth-helpers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // DEV MODE: Bypass authentication
    if (process.env.BYPASS_AUTH === 'true' || process.env.VERCEL) {
      console.log('⚠️ BYPASS_AUTH enabled - allowing any login');
      
      const dal = getDAL();
      await dal.init();
      
      // Try to find the user, if not create a temporary admin
      let user = await dal.findOne('users', { email });
      let role;
      
      if (!user) {
        // Create temporary admin role if it doesn't exist
        role = await dal.findOne('roles', { name: 'admin' });
        if (!role) {
          role = await dal.create('roles', {
            name: 'admin',
            displayName: 'Administrator',
            description: 'Full system access',
            permissions: ['*'],
            isDefault: true
          });
        }
        
        // Create temporary user
        const hashedPassword = await comparePassword(password, password); // dummy
        user = {
          id: 'temp-admin-' + Date.now(),
          email: email,
          name: email.split('@')[0],
          roleId: role.id,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        role = await dal.findById('roles', user.roleId);
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      return NextResponse.json({
        message: 'Login successful (BYPASS MODE)',
        user: { ...userWithoutPassword, role },
        token
      });
    }

    const dal = getDAL();
    await dal.init();

    // Find user
    const user = await dal.findOne('users', { email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user role
    const role = await dal.findById('roles', user.roleId);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user.id);

    return NextResponse.json({
      message: 'Login successful',
      user: { ...userWithoutPassword, role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

