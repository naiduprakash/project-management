/**
 * Authentication Middleware for Next.js API Routes
 * Handles JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const { getDAL } = require('../dal/filesystem');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and return user
 */
export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const dal = getDAL();
    await dal.init(); // Ensure DAL is initialized
    
    let user = await dal.findById('users', decoded.userId);
    
    // DEV MODE: If user not found but we're on Vercel/bypass mode, create temp admin
    if (!user && (process.env.BYPASS_AUTH === 'true' || process.env.VERCEL)) {
      console.log('⚠️ BYPASS_AUTH: Creating temp user for token', decoded.userId);
      
      let role = await dal.findOne('roles', { name: 'admin' });
      if (!role) {
        role = await dal.create('roles', {
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full system access',
          permissions: ['*'],
          isDefault: true
        });
      }
      
      user = {
        id: decoded.userId,
        email: 'temp@example.com',
        name: 'Temporary Admin',
        roleId: role.id,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    if (!user.active) {
      return { error: 'Account is disabled', status: 401 };
    }

    return { user };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return { error: 'Invalid token', status: 401 };
    }
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token expired', status: 401 };
    }
    return { error: 'Authentication error', status: 500 };
  }
}

/**
 * Check if user has required role
 */
export async function checkRole(user, allowedRoles) {
  try {
    const dal = getDAL();
    const userRole = await dal.findById('roles', user.roleId);

    if (!userRole) {
      return { error: 'Role not found', status: 403 };
    }

    // Admin always has access
    if (userRole.name === 'admin') {
      return { authorized: true, role: userRole };
    }

    // Check if user's role is in allowed roles
    if (allowedRoles.includes(userRole.name)) {
      return { authorized: true, role: userRole };
    }

    return { error: 'Insufficient permissions', status: 403 };
  } catch (error) {
    return { error: 'Authorization error', status: 500 };
  }
}

/**
 * Check if user has specific permission
 */
export async function checkPermission(user, permission) {
  try {
    const dal = getDAL();
    const userRole = await dal.findById('roles', user.roleId);

    if (!userRole) {
      return { error: 'Role not found', status: 403 };
    }

    // Admin always has all permissions
    if (userRole.name === 'admin' || userRole.permissions?.includes('*')) {
      return { authorized: true, role: userRole };
    }

    // Check if role has the required permission
    if (userRole.permissions && userRole.permissions.includes(permission)) {
      return { authorized: true, role: userRole };
    }

    return { 
      error: 'Insufficient permissions',
      required: permission,
      status: 403 
    };
  } catch (error) {
    return { error: 'Permission check error', status: 500 };
  }
}

/**
 * Wrapper to handle auth in API routes
 */
export async function withAuth(request, handler) {
  const auth = await verifyAuth(request);
  
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  return handler(auth.user);
}

/**
 * Wrapper to handle auth + role check in API routes
 */
export async function withRole(request, allowedRoles, handler) {
  const auth = await verifyAuth(request);
  
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const roleCheck = await checkRole(auth.user, allowedRoles);
  
  if (roleCheck.error) {
    return Response.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  return handler(auth.user, roleCheck.role);
}

/**
 * Wrapper to handle auth + permission check in API routes
 */
export async function withPermission(request, permission, handler) {
  const auth = await verifyAuth(request);
  
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const permCheck = await checkPermission(auth.user, permission);
  
  if (permCheck.error) {
    return Response.json({ error: permCheck.error }, { status: permCheck.status });
  }

  return handler(auth.user, permCheck.role);
}

