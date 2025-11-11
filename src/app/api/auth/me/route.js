/**
 * Get Current User API Route
 * GET /api/auth/me
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { withAuth } from '@/lib/middleware/auth';

export async function GET(request) {
  return withAuth(request, async (user) => {
    try {
      const dal = getDAL();
      const role = await dal.findById('roles', user.roleId);
      
      const { password, ...userWithoutPassword } = user;
      
      return NextResponse.json({
        user: { ...userWithoutPassword, role }
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

