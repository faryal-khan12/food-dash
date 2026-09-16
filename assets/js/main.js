/**
 * Food Dash - Main Interactive JavaScript
 */

// Cart State Management
let cart = JSON.parse(localStorage.getItem('foodDashCart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initCategoryFilter();
    initSearch();
    initTrackOrder();
    initNavSmoothScroll();
    initNewsletter();
});

// Toast Notification Helper
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1090';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-orange text-white' : 'bg-dark text-white';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2 fs-6">
                    <i class="bi ${type === 'success' ? 'bi-check-circle-fill fs-5' : 'bi-info-circle-fill fs-5'}"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, { delay: 3000 });
    bsToast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Cart System
function initCart() {
    updateCartUI();

    // Event listeners for Add to Cart / Buy Now buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart, .btn-buy-now, .order-dish');
        if (btn) {
            e.preventDefault();
            const card = btn.closest('.product-card, .dish-card, [data-name]');
            if (card) {
                const item = {
                    id: card.dataset.id || card.querySelector('.dish-name, .p-name')?.textContent.trim() || 'item-' + Date.now(),
                    name: card.dataset.name || card.querySelector('.dish-name, .p-name')?.textContent.trim().replace(/\s+/g, ' '),
                    price: parseFloat(card.dataset.price || (card.querySelector('.p-price')?.textContent.replace(/[^0-9.]/g, '') || 250)),
                    img: card.dataset.img || card.querySelector('img')?.getAttribute('src') || 'assets/images/Food.png',
                    quantity: 1
                };
                addToCart(item);
            } else {
                // Default order action if clicked generic hero button
                const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartDrawer'));
                cartOffcanvas.show();
            }
        }
    });

    // Clear cart button
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            cart = [];
            saveCart();
            updateCartUI();
            showToast('Cart cleared', 'info');
        });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Your cart is empty! Add some delicious food first.', 'info');
                return;
            }
            // Close cart offcanvas
            const cartOffcanvasEl = document.getElementById('cartDrawer');
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
            if (bsOffcanvas) bsOffcanvas.hide();

            // Simulate checkout success
            cart = [];
            saveCart();
            updateCartUI();

            // Show order confirmation modal or toast
            const trackModalEl = document.getElementById('trackOrderModal');
            if (trackModalEl) {
                const trackModal = new bootstrap.Modal(trackModalEl);
                trackModal.show();
            }
            showToast('Order Placed Successfully! Tracking your food delivery...', 'success');
        });
    }
}

function addToCart(item) {
    const existingIndex = cart.findIndex(i => i.name === item.name);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(item);
    }
    saveCart();
    updateCartUI();
    showToast(`Added "${item.name}" to your cart!`, 'success');

    // Bounce cart icon animation
    const cartIcon = document.getElementById('cartIconBtn');
    if (cartIcon) {
        cartIcon.classList.add('bounce-anim');
        setTimeout(() => cartIcon.classList.remove('bounce-anim'), 600);
    }
}

function updateCartQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(index) {
    if (cart[index]) {
        const name = cart[index].name;
        cart.splice(index, 1);
        saveCart();
        updateCartUI();
        showToast(`Removed "${name}" from cart`, 'info');
    }
}

function saveCart() {
    localStorage.setItem('foodDashCart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartTotalEl = document.getElementById('cartTotal');
    const emptyCartMsg = document.getElementById('emptyCartMsg');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = totalItems > 0 ? 40 : 0;
    const grandTotal = subtotal + deliveryFee;

    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            if (emptyCartMsg) emptyCartMsg.classList.remove('d-none');
        } else {
            if (emptyCartMsg) emptyCartMsg.classList.add('d-none');
            cartItemsContainer.innerHTML = cart.map((item, index) => `
                <div class="cart-item d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 bg-light border">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.img}" alt="${item.name}" class="rounded-3" style="width: 55px; height: 55px; object-fit: cover;">
                        <div>
                            <h6 class="mb-0 fw-bold fs-6 text-dark">${item.name}</h6>
                            <small class="text-muted fw-semibold">₹${item.price} x ${item.quantity}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="input-group input-group-sm" style="width: 90px;">
                            <button class="btn btn-outline-secondary btn-decrease" onclick="updateCartQuantity(${index}, -1)">-</button>
                            <span class="input-group-text bg-white justify-content-center fw-bold">${item.quantity}</span>
                            <button class="btn btn-outline-secondary btn-increase" onclick="updateCartQuantity(${index}, 1)">+</button>
                        </div>
                        <button class="btn btn-sm text-danger border-0 ms-1" onclick="removeFromCart(${index})" title="Remove">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal}`;
    if (cartTotalEl) cartTotalEl.textContent = `₹${grandTotal}`;
}

// Category Filtering
function initCategoryFilter() {
    const filterBtns = document.querySelectorAll('.category-btn');
    const menuCards = document.querySelectorAll('.menu-item-col');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active', 'btn-orange'));
            filterBtns.forEach(b => b.classList.add('btn-outline-orange'));
            btn.classList.add('active', 'btn-orange');
            btn.classList.remove('btn-outline-orange');

            const category = btn.dataset.category;

            menuCards.forEach(card => {
                const cardCat = card.dataset.category;
                if (category === 'all' || cardCat === category) {
                    card.style.display = 'block';
                    card.classList.add('animate-fade-in');
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Live Search Modal
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const allItems = Array.from(document.querySelectorAll('.menu-item-col, .dish-card-col')).map(el => {
                const nameEl = el.querySelector('.p-name, .dish-name');
                const priceEl = el.querySelector('.p-price');
                const imgEl = el.querySelector('img');
                return {
                    name: nameEl ? nameEl.textContent.trim().replace(/\s+/g, ' ') : '',
                    price: priceEl ? priceEl.textContent.trim() : '₹250',
                    img: imgEl ? imgEl.getAttribute('src') : 'assets/images/Food.png',
                    element: el
                };
            });

            if (query.length === 0) {
                searchResults.innerHTML = '<p class="text-center text-muted py-4">Start typing to search dishes...</p>';
                return;
            }

            const matches = allItems.filter(item => item.name.toLowerCase().includes(query));

            if (matches.length === 0) {
                searchResults.innerHTML = `<p class="text-center text-muted py-4">No dishes found matching "${query}"</p>`;
            } else {
                searchResults.innerHTML = matches.map(item => `
                    <div class="d-flex align-items-center justify-content-between p-3 border-bottom hover-bg-light rounded-3 mb-2">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${item.img}" alt="${item.name}" class="rounded-3" style="width: 50px; height: 50px; object-fit: cover;">
                            <div>
                                <h6 class="mb-0 fw-bold text-dark">${item.name}</h6>
                                <span class="text-orange fw-semibold">${item.price}</span>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-orange rounded-pill px-3" onclick="addDirectFromSearch('${item.name.replace(/'/g, "\\'")}', '${item.price.replace(/[^0-9.]/g, '')}', '${item.img}')">
                            <i class="bi bi-cart-plus me-1"></i> Add
                        </button>
                    </div>
                `).join('');
            }
        });
    }
}

function addDirectFromSearch(name, price, img) {
    addToCart({
        id: name,
        name: name,
        price: parseFloat(price) || 250,
        img: img,
        quantity: 1
    });
    const searchModalEl = document.getElementById('searchModal');
    if (searchModalEl) {
        const modal = bootstrap.Modal.getInstance(searchModalEl);
        if (modal) modal.hide();
    }
}

// Track Order Modal Timeline
function initTrackOrder() {
    const trackBtns = document.querySelectorAll('.btn-track, [href="#track-order"]');
    trackBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const trackModalEl = document.getElementById('trackOrderModal');
            if (trackModalEl) {
                const trackModal = new bootstrap.Modal(trackModalEl);
                trackModal.show();
            }
        });
    });
}

// Smooth scrolling and active navigation links
function initNavSmoothScroll() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.getElementById('openclose');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            }
        });
    });
}

// Newsletter Subscription
function initNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                showToast(`Thank you for subscribing, ${emailInput.value}! 🍔`, 'success');
                emailInput.value = '';
            }
        });
    }
}
