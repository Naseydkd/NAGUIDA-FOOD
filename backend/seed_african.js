require('dotenv').config();
const db = require('./db');

// 🍲 PLATS AFRICAINS AUTHENTIQUES - NAGUIDA FOOD
const products = [
  // ENTRÉES
  { name: 'Alloco',                category: 'entrees', description: 'Bananes plantains frites, sauce pimentée maison',                    price: 1500, image_url: 'images/alloco.jpg',        available: true, stock: 50 },
  { name: 'Beignets Haricots',     category: 'entrees', description: 'Beignets de haricots croustillants (akara)',                        price: 1000, image_url: 'images/akara.jpg',         available: true, stock: 50 },
  { name: 'Accras de Morue',       category: 'entrees', description: 'Beignets de morue épicés, recette antillaise',                     price: 2000, image_url: 'images/accras.jpg',        available: true, stock: 50 },
  { name: 'Nems Africains',        category: 'entrees', description: 'Nems garnis de légumes et viande, frits à l\'huile',               price: 1500, image_url: 'images/nems.jpg',          available: true, stock: 50 },
  { name: 'Salade Avocat',         category: 'entrees', description: 'Salade fraîche d\'avocat, tomates et oignons',                     price: 1200, image_url: 'images/salade-avocat.jpg', available: true, stock: 50 },

  // PLATS PRINCIPAUX
  { name: 'Poulet Braisé',         category: 'plats',   description: 'Poulet mariné aux épices, grillé au feu de bois',                   price: 3500, image_url: 'images/poulet-braise.jpg', available: true, stock: 30 },
  { name: 'Poisson Braisé',        category: 'plats',   description: 'Poisson entier grillé, sauce tomate pimentée',                      price: 4000, image_url: 'images/poisson-braise.jpg',available: true, stock: 25 },
  { name: 'Riz Gras',              category: 'plats',   description: 'Riz cuisiné à la sauce tomate, viande et légumes',                  price: 2500, image_url: 'images/riz-gras.jpg',      available: true, stock: 50 },
  { name: 'Attiéké Poisson',       category: 'plats',   description: 'Semoule de manioc, poisson frit et sauce tomate',                   price: 3000, image_url: 'images/attieke.jpg',       available: true, stock: 40 },
  { name: 'Sauce Graine',          category: 'plats',   description: 'Sauce aux graines de palme, viande et fufu',                        price: 3500, image_url: 'images/sauce-graine.jpg',  available: true, stock: 30 },
  { name: 'Sauce Arachide',        category: 'plats',   description: 'Sauce onctueuse aux arachides, poulet et riz',                      price: 3000, image_url: 'images/sauce-arachide.jpg',available: true, stock: 35 },
  { name: 'Mafé',                  category: 'plats',   description: 'Ragoût de viande à la sauce arachide, riz blanc',                   price: 3200, image_url: 'images/mafe.jpg',          available: true, stock: 30 },
  { name: 'Garba',                 category: 'plats',   description: 'Attiéké avec thon frit, oignons et piment',                         price: 2000, image_url: 'images/garba.jpg',         available: true, stock: 50 },
  { name: 'Tiep Bou Dien',         category: 'plats',   description: 'Riz au poisson sénégalais, légumes mijotés',                        price: 4000, image_url: 'images/tiep.jpg',          available: true, stock: 25 },
  { name: 'Foutou Sauce Claire',   category: 'plats',   description: 'Foutou d\'igname, sauce légère aux légumes',                        price: 2800, image_url: 'images/foutou.jpg',        available: true, stock: 30 },

  // DESSERTS
  { name: 'Beignets Banane',       category: 'desserts', description: 'Beignets de banane sucrés, saupoudrés de cannelle',                price: 1000, image_url: 'images/beignet-banane.jpg',available: true, stock: 50 },
  { name: 'Degué',                 category: 'desserts', description: 'Yaourt au mil, vanille et raisins secs',                            price: 1500, image_url: 'images/degue.jpg',         available: true, stock: 40 },
  { name: 'Thiakry',               category: 'desserts', description: 'Couscous au lait caillé sucré, vanille',                            price: 1500, image_url: 'images/thiakry.jpg',       available: true, stock: 40 },
  { name: 'Salade de Fruits',      category: 'desserts', description: 'Fruits frais de saison, jus de citron et menthe',                   price: 1200, image_url: 'images/salade-fruits.jpg', available: true, stock: 30 },
  { name: 'Crème Caramel',         category: 'desserts', description: 'Flan caramel maison, recette traditionnelle',                       price: 1000, image_url: 'images/creme-caramel.jpg', available: true, stock: 50 },

  // BOISSONS
  { name: 'Bissap Rouge',          category: 'boissons', description: 'Jus d\'hibiscus frais, légèrement sucré',                           price: 500,  image_url: 'images/bissap.jpg',        available: true, stock: 100 },
  { name: 'Gnamakoudji',           category: 'boissons', description: 'Jus de gingembre frais, menthe et citron',                          price: 600,  image_url: 'images/gnamakoudji.jpg',   available: true, stock: 100 },
  { name: 'Bouye',                 category: 'boissons', description: 'Jus de pain de singe (baobab), onctueux',                           price: 700,  image_url: 'images/bouye.jpg',         available: true, stock: 80 },
  { name: 'Tamarin',               category: 'boissons', description: 'Jus de tamarin acidulé, rafraîchissant',                            price: 500,  image_url: 'images/tamarin.jpg',       available: true, stock: 100 },
  { name: 'Jus de Bissap Blanc',   category: 'boissons', description: 'Jus de fleurs d\'hibiscus blanches',                                price: 600,  image_url: 'images/bissap-blanc.jpg',  available: true, stock: 80 },
  { name: 'Tchapalo',              category: 'boissons', description: 'Boisson traditionnelle fermentée au mil',                           price: 800,  image_url: 'images/tchapalo.jpg',      available: true, stock: 50 },
];

// 🍽️ CATÉGORIES AFRICAINES
const categories = [
  { name: 'entrees',   display_order: 1 },
  { name: 'plats',     display_order: 2 },
  { name: 'desserts',  display_order: 3 },
  { name: 'boissons',  display_order: 4 },
];

async function seed() {
  console.log('🍲 Seeding NAGUIDA FOOD - Cuisine Africaine...');

  try {
    // Supprimer les anciennes données
    console.log('🗑️  Nettoyage des anciennes données...');
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM reviews');
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM categories');
    console.log('✅ Anciennes données supprimées');

    // Insérer les nouvelles catégories
    console.log('📂 Insertion des catégories africaines...');
    for (const cat of categories) {
      await db.query(
        `INSERT INTO categories (name, display_order, is_visible)
         VALUES ($1, $2, true)`,
        [cat.name, cat.display_order]
      );
    }
    console.log('✅ Catégories insérées : Entrées, Plats, Desserts, Boissons');

    // Insérer les produits africains
    console.log('🍽️  Insertion des plats africains...');
    let count = 0;
    for (const p of products) {
      await db.query(
        `INSERT INTO products (name, category, description, price, image_url, available, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [p.name, p.category, p.description, p.price, p.image_url, p.available, p.stock]
      );
      count++;
    }
    console.log(`✅ ${count} plats africains insérés`);

    console.log('\n🎉 NAGUIDA FOOD - Base de données initialisée avec succès !');
    console.log('\n📊 Récapitulatif :');
    console.log(`   - ${categories.length} catégories`);
    console.log(`   - ${products.length} produits`);
    console.log('\n🍲 Catégories disponibles :');
    console.log('   1️⃣  Entrées (5 produits)');
    console.log('   2️⃣  Plats principaux (10 produits)');
    console.log('   3️⃣  Desserts (5 produits)');
    console.log('   4️⃣  Boissons (6 produits)');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

seed().catch(e => {
  console.error('❌ Erreur fatale:', e);
  process.exit(1);
});

