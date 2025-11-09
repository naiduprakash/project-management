/**
 * User Management Routes
 * Handles CRUD operations for users
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDAL } = require('../dal');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Get all users (Admin only)
 * GET /api/users
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
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

    res.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const dal = getDAL();
    const user = await dal.findById('users', req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    const role = await dal.findById('roles', user.roleId);

    res.json({ user: { ...userWithoutPassword, role } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * Create user (Admin only)
 * POST /api/users
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email, password, name, roleId, active = true } = req.body;

    if (!email || !password || !name || !roleId) {
      return res.status(400).json({ error: 'Email, password, name, and roleId are required' });
    }

    const dal = getDAL();

    // Check if user already exists
    const existingUser = await dal.findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Verify role exists
    const role = await dal.findById('roles', roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await dal.create('users', {
      email,
      password: hashedPassword,
      name,
      roleId,
      active
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User created successfully',
      user: { ...userWithoutPassword, role }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email, name, roleId, active, password } = req.body;
    const dal = getDAL();

    const user = await dal.findById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (email) updates.email = email;
    if (name) updates.name = name;
    if (roleId) updates.roleId = roleId;
    if (typeof active !== 'undefined') updates.active = active;
    
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await dal.updateById('users', req.params.id, updates);
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    const role = await dal.findById('roles', updatedUser.roleId);

    res.json({
      message: 'User updated successfully',
      user: { ...userWithoutPassword, role }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const dal = getDAL();
    
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await dal.deleteById('users', req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;

