const ORDERS_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

const ORDER_STATUS_STEPS = [
    { key: 'pending', label: 'En attente', icon: '🕐' },
    { key: 'confirmed', label: 'Confirmée', icon: '✅' },
    { key: 'shipped', label: 'En livraison', icon: '🛵' },
    { key: 'delivered', label: 'Livrée', icon: '🎉' }
];

const STATUS_LABELS = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée'
};

let ordersRefreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    setupOrdersPageNav();
    initOrdersPage();

    document.getElementById('btn-go-login')?.addEventListener('click', () => openModal('modal-login'));
    document.getElementById('btn-go-signup')?.addEventListener('click', () => openModal('modal-signup'));

    document.addEventListener('userAuthChanged', () => initOrdersPage());
});

function setupOrdersPageNav() {
    const btnPanier = document.getElementById('btn-panier');
    if (btnPanier) {
        const newBtn = btnPanier.cloneNode(true);
        btnPanier.replaceWith(newBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'menu.html';
        });
    }
}

function getCurrentUserFromStorage() {
    try {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

async function initOrdersPage() {
    const loading = document.getElementById('orders-loading');
    const authRequired = document.getElementById('orders-auth-required');
    const empty = document.getElementById('orders-empty');
    const list = document.getElementById('orders-list');

    const user = getCurrentUserFromStorage();

    if (authRequired) authRequired.style.display = 'none';
    if (empty) empty.style.display = 'none';
    if (list) list.innerHTML = '';

    if (!user) {
        if (loading) loading.style.display = 'none';
        if (authRequired) authRequired.style.display = 'block';
        stopOrdersRefresh();
        return;
    }

    await loadUserOrders(user.id);
}

async function loadUserOrders(userId, silent = false) {
    const loading = document.getElementById('orders-loading');
    const empty = document.getElementById('orders-empty');
    const list = document.getElementById('orders-list');

    if (!silent && loading) loading.style.display = 'flex';

    try {
        const response = await fetch(`${ORDERS_API_BASE}/orders/user/${userId}`);
        if (!response.ok) throw new Error('Impossible de charger les commandes');

        const orders = await response.json();
        if (loading) loading.style.display = 'none';

        if (!orders.length) {
            if (empty) empty.style.display = 'block';
            if (list) list.innerHTML = '';
            stopOrdersRefresh();
            return;
        }

        if (empty) empty.style.display = 'none';
        renderOrders(orders);
        highlightOrderFromUrl();
        startOrdersRefresh(userId);
    } catch (error) {
        console.error(error);
        if (loading) loading.style.display = 'none';
        if (list) {
            list.innerHTML = '<p class="orders-error">Erreur lors du chargement. Réessayez dans quelques instants.</p>';
        }
    }
}

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    if (!list) return;

    list.innerHTML = orders.map(order => renderOrderCard(order)).join('');
}

function renderOrderCard(order) {
    const status = order.status || 'pending';
    const isCancelled = status === 'cancelled';
    const date = formatOrderDate(order.order_date);
    const deliveryLabel = order.delivery_type === 'pickup' ? 'Retrait en magasin' : 'Livraison à domicile';
    const paymentLabel = order.payment_method === 'cash' ? 'Paiement à la livraison' : 'MyNita';
    const itemsHtml = (order.items || []).map(item => `
        <li>
            <span>${item.quantity}× ${item.product_name || 'Produit'}</span>
            <span>${(item.quantity * item.unit_price).toLocaleString('fr-FR')} FCFA</span>
        </li>
    `).join('');

    return `
        <article class="order-card" id="order-${order.id}" data-order-id="${order.id}">
            <div class="order-card-header">
                <div>
                    <h3>Commande #${order.id}</h3>
                    <p class="order-date">${date}</p>
                </div>
                <span class="order-status-badge status-${status}">${STATUS_LABELS[status] || status}</span>
            </div>

            ${isCancelled ? renderCancelledBanner() : renderStatusTimeline(status)}

            <div class="order-card-body">
                <div class="order-info-grid">
                    <div><strong>Livraison</strong><span>${deliveryLabel}</span></div>
                    <div><strong>Paiement</strong><span>${paymentLabel}</span></div>
                    ${order.address ? `<div><strong>Adresse</strong><span>${order.address}${order.city ? ', ' + order.city : ''}</span></div>` : ''}
                    ${order.phone ? `<div><strong>Téléphone</strong><span>${order.phone}</span></div>` : ''}
                </div>

                <ul class="order-items-list">${itemsHtml}</ul>

                <div class="order-total">
                    <span>Total</span>
                    <strong>${(order.total_price || 0).toLocaleString('fr-FR')} FCFA</strong>
                </div>

                ${order.notes ? `<p class="order-notes"><strong>Notes :</strong> ${order.notes}</p>` : ''}
            </div>
        </article>
    `;
}

function renderCancelledBanner() {
    return `
        <div class="order-cancelled-banner">
            <span>❌</span>
            <p>Cette commande a été annulée.</p>
        </div>
    `;
}

function renderStatusTimeline(currentStatus) {
    const currentIndex = ORDER_STATUS_STEPS.findIndex(step => step.key === currentStatus);

    const stepsHtml = ORDER_STATUS_STEPS.map((step, index) => {
        let stepClass = 'upcoming';
        if (currentIndex === -1) {
            stepClass = index === 0 ? 'active' : 'upcoming';
        } else if (index < currentIndex) {
            stepClass = 'done';
        } else if (index === currentIndex) {
            stepClass = 'active';
        }

        return `
            <div class="timeline-step ${stepClass}">
                <div class="timeline-dot">${step.icon}</div>
                <span class="timeline-label">${step.label}</span>
            </div>
        `;
    }).join('');

    return `<div class="order-timeline">${stepsHtml}</div>`;
}

function formatOrderDate(dateStr) {
    if (!dateStr) return 'Date inconnue';
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function highlightOrderFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    if (!orderId) return;

    const card = document.getElementById(`order-${orderId}`);
    if (!card) return;

    card.classList.add('order-card-highlight');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.history.replaceState({}, document.title, 'commandes.html');
}

function startOrdersRefresh(userId) {
    stopOrdersRefresh();
    ordersRefreshInterval = setInterval(() => loadUserOrders(userId, true), 30000);
}

function stopOrdersRefresh() {
    if (ordersRefreshInterval) {
        clearInterval(ordersRefreshInterval);
        ordersRefreshInterval = null;
    }
}
