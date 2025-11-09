/**
 * Authentication Routes
 * Handles login, registration, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDAL } = require('../dal');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const dal = getDAL();

    // Check if user already exists
    const existingUser = await dal.findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get default 'user' role
    let userRole = await dal.findOne('roles', { name: 'user' });
    
    // If no roles exist, create default roles
    if (!userRole) {
      await initializeDefaultRoles(dal);
      userRole = await dal.findOne('roles', { name: 'user' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const dal = getDAL();

    // Find user
    const user = await dal.findOne('users', { email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user role
    const role = await dal.findById('roles', user.roleId);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      message: 'Login successful',
      user: { ...userWithoutPassword, role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const role = await dal.findById('roles', req.user.roleId);
    
    const { password, ...userWithoutPassword } = req.user;
    
    res.json({
      user: { ...userWithoutPassword, role }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * Initialize default roles (admin and user)
 */
async function initializeDefaultRoles(dal) {
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

module.exports = router;

