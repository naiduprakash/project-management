/**
 * Role Management Routes
 * Handles CRUD operations for roles and permissions
 */

const express = require('express');
const router = express.Router();
const { getDAL } = require('../dal');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Get all roles
 * GET /api/roles
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const roles = await dal.findAll('roles');

    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

/**
 * Get role by ID
 * GET /api/roles/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const role = await dal.findById('roles', req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
});

/**
 * Create custom role (Admin only)
 * POST /api/roles
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, description, permissions = [] } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and displayName are required' });
    }

    const dal = getDAL();

    // Check if role already exists
    const existingRole = await dal.findOne('roles', { name });
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    // Create role
    const role = await dal.create('roles', {
      name,
      displayName,
      description: description || '',
      permissions,
      isDefault: false
    });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

/**
 * Update role (Admin only)
 * PUT /api/roles/:id
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { displayName, description, permissions } = req.body;
    const dal = getDAL();

    const role = await dal.findById('roles', req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent modifying default roles' core properties
    if (role.isDefault && req.body.name) {
      return res.status(400).json({ error: 'Cannot change name of default roles' });
    }

    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (description !== undefined) updates.description = description;
    if (permissions) updates.permissions = permissions;

    const updatedRole = await dal.updateById('roles', req.params.id, updates);

    res.json({
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

/**
 * Delete role (Admin only)
 * DELETE /api/roles/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const dal = getDAL();
    
    const role = await dal.findById('roles', req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent deleting default roles
    if (role.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default roles' });
    }

    // Check if any users have this role
    const usersWithRole = await dal.findAll('users', { roleId: req.params.id });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role with assigned users',
        userCount: usersWithRole.length 
      });
    }

    await dal.deleteById('roles', req.params.id);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

/**
 * Get available permissions
 * GET /api/roles/permissions/list
 */
router.get('/permissions/list', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Define available permissions
    const permissions = [
      { key: '*', description: 'All permissions (admin only)' },
      { key: 'projects.create', description: 'Create new projects' },
      { key: 'projects.read', description: 'View projects' },
      { key: 'projects.read.all', description: 'View all projects (not just own)' },
      { key: 'projects.update.own', description: 'Update own projects' },
      { key: 'projects.update.all', description: 'Update any project' },
      { key: 'projects.delete.own', description: 'Delete own projects' },
      { key: 'projects.delete.all', description: 'Delete any project' },
      { key: 'forms.read', description: 'View published forms' },
      { key: 'forms.manage', description: 'Create and manage forms' },
      { key: 'pages.read', description: 'View published pages' },
      { key: 'pages.manage', description: 'Create and manage pages' },
      { key: 'users.read', description: 'View users' },
      { key: 'users.manage', description: 'Manage users' },
      { key: 'roles.read', description: 'View roles' },
      { key: 'roles.manage', description: 'Manage roles' }
    ];

    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
});

module.exports = router;

