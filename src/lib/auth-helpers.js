/**
 * Authentication helper functions
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash a password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Initialize default roles
 */
export async function initializeDefaultRoles(dal) {
  const adminRole = await dal.findOne('roles', { name: 'admin' });
  if (!adminRole) {
    await dal.create('roles', {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access',
      permissions: ['*'], // All permissions
      isDefault: true
    });
  }

  const userRole = await dal.findOne('roles', { name: 'user' });
  if (!userRole) {
    await dal.create('roles', {
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
}

