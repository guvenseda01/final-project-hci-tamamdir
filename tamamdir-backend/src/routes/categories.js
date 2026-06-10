/**
 * /api/categories
 *
 * GET /    – list all categories
 * GET /:id – single category with service count
 */
const router = require('express').Router();
const { get, all } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const categories = await all(
      `SELECT c.*, COUNT(s.id) AS service_count
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND s.is_active = 1
       GROUP BY c.id
       ORDER BY c.name`,
      []
    );
    return res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const category = await get(
      `SELECT c.*, COUNT(s.id) AS service_count
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND s.is_active = 1
       WHERE c.id = ? OR c.slug = ?
       GROUP BY c.id`,
      [req.params.id, req.params.id]
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    return res.json(category);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
