/* ===========================
   Rajpoot Dhaba — Frontend JS
=========================== */

const API = '';  // same origin

// ── Cart state ──────────────────────────────────────────────
let cart = [];

// ── Helpers ─────────────────────────────────────────────────
function showMessage(elementId, text, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}

function formatPrice(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

// ── Mobile nav toggle ────────────────────────────────────────
document.querySelector('.nav-toggle')?.addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// ── Menu ─────────────────────────────────────────────────────
let allMenuItems = [];

async function loadMenu(category = 'all') {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;

  grid.innerHTML = '<p class="loading">Loading menu...</p>';

  try {
    const url = category === 'all' ? `${API}/api/menu` : `${API}/api/menu?category=${category}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load menu');
    allMenuItems = await res.json();
    renderMenu(allMenuItems);
  } catch (err) {
    grid.innerHTML = `<p class="loading" style="color:#c0392b;">Could not load menu. Please try again later.</p>`;
    console.error(err);
  }
}

function renderMenu(items) {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = '<p class="loading">No items found in this category.</p>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="menu-card" data-id="${item._id}">
      <div class="menu-card-body">
        <div class="menu-card-header">
          <h3>${escapeHtml(item.name)}</h3>
          <span class="price">${formatPrice(item.price)}</span>
        </div>
        <span class="badge ${item.isVegetarian ? 'badge-veg' : 'badge-nonveg'}">
          ${item.isVegetarian ? '🟢 Veg' : '🔴 Non-Veg'}
        </span>
        <span class="badge badge-category">${capitalize(item.category)}</span>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
        <button class="btn btn-primary btn-sm" onclick="addToCart('${item._id}', '${escapeHtml(item.name)}', ${item.price})">
          + Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// Category filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadMenu(btn.dataset.category);
  });
});

// ── Cart ─────────────────────────────────────────────────────
function addToCart(id, name, price) {
  const existing = cart.find(i => i.menuItem === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ menuItem: id, name, price, quantity: 1 });
  }
  renderCart();
  // Scroll to order section hint
  const orderSection = document.getElementById('order');
  if (orderSection) {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#c0392b;color:#fff;padding:0.75rem 1.25rem;border-radius:8px;font-weight:600;z-index:9999;';
    flash.textContent = `✓ ${name} added to cart`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 2500);
  }
}

function updateQuantity(id, delta) {
  const item = cart.find(i => i.menuItem === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(i => i.menuItem !== id);
  renderCart();
}

function renderCart() {
  const summary = document.getElementById('cart-summary');
  if (!summary) return;

  if (!cart.length) {
    summary.innerHTML = '<p class="empty-cart">No items in cart. Browse the menu and add items.</p>';
    return;
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  summary.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span>${escapeHtml(item.name)}</span>
      <div class="cart-item-controls">
        <button onclick="updateQuantity('${item.menuItem}', -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity('${item.menuItem}', 1)">+</button>
        <span>${formatPrice(item.price * item.quantity)}</span>
      </div>
    </div>
  `).join('') + `
    <div class="cart-total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
  `;
}

// ── Order Form ───────────────────────────────────────────────
document.getElementById('order-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!cart.length) {
    showMessage('order-message', 'Please add at least one item to your cart before ordering.', 'error');
    return;
  }

  const form = e.target;
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const payload = {
    customerName: form.customerName.value.trim(),
    customerEmail: form.customerEmail.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    deliveryAddress: form.deliveryAddress.value.trim(),
    notes: form.notes.value.trim(),
    items: cart.map(({ menuItem, name, price, quantity }) => ({ menuItem, name, price, quantity })),
    totalAmount: total,
  };

  try {
    const res = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Order failed');
    showMessage('order-message', '🎉 Order placed successfully! We will contact you shortly.', 'success');
    form.reset();
    cart = [];
    renderCart();
  } catch (err) {
    showMessage('order-message', `Error: ${err.message}`, 'error');
  }
});

// ── Booking Form ─────────────────────────────────────────────
document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const payload = {
    customerName: form.customerName.value.trim(),
    customerEmail: form.customerEmail.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    date: form.date.value,
    time: form.time.value,
    guests: Number(form.guests.value),
    specialRequests: form.specialRequests.value.trim(),
  };

  try {
    const res = await fetch(`${API}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Booking failed');
    showMessage('booking-message', '✅ Table booked successfully! See you soon.', 'success');
    form.reset();
  } catch (err) {
    showMessage('booking-message', `Error: ${err.message}`, 'error');
  }
});

// ── Contact Form ─────────────────────────────────────────────
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim(),
  };

  try {
    const res = await fetch(`${API}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send message');
    showMessage('contact-message-status', '📨 Message sent! We will get back to you soon.', 'success');
    form.reset();
  } catch (err) {
    showMessage('contact-message-status', `Error: ${err.message}`, 'error');
  }
});

// ── Utility ──────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Init ─────────────────────────────────────────────────────
loadMenu();
