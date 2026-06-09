// Configuration - fonctionne en local et en production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';
const CLOUDINARY_CONFIG = {
    cloudName: 'dnx3uefmc',
    uploadPreset: 'boule-de-neige',
    folder: 'naguida-food/products'
};
let currentAdmin = null;
let allOrders = [];
let allProducts = [];
let allUsers = [];
let allCategories = [];

// ===========================
// AVIS CLIENTS
// ===========================

async function displayReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`);
        const reviews = await response.json();

        if (!reviews.length) {
            document.getElementById('reviews-table').innerHTML = '<p style="padding:20px;color:#666;">Aucun avis pour le moment.</p>';
            return;
        }

        const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Produit</th>
                        <th>Utilisateur</th>
                        <th>Note</th>
                        <th>Commentaire</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map(r => `
                        <tr>
                            <td>#${r.id}</td>
                            <td>${r.product_name || '-'}</td>
                            <td>${r.user_email || '-'}</td>
                            <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                            <td>${r.comment || '-'}</td>
                            <td>${r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                            <td><button class="btn-sm btn-delete" onclick="deleteReview(${r.id})">Supprimer</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('reviews-table').innerHTML = tableHtml;
    } catch (e) {
        console.error('Erreur avis:', e);
        document.getElementById('reviews-table').innerHTML = '<p style="padding:20px;color:red;">Erreur lors du chargement des avis.</p>';
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('Avis supprimé ✅', 'success');
            displayReviews();
        }
    } catch (e) {
        showNotification('Erreur lors de la suppression', 'error');
    }
}

// ===========================
// INITIALISATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadDashboardData();
    setupEventListeners();
    setupNavigation();
    setupBurgerMenu();
    setupRingtone();
});

// ===========================
// AUTHENTIFICATION
// ===========================

function checkAdminAuth() {
    const savedAdmin = localStorage.getItem('currentAdmin');
    if (!savedAdmin) {
        // Rediriger vers la page de connexion admin si pas connecté
        window.location.href = 'admin-auth.html';
        return;
    }
    currentAdmin = JSON.parse(savedAdmin);
    document.getElementById('admin-user').textContent = currentAdmin.email || 'Admin';
}

// ===========================
// CHARGEMENT DES DONNÉES
// ===========================

async function loadDashboardData() {
    try {
        const [ordersRes, productsRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/orders/`),
            fetch(`${API_BASE_URL}/products/all`),  // Admin voit TOUS les produits (même stock = 0)
            fetch(`${API_BASE_URL}/users/`)
        ]);

        allOrders = await ordersRes.json();
        allProducts = await productsRes.json();
        allUsers = await usersRes.json();

        updateDashboard();
        displayOrders();
        displayProducts();
        displayStockTable();
        displayUsers();
        createSalesChart();
        createProductsChart();
        displayReviews();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

// ===========================
// MISE À JOUR DU TABLEAU DE BORD
// ===========================

function updateDashboard() {
    // Statistiques
    document.getElementById('stat-orders').textContent = allOrders.length;
    document.getElementById('stat-users').textContent = allUsers.length;
    document.getElementById('stat-products').textContent = allProducts.length;

    // Revenu total (uniquement les commandes livrées)
    const totalRevenue = allOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.total_price || 0), 0);
    document.getElementById('stat-revenue').textContent = totalRevenue.toFixed(0) + ' FCFA';
    
    // Dernières commandes
    const recentOrders = allOrders.slice(-5).reverse();
    const recentOrdersHtml = recentOrders.map(order => {
        const userInfo = order.user_info || {};
        const clientName = userInfo.first_name && userInfo.last_name 
            ? `${userInfo.first_name} ${userInfo.last_name}` 
            : `Client #${order.user_id}`;
        const phone = userInfo.phone ? ` | Tél: ${userInfo.phone}` : '';
        
        return `
        <div class="list-item">
            <div class="list-item-title">Commande #${order.id}</div>
            <div class="list-item-info">
                ${clientName}${phone} | Total: ${order.total_price || 0} FCFA | Statut: ${order.status}
            </div>
        </div>
        `;
    }).join('');
    document.getElementById('recent-orders').innerHTML = recentOrdersHtml;

    // Produits populaires (plus vendus)
    const productSales = {};
    allOrders.forEach(order => {
        // Exemple simplifié - en vrai il faudrait les order_items
        if (order.items) {
            order.items.forEach(item => {
                productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
            });
        }
    });

    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topProductsHtml = topProducts.map(([productId, quantity]) => {
        const product = allProducts.find(p => p.id == productId);
        return `
            <div class="list-item">
                <div class="list-item-title">${product?.name || 'Produit inconnu'}</div>
                <div class="list-item-info">Ventes: ${quantity} unités</div>
            </div>
        `;
    }).join('');
    document.getElementById('popular-products').innerHTML = topProductsHtml;
}

// ===========================
// AFFICHAGE DES COMMANDES
// ===========================

function displayOrders(filteredOrders = null) {
    const orders = filteredOrders || allOrders;
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => {
                    const userInfo = order.user_info || {};
                    const clientName = userInfo.first_name && userInfo.last_name 
                        ? `${userInfo.first_name} ${userInfo.last_name}` 
                        : `Client #${order.user_id}`;
                    const phone = userInfo.phone || 'N/A';
                    
                    return `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${clientName}</td>
                        <td>${phone}</td>
                        <td>${order.total_price || 0} FCFA</td>
                        <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'En attente'}</span></td>
                        <td>${new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                            <button class="btn-sm btn-view" onclick="editOrder(${order.id})">Éditer</button>
                            <button class="btn-sm btn-delete" onclick="deleteOrder(${order.id})">Supprimer</button>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('orders-table').innerHTML = tableHtml;
}

// ===========================
// AFFICHAGE DES PRODUITS
// ===========================

function displayProducts() {
    // Filtres et tri
    const filterCategory = document.getElementById('filter-category')?.value || '';
    const sortBy = document.getElementById('sort-products')?.value || 'name';
    
    let filtered = allProducts;
    
    // Filtrer par catégorie
    if (filterCategory) {
        filtered = filtered.filter(p => p.category === filterCategory);
    }
    
    // Trier
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock') return (b.stock || 0) - (a.stock || 0);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
    });
    
    const tableHtml = `
        <div style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center;">
            <select id="filter-category" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                <option value="">📁 Toutes les catégories</option>
                <option value="entrees">🥗 Entrées</option>
                <option value="plats">🍲 Plats</option>
                <option value="desserts">🍰 Desserts</option>
                <option value="boissons">🥤 Boissons</option>
            </select>
            
            <select id="sort-products" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                <option value="name">📝 Trier par Nom</option>
                <option value="price-asc">💰 Prix (↑)</option>
                <option value="price-desc">💰 Prix (↓)</option>
                <option value="stock">📦 Stock</option>
                <option value="category">📁 Catégorie</option>
            </select>
            
            <button id="btn-delete-selected" class="btn-delete" style="display: none; padding: 8px 12px;">🗑️ Supprimer sélection</button>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;"><input type="checkbox" id="select-all-products" title="Tout sélectionner"></th>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Disponible</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(product => `
                    <tr class="product-row">
                        <td style="text-align: center;"><input type="checkbox" class="product-checkbox" data-product-id="${product.id}"></td>
                        <td>#${product.id}</td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>${product.price} FCFA</td>
                        <td><strong>${product.stock || 0}</strong></td>
                        <td>${product.available ? '✅' : '❌'}</td>
                        <td>
                            <button class="btn-sm btn-edit" onclick="editProduct(${product.id})">Éditer</button>
                            <button class="btn-sm btn-delete" onclick="deleteProduct(${product.id})">Supprimer</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('products-table').innerHTML = tableHtml;
    
    // Ajouter les listeners après rendu
    document.getElementById('filter-category').addEventListener('change', displayProducts);
    document.getElementById('sort-products').addEventListener('change', displayProducts);
    
    document.getElementById('select-all-products').addEventListener('change', (e) => {
        document.querySelectorAll('.product-checkbox').forEach(cb => cb.checked = e.target.checked);
        updateDeleteButton();
    });
    
    document.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDeleteButton);
    });
    
    document.getElementById('btn-delete-selected').addEventListener('click', deleteSelectedProducts);
}

function updateDeleteButton() {
    const selected = document.querySelectorAll('.product-checkbox:checked').length;
    const btn = document.getElementById('btn-delete-selected');
    btn.style.display = selected > 0 ? 'block' : 'none';
    if (selected > 0) btn.textContent = `🗑️ Supprimer ${selected} produit(s)`;
}

async function deleteSelectedProducts() {
    const selected = document.querySelectorAll('.product-checkbox:checked');
    if (selected.length === 0) return;
    
    if (!confirm(`Supprimer ${selected.length} produit(s)?`)) return;
    
    for (const checkbox of selected) {
        const productId = checkbox.dataset.productId;
        try {
            await fetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Erreur suppression:', e);
        }
    }
    
    showNotification(`${selected.length} produit(s) supprimé(s)`, 'success');
    loadDashboardData();
}

// ===========================
// AFFICHAGE DES UTILISATEURS
// ===========================

function displayUsers() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Nom d'utilisateur</th>
                    <th>Téléphone</th>
                    <th>Date d'inscription</th>
                </tr>
            </thead>
            <tbody>
                ${allUsers.map(user => `
                    <tr>
                        <td>#${user.id}</td>
                        <td>${user.email}</td>
                        <td>${user.username}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('users-table').innerHTML = tableHtml;
}

// ===========================
// GESTION DES PRODUITS
// ===========================

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-image').value = product.image_url || '';
    document.getElementById('product-image-file').value = '';
    document.getElementById('product-available').checked = product.available;
    
    // Afficher l'aperçu de l'image existante
    const preview = document.getElementById('preview-img');
    if (product.image_url) {
        preview.src = product.image_url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    
    document.getElementById('modal-title').textContent = 'Éditer le produit';

    openModal('modal-product');
}

async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Produit supprimé', 'success');
            loadDashboardData();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

// ===========================
// GESTION DES COMMANDES
// ===========================

function editOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('order-id').value = order.id;
    document.getElementById('order-status').value = order.status || 'pending';

    const userInfo = order.user_info || {};
    const clientName = userInfo.first_name && userInfo.last_name 
        ? `${userInfo.first_name} ${userInfo.last_name}` 
        : `Client #${order.user_id}`;
    const phone = userInfo.phone || 'Non renseigné';
    const email = userInfo.email || 'Non renseigné';

    const detailsHtml = `
        <div class="order-detail-row">
            <strong>ID Commande:</strong> <span>#${order.id}</span>
        </div>
        <div class="order-detail-row">
            <strong>Client:</strong> <span>${clientName}</span>
        </div>
        <div class="order-detail-row">
            <strong>Téléphone:</strong> <span>${phone}</span>
        </div>
        <div class="order-detail-row">
            <strong>Email:</strong> <span>${email}</span>
        </div>
        <div class="order-detail-row">
            <strong>Montant:</strong> <span>${order.total_price || 0} FCFA</span>
        </div>
        <div class="order-detail-row">
            <strong>Type de livraison:</strong> <span>${order.delivery_type || 'Non spécifié'}</span>
        </div>
        <div class="order-detail-row">
            <strong>Méthode de paiement:</strong> <span>${order.payment_method || 'Non spécifiée'}</span>
        </div>
    `;
    document.getElementById('order-details').innerHTML = detailsHtml;

    openModal('modal-order');
}

async function deleteOrder(orderId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Commande supprimée', 'success');
            loadDashboardData();
        } else {
            showNotification(`Erreur: ${data.error || response.status}`, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

// ===========================
// GESTION DES IMAGES
// ===========================

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('preview-img');
    const btnUpload = document.getElementById('btn-upload-image');

    if (!file.type.startsWith('image/')) {
        showNotification('Sélectionne un fichier image valide', 'error');
        event.target.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image trop volumineuse. Maximum: 5 MB', 'error');
        event.target.value = '';
        return;
    }

    btnUpload.textContent = '⏳ Upload en cours...';
    btnUpload.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('folder', CLOUDINARY_CONFIG.folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.secure_url) {
            document.getElementById('product-image').value = data.secure_url;
            preview.src = data.secure_url;
            preview.style.display = 'block';
            showNotification('Image uploadée ✅', 'success');
        } else {
            showNotification('Erreur Cloudinary: ' + (data.error?.message || 'upload refusé'), 'error');
        }
    } catch (e) {
        console.error('Erreur upload Cloudinary:', e);
        showNotification('Erreur réseau lors de l\'upload', 'error');
    } finally {
        btnUpload.textContent = '📤 Upload Image';
        btnUpload.disabled = false;
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

// ===========================
// GESTION DE LA NAVIGATION
// ===========================

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Retirer la classe active
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

            // Ajouter la classe active
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            // Mettre à jour le titre
            const titles = {
                dashboard: 'Tableau de bord',
                orders: 'Gestion des Commandes',
                products: 'Gestion des Produits',
                categories: 'Gestion des Catégories',
                users: 'Gestion des Utilisateurs',
                reviews: 'Avis Clients',
                stock: 'Gestion du Stock',
                settings: 'Paramètres'
            };
            document.getElementById('page-title').textContent = titles[sectionId] || sectionId;
            
            // Charger les données appropriées
            if (sectionId === 'categories') loadCategories();
            if (sectionId === 'reviews') displayReviews();
        });
    });
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    // Bouton ajouter produit
    document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('product-id').value = '';
        document.getElementById('form-product').reset();
        document.getElementById('product-image-file').value = '';
        document.getElementById('preview-img').style.display = 'none';
        document.getElementById('modal-title').textContent = 'Ajouter un produit';
        openModal('modal-product');
    });

    // Upload d'image
    document.getElementById('btn-upload-image').addEventListener('click', () => {
        document.getElementById('product-image-file').click();
    });

    document.getElementById('product-image-file').addEventListener('change', handleImageUpload);
    
    // Aperçu URL image
    document.getElementById('product-image').addEventListener('change', (e) => {
        if (e.target.value) {
            const preview = document.getElementById('preview-img');
            preview.src = e.target.value;
            preview.style.display = 'block';
            preview.onerror = () => {
                preview.style.display = 'none';
            };
        }
    });

    // Formulaire produit
    document.getElementById('form-product').addEventListener('submit', submitProduct);

    // Formulaire commande
    document.getElementById('form-order').addEventListener('submit', submitOrder);

    // Formulaire paramètres
    document.getElementById('form-settings').addEventListener('submit', saveSettings);

    // Bouton actualiser stock
    document.getElementById('btn-refresh-stock').addEventListener('click', () => {
        loadDashboardData();
        showNotification('Stock actualisé ✅', 'success');
    });

    // Bouton actualiser avis
    const btnRefreshReviews = document.getElementById('btn-refresh-reviews');
    if (btnRefreshReviews) {
        btnRefreshReviews.addEventListener('click', () => {
            displayReviews();
            showNotification('Avis actualisés ✅', 'success');
        });
    }

    // Filtre statut
    document.getElementById('filter-status').addEventListener('change', (e) => {
        if (e.target.value) {
            const filtered = allOrders.filter(o => o.status === e.target.value);
            displayOrders(filtered);
        } else {
            displayOrders();
        }
    });

    // Déconnexion
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Fermer modales
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });

    // Charger les paramètres au démarrage
    loadSettings();
}

async function submitProduct(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;
    const imageUrl = document.getElementById('product-image').value;
    const imageFile = document.getElementById('product-image-file').files[0];
    
    if (imageFile && !imageUrl.includes('res.cloudinary.com')) {
        showNotification('Attends la fin de l\'upload Cloudinary avant d\'enregistrer', 'error');
        return;
    }

    // Vérifier la taille de l'image
    if (imageUrl && imageUrl.startsWith('data:') && imageUrl.length > 1000000) {
        showNotification('Image trop volumineuse. Utilise une URL ou une petite image', 'error');
        return;
    }

    const data = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value,
        image_url: imageUrl,
        available: document.getElementById('product-available').checked
    };

    try {
        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `${API_BASE_URL}/products/${productId}` : `${API_BASE_URL}/products/`;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showNotification(productId ? 'Produit mis à jour' : 'Produit créé', 'success');
            closeModal('modal-product');
            loadDashboardData();
        } else {
            const error = await response.json();
            showNotification(`Erreur: ${error.error || 'Erreur lors de la sauvegarde'}`, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

async function submitOrder(e) {
    e.preventDefault();

    const orderId = document.getElementById('order-id').value;
    const status = document.getElementById('order-status').value;

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification('Commande mise à jour', 'success');
            closeModal('modal-order');
            loadDashboardData();
        } else {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

// ===========================
// NAVIGATION
// ===========================

// ===========================
// GESTION DES CATÉGORIES
// ===========================

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`);
        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des catégories', 'error');
    }
}

function displayCategories(categories) {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Catégorie</th>
                    <th>Ordre d'affichage</th>
                    <th>Visible</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(cat => `
                    <tr>
                        <td><strong>${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</strong></td>
                        <td>
                            <input type="number" data-cat-id="${cat.id}" class="cat-order" value="${cat.display_order}" min="1" style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        </td>
                        <td>
                            <input type="checkbox" data-cat-id="${cat.id}" class="cat-visible" ${cat.is_visible ? 'checked' : ''}>
                        </td>
                        <td>
                            <button class="btn-sm btn-save" onclick="saveCategory(${cat.id})">Enregistrer</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('categories-table').innerHTML = tableHtml;
}

async function saveCategory(categoryId) {
    const orderInput = document.querySelector(`.cat-order[data-cat-id="${categoryId}"]`);
    const visibleInput = document.querySelector(`.cat-visible[data-cat-id="${categoryId}"]`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                display_order: parseInt(orderInput.value),
                is_visible: visibleInput.checked
            })
        });
        
        if (response.ok) {
            showNotification('Catégorie mise à jour ✅', 'success');
            loadCategories();
        } else {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}
// ===========================
// MODALES
// ===========================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

// ===========================
// GESTION DU STOCK
// ===========================

function displayStockTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Produit</th>
                    <th>Stock</th>
                    <th>Disponible</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allProducts.map(product => `
                    <tr>
                        <td>#${product.id}</td>
                        <td>${product.name}</td>
                        <td><strong>${product.stock}</strong></td>
                        <td>${product.available ? '✅' : '❌'}</td>
                        <td>
                            <button class="btn-sm btn-edit" onclick="editStock(${product.id})">Éditer Stock</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('stock-table').innerHTML = tableHtml;
}

async function editStock(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const newStock = prompt(`Modifier le stock de "${product.name}"\nStock actuel: ${product.stock}`, product.stock);
    if (newStock === null || newStock === '') return;

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: parseInt(newStock) })
        });

        if (response.ok) {
            showNotification('Stock mis à jour ✅', 'success');
            loadDashboardData();
        } else {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur', 'error');
    }
}

// ===========================
// GESTION DES PARAMÈTRES
// ===========================

async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/`);
        const settings = await response.json();

        document.getElementById('opening-time').value = settings.opening_time;
        document.getElementById('closing-time').value = settings.closing_time;
        document.getElementById('is-open').checked = settings.is_open;
        document.getElementById('notify-email').value = settings.notify_email || '';
        document.getElementById('notify-on-order').checked = settings.notify_on_order;

        // Charger la sonnerie globale
        if (settings.ringtone_url) {
            globalRingtoneUrl = settings.ringtone_url;
            const statusDiv = document.getElementById('ringtone-status');
            if (statusDiv) {
                const name = settings.ringtone_name || 'sonnerie personnalisée';
                statusDiv.textContent = `✅ "${name}" active`;
                statusDiv.style.color = '#4caf50';
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des paramètres', 'error');
    }
}

async function saveSettings(e) {
    e.preventDefault();

    const settings = {
        opening_time: document.getElementById('opening-time').value,
        closing_time: document.getElementById('closing-time').value,
        is_open: document.getElementById('is-open').checked,
        notify_email: document.getElementById('notify-email').value,
        notify_on_order: document.getElementById('notify-on-order').checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/settings/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            showNotification('Paramètres enregistrés ✅', 'success');
        } else {
            showNotification('Erreur lors de l\'enregistrement', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur', 'error');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// ===========================
// GRAPHIQUES
// ===========================

function createSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // Données des 7 derniers jours
    const dates = [];
    const revenues = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
        
        const dayRevenue = allOrders
            .filter(order => {
                const orderDate = order.created_at ? order.created_at.split('T')[0] : '';
                return orderDate === dateStr;
            })
            .reduce((sum, order) => sum + (order.total_price || 0), 0);
        
        revenues.push(dayRevenue);
    }

    // Détruire le graphique existant s'il existe
    if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
    }

    window.salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Revenus (FCFA)',
                data: revenues,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenus (FCFA)'
                    }
                }
            }
        }
    });
}

function createProductsChart() {
    const ctx = document.getElementById('productsChart');
    if (!ctx) return;

    // Calcul des ventes par produit
    const productSales = {};
    allOrders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = { quantity: 0, name: '' };
                }
                productSales[item.product_id].quantity += item.quantity;
            });
        }
    });

    // Trouver les noms des produits
    Object.keys(productSales).forEach(productId => {
        const product = allProducts.find(p => p.id == productId);
        productSales[productId].name = product?.name || `Produit ${productId}`;
    });

    // Top 5 produits
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5);

    // Détruire le graphique existant s'il existe
    if (window.productsChartInstance) {
        window.productsChartInstance.destroy();
    }

    window.productsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topProducts.map(([_, data]) => data.name),
            datasets: [{
                label: 'Quantités vendues',
                data: topProducts.map(([_, data]) => data.quantity),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// ===========================
// AVIS CLIENTS
// ===========================

async function displayReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`);
        if (!response.ok) throw new Error('Erreur lors du chargement des avis');
        
        const reviews = await response.json();
        
        // Remplir la section "Avis Récents" du dashboard
        if (document.getElementById('recent-reviews')) {
            if (!Array.isArray(reviews) || reviews.length === 0) {
                document.getElementById('recent-reviews').innerHTML = '<p class="no-data">Aucun avis pour le moment.</p>';
            } else {
                const recentReviewsHtml = reviews.slice(-5).reverse().map(review => `
                    <div class="list-item">
                        <div class="list-item-title">${review.product_name || 'Produit'}</div>
                        <div class="list-item-info">
                            ${'⭐'.repeat(review.rating)} - "${review.comment || 'Pas de commentaire'}" par ${review.user_email ? review.user_email.split('@')[0] : 'Client'}
                        </div>
                    </div>
                `).join('');
                document.getElementById('recent-reviews').innerHTML = recentReviewsHtml;
            }
        }
        
        // Remplir la table des avis (page Avis Clients)
        if (document.getElementById('reviews-table')) {
            if (!Array.isArray(reviews) || reviews.length === 0) {
                document.getElementById('reviews-table').innerHTML = '<p class="no-data">Aucun avis client pour le moment.</p>';
                return;
            }

            const reviewsHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Client</th>
                            <th>Évaluation</th>
                            <th>Commentaire</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reviews.map(review => `
                            <tr>
                                <td>${review.product_name || 'Produit inconnu'}</td>
                                <td>${review.user_email || review.user_id}</td>
                                <td>
                                    <span class="rating">
                                        ${'⭐'.repeat(review.rating)}<span class="rating-count">(${review.rating}/5)</span>
                                    </span>
                                </td>
                                <td class="comment-cell">${review.comment || '-'}</td>
                                <td>${new Date(review.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <button class="btn-small btn-danger" onclick="deleteReview(${review.id})">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            document.getElementById('reviews-table').innerHTML = reviewsHtml;
        }
    } catch (error) {
        console.error('Erreur lors de l\'affichage des avis:', error);
        if (document.getElementById('reviews-table')) {
            document.getElementById('reviews-table').innerHTML = '<p class="error">Erreur lors du chargement des avis</p>';
        }
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            showNotification('Avis supprimé avec succès ✅', 'success');
            displayReviews();
        } else {
            throw new Error('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression de l\'avis', 'error');
    }
}

// ===========================
// DÉCONNEXION
// ===========================

function logout() {
    // Demander confirmation avant déconnexion
    if (confirm('🔐 Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // Supprimer les données admin du localStorage
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('adminToken');
        
        // Afficher un message de déconnexion
        console.log('👋 Déconnexion admin réussie - Redirection vers admin-auth.html');
        
        // Petit délai pour l'UX puis redirection
        setTimeout(() => {
            window.location.href = 'admin-auth.html';
        }, 100);
    }
}

// ===========================
// NOTIFICATIONS
// ===========================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s;
        background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// ===========================
// GESTION DES CATÉGORIES
// ===========================

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`);
        if (response.ok) {
            allCategories = await response.json();
            displayCategories();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

function displayCategories() {
    const tableHtml = `
        <button id="btn-add-category" class="btn-primary" style="margin-bottom: 15px;">+ Ajouter une catégorie</button>
        
        <table>
            <thead>
                <tr>
                    <th>Catégorie</th>
                    <th>Ordre d'affichage</th>
                    <th>Visible</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allCategories.map(category => `
                    <tr>
                        <td><strong>${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</strong></td>
                        <td>
                            <input type="number" value="${category.display_order}" min="1" max="99" class="category-order" data-category-id="${category.id}" style="width: 60px; padding: 5px;">
                        </td>
                        <td>
                            <input type="checkbox" class="category-visible" data-category-id="${category.id}" ${category.is_visible ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                        </td>
                        <td>
                            <button class="btn-sm btn-primary" onclick="saveCategory(${category.id})">Enregistrer</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('categories-table').innerHTML = tableHtml;
    
    // Ajouter le listener pour créer une catégorie
    document.getElementById('btn-add-category').addEventListener('click', showAddCategoryDialog);
    
    // Ajouter les listeners
    document.querySelectorAll('.category-order, .category-visible').forEach(input => {
        input.addEventListener('change', function() {
            const categoryId = this.dataset.categoryId;
            saveCategory(categoryId);
        });
    });
}

async function saveCategory(categoryId) {
    const orderInput = document.querySelector(`input.category-order[data-category-id="${categoryId}"]`);
    const visibleInput = document.querySelector(`input.category-visible[data-category-id="${categoryId}"]`);
    
    const data = {
        display_order: parseInt(orderInput.value),
        is_visible: visibleInput.checked
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('Catégorie mise à jour ✅', 'success');
            loadCategories();
        } else {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

function showAddCategoryDialog() {
    const name = prompt('Nom de la nouvelle catégorie:');
    if (!name) return;
    
    createCategory(name);
}

async function createCategory(name) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.toLowerCase().trim(),
                display_order: allCategories.length + 1,
                is_visible: true
            })
        });
        
        if (response.ok) {
            showNotification(`Catégorie "${name}" créée ✅`, 'success');
            loadCategories();
        } else {
            const error = await response.json();
            showNotification(`Erreur: ${error.error || 'Erreur lors de la création'}`, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la création', 'error');
    }
}

// ===========================
// SONNERIE NOUVELLE COMMANDE
// ===========================

let lastOrderCount = null;
let orderPollingInterval = null;
let audioCtx = null;

// Initialiser l'AudioContext au premier clic (requis par les navigateurs)
document.addEventListener('click', () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: false });

function playOrderSound() {
    if (globalRingtoneUrl) {
        const audio = new Audio(globalRingtoneUrl);
        audio.volume = 0.8;
        audio.loop = true;
        audio.play().catch(e => console.warn('Audio bloqué:', e));
        setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 10000);
        return;
    }
    _playNotesLoop();
}

function _generateBeepWav(freq, durationMs) {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * durationMs / 1000);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Samples
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.min(1, t * 20) * Math.max(0, 1 - t * 3);
        const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
        view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, sample * 32767)), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

function _playNotesLoop() {
    // Alerte longue : bip continu qui monte et descend
    const sampleRate = 44100;
    const bipDur = 0.6;   // 600ms de son
    const silDur = 0.2;   // 200ms de silence
    const cycleDur = bipDur + silDur; // 800ms par cycle
    const totalSamples = Math.floor(sampleRate * cycleDur);

    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    const bipSamples = Math.floor(sampleRate * bipDur);
    for (let i = 0; i < totalSamples; i++) {
        let s = 0;
        if (i < bipSamples) {
            const t = i / sampleRate;
            // Fréquence qui monte de 600Hz à 1200Hz sur la durée du bip
            const freq = 600 + (600 * t / bipDur);
            const env = Math.min(1, t * 20) * Math.max(0, 1 - (t - bipDur * 0.8) / (bipDur * 0.2));
            s = Math.sin(2 * Math.PI * freq * t) * Math.max(0, env) * 0.7;
        }
        view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, s * 32767)), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.8;
    audio.play().catch(e => console.warn('Audio:', e));

    setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        URL.revokeObjectURL(url);
    }, 10000);
}

function _playNotes() {
    const notes = [523, 659, 784]; // Do, Mi, Sol
    notes.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.18);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.18);
        gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + i * 0.18 + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + i * 0.18 + 0.16);

        oscillator.start(audioCtx.currentTime + i * 0.18);
        oscillator.stop(audioCtx.currentTime + i * 0.18 + 0.18);
    });
}
async function checkNewOrders() {
    try {
        const res = await fetch(`${API_BASE_URL}/orders/`);
        if (!res.ok) return;
        const orders = await res.json();
        const count = orders.length;

        if (lastOrderCount === null) {
            // Première vérification — on initialise sans sonner
            lastOrderCount = count;
            return;
        }

        if (count > lastOrderCount) {
            const newCount = count - lastOrderCount;
            lastOrderCount = count;
            playOrderSound();
            showNotification(`🛎️ ${newCount} nouvelle${newCount > 1 ? 's' : ''} commande${newCount > 1 ? 's' : ''} !`, 'success');
            // Recharger les commandes dans le tableau
            allOrders = orders;
            displayOrders();
            updateDashboard();
        } else {
            lastOrderCount = count;
        }
    } catch (e) {
        // Silencieux — pas de spam d'erreurs réseau
    }
}

function startOrderPolling() {
    if (orderPollingInterval) return;
    checkNewOrders(); // vérification immédiate
    orderPollingInterval = setInterval(checkNewOrders, 5000); // toutes les 5s
}

function stopOrderPolling() {
    if (orderPollingInterval) {
        clearInterval(orderPollingInterval);
        orderPollingInterval = null;
    }
}

// Démarrer le polling quand la page est prête
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour laisser loadDashboardData() s'exécuter en premier
    setTimeout(startOrderPolling, 3000);
});

// Arrêter le polling si l'onglet est fermé
window.addEventListener('beforeunload', stopOrderPolling);

// ===========================
// SONNERIE PERSONNALISÉE
// ===========================

let globalRingtoneUrl = null; // chargée depuis les settings

function setupRingtone() {
    const fileInput = document.getElementById('ringtone-file');
    const statusDiv = document.getElementById('ringtone-status');
    const btnTest = document.getElementById('btn-test-ringtone');
    const btnReset = document.getElementById('btn-reset-ringtone');

    if (!fileInput) return;

    function updateStatus() {
        statusDiv.textContent = globalRingtoneUrl ? '✅ Sonnerie personnalisée active' : '🎵 Sonnerie par défaut (Do-Mi-Sol)';
        statusDiv.style.color = globalRingtoneUrl ? '#4caf50' : '#999';
    }
    updateStatus();

    // Upload et sauvegarde en DB
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            statusDiv.textContent = '❌ Fichier trop volumineux (max 2MB)';
            statusDiv.style.color = '#f44336';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target.result;
            try {
                const res = await fetch(`${API_BASE_URL}/settings/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ringtone_url: base64, ringtone_name: file.name })
                });
                if (res.ok) {
                    globalRingtoneUrl = base64;
                    statusDiv.textContent = `✅ "${file.name}" enregistrée pour tous les admins`;
                    statusDiv.style.color = '#4caf50';
                } else {
                    statusDiv.textContent = '❌ Erreur lors de la sauvegarde';
                    statusDiv.style.color = '#f44336';
                }
            } catch (e) {
                statusDiv.textContent = '❌ Erreur réseau';
                statusDiv.style.color = '#f44336';
            }
        };        reader.readAsDataURL(file);
    });

    btnTest.addEventListener('click', () => playOrderSound());

    btnReset.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ringtone_url: null })
            });
            if (res.ok) {
                globalRingtoneUrl = null;
                fileInput.value = '';
                updateStatus();
            }
        } catch (e) {
            showNotification('Erreur lors de la suppression', 'error');
        }
    });
}

// ===========================
// MENU BURGER (mobile)
// ===========================

function setupBurgerMenu() {
    const burger = document.getElementById('burger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = document.getElementById('close-sidebar');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    if (burger) burger.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Fermer la sidebar quand on clique sur un item de nav (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });
}
