const router = require('express').Router();
const db = require('../db');

// GET all products (for ADMIN - includes products with stock = 0)
router.get('/all', async (req, res) => {
  const { category } = req.query;
  try {
    const { rows } = category
      ? await db.query('SELECT * FROM products WHERE category = $1 ORDER BY display_order, id', [category])
      : await db.query('SELECT * FROM products ORDER BY display_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET products with stock > 0 (for CLIENT APP - hides out of stock items)
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    const { rows } = category
      ? await db.query('SELECT * FROM products WHERE category = $1 AND stock > 0 AND available = true ORDER BY display_order, id', [category])
      : await db.query('SELECT * FROM products WHERE stock > 0 AND available = true ORDER BY display_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one product
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create product
router.post('/', async (req, res) => {
  const { name, category, description, price, image_url, available = true, stock = 0, is_featured = false } = req.body;
  if (!name || !category || price == null)
    return res.status(400).json({ error: 'Champs requis: name, category, price' });
  try {
    const { rows } = await db.query(
      `INSERT INTO products (name, category, description, price, image_url, available, stock, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, category, description, price, image_url, available, stock, is_featured]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Produit non trouvé' });
    const p = existing[0];
    const { name=p.name, category=p.category, description=p.description, price=p.price,
            image_url=p.image_url, available=p.available, stock=p.stock,
            is_featured=p.is_featured } = req.body;
    const { rows } = await db.query(
      `UPDATE products SET name=$1, category=$2, description=$3, price=$4,
       image_url=$5, available=$6, stock=$7, is_featured=$8 WHERE id=$9 RETURNING *`,
      [name, category, description, price, image_url, available, stock, is_featured, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id FROM products WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Produit non trouvé' });
    await db.query('DELETE FROM order_items WHERE product_id = $1', [req.params.id]);
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT display order
router.put('/:id/display-order', async (req, res) => {
  const { display_order, is_featured } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE products SET display_order=COALESCE($1, display_order),
       is_featured=COALESCE($2, is_featured) WHERE id=$3 RETURNING *`,
      [display_order, is_featured, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST reorder
router.post('/reorder', async (req, res) => {
  const items = req.body;
  try {
    for (const item of items) {
      await db.query('UPDATE products SET display_order=$1 WHERE id=$2', [item.display_order ?? 999, item.id]);
    }
    res.json({ message: 'Ordre mis à jour' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
