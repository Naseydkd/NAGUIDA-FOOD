require('dotenv').config();
const db = require('./db');

const demoReviews = [
  { product_name: 'Poulet Braisé',     rating: 5, comment: 'Absolument délicieux ! Le poulet est bien mariné, tendre et cuit à la perfection.', user_name: 'Marie L.' },
  { product_name: 'Alloco',            rating: 5, comment: 'L\'alloco est excellent, bien doré et pas trop gras. La sauce pimentée est divine !', user_name: 'Pierre D.' },
  { product_name: 'Riz Gras',          rating: 4, comment: 'Très bon plat avec beaucoup de goût. Portion généreuse, je recommande !',               user_name: 'Sophie M.' },
  { product_name: 'Poisson Braisé',    rating: 5, comment: 'Poisson frais très savoureux et bien épicé. Livraison rapide et soignée.',            user_name: 'Ahmed K.' },
  { product_name: 'Attiéké Poisson',   rating: 5, comment: 'Un régal ! L\'attiéké est bien frais et le poisson parfaitement frit.',                 user_name: 'Lucie R.' },
  { product_name: 'Bissap Rouge',      rating: 4, comment: 'Jus de bissap très rafraîchissant, bien dosé en sucre.',                                 user_name: 'Thomas B.' },
];

async function seed() {
  console.log('🌱 Insertion des avis de démo...');

  for (const r of demoReviews) {
    // Trouver l'ID du produit par son nom
    const { rows } = await db.query('SELECT id FROM products WHERE name = $1 LIMIT 1', [r.product_name]);
    if (!rows[0]) {
      console.warn(`⚠️  Produit "${r.product_name}" non trouvé, avis ignoré`);
      continue;
    }
    await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, NULL, $2, $3)`,
      [rows[0].id, r.rating, `${r.comment} — ${r.user_name}`]
    );
    console.log(`✅ Avis de ${r.user_name} inséré`);
  }

  await db.end();
  console.log('🎉 Done');
}

seed().catch(e => { console.error(e.message); process.exit(1); });
