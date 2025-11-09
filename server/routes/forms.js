/**
 * Form Management Routes
 * Handles CRUD operations for dynamic forms
 */

const express = require('express');
const router = express.Router();
const { getDAL } = require('../dal');
const { authenticate, checkPermission } = require('../middleware/auth');

/**
 * Get all forms
 * GET /api/forms
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const { pageId } = req.query;

    let forms = await dal.findAll('forms');

    // Filter by pageId if specified
    if (pageId) {
      forms = forms.filter(form => form.pageId === pageId);
    }

    res.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Failed to get forms' });
  }
});

/**
 * Get form by ID
 * GET /api/forms/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const form = await dal.findById('forms', req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Failed to get form' });
  }
});

/**
 * Create form (Admin only)
 * POST /api/forms
 */
router.post('/', authenticate, checkPermission('forms.manage'), async (req, res) => {
  try {
    const { pageId, title, description, sections = [], settings = {} } = req.body;

    if (!pageId || !title) {
      return res.status(400).json({ error: 'PageId and title are required' });
    }

    const dal = getDAL();

    // Verify page exists
    const page = await dal.findById('pages', pageId);
    if (!page) {
      return res.status(400).json({ error: 'Page not found' });
    }

    // Create form
    const form = await dal.create('forms', {
      pageId,
      title,
      description: description || '',
      sections,
      settings: {
        multiPage: settings.multiPage || false,
        showProgressBar: settings.showProgressBar !== false,
        allowSaveDraft: settings.allowSaveDraft !== false,
        ...settings
      },
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Form created successfully',
      form
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

/**
 * Update form (Admin only)
 * PUT /api/forms/:id
 */
router.put('/:id', authenticate, checkPermission('forms.manage'), async (req, res) => {
  try {
    const { title, description, sections, settings } = req.body;
    const dal = getDAL();

    const form = await dal.findById('forms', req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (sections) updates.sections = sections;
    if (settings) updates.settings = { ...form.settings, ...settings };

    const updatedForm = await dal.updateById('forms', req.params.id, updates);

    res.json({
      message: 'Form updated successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

/**
 * Delete form (Admin only)
 * DELETE /api/forms/:id
 */
router.delete('/:id', authenticate, checkPermission('forms.manage'), async (req, res) => {
  try {
    const dal = getDAL();
    
    const form = await dal.findById('forms', req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if there are projects using this form
    const projects = await dal.findAll('projects', { formId: req.params.id });
    if (projects.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete form with existing projects',
        projectCount: projects.length 
      });
    }

    await dal.deleteById('forms', req.params.id);

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

/**
 * Add section to form (Admin only)
 * POST /api/forms/:id/sections
 */
router.post('/:id/sections', authenticate, checkPermission('forms.manage'), async (req, res) => {
  try {
    const { title, description, fields = [], order } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Section title is required' });
    }

    const dal = getDAL();
    const form = await dal.findById('forms', req.params.id);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { v4: uuidv4 } = require('uuid');
    const newSection = {
      id: uuidv4(),
      title,
      description: description || '',
      fields,
      order: order !== undefined ? order : form.sections.length
    };

    const updatedSections = [...form.sections, newSection];
    const updatedForm = await dal.updateById('forms', req.params.id, { sections: updatedSections });

    res.status(201).json({
      message: 'Section added successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
});

/**
 * Update section in form (Admin only)
 * PUT /api/forms/:formId/sections/:sectionId
 */
router.put('/:formId/sections/:sectionId', authenticate, checkPermission('forms.manage'), async (req, res) => {
  try {
    const { title, description, fields, order } = req.body;
    const dal = getDAL();
    
    const form = await dal.findById('forms', req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const sectionIndex = form.sections.findIndex(s => s.id === req.params.sectionId);
    if (sectionIndex === -1) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const updatedSection = {
      ...form.sections[sectionIndex],
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(fields && { fields }),
      ...(order !== undefined && { order })
    };

    const updatedSections = [...form.sections];
    updatedSections[sectionIndex] = updatedSection;

    const updatedForm = await dal.updateById('forms', req.params.formId, { sections: updatedSections });

    res.json({
      message: 'Section updated successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

/**
 * Delete section from form (Admin only)
 * DELETE /api/forms/:formId/sections/:sectionId
 */
router.delete('/:formId/sections/:sectionId', authenticate, checkPermission('forms.manage'), async (req, res) => {
  try {
    const dal = getDAL();
    const form = await dal.findById('forms', req.params.formId);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const updatedSections = form.sections.filter(s => s.id !== req.params.sectionId);
    
    if (updatedSections.length === form.sections.length) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const updatedForm = await dal.updateById('forms', req.params.formId, { sections: updatedSections });

    res.json({
      message: 'Section deleted successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

module.exports = router;

