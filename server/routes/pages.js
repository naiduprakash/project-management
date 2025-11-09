/**
 * Page Management Routes
 * Handles CRUD operations for pages (containers for forms)
 */

const express = require('express');
const router = express.Router();
const { getDAL } = require('../dal');
const { authenticate, checkPermission } = require('../middleware/auth');

/**
 * Get all pages
 * GET /api/pages
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const { published } = req.query;

    let pages = await dal.findAll('pages');

    // Filter by published status if specified
    if (published !== undefined) {
      const isPublished = published === 'true';
      pages = pages.filter(page => page.published === isPublished);
    }

    // Get forms for each page and add slug
    const pagesWithForms = await Promise.all(
      pages.map(async (page) => {
        const forms = await dal.findAll('forms', { pageId: page.id });
        // Generate slug from title if not exists
        const slug = page.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        // Ensure both published and isPublished fields exist for backward compatibility
        const published = page.published !== undefined ? page.published : page.isPublished;
        const isPublished = page.isPublished !== undefined ? page.isPublished : page.published;
        return { ...page, slug, forms, published, isPublished };
      })
    );

    res.json(pagesWithForms);
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Failed to get pages' });
  }
});

/**
 * Get page by ID
 * GET /api/pages/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dal = getDAL();
    const page = await dal.findById('pages', req.params.id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Get forms for this page
    const forms = await dal.findAll('forms', { pageId: page.id });
    
    // Generate slug if not exists
    const slug = page.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Ensure both published and isPublished fields exist for backward compatibility
    const published = page.published !== undefined ? page.published : page.isPublished;
    const isPublished = page.isPublished !== undefined ? page.isPublished : page.published;

    res.json({ ...page, slug, forms, published, isPublished });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
});

/**
 * Create page (Admin only)
 * POST /api/pages
 */
router.post('/', authenticate, checkPermission('pages.manage'), async (req, res) => {
  try {
    const { title, description, icon, published = false } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const dal = getDAL();
    
    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Create page
    const page = await dal.create('pages', {
      title,
      slug,
      description: description || '',
      icon: icon || 'document',
      published,
      isPublished: published,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Page created successfully',
      page
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

/**
 * Update page (Admin only)
 * PUT /api/pages/:id
 */
router.put('/:id', authenticate, checkPermission('pages.manage'), async (req, res) => {
  try {
    const { title, description, icon, published } = req.body;
    const dal = getDAL();

    const page = await dal.findById('pages', req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const updates = {};
    if (title) {
      updates.title = title;
      // Update slug when title changes
      updates.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (icon) updates.icon = icon;
    if (typeof published !== 'undefined') {
      updates.published = published;
      updates.isPublished = published;
    }

    const updatedPage = await dal.updateById('pages', req.params.id, updates);

    res.json({
      message: 'Page updated successfully',
      page: updatedPage
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

/**
 * Delete page (Admin only)
 * DELETE /api/pages/:id
 */
router.delete('/:id', authenticate, checkPermission('pages.manage'), async (req, res) => {
  try {
    const dal = getDAL();
    
    const page = await dal.findById('pages', req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete all forms associated with this page
    const forms = await dal.findAll('forms', { pageId: req.params.id });
    for (const form of forms) {
      await dal.deleteById('forms', form.id);
    }

    // Delete the page
    await dal.deleteById('pages', req.params.id);

    res.json({ message: 'Page and associated forms deleted successfully' });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

module.exports = router;

