/**
 * Authentication Middleware
 * Handles JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const { getDAL } = require('../dal');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const dal = getDAL();
    
    const user = await dal.findById('users', decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Check if user has required role
 */
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const dal = getDAL();
      const userRole = await dal.findById('roles', req.user.roleId);

      if (!userRole) {
        return res.status(403).json({ error: 'Role not found' });
      }

      // Admin always has access
      if (userRole.name === 'admin') {
        return next();
      }

      // Check if user's role is in allowed roles
      if (allowedRoles.includes(userRole.name)) {
        return next();
      }

      return res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Check if user has specific permission
 */
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const dal = getDAL();
      const userRole = await dal.findById('roles', req.user.roleId);

      if (!userRole) {
        return res.status(403).json({ error: 'Role not found' });
      }

      // Admin always has all permissions
      if (userRole.name === 'admin') {
        return next();
      }

      // Check if role has the required permission
      if (userRole.permissions && userRole.permissions.includes(permission)) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Permission check error' });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  checkPermission
};

