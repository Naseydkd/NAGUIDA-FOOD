const router = require('express').Router();
const db = require('../db');

async function ensureSettingsColumns() {
  await db.query(`
    ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS ringtone_url TEXT,
    ADD COLUMN IF NOT EXISTS ringtone_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS promo_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS promo_kicker VARCHAR(120) DEFAULT 'Offre du moment',
    ADD COLUMN IF NOT EXISTS promo_title VARCHAR(255) DEFAULT 'Livraison rapide pour vos plats africains préférés',
    ADD COLUMN IF NOT EXISTS promo_text TEXT DEFAULT 'Commandez vos plats maison et recevez-les chauds, prêts à partager.',
    ADD COLUMN IF NOT EXISTS promo_button_text VARCHAR(120) DEFAULT 'Commander maintenant',
    ADD COLUMN IF NOT EXISTS today_menu_product_ids TEXT DEFAULT '[]'
  `);
}

async function getOrCreateSettings() {
  await ensureSettingsColumns();
  let { rows } = await db.query('SELECT * FROM settings LIMIT 1');
  if (!rows[0]) {
    const res = await db.query(
      `INSERT INTO settings (opening_time, closing_time, is_open, notify_on_order)
       VALUES ('09:00','20:00',true,true) RETURNING *`
    );
    rows = res.rows;
  }
  return rows[0];
}

router.get('/', async (req, res) => {
  try { res.json(await getOrCreateSettings()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/', async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    const { opening_time=s.opening_time, closing_time=s.closing_time, is_open=s.is_open,
            notify_email=s.notify_email, notify_on_order=s.notify_on_order,
            ringtone_url=s.ringtone_url, ringtone_name=s.ringtone_name,
            promo_enabled=s.promo_enabled, promo_kicker=s.promo_kicker,
            promo_title=s.promo_title, promo_text=s.promo_text,
            promo_button_text=s.promo_button_text,
            today_menu_product_ids=s.today_menu_product_ids } = req.body;
    const normalizedTodayMenuProductIds = Array.isArray(today_menu_product_ids)
      ? JSON.stringify(today_menu_product_ids)
      : (today_menu_product_ids || '[]');

    const { rows } = await db.query(
      `UPDATE settings SET opening_time=$1, closing_time=$2, is_open=$3,
       notify_email=$4, notify_on_order=$5, ringtone_url=$6, ringtone_name=$7,
       promo_enabled=$8, promo_kicker=$9, promo_title=$10, promo_text=$11,
       promo_button_text=$12, today_menu_product_ids=$13 WHERE id=$14 RETURNING *`,
      [
        opening_time, closing_time, is_open, notify_email, notify_on_order,
        ringtone_url, ringtone_name, promo_enabled, promo_kicker, promo_title,
        promo_text, promo_button_text, normalizedTodayMenuProductIds, s.id
      ]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
