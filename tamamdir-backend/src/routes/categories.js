/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Service categories
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     responses:
 *       200:
 *         description: List of categories with service counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Category'
 *                   - type: object
 *                     properties:
 *                       service_count:
 *                         type: integer
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID or slug
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Category'
 *                 - type: object
 *                   properties:
 *                     service_count:
 *                       type: integer
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
