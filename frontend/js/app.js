// Fonction globale pour gérer les erreurs
window.addEventListener('error', (e) => {
    console.error('❌ Erreur JavaScript:', e.error);
});

// Configuration - fonctionne en local et en production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];
let homeSettings = {};

// ===========================
// INITIALISATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de l\'application...');
    
    // Charger l'utilisateur depuis localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    loadProducts();
    loadReviews(); // Charger les avis
    setupEventListeners();
    updateCartUI();
    updateAuthUI(); // Mettre à jour l'interface d'authentification
    
    console.log('✅ Application initialisée');
});

// ===========================
// RÉCUPÉRATION DES DONNÉES
// ===========================

// Toggle Password Visibility - FONCTION GLOBALE
window.togglePasswordVisibility = function(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈'; // Yeux fermés
        button.setAttribute('title', 'Masquer le mot de passe');
    } else {
        input.type = 'password';
        icon.textContent = '👁️'; // Yeux ouverts
        button.setAttribute('title', 'Afficher le mot de passe');
    }
}

// Geolocation - FONCTION GLOBALE
window.getLocation = function() {
    const button = document.getElementById('btn-get-location');
    const locationText = button.querySelector('.location-text');
    const locationIcon = button.querySelector('.location-icon');
    
    if (!navigator.geolocation) {
        showNotification('❌ La géolocalisation n\'est pas supportée par votre navigateur', 'error');
        return;
    }
    
    // État "chargement"
    button.classList.add('loading');
    button.disabled = true;
    locationText.textContent = 'Recherche de votre position...';
    locationIcon.textContent = '🔄';
    
    navigator.geolocation.getCurrentPosition(
        // Succès
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Stocker dans les champs cachés
            document.getElementById('signup-latitude').value = latitude;
            document.getElementById('signup-longitude').value = longitude;
            
            // État "succès"
            button.classList.remove('loading');
            button.classList.add('success');
            locationText.textContent = 'Position enregistrée ✓';
            locationIcon.textContent = '✅';
            
            showNotification(`📍 Position enregistrée: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
            
            // Réactiver le bouton après 2 secondes
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('success');
                locationText.textContent = 'Mettre à jour ma position';
                locationIcon.textContent = '📍';
            }, 2000);
        },
        // Erreur
        (error) => {
            button.classList.remove('loading');
            button.disabled = false;
            locationText.textContent = 'Utiliser ma position';
            locationIcon.textContent = '📍';
            
            let errorMessage = 'Erreur lors de la récupération de la position';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Vous avez refusé l\'accès à la position';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Position non disponible';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Délai d\'attente dépassé';
                    break;
            }
            showNotification('❌ ' + errorMessage, 'error');
        },
        // Options
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Geolocation pour le CHECKOUT - FONCTION GLOBALE
window.getLocationCheckout = function() {
    const button = document.getElementById('btn-get-location-checkout');
    const locationText = button.querySelector('.location-text');
    const locationIcon = button.querySelector('.location-icon');
    
    if (!navigator.geolocation) {
        showNotification('❌ La géolocalisation n\'est pas supportée par votre navigateur', 'error');
        return;
    }
    
    // État "chargement"
    button.classList.add('loading');
    button.disabled = true;
    locationText.textContent = 'Localisation en cours...';
    locationIcon.textContent = '🔄';
    
    navigator.geolocation.getCurrentPosition(
        // Succès
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Stocker dans les champs cachés
            document.getElementById('checkout-latitude').value = latitude;
            document.getElementById('checkout-longitude').value = longitude;
            
            // État "succès"
            button.classList.remove('loading');
            button.classList.add('success');
            locationText.textContent = 'Position enregistrée ✓';
            locationIcon.textContent = '✅';
            
            showNotification(`📍 Position de livraison enregistrée !`, 'success');
            
            // Réactiver le bouton après 2 secondes
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('success');
                locationText.textContent = 'Mettre à jour ma position';
                locationIcon.textContent = '📍';
            }, 2000);
        },
        // Erreur
        (error) => {
            button.classList.remove('loading');
            button.disabled = false;
            locationText.textContent = 'Utiliser ma position actuelle';
            locationIcon.textContent = '📍';
            
            let errorMessage = 'Erreur lors de la récupération de la position';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Vous avez refusé l\'accès à la position';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Position non disponible';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Délai d\'attente dépassé';
                    break;
            }
            showNotification('❌ ' + errorMessage, 'error');
        },
        // Options
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Modal functions - FONCTIONS GLOBALES
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

async function loadProducts() {
    try {
        const [productsResponse, settingsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/products/`),
            fetch(`${API_BASE_URL}/settings/`)
        ]);
        if (!productsResponse.ok) throw new Error('API Error');
        const data = await productsResponse.json();
        homeSettings = settingsResponse.ok ? await settingsResponse.json() : {};
        allProducts = Array.isArray(data) && data.length > 0 ? data : [];
        updateHomePromo(homeSettings);
        displayProducts(allProducts);
        displayHomeSections(allProducts);
    } catch (error) {
        console.warn('❌ API indisponible');
        updateHomePromo({});
        displayProducts([]);
        displayHomeSections([]);
    }
}

// ===========================
// AFFICHAGE DES PRODUITS - VERSION SIMPLIFIÉE
// ===========================

function displayProducts(products) {
    console.log('🍩 Affichage des produits:', products.length);
    
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('❌ Grille de produits non trouvée');
        return;
    }
    
    // Nettoyer la grille
    grid.innerHTML = '';

    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">Aucun produit trouvé</p>';
        return;
    }

    // Créer les cartes de produits de manière simple
    products.forEach((product, index) => {
        try {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Obtenir le nom de la catégorie
            const categoryName = getCategoryDisplayName(product.category);
            
            // Description simple
            const description = product.description || 'Donut artisanal fait maison';
            
            // Prix formaté
            const price = typeof product.price === 'number' ? product.price.toFixed(0) : product.price;
            
            // Image avec fallback
            const imageSrc = product.image_url || product.image || 'images/bouledn.png';
            
            // Créer le HTML de manière simple
            card.innerHTML = `
                <div class="product-image">
                    <img src="${imageSrc}" alt="${product.name}" />
                </div>
                <div class="product-info">
                    <div class="product-category">${categoryName}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${price} FCFA</div>
                    <div class="product-description">${description}</div>
                    <div class="product-actions">
                        <button class="btn-details" data-product-id="${product.id}">
                            Voir
                        </button>
                        <button class="btn-add-cart" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
                            Ajouter
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
            
        } catch (error) {
            console.error('❌ Erreur lors de la création de la carte produit:', error);
        }
    });
    
    // Ajouter les event listeners de manière sécurisée
    setupProductEventListeners();
    
    // Initialiser les filtres après l'affichage des produits
    initializeFilters();
    
    console.log('✅ Produits affichés avec succès');
}

function getCategoryDisplayName(category) {
    const categoryNames = {
        'entrees': '🥗 Entrées',
        'plats': '🍲 Plats',
        'desserts': '🍰 Desserts',
        'boissons': '🥤 Boissons'
    };
    return categoryNames[category] || category;
}

function displayHomeSections(products) {
    const todayGrid = document.getElementById('today-menu-grid');
    const popularGrid = document.getElementById('popular-products-grid');

    if (!todayGrid && !popularGrid) return;

    const availableProducts = Array.isArray(products) ? products.filter(product => product.available !== false) : [];
    const todayProductIds = getTodayMenuProductIds(homeSettings);
    const todayProducts = todayProductIds.length
        ? todayProductIds
            .map(productId => availableProducts.find(product => Number(product.id) === Number(productId)))
            .filter(Boolean)
            .slice(0, 4)
        : pickProductsByCategories(availableProducts, ['plats', 'entrees', 'boissons', 'desserts'], 4);
    const featuredProducts = availableProducts.filter(product => product.is_featured);
    const popularProducts = (featuredProducts.length ? featuredProducts : availableProducts)
        .sort((a, b) => {
            const featuredDiff = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
            if (featuredDiff !== 0) return featuredDiff;
            return Number(b.stock || 0) - Number(a.stock || 0);
        })
        .slice(0, 4);

    renderHomeProducts(todayGrid, todayProducts);
    renderHomeProducts(popularGrid, popularProducts);
    setupProductEventListeners();
}

function updateHomePromo(settings) {
    const promoSection = document.getElementById('home-promo');
    if (!promoSection) return;

    if (settings.promo_enabled === false) {
        promoSection.style.display = 'none';
        return;
    }

    promoSection.style.display = '';
    document.getElementById('promo-kicker-display').textContent = settings.promo_kicker || 'Offre du moment';
    document.getElementById('promo-title-display').textContent = settings.promo_title || 'Livraison rapide pour vos plats africains préférés';
    document.getElementById('promo-text-display').textContent = settings.promo_text || 'Commandez vos plats maison et recevez-les chauds, prêts à partager.';
    document.getElementById('promo-button-display').textContent = settings.promo_button_text || 'Commander maintenant';
}

function getTodayMenuProductIds(settings) {
    const raw = settings.today_menu_product_ids;
    if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);

    try {
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
    } catch (e) {
        return [];
    }
}

function pickProductsByCategories(products, categories, limit) {
    const selected = [];

    categories.forEach(category => {
        const product = products.find(item => item.category === category && !selected.some(selectedItem => selectedItem.id === item.id));
        if (product) selected.push(product);
    });

    products.forEach(product => {
        if (selected.length >= limit) return;
        if (!selected.some(selectedItem => selectedItem.id === product.id)) {
            selected.push(product);
        }
    });

    return selected.slice(0, limit);
}

function renderHomeProducts(grid, products) {
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="home-empty">Aucun plat disponible pour le moment.</div>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const price = typeof product.price === 'number' ? product.price.toFixed(0) : product.price;
        const imageSrc = product.image_url || product.image || 'images/logo-naguida-light.png';
        const description = product.description || 'Plat maison disponible à la commande.';

        return `
            <article class="home-product-card">
                <div class="home-product-image">
                    <img src="${imageSrc}" alt="${product.name}">
                </div>
                <div class="home-product-info">
                    <div class="home-product-category">${getCategoryDisplayName(product.category)}</div>
                    <h3 class="home-product-name">${product.name}</h3>
                    <p class="home-product-description">${description}</p>
                    <div class="home-product-footer">
                        <span class="home-product-price">${price} FCFA</span>
                        <button class="btn-add-cart" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
                            Ajouter
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ===========================
// EVENT LISTENERS POUR LES PRODUITS
// ===========================

function setupProductEventListeners() {
    // Event listeners pour les boutons "Voir"
    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.btn-details').dataset.productId);
            showProductDetails(productId);
        });
    });

    // Event listeners pour les boutons "Commander"
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-add-cart');
            const productId = parseInt(button.dataset.productId);
            const productName = button.dataset.productName;
            const productPrice = parseFloat(button.dataset.productPrice);
            addToCart(productId, productName, productPrice);
        });
    });
}

function initializeFilters() {
    // Configuration simple des filtres
    setTimeout(() => {
        document.querySelectorAll('.filtre-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer la classe active de tous les boutons
                document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                
                // Filtrer les produits
                filterProducts(btn.dataset.category);
            });
        });
    }, 100);
}



function showProductDetails(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const detailsDiv = document.getElementById('product-details');
    detailsDiv.innerHTML = `
        <div class="product-details-image">
            <img src="${product.image_url || product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="product-details-info">
            <div class="product-details-category">${product.category}</div>
            <div class="product-details-name">${product.name}</div>
            <div class="product-details-price">${product.price.toFixed(0)} FCFA</div>
            <div class="product-details-description">
                ${product.description || 'Un délicieux donut artisanal'}
            </div>
            <div class="product-details-actions">
                <button class="btn-primary" onclick="addToCart(${product.id}, '${product.name}', ${product.price}); closeModal('modal-product')">Ajouter au panier</button>
                <button class="btn-secondary" onclick="closeModal('modal-product')">Fermer</button>
            </div>
        </div>
    `;

    openModal('modal-product');
}

// ===========================
// GESTION DU PANIER
// ===========================

function addToCart(productId, name, price) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    showNotification(`${name} ajouté au panier ! 🍩`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsDiv = document.getElementById('cart-items');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    if (!cartItemsDiv) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="cart-empty">Votre panier est vide</div>';
        const totalElement = document.getElementById('cart-total');
        if (totalElement) totalElement.textContent = '0.00';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div class="cart-item-price">${itemTotal.toFixed(2)} FCFA</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Supprimer</button>
            </div>
        `;
    });

    cartItemsDiv.innerHTML = html;
    const totalElement = document.getElementById('cart-total');
    if (totalElement) totalElement.textContent = total.toFixed(2);
}

// ===========================
// FILTRAGE DES PRODUITS
// ===========================

function filterProducts(category) {
    if (category === 'all') {
        displayProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

// ===========================
// GESTION DES MODALES
// ===========================

// Déjà définies comme fonctions globales en haut du fichier
// window.openModal et window.closeModal

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
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===========================
// SETUP DES EVENT LISTENERS
// ===========================

function setupEventListeners() {
    console.log('🔧 Configuration des event listeners...');
    
    // Menu burger
    const hamburger = document.getElementById('hamburger');
    const navbarMenu = document.getElementById('navbar-menu');

    if (hamburger && navbarMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navbarMenu.classList.toggle('mobile-open');
        });
    }

    // Fermer le menu burger lors du clic sur un lien
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navbarMenu) navbarMenu.classList.remove('mobile-open');
        });
    });

    // BOUTONS PRINCIPAUX
    setupMainButtons();
    
    // FORMULAIRES
    setupForms();
    
    // MODALES
    setupModals();
    
    // AVIS
    setupReviews();
    
    console.log('✅ Tous les event listeners configurés');
}

function setupMainButtons() {
    // Panier
    const btnPanier = document.getElementById('btn-panier');
    if (btnPanier) {
        btnPanier.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('modal-panier');
        });
    }

    // Connexion
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('modal-login');
        });
        console.log('✅ Bouton connexion configuré');
    }
    
    // Boutons Google OAuth
    const btnGoogleLoginClient = document.getElementById('btn-google-login-client');
    const btnGoogleSignupClient = document.getElementById('btn-google-signup-client');
    
    if (btnGoogleLoginClient) {
        btnGoogleLoginClient.addEventListener('click', handleGoogleAuth);
        console.log('✅ Bouton Google Login configuré');
    }
    
    if (btnGoogleSignupClient) {
        btnGoogleSignupClient.addEventListener('click', handleGoogleAuth);
        console.log('✅ Bouton Google Signup configuré');
    }

    // Commander
    const btnCommander = document.getElementById('btn-commander');
    if (btnCommander) {
        btnCommander.addEventListener('click', (e) => {
            e.preventDefault();
            const catalogue = document.getElementById('catalogue');
            if (catalogue) {
                catalogue.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Continue shopping
    const btnContinueShopping = document.getElementById('btn-continue-shopping');
    if (btnContinueShopping) {
        btnContinueShopping.addEventListener('click', () => {
            closeModal('modal-panier');
            // Si on est sur index.html, rediriger vers menu.html
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                window.location.href = 'menu.html';
            }
        });
    }

    // Checkout
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            closeModal('modal-panier');
            openModal('modal-checkout');
        });
    }
}

function setupModals() {
    // Fermer les modales avec le bouton X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Fermer les modales en cliquant à l'extérieur
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ===========================
// AVIS CLIENTS / REVIEWS
// ===========================

async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`);
        if (!response.ok) throw new Error('API non disponible');
        const reviews = await response.json();
        displayReviewsSlider(reviews);
        updateReviewsStats(reviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
    }
}

// Variables pour le slider continu
let reviewsData = [];

function displayReviewsSlider(reviews) {
    console.log('Affichage du slider continu avec', reviews.length, 'avis');
    reviewsData = reviews || [];
    const sliderContainer = document.getElementById('reviews-slider');
    const noReviewsDiv = document.getElementById('no-reviews');
    
    if (!sliderContainer) {
        console.error('Container du slider non trouvé');
        return;
    }
    
    if (reviewsData.length === 0) {
        sliderContainer.style.display = 'none';
        if (noReviewsDiv) noReviewsDiv.style.display = 'block';
        return;
    }
    
    sliderContainer.style.display = 'flex';
    if (noReviewsDiv) noReviewsDiv.style.display = 'none';
    
    // Créer les avis en double pour un défilement infini
    const doubledReviews = [...reviewsData, ...reviewsData];
    
    const reviewsHTML = doubledReviews.map(review => `
        <div class="avis-card">
            <div class="avis-header">
                <div class="avis-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    <span class="avis-rating-num">${review.rating}/5</span>
                </div>
                <div class="avis-product">${review.product_name || 'Produit'}</div>
            </div>
            <div class="avis-comment">
                ${review.comment || 'Excellent produit !'}
            </div>
            <div class="avis-user">
                par ${review.user_name || (review.user_email ? review.user_email.split('@')[0] : 'Client')}
            </div>
            <div class="avis-date">
                ${review.created_at ? new Date(review.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
            </div>
        </div>
    `).join('');
    
    sliderContainer.innerHTML = reviewsHTML;
    
    // Masquer les contrôles manuels car on a un défilement continu
    const sliderControls = document.querySelector('.slider-controls');
    if (sliderControls) {
        sliderControls.style.display = 'none';
    }
    
    // Masquer les dots
    const sliderDots = document.getElementById('slider-dots');
    if (sliderDots) {
        sliderDots.style.display = 'none';
    }
    
    console.log('✅ Slider continu initialisé avec', doubledReviews.length, 'avis (doublés pour boucle infinie)');
}

function updateReviewsStats(reviews) {
    const totalCount = document.getElementById('total-reviews-count');
    const averageStars = document.getElementById('average-stars');
    const averageRating = document.getElementById('average-rating-display');
    
    if (!reviews || reviews.length === 0) {
        if (totalCount) totalCount.textContent = '0';
        if (averageStars) averageStars.textContent = '☆☆☆☆☆';
        if (averageRating) averageRating.textContent = '0.0';
        return;
    }
    
    const total = reviews.length;
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / total;
    
    if (totalCount) totalCount.textContent = total;
    if (averageRating) averageRating.textContent = average.toFixed(1);
    if (averageStars) {
        const fullStars = Math.floor(average);
        const hasHalfStar = average % 1 >= 0.5;
        let starsHTML = '★'.repeat(fullStars);
        if (hasHalfStar) starsHTML += '☆';
        starsHTML += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
        averageStars.textContent = starsHTML;
    }
}


// Fonction pour soumettre un avis
async function submitReview(productId, name, rating, comment) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                user_id: currentUser ? currentUser.id : null,
                user_name: currentUser ? currentUser.username : (name || 'Anonyme'),
                rating: rating,
                comment: comment
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.error || 'Erreur lors de l\'ajout de l\'avis', 'error');
            return false;
        }

        showNotification('Avis ajouté avec succès !', 'success');
        loadReviews(); // Recharger les avis
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'avis:', error);
        showNotification('Erreur lors de l\'ajout de l\'avis', 'error');
        return false;
    }
}

// Fonction pour charger les produits dans le select du modal avis
function loadProductsForReview() {
    const select = document.getElementById('review-product');
    if (!select || !allProducts) return;
    
    select.innerHTML = '<option value="">Sélectionnez un produit</option>';
    
    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

function displayReviews(reviews) {
    // Cette fonction est gardée pour compatibilité mais on utilise maintenant displayReviewsSlider
    displayReviewsSlider(reviews);
}

function setupReviews() {
    console.log('⭐ Configuration des avis...');
    
    // Event listeners pour les avis
    const btnAddReview = document.getElementById('btn-add-review');
    if (btnAddReview) {
        btnAddReview.addEventListener('click', () => {
            loadProductsForReview();
            openModal('modal-review');
        });
        console.log('✅ Bouton d\'ajout d\'avis configuré');
    }
    
    // Formulaire d'ajout d'avis
    const formReview = document.getElementById('form-review');
    if (formReview) {
        formReview.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productId = document.getElementById('review-product')?.value;
            const name = document.getElementById('review-name')?.value;
            const rating = document.querySelector('input[name="rating"]:checked')?.value;
            const comment = document.getElementById('review-comment')?.value;
            
            if (!productId || !name || !rating || !comment) {
                showNotification('Veuillez remplir tous les champs', 'error');
                return;
            }
            
            const success = await submitReview(parseInt(productId), name, parseInt(rating), comment);
            if (success) {
                closeModal('modal-review');
                formReview.reset();
                // Réinitialiser les étoiles
                document.querySelectorAll('input[name="rating"]').forEach(input => {
                    input.checked = false;
                });
            }
        });
        console.log('✅ Formulaire d\'avis configuré');
    }
}
// ===========================
// AUTHENTIFICATION
// ===========================

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.error || 'Erreur de connexion', 'error');
            return;
        }

        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('modal-login');
        showNotification('Connecté avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

async function signup(email, username, password, firstName, lastName, phone) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                username,
                password,
                first_name: firstName,
                last_name: lastName,
                phone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.error || 'Erreur lors de l\'inscription', 'error');
            return;
        }

        showNotification('Compte créé! Veuillez vous connecter.', 'success');
        closeModal('modal-signup');
        openModal('modal-login');
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        showNotification('Erreur lors de l\'inscription', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showNotification('Déconnecté', 'success');
}

function updateAuthUI() {
    const btnLogin = document.getElementById('btn-login');
    const loginText = document.querySelector('.login-text');

    if (btnLogin) {
        if (currentUser) {
            if (loginText) {
                loginText.textContent = `Déconnexion`;
            } else {
                btnLogin.textContent = `Déconnexion (${currentUser.username})`;
            }
            btnLogin.onclick = logout;
        } else {
            if (loginText) {
                loginText.textContent = 'Connexion';
            } else {
                btnLogin.textContent = 'Connexion';
            }
            btnLogin.onclick = () => openModal('modal-login');
        }
    }
}

// ===========================
// COMMANDE
// ===========================

async function submitOrder(address, city, phone, deliveryType, paymentMethod, notes, latitude, longitude) {
    if (!currentUser) {
        showNotification('Veuillez vous connecter d\'abord', 'error');
        openModal('modal-login');
        return;
    }

    if (cart.length === 0) {
        showNotification('Votre panier est vide', 'error');
        return;
    }

    const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
    }));

    try {
        const response = await fetch(`${API_BASE_URL}/orders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                items,
                address,
                city,
                phone,
                delivery_type: deliveryType,
                payment_method: paymentMethod,
                notes,
                delivery_latitude: latitude || null,
                delivery_longitude: longitude || null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.error || 'Erreur lors de la création de la commande', 'error');
            return;
        }

        showNotification('Commande créée avec succès! Numéro: ' + data.id, 'success');
        cart = [];
        saveCart();
        updateCartUI();
        closeModal('modal-checkout');
        closeModal('modal-panier');
    } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        showNotification('Erreur lors de la création de la commande', 'error');
    }
}
function setupForms() {
    console.log('📝 Configuration des formulaires...');
    
    // Authentification
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password-client')?.value;
            login(email, password);
        });
        console.log('✅ Formulaire de connexion configuré');
    }

    const formSignup = document.getElementById('form-signup');
    if (formSignup) {
        formSignup.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email')?.value;
            const username = document.getElementById('signup-username')?.value;
            const password = document.getElementById('signup-password-client')?.value;
            const firstName = document.getElementById('signup-firstname')?.value;
            const lastName = document.getElementById('signup-lastname')?.value;
            const phone = document.getElementById('signup-phone')?.value;
            
            signup(email, username, password, firstName, lastName, phone);
        });
        console.log('✅ Formulaire d\'inscription configuré');
    }

    const btnSignup = document.getElementById('btn-signup');
    if (btnSignup) {
        btnSignup.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('modal-login');
            openModal('modal-signup');
        });
        console.log('✅ Lien d\'inscription configuré');
    }

    // Checkout
    const formCheckout = document.getElementById('form-checkout');
    if (formCheckout) {
        formCheckout.addEventListener('submit', (e) => {
            e.preventDefault();
            const address = document.getElementById('address').value;
            const city = document.getElementById('city').value;
            const phone = document.getElementById('phone').value;
            const deliveryType = document.querySelector('input[name="delivery_type"]:checked')?.value;
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;
            const notes = document.getElementById('notes').value;
            const latitude = document.getElementById('checkout-latitude')?.value;
            const longitude = document.getElementById('checkout-longitude')?.value;

            submitOrder(address, city, phone, deliveryType, paymentMethod, notes, latitude, longitude);
        });
        console.log('✅ Formulaire de commande configuré');
    }
}

// ===========================
// GOOGLE OAUTH FUNCTIONS
// ===========================

function handleGoogleAuth(e) {
    e.preventDefault();
    
    // Ajouter une classe de loading au bouton
    const button = e.currentTarget;
    button.classList.add('loading');
    
    // Rediriger vers l'authentification Google
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin;
    
    window.location.href = `${baseUrl}/api/auth/google`;
}

// Vérifier si on revient d'une authentification Google
function checkGoogleAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('google_auth') === 'success') {
        try {
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                
                // Sauvegarder l'utilisateur
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                showNotification('✅ Connexion Google réussie !', 'success');
                updateAuthUI();
                
                // Nettoyer l'URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Erreur parsing user Google:', error);
            showNotification('Erreur lors de la connexion Google', 'error');
        }
    } else if (params.get('error') === 'google_auth_failed') {
        showNotification('Erreur lors de l\'authentification Google. Veuillez réessayer.', 'error');
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Appeler la fonction au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    checkGoogleAuthCallback();
});
