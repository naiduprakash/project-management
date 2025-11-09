/**
 * Project Management Routes
 * Handles CRUD operations for project data entries
 */

const express = require('express');
const router = express.Router();
const { getDAL } = require('../dal');
const { authenticate } = require('../middleware/auth');

/**
 * Get all projects with filtering, sorting, and pagination
 * GET /api/projects
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search = '',
      formId,
      status,
      createdBy
    } = req.query;

    // Build filter
    const filter = {};
    if (formId) filter.formId = formId;
    if (status) filter.status = status;
    
    // Check user permissions
    const userRole = await dal.findById('roles', req.user.roleId);
    const canViewAll = userRole.permissions.includes('*') || 
                      userRole.permissions.includes('projects.read.all');
    
    // If user can't view all, only show their own projects
    if (!canViewAll) {
      filter.createdBy = req.user.id;
    } else if (createdBy) {
      filter.createdBy = createdBy;
    }

    // Build sort
    const sort = { [sortBy]: sortOrder };

    // Build search
    const searchFilter = search ? { title: search, description: search } : {};

    // Get paginated results
    const result = await dal.paginate('projects', {
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      search: searchFilter
    });

    // Populate creator and form information
    const projectsWithDetails = await Promise.all(
      result.data.map(async (project) => {
        const creator = await dal.findById('users', project.createdBy);
        const form = await dal.findById('forms', project.formId);
        const { password, ...creatorWithoutPassword } = creator || {};
        
        return {
          ...project,
          creator: creatorWithoutPassword,
          form: form ? { id: form.id, title: form.title } : null
        };
      })
    );

    res.json({
      projects: projectsWithDetails,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

/**
 * Get project by ID
 * GET /api/projects/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const project = await dal.findById('projects', req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions
    const userRole = await dal.findById('roles', req.user.roleId);
    const canViewAll = userRole.permissions.includes('*') || 
                      userRole.permissions.includes('projects.read.all');
    
    if (!canViewAll && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get form and creator details
    const creator = await dal.findById('users', project.createdBy);
    const form = await dal.findById('forms', project.formId);
    const { password, ...creatorWithoutPassword } = creator || {};

    res.json({
      project: {
        ...project,
        creator: creatorWithoutPassword,
        form
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

/**
 * Create project
 * POST /api/projects
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { formId, title, description, data, status = 'draft' } = req.body;

    if (!formId || !title || !data) {
      return res.status(400).json({ error: 'FormId, title, and data are required' });
    }

    const dal = getDAL();

    // Verify form exists
    const form = await dal.findById('forms', formId);
    if (!form) {
      return res.status(400).json({ error: 'Form not found' });
    }

    // Validate data against form schema (basic validation)
    // In a production app, you'd want more robust validation

    // Create project
    const project = await dal.create('projects', {
      formId,
      title,
      description: description || '',
      data,
      status,
      createdBy: req.user.id
    });

    // Get form details for response
    const creator = await dal.findById('users', project.createdBy);
    const { password, ...creatorWithoutPassword } = creator;

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        ...project,
        creator: creatorWithoutPassword,
        form: { id: form.id, title: form.title }
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * Update project
 * PUT /api/projects/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, data, status } = req.body;
    const dal = getDAL();

    const project = await dal.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions
    const userRole = await dal.findById('roles', req.user.roleId);
    const canUpdateAll = userRole.permissions.includes('*') || 
                        userRole.permissions.includes('projects.update.all');
    const canUpdateOwn = userRole.permissions.includes('projects.update.own');
    
    if (!canUpdateAll && (!canUpdateOwn || project.createdBy !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (data) updates.data = data;
    if (status) updates.status = status;

    const updatedProject = await dal.updateById('projects', req.params.id, updates);

    // Get details for response
    const creator = await dal.findById('users', updatedProject.createdBy);
    const form = await dal.findById('forms', updatedProject.formId);
    const { password, ...creatorWithoutPassword } = creator;

    res.json({
      message: 'Project updated successfully',
      project: {
        ...updatedProject,
        creator: creatorWithoutPassword,
        form: { id: form.id, title: form.title }
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * Delete project
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    
    const project = await dal.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions
    const userRole = await dal.findById('roles', req.user.roleId);
    const canDeleteAll = userRole.permissions.includes('*') || 
                        userRole.permissions.includes('projects.delete.all');
    const canDeleteOwn = userRole.permissions.includes('projects.delete.own');
    
    if (!canDeleteAll && (!canDeleteOwn || project.createdBy !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await dal.deleteById('projects', req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;

