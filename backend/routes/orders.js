const router = require('express').Router();
const db = require('../db');

async function getOrderWithItems(orderId) {
  const { rows: [order] } = await db.query(
    `SELECT o.*, u.first_name, u.last_name, u.phone, u.email
     FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id=$1`,
    [orderId]
  );
  if (!order) return null;
  const { rows: items } = await db.query(
    `SELECT oi.*, p.name as product_name FROM order_items oi
     JOIN products p ON oi.product_id = p.id WHERE oi.order_id=$1`,
    [orderId]
  );
  return {
    ...order,
    user_info: { first_name: order.first_name, last_name: order.last_name, phone: order.phone, email: order.email },
    items: items.map(i => ({ ...i, total: i.quantity * i.unit_price }))
  };
}

// POST create order
router.post('/', async (req, res) => {
  const { user_id, items, delivery_type, payment_method, notes, delivery_latitude, delivery_longitude } = req.body;
  if (!user_id || !items || !delivery_type || !payment_method)
    return res.status(400).json({ error: 'Champs requis manquants' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let total_price = 0;
    const resolvedItems = [];

    for (const item of items) {
      const { rows } = await client.query('SELECT * FROM products WHERE id=$1', [item.product_id]);
      if (!rows[0]) throw new Error(`Produit ${item.product_id} non trouvé`);
      total_price += rows[0].price * item.quantity;
      resolvedItems.push({ product: rows[0], quantity: item.quantity });
    }

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, total_price, delivery_type, payment_method, notes, delivery_latitude, delivery_longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [user_id, total_price, delivery_type, payment_method, notes, delivery_latitude || null, delivery_longitude || null]
    );

    for (const { product, quantity } of resolvedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.id, product.id, quantity, product.price]
      );
    }

    await client.query('COMMIT');
    const full = await getOrderWithItems(order.id);
    res.status(201).json(full);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(e.message.includes('non trouvé') ? 404 : 500).json({ error: e.message });
  } finally { client.release(); }
});

// GET orders by user
router.get('/user/:user_id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id FROM orders WHERE user_id=$1', [req.params.user_id]);
    const orders = await Promise.all(rows.map(r => getOrderWithItems(r.id)));
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all orders
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id FROM orders ORDER BY order_date DESC');
    const orders = await Promise.all(rows.map(r => getOrderWithItems(r.id)));
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one order
router.get('/:id', async (req, res) => {
  try {
    const order = await getOrderWithItems(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update order
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Commande non trouvée' });
    const o = existing[0];
    const { status=o.status, notes=o.notes } = req.body;
    await db.query('UPDATE orders SET status=$1, notes=$2 WHERE id=$3', [status, notes, req.params.id]);
    const order = await getOrderWithItems(req.params.id);
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id FROM orders WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Commande non trouvée' });
    await db.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
    res.json({ message: 'Commande supprimée' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
