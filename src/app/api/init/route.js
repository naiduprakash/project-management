/**
 * Initialization API Route
 * POST /api/init - Initialize default data and admin user
 * This should be called once after deployment
 */

import { NextResponse } from 'next/server';
import { getDAL } from '@/lib/dal/filesystem';
import { hashPassword } from '@/lib/auth-helpers';

// Security: Only allow initialization if no users exist
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      adminEmail = 'admin@example.com', 
      adminPassword = 'admin123',
      adminName = 'Administrator',
      initKey 
    } = body;

    // Optional: Add a secret key for extra security
    const INIT_SECRET = process.env.INIT_SECRET;
    if (INIT_SECRET && initKey !== INIT_SECRET) {
      return NextResponse.json(
        { error: 'Invalid initialization key' },
        { status: 403 }
      );
    }

    const dal = getDAL();
    
    // Initialize the data directory and files
    await dal.init();

    // Check if already initialized
    const existingUsers = await dal.findAll('users');
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'System already initialized. Users already exist.' },
        { status: 400 }
      );
    }

    // Initialize roles
    let adminRole = await dal.findOne('roles', { name: 'admin' });
    let userRole = await dal.findOne('roles', { name: 'user' });

    if (!adminRole) {
      adminRole = await dal.create('roles', {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        permissions: ['*'],
        isDefault: true
      });
    }

    if (!userRole) {
      userRole = await dal.create('roles', {
        name: 'user',
        displayName: 'Normal User',
        description: 'Standard user access',
        permissions: [
          'projects.create',
          'projects.read',
          'projects.update.own',
          'projects.delete.own'
        ],
        isDefault: true
      });
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = await dal.create('users', {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      roleId: adminRole.id,
      active: true
    });

    // Create default "Projects" page
    const projectsPage = await dal.create('pages', {
      title: 'Projects',
      slug: 'projects',
      description: 'Manage your projects',
      icon: 'folder',
      published: true,
      isPublished: true,
      createdBy: adminUser.id
    });

    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
      data: {
        adminEmail,
        rolesCreated: 2,
        pagesCreated: 1,
        note: 'Please change the admin password immediately after login'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { error: 'Initialization failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check initialization status
export async function GET() {
  try {
    const dal = getDAL();
    await dal.init();
    
    const users = await dal.findAll('users');
    const roles = await dal.findAll('roles');
    const pages = await dal.findAll('pages');

    return NextResponse.json({
      initialized: users.length > 0,
      stats: {
        users: users.length,
        roles: roles.length,
        pages: pages.length
      },
      environment: process.env.VERCEL ? 'vercel' : 'local',
      dataDir: dal.dataDir
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check status', details: error.message },
      { status: 500 }
    );
  }
}

