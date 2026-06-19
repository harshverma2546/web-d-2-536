// ======================== CART STATE (with item objects) ========================
let cart = []; // each item: { id, name, price, quantity, img }
const cartCountSpan = document.getElementById('cartCountDisplay');
const cartModal = document.getElementById('cartModal');
const cartItemsContainer = document.getElementById('cartItemsList');
const cartTotalSpan = document.getElementById('cartTotal');

// Helper: update cart icon number and save to localStorage
function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountSpan.innerText = totalItems;
  localStorage.setItem('amazonCart', JSON.stringify(cart));
}

// Render cart modal content
function renderCartModal() {
  if (!cartItemsContainer) return;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    cartTotalSpan.innerText = '0.00';
    return;
  }
  let html = '';
  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    html += `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="decrease-qty" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="increase-qty" data-id="${item.id}">+</button>
          <button class="remove-item" data-id="${item.id}">🗑️</button>
        </div>
      </div>
    `;
  });
  cartItemsContainer.innerHTML = html;
  cartTotalSpan.innerText = total.toFixed(2);

  // attach events to modal buttons
  document.querySelectorAll('.decrease-qty').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      changeQuantity(id, -1);
    });
  });
  document.querySelectorAll('.increase-qty').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      changeQuantity(id, 1);
    });
  });
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      removeFromCart(id);
    });
  });
}

function changeQuantity(productId, delta) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    const newQty = cart[index].quantity + delta;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = newQty;
    }
    updateCartUI();
    renderCartModal();
    renderProducts(currentFilter); // refresh product grid to update button states
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
  renderCartModal();
  renderProducts(currentFilter);
}

// Add to cart (called from product buttons)
function addToCart(productId, name, price, img) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: productId, name, price, quantity: 1, img });
  }
  updateCartUI();
  renderCartModal();
  renderProducts(currentFilter); // update button text if needed
  showToast(`✓ ${name} added to cart`);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#232f3e';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '1001';
  toast.style.fontWeight = 'bold';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

// ======================== PRODUCT DATA (with discount flag for deals) ========================
const productsData = [
  { id: 1, name: "Echo Dot (5th Gen)", price: 49.99, rating: 4.6, img: "https://picsum.photos/id/1/300/220", discount: false },
  { id: 2, name: "Fire TV Stick 4K", price: 39.99, rating: 4.7, img: "https://picsum.photos/id/0/300/220", discount: true },
  { id: 3, name: "Kindle Paperwhite", price: 139.99, rating: 4.8, img: "https://picsum.photos/id/24/300/220", discount: false },
  { id: 4, name: "Amazon Basics Laptop Backpack", price: 27.99, rating: 4.4, img: "https://picsum.photos/id/128/300/220", discount: true },
  { id: 5, name: "Wireless Gaming Mouse", price: 29.99, rating: 4.5, img: "https://picsum.photos/id/48/300/220", discount: false },
  { id: 6, name: "Premium Yoga Mat", price: 22.99, rating: 4.3, img: "https://picsum.photos/id/96/300/220", discount: false },
  { id: 7, name: "Noise Cancelling Headphones", price: 89.99, rating: 4.7, img: "https://picsum.photos/id/91/300/220", discount: true },
  { id: 8, name: "Smart Watch (GPS)", price: 199.99, rating: 4.6, img: "https://picsum.photos/id/106/300/220", discount: false }
];

let currentFilter = 'all'; // 'all', 'deals', or search keyword
let searchKeyword = '';

function renderStars(ratingValue) {
  const full = Math.floor(ratingValue);
  const half = ratingValue - full >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
  if (half) stars += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < 5 - full - (half ? 1 : 0); i++) stars += '<i class="far fa-star"></i>';
  return `${stars} <span style="color:#555; font-size:13px;">(${ratingValue})</span>`;
}

function renderProducts(filterType = currentFilter, search = searchKeyword) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let filtered = [...productsData];
  // apply deals filter
  if (filterType === 'deals') {
    filtered = filtered.filter(p => p.discount === true);
  }
  // apply search keyword (case-insensitive)
  if (search.trim() !== '') {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-products">🚀 No products found. Try another search or reset filter.</div>';
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(product => {
    const inCart = cart.find(item => item.id === product.id);
    const qtyInCart = inCart ? inCart.quantity : 0;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img class="product-img" src="${product.img}" alt="${product.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${product.name} ${product.discount ? '🔥 Deal' : ''}</div>
        <div class="rating">${renderStars(product.rating)}</div>
        <div class="price">$${product.price.toFixed(2)} <small>USD</small></div>
        <button class="add-to-cart" data-id="${product.id}" data-name="${product.name.replace(/"/g, '&quot;')}" data-price="${product.price}" data-img="${product.img}">
          <i class="fas fa-cart-plus"></i> ${qtyInCart > 0 ? `Add another (${qtyInCart})` : 'Add to Cart'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach add-to-cart events
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.removeEventListener('click', addToCartHandler);
    btn.addEventListener('click', addToCartHandler);
  });
}

function addToCartHandler(e) {
  const btn = e.currentTarget;
  const id = parseInt(btn.dataset.id);
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  const img = btn.dataset.img;
  addToCart(id, name, price, img);
}

// ======================== SEARCH ENGINE ========================
function performSearch() {
  const input = document.getElementById('searchInput');
  searchKeyword = input.value.trim();
  currentFilter = 'all'; // reset filter when searching
  renderProducts('all', searchKeyword);
}

// ======================== NAVBAR FUNCTIONALITY ========================
function setupNavLinks() {
  const allLink = document.querySelector('.nav-links a:first-child');
  const dealsLink = document.querySelector('.nav-links a:nth-child(2)');
  const customerServiceLink = document.querySelector('.nav-links a:nth-child(3)');
  const registryLink = document.querySelector('.nav-links a:nth-child(4)');
  const giftLink = document.querySelector('.nav-links a:nth-child(5)');
  const sellLink = document.querySelector('.nav-links a:nth-child(6)');

  if (allLink) {
    allLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = 'all';
      searchKeyword = '';
      document.getElementById('searchInput').value = '';
      renderProducts('all', '');
    });
  }
  if (dealsLink) {
    dealsLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = 'deals';
      searchKeyword = '';
      document.getElementById('searchInput').value = '';
      renderProducts('deals', '');
    });
  }
  if (customerServiceLink) {
    customerServiceLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert("📞 Customer Service: Contact us at 1-800-AMAZON (demo).");
    });
  }
  if (registryLink) {
    registryLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert("🎁 Wedding & Gift Registry (demo feature).");
    });
  }
  if (giftLink) {
    giftLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert("🎟️ Gift Cards – buy now for any occasion.");
    });
  }
  if (sellLink) {
    sellLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert("📦 Sell on Amazon – become a seller today!");
    });
  }
}

// ======================== CAROUSEL (unchanged but keep) ========================
const slidesContainer = document.getElementById('carouselSlide');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dotsContainer');
let currentIndex = 0;
let autoSlideInterval;

function updateCarousel() {
  if (slidesContainer) slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, idx) => {
    if (idx === currentIndex) dot.classList.add('active-dot');
    else dot.classList.remove('active-dot');
  });
}
function nextSlide() { currentIndex = (currentIndex + 1) % slides.length; updateCarousel(); }
function prevSlide() { currentIndex = (currentIndex - 1 + slides.length) % slides.length; updateCarousel(); }
function createDots() {
  if (!dotsContainer) return;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === currentIndex) dot.classList.add('active-dot');
    dot.addEventListener('click', () => { currentIndex = i; updateCarousel(); resetAutoSlide(); });
    dotsContainer.appendChild(dot);
  }
}
function startAutoSlide() { if (autoSlideInterval) clearInterval(autoSlideInterval); autoSlideInterval = setInterval(nextSlide, 5000); }
function resetAutoSlide() { clearInterval(autoSlideInterval); startAutoSlide(); }
if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => { clearInterval(autoSlideInterval); prevSlide(); startAutoSlide(); });
  nextBtn.addEventListener('click', () => { clearInterval(autoSlideInterval); nextSlide(); startAutoSlide(); });
}

// ======================== LOAD CART FROM LOCALSTORAGE ========================
function loadCartFromStorage() {
  const saved = localStorage.getItem('amazonCart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
    } catch(e) { cart = []; }
  } else {
    cart = [];
  }
  updateCartUI();
}

// ======================== MODAL CONTROLS ========================
function openCartModal() { if (cartModal) { renderCartModal(); cartModal.style.display = 'block'; } }
function closeCartModal() { if (cartModal) cartModal.style.display = 'none'; }

// ======================== INITIALIZE EVERYTHING ========================
function init() {
  loadCartFromStorage();
  renderProducts('all', '');
  createDots();
  updateCarousel();
  startAutoSlide();
  setupNavLinks();
  // search button
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
  // cart icon
  const cartIcon = document.getElementById('cartIcon');
  if (cartIcon) cartIcon.addEventListener('click', openCartModal);
  // modal close
  const closeSpan = document.querySelector('.close-cart');
  if (closeSpan) closeSpan.addEventListener('click', closeCartModal);
  window.addEventListener('click', (e) => { if (e.target === cartModal) closeCartModal(); });
  // checkout button
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', () => alert('🚀 Checkout simulation: total $' + cartTotalSpan.innerText + '. Thank you!'));
  // other header buttons
  document.getElementById('signInBtn')?.addEventListener('click', () => alert("🔐 Sign in (demo) – your cart is saved locally."));
  document.getElementById('returnsBtn')?.addEventListener('click', () => alert("📦 Returns & Orders demo."));
  document.getElementById('locationBtn')?.addEventListener('click', () => alert("📍 Location: India (demo)"));
  document.getElementById('logoBtn')?.addEventListener('click', () => { location.reload(); });
}

window.addEventListener('load', init);