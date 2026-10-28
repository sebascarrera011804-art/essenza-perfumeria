/* Conexión con tu base de datos en Supabase.
   La clave "publishable" es pública por diseño: la seguridad real
   la dan las reglas (RLS) que ya creaste en la base de datos. */
const SUPABASE_URL = 'https://bhmdlbyexqdtnkufmlpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VKrMu0d8LpdtHet127ZrYQ_KFfaAiSS';

/* WhatsApp del negocio (botón de contacto) */
const PHONE = '593983098535';

/* Datos bancarios que verá el cliente al elegir transferencia */
const BANK = {
    bank:   'Banco Pichincha',           
    type:   'Cuenta de ahorros',          
    number: '2206904769',                 
    holder: 'Sebastian Carrera',        
    id:     '1726586579'                 
};

const CITIES = [
    'Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Riobamba',
    'Santo Domingo', 'Ibarra', 'Otra ciudad'
];

const CATS = ['Mujer', 'Hombre', 'Niños', 'Sets de regalo'];

const CAT_SUBTITLE = {
    'Mujer': 'Florales, dulces y elegantes',
    'Hombre': 'Frescos, amaderados e intensos',
    'Niños': 'Suaves y delicados',
    'Sets de regalo': 'Listos para regalar'
};

const STATUS = {
    pendiente: { label: 'Pendiente', hint: 'Estamos verificando tu pedido.' },
    pagado:    { label: 'Pagado',    hint: 'Pago confirmado. Estamos preparando tu envío.' },
    enviado:   { label: 'Enviado',   hint: 'Tu pedido va en camino.' },
    entregado: { label: 'Entregado', hint: '¡Que disfrutes tu fragancia!' },
    cancelado: { label: 'Cancelado', hint: 'Este pedido fue cancelado.' }
};
const STATUS_FLOW = ['pendiente', 'pagado', 'enviado', 'entregado'];

const CART_KEY = 'essenza_cart_v1';
const MAX_PER_ITEM = 20;


/* =====================================================
   ESTADO
===================================================== */

const sb = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

let P = [];                    // productos (vienen de la base de datos)
let catalogStatus = 'loading'; // loading | ready | error
const state = { cat: 'Todos', q: '', pr: 'all' };
const cart = {};
let currentProductId = null;

let user = null;               // usuario con sesión iniciada
let profile = null;            // sus datos guardados
let cancelingOrder = null;     // pedido esperando confirmación de cancelación


/* =====================================================
   HELPERS
===================================================== */

const $ = id => document.getElementById(id);

const money = value => {
    const n = Number(value) || 0;
    return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const findProduct = id => P.find(p => p.id === Number(id));

const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const phoneDigits = value => String(value || '').replace(/\D/g, '');

const formatDate = iso => new Date(iso).toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric'
});

function setMsg(el, text, type = 'error') {
    if (!el) return;
    el.textContent = text || '';
    el.className = `form-msg ${type}`;
    el.hidden = !text;
}

async function withBusy(button, label, task) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = label;
    try {
        return await task();
    } finally {
        button.disabled = false;
        button.textContent = original;
    }
}

/* Aviso breve (visibilidad del estado del sistema) */
let toastTimer;
function toast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}


/* =====================================================
   VENTANAS (abrir / cerrar con manejo del foco)
===================================================== */

const focusStack = [];
const layerOrder = [];     /* ventanas abiertas, en el orden en que se abrieron */

function syncBodyScroll() {
    const anyOpen = document.querySelector(
        '.drawer.open, .product-overlay.open, .checkout-overlay.open, .success-overlay.open, .m-overlay.open'
    );
    document.body.style.overflow = anyOpen ? 'hidden' : '';
}

function show(el, focusSelector) {
    if (!el || el.classList.contains('open')) return;
    focusStack.push(document.activeElement);
    layerOrder.push(el);
    el.classList.add('open');
    syncBodyScroll();

    setTimeout(() => {
        const target = (focusSelector && el.querySelector(focusSelector)) ||
            el.querySelector('input:not([type=hidden]):not([disabled]), select, textarea, button:not([disabled])');
        if (target && target.focus) target.focus();
    }, 60);
}

function hide(el) {
    if (!el || !el.classList.contains('open')) return;
    el.classList.remove('open');

    const i = layerOrder.lastIndexOf(el);
    if (i >= 0) layerOrder.splice(i, 1);

    syncBodyScroll();
    const previous = focusStack.pop();
    if (previous && previous.focus) previous.focus();
}

/* Cómo se cierra cada tipo de ventana */
const LAYER_RULES = {
    successOverlay:  { box: '.success-modal',  close: () => closeSuccess() },
    checkoutOverlay: { box: '.checkout-modal', close: () => closeCheckout() },
    productOverlay:  { box: '.product-modal',  close: () => closeProduct() },
    drawer:          { box: null,              close: () => closeCart() }
};

/* La ventana que se abrió última (la que está encima) */
function topLayer() {
    const el = [...layerOrder].reverse().find(e => e.classList.contains('open'));
    if (!el) return null;

    const rule = LAYER_RULES[el.id] || { box: '.m-box', close: () => hide(el) };
    return { el, box: rule.box, close: rule.close };
}

function closeMenu() {
    $('navLinks')?.classList.remove('open');
    $('menuBtn')?.setAttribute('aria-expanded', 'false');
}


/* =====================================================
   CARRITO: guardado en el navegador
===================================================== */

function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* sin almacenamiento */ }
}

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
        Object.entries(saved).forEach(([id, qty]) => {
            if (Number.isInteger(qty) && qty > 0) cart[id] = qty;
        });
    } catch (e) { /* ignorar datos dañados */ }
}

/* Quita del carrito lo que ya no existe o ya no alcanza */
function pruneCart() {
    if (catalogStatus !== 'ready') return;

    Object.keys(cart).forEach(id => {
        const p = findProduct(id);
        if (!p || p.stock <= 0) { delete cart[id]; return; }
        cart[id] = Math.min(cart[id], p.stock, MAX_PER_ITEM);
    });
    saveCart();
}

function getCartTotal() {
    return Object.entries(cart).reduce((total, [id, qty]) => {
        const p = findProduct(id);
        return p ? total + p.p * qty : total;
    }, 0);
}

function getCartCount() {
    return Object.values(cart).reduce((total, qty) => total + qty, 0);
}

function maxFor(p) {
    return Math.min(p.stock, MAX_PER_ITEM);
}


/* =====================================================
   CATÁLOGO: carga desde la base de datos
===================================================== */

function mapProduct(row) {
    return {
        id: row.id,
        n: row.name,
        brand: row.brand,
        c: row.category,
        p: Number(row.price),
        t: row.notes,
        d: row.description,
        size: row.size,
        family: row.family,
        image: row.image,
        tag: row.tag,
        stock: row.stock,
        featured: row.featured
    };
}

async function loadProducts() {
    if (!sb) {
        catalogStatus = 'error';
        refreshCatalogUI();
        return;
    }

    try {
        const { data, error } = await sb
            .from('products')
            .select('*')
            .eq('active', true)
            .order('id');

        if (error) throw error;

        P = data.map(mapProduct);
        catalogStatus = 'ready';

    } catch (err) {
        console.error('No se pudo cargar el catálogo:', err);
        P = [];
        catalogStatus = 'error';
    }

    pruneCart();
    refreshCatalogUI();
    renderCart();
}

function refreshCatalogUI() {
    buildCategories();
    buildCategoryChips();
    renderFeatured();
    render();

    const hero = findProduct(2);
    if ($('heroPrice') && hero) $('heroPrice').textContent = money(hero.p);
}


/* =====================================================
   CATEGORÍAS Y FILTROS
===================================================== */

function buildCategories() {
    const container = $('cats');
    if (!container) return;

    container.innerHTML = CATS.map(cat => {
        const count = P.filter(p => p.c === cat).length;
        return `
            <button class="cat" data-cat="${cat}" type="button">
                <h3>${cat}</h3>
                <span>${CAT_SUBTITLE[cat] || ''}</span>
                <em>${catalogStatus === 'ready' ? `${count} fragancias →` : 'Ver fragancias →'}</em>
            </button>
        `;
    }).join('');
}

function buildCategoryChips() {
    const container = $('chips');
    if (!container) return;

    container.innerHTML = ['Todos', ...CATS].map(cat => `
        <button class="chip" data-chip="${cat}" type="button">${cat}</button>
    `).join('');

    syncChips();
}

function syncChips() {
    document.querySelectorAll('.chip').forEach(chip => {
        const active = chip.dataset.chip === state.cat;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', String(active));
    });
}


/* =====================================================
   TARJETAS DE PRODUCTO
===================================================== */

function stockBadge(p) {
    if (p.stock <= 0) return '<span class="stock out">Agotado</span>';
    if (p.stock <= 3) return `<span class="stock low">¡Últimas ${p.stock} unidades!</span>`;
    return '';
}

function productCard(p) {
    const soldOut = p.stock <= 0;
    return `
        <article class="card">
            <div class="img" data-open="${p.id}">
                <img class="product-photo" src="${esc(p.image)}"
                     alt="${esc(p.brand)} ${esc(p.n)}" loading="lazy">
                ${soldOut ? '<span class="product-tag out">AGOTADO</span>'
                          : (p.tag ? `<span class="product-tag">${esc(p.tag)}</span>` : '')}
            </div>

            <div class="in">
                <span class="product-brand">${esc(p.brand)}</span>
                <h3 data-open="${p.id}">${esc(p.n)}</h3>
                <small>${esc(p.c)}</small>
                <p class="notes">${esc(p.t)}</p>
                ${stockBadge(p)}

                <div class="row">
                    <strong class="price">${money(p.p)}</strong>
                    <button class="add" data-id="${p.id}" type="button"
                            ${soldOut ? 'disabled' : ''}
                            aria-label="${soldOut ? 'Agotado' : `Agregar ${esc(p.n)} al carrito`}">
                        ${soldOut ? 'Agotado' : 'Agregar'}
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderFeatured() {
    const container = $('featuredGrid');
    const section = $('destacados');
    if (!container) return;

    const featured = P.filter(p => p.featured).slice(0, 3);
    if (section) section.hidden = catalogStatus === 'ready' && !featured.length;

    if (catalogStatus === 'loading') {
        container.innerHTML = Array(3).fill('<div class="featured-card skeleton" aria-hidden="true"></div>').join('');
        return;
    }
    if (catalogStatus === 'error') {
        container.innerHTML = '';
        if (section) section.hidden = true;
        return;
    }

    container.innerHTML = featured.map(p => {
        const soldOut = p.stock <= 0;
        return `
            <article class="featured-card">
                <div class="product-image" data-open="${p.id}">
                    <img src="${esc(p.image)}" alt="${esc(p.brand)} ${esc(p.n)}" loading="lazy">
                    ${soldOut ? '<span class="product-tag out">AGOTADO</span>'
                              : (p.tag ? `<span class="product-tag">${esc(p.tag)}</span>` : '')}
                </div>

                <div class="featured-info">
                    <span class="product-brand">${esc(p.brand)}</span>
                    <h3 data-open="${p.id}">${esc(p.n)}</h3>
                    <p>${esc(p.t)}</p>

                    <div class="featured-bottom">
                        <strong class="featured-price">${money(p.p)}</strong>
                        <button class="featured-add" data-featured="${p.id}" type="button"
                                ${soldOut ? 'disabled' : ''}>
                            ${soldOut ? 'Agotado' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function render() {
    const container = $('grid');
    if (!container) return;

    if (catalogStatus === 'loading') {
        container.innerHTML = Array(8).fill(
            '<div class="card skeleton" aria-hidden="true"></div>'
        ).join('');
        container.setAttribute('aria-busy', 'true');
        return;
    }
    container.removeAttribute('aria-busy');

    if (catalogStatus === 'error') {
        container.innerHTML = `
            <div class="empty">
                <strong>No pudimos cargar el catálogo.</strong>
                <span>Revisa tu conexión a internet e inténtalo otra vez.</span>
                <button class="btn" type="button" data-retry>Reintentar</button>
            </div>
        `;
        return;
    }

    let products = [...P];

    if (state.cat !== 'Todos') {
        products = products.filter(p => p.c === state.cat);
    }

    const q = state.q.toLowerCase().trim();
    if (q) {
        products = products.filter(p =>
            [p.n, p.brand, p.c, p.t].some(v => String(v).toLowerCase().includes(q))
        );
    }

    if (state.pr !== 'all') {
        const [min, max] = state.pr.split('-').map(Number);
        products = products.filter(p => p.p >= min && p.p <= max);
    }

    if (!products.length) {
        container.innerHTML = `
            <div class="empty">
                <strong>No encontramos perfumes.</strong>
                <span>Prueba con otra búsqueda o categoría.</span>
                <button class="btn line" type="button" data-clear-filters>Quitar filtros</button>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(productCard).join('');
}

function clearFilters() {
    state.cat = 'Todos';
    state.q = '';
    state.pr = 'all';
    if ($('q')) $('q').value = '';
    if ($('price')) $('price').value = 'all';
    syncChips();
    render();
}


/* =====================================================
   MODAL DE PRODUCTO
===================================================== */

function openProduct(id) {
    const p = findProduct(id);
    if (!p) return;

    currentProductId = p.id;
    const soldOut = p.stock <= 0;

    $('productModalImage').src = p.image;
    $('productModalImage').alt = `${p.brand} ${p.n}`;
    $('productModalTag').textContent = soldOut ? 'AGOTADO' : (p.tag || '');
    $('productModalTag').style.display = (soldOut || p.tag) ? '' : 'none';
    $('productModalCategory').textContent = `${p.brand} · ${p.c}`;
    $('productModalTitle').textContent = p.n;
    $('productModalNotes').textContent = p.t;
    $('productModalDescription').textContent = p.d || '';
    $('productModalSize').textContent = p.size || 'Consultar';
    $('productModalFamily').textContent = p.family || '—';
    $('productModalPrice').textContent = money(p.p);

    const stockEl = $('productModalStock');
    stockEl.textContent = soldOut ? 'Agotado'
        : p.stock <= 3 ? `Últimas ${p.stock} unidades` : 'Disponible';
    stockEl.classList.toggle('sold-out', soldOut);

    const addBtn = $('productModalAdd');
    addBtn.disabled = soldOut;
    addBtn.textContent = soldOut ? 'Agotado' : 'Agregar al carrito';

    show($('productOverlay'), '#productModalAdd');
}

function closeProduct() {
    hide($('productOverlay'));
    currentProductId = null;
}


/* =====================================================
   CARRITO
===================================================== */

function renderCart() {
    const container = $('items');
    if (!container) return;

    const ids = Object.keys(cart);

    if (!ids.length) {
        container.innerHTML = `
            <div class="empty">
                <strong>Tu carrito está vacío.</strong>
                <span>Agrega un perfume para comenzar.</span>
            </div>
        `;
    } else {
        container.innerHTML = ids.map(id => {
            const product = findProduct(id);
            const quantity = cart[id];
            if (!product) return '';

            const atLimit = quantity >= maxFor(product);

            return `
                <div class="it">
                    <img class="cart-image" src="${esc(product.image)}"
                         alt="${esc(product.brand)} ${esc(product.n)}">

                    <div class="cart-product">
                        <span class="cart-category">${esc(product.brand)}</span>
                        <strong>${esc(product.n)}</strong>

                        <div class="q">
                            <button data-d="${product.id}" data-dir="-1" type="button"
                                    aria-label="Disminuir cantidad de ${esc(product.n)}">−</button>
                            <span aria-live="polite">${quantity}</span>
                            <button data-d="${product.id}" data-dir="1" type="button"
                                    ${atLimit ? 'disabled' : ''}
                                    aria-label="Aumentar cantidad de ${esc(product.n)}">+</button>
                        </div>

                        <button class="remove" data-remove="${product.id}" type="button">Quitar</button>
                    </div>

                    <strong class="cart-price">${money(product.p * quantity)}</strong>
                </div>
            `;
        }).join('');
    }

    $('count').textContent = getCartCount();
    $('total').textContent = money(getCartTotal());
    $('buy').disabled = ids.length === 0;
}

function addToCart(id) {
    const p = findProduct(id);
    if (!p) return false;

    if (p.stock <= 0) {
        toast(`${p.n} está agotado.`);
        return false;
    }

    const current = cart[p.id] || 0;
    if (current >= maxFor(p)) {
        toast(`Solo hay ${maxFor(p)} unidades disponibles de ${p.n}.`);
        return false;
    }

    cart[p.id] = current + 1;
    saveCart();
    renderCart();
    return true;
}

function changeQuantity(id, direction) {
    const p = findProduct(id);
    if (!p || !cart[p.id]) return;

    if (direction > 0 && cart[p.id] >= maxFor(p)) {
        toast(`Solo hay ${maxFor(p)} unidades disponibles de ${p.n}.`);
        return;
    }

    cart[p.id] += direction;
    if (cart[p.id] <= 0) delete cart[p.id];

    saveCart();
    renderCart();
    afterCartChange();
}

function removeFromCart(id) {
    const p = findProduct(id);
    delete cart[Number(id)];
    saveCart();
    renderCart();
    afterCartChange();
    if (p) toast(`Quitaste ${p.n} del carrito.`);
}

function afterCartChange() {
    if (!Object.keys(cart).length) closeCheckout();
    else if ($('checkoutOverlay').classList.contains('open')) {
        renderCheckoutSummary();
        renderPaymentInfo();
    }
}

function openCart() {
    $('drawerOverlay').classList.add('open');
    show($('drawer'), '#close');
}

function closeCart() {
    $('drawerOverlay').classList.remove('open');
    hide($('drawer'));
}


/* =====================================================
   CHECKOUT
===================================================== */

function fillCities() {
    const options = CITIES.map(c => `<option value="${c}">${c}</option>`).join('');
    ['customerCity', 'pfCity'].forEach(id => {
        const select = $(id);
        if (select) {
            select.innerHTML = `<option value="">Selecciona una ciudad</option>${options}`;
        }
    });
}

function renderCheckoutSummary() {
    const container = $('checkoutSummary');
    if (!container) return;

    const ids = Object.keys(cart);

    if (!ids.length) {
        container.innerHTML = '<p>No hay productos en el carrito.</p>';
        return;
    }

    container.innerHTML = `
        <h3>Resumen de tu pedido</h3>

        ${ids.map(id => {
            const product = findProduct(id);
            if (!product) return '';
            return `
                <div class="summary-item">
                    <span>${esc(product.brand)} - ${esc(product.n)} × ${cart[id]}</span>
                    <strong>${money(product.p * cart[id])}</strong>
                </div>
            `;
        }).join('')}

        <div class="summary-total">
            <span>Total a pagar</span>
            <strong>${money(getCartTotal())}</strong>
        </div>
    `;
}

function renderPaymentInfo() {
    const method = $('paymentMethod').value;
    const box = $('payInfo');
    const total = money(getCartTotal());

    $('proofLabel').hidden = method !== 'Transferencia bancaria';

    if (method === 'Transferencia bancaria') {
        box.hidden = false;
        box.innerHTML = `
            <h3>Datos para tu transferencia</h3>

            <dl class="bank-data">
                <div><dt>Banco</dt><dd>${esc(BANK.bank)}</dd></div>
                <div><dt>Tipo de cuenta</dt><dd>${esc(BANK.type)}</dd></div>
                <div>
                    <dt>N.º de cuenta</dt>
                    <dd>
                        <strong>${esc(BANK.number)}</strong>
                        <button type="button" class="copy-btn" data-copy="${esc(BANK.number)}">Copiar</button>
                    </dd>
                </div>
                <div><dt>Titular</dt><dd>${esc(BANK.holder)}</dd></div>
                <div><dt>Cédula / RUC</dt><dd>${esc(BANK.id)}</dd></div>
                <div>
                    <dt>Valor a transferir</dt>
                    <dd>
                        <strong class="bank-amount">${total}</strong>
                        <button type="button" class="copy-btn" data-copy="${getCartTotal()}">Copiar</button>
                    </dd>
                </div>
            </dl>

            <ol class="pay-steps">
                <li>Abre la app de tu banco y transfiere <b>${total}</b> a la cuenta indicada.</li>
                <li>Guarda el comprobante y copia su <b>número</b>.</li>
                <li>Escríbelo en el campo de abajo y presiona <b>Confirmar compra</b>.</li>
            </ol>

            <p class="pay-note">
                Tu pedido se confirma cuando verifiquemos el pago.
                Te contactaremos al teléfono que ingresaste.
            </p>
        `;
    } else if (method === 'Pago contra entrega') {
        box.hidden = false;
        box.innerHTML = `
            <h3>Pago contra entrega</h3>
            <p class="pay-note">
                No pagas nada ahora. Cuando recibas tu pedido pagarás <b>${total}</b>.
                Te contactaremos al teléfono que ingresaste para coordinar la entrega.
            </p>
        `;
    } else {
        box.hidden = true;
        box.innerHTML = '';
    }
}

/* Aviso arriba del formulario: invitado o con cuenta */
function renderCheckoutAccount() {
    const box = $('checkoutAccount');
    const saveWrap = $('saveProfileWrap');
    if (!box) return;

    if (user) {
        box.innerHTML = `Comprando como <b>${esc(user.email)}</b>. Tus datos se completaron solos.`;
        box.className = 'checkout-account logged';
        if (saveWrap) saveWrap.hidden = false;
    } else {
        box.innerHTML = `
            ¿Ya tienes cuenta?
            <button type="button" class="link-btn" data-auth="login">Inicia sesión</button>
            para completar tus datos automáticamente, o
            <button type="button" class="link-btn" data-auth="register">crea una cuenta</button>.
            También puedes comprar como invitado.
        `;
        box.className = 'checkout-account';
        if (saveWrap) saveWrap.hidden = true;
    }
}

/* Completa solo los campos que el cliente todavía no escribió */
function fillCheckoutFromProfile() {
    if (!profile) return;

    const map = {
        customerName: profile.full_name,
        customerPhone: profile.phone,
        customerAddress: profile.address,
        customerCity: profile.city,
        customerSector: profile.sector,
        customerReference: profile.reference
    };

    Object.entries(map).forEach(([id, value]) => {
        const el = $(id);
        if (el && !el.value && value) el.value = value;
    });
}

function openCheckout() {
    if (!Object.keys(cart).length) return;

    closeCart();
    renderCheckoutSummary();
    renderPaymentInfo();
    renderCheckoutAccount();
    fillCheckoutFromProfile();
    clearCheckoutError();

    show($('checkoutOverlay'), '#customerName');
}

function closeCheckout() {
    hide($('checkoutOverlay'));
}

function showCheckoutError(message, field) {
    const box = $('checkoutError');
    box.textContent = message;
    box.classList.add('show');

    document.querySelectorAll('#checkoutForm .invalid')
        .forEach(el => el.classList.remove('invalid'));

    if (field) {
        field.classList.add('invalid');
        field.focus();
    } else if (box.scrollIntoView) {
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function clearCheckoutError() {
    const box = $('checkoutError');
    box.textContent = '';
    box.classList.remove('show');

    document.querySelectorAll('#checkoutForm .invalid')
        .forEach(el => el.classList.remove('invalid'));
}

function closeSuccess() {
    hide($('successOverlay'));
}

function orderErrorMessage(error) {
    const text = String(error?.message || '');

    /* Los mensajes que escribimos en la base de datos ya están en español */
    if (error?.code === 'P0001') return text;
    if (/fetch|network|failed/i.test(text)) {
        return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo. No se ha cobrado nada.';
    }
    return 'No pudimos registrar tu pedido. Inténtalo de nuevo. No se ha cobrado nada.';
}

function showSuccess(order) {
    $('successOrder').textContent = order.number;

    const nextStep = order.payment === 'Transferencia bancaria'
        ? `Verificaremos tu transferencia (comprobante <b>${esc(order.proof)}</b>) y te contactaremos al <b>${esc(order.phone)}</b> para coordinar la entrega.`
        : `Te contactaremos al <b>${esc(order.phone)}</b> para coordinar la entrega. Ten listo <b>${money(order.total)}</b> para pagar al recibir.`;

    $('successDetails').innerHTML = `
        <div class="success-row"><span>Total</span><strong>${money(order.total)}</strong></div>
        <div class="success-row"><span>Pago</span><strong>${esc(order.payment)}</strong></div>
        <div class="success-row"><span>Entrega en</span><strong>${esc(order.city)}</strong></div>
        <p class="success-next">${nextStep}</p>
    `;

    const trackBtn = $('successTrack');
    trackBtn.textContent = user ? 'Ver mis pedidos' : 'Rastrear mi pedido';
    trackBtn.dataset.number = order.number;
    trackBtn.dataset.phone = order.phone;

    show($('successOverlay'), '#successClose');
}


/* =====================================================
   CUENTA: sesión, registro, recuperación
===================================================== */

function authMessage(error) {
    const m = String(error?.message || '').toLowerCase();

    if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
    if (m.includes('already registered') || m.includes('already been registered')) {
        return 'Ya existe una cuenta con ese correo. Prueba iniciar sesión.';
    }
    if (m.includes('not confirmed')) return 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.';
    if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
        return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    if (m.includes('same password')) return 'La nueva contraseña debe ser distinta a la anterior.';
    if (m.includes('password')) return 'La contraseña es muy débil. Usa al menos 8 caracteres.';
    if (m.includes('fetch') || m.includes('network')) return 'No hay conexión con el servidor. Revisa tu internet.';
    return 'Ocurrió un problema. Inténtalo de nuevo.';
}

function displayName() {
    const name = (profile?.full_name || user?.user_metadata?.full_name || '').trim();
    if (name) return name.split(' ')[0];
    return user?.email ? user.email.split('@')[0] : '';
}

function updateHeader() {
    const label = $('accountLabel');
    const button = $('accountBtn');
    if (!label || !button) return;

    if (user) {
        label.textContent = `Hola, ${displayName()}`;
        button.setAttribute('aria-label', 'Abrir mi cuenta');
    } else {
        label.textContent = 'Ingresar';
        button.setAttribute('aria-label', 'Ingresar o crear cuenta');
    }
}

async function loadProfile() {
    if (!sb || !user) return;

    const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error('No se pudo cargar el perfil:', error);
        return;
    }

    profile = data || null;
    updateHeader();
    fillProfileForm();

    if ($('checkoutOverlay').classList.contains('open')) {
        renderCheckoutAccount();
        fillCheckoutFromProfile();
    }
}

function setUser(nextUser) {
    const changed = (user?.id || null) !== (nextUser?.id || null);
    user = nextUser;

    if (!user) {
        profile = null;
        cancelingOrder = null;
        hide($('accountOverlay'));
    }

    updateHeader();

    if (user && changed) {
        /* No se llama a la base dentro del evento de autenticación (recomendación de Supabase) */
        setTimeout(loadProfile, 0);
    }

    if ($('checkoutOverlay').classList.contains('open')) renderCheckoutAccount();
}

async function initAuth() {
    if (!sb) return;

    const { data } = await sb.auth.getSession();
    setUser(data?.session?.user ?? null);

    sb.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
            setTimeout(() => openAuth('newpass'), 0);
        }
    });
}

/* --- Ventana de ingreso / registro --- */

const AUTH_TITLES = {
    login: 'Ingresar',
    register: 'Crea tu cuenta',
    recover: 'Recuperar contraseña',
    newpass: 'Nueva contraseña'
};

function showAuthPanel(name) {
    document.querySelectorAll('[data-auth-panel]').forEach(form => {
        form.hidden = form.dataset.authPanel !== name;
    });

    $('authTitle').textContent = AUTH_TITLES[name];
    $('authTabs').hidden = !(name === 'login' || name === 'register');

    document.querySelectorAll('[data-auth-tab]').forEach(tab => {
        const active = tab.dataset.authTab === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });

    ['loginError', 'registerError', 'recoverMsg', 'newPassError'].forEach(id => setMsg($(id), ''));
}

function openAuth(panel = 'login') {
    if (user && panel !== 'newpass') {
        openAccount();
        return;
    }

    showAuthPanel(panel);
    show($('authOverlay'));

    const first = { login: 'loginEmail', register: 'regName', recover: 'recEmail', newpass: 'newPass' }[panel];
    setTimeout(() => $(first)?.focus(), 80);
}

function closeAuth() {
    hide($('authOverlay'));
}

function afterLogin() {
    closeAuth();
    toast('Sesión iniciada.');
}

/* --- Mi cuenta --- */

function showAccountTab(tab) {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
    });
    $('panelOrders').hidden = tab !== 'orders';
    $('panelProfile').hidden = tab !== 'profile';

    if (tab === 'orders') loadOrders();
}

function openAccount(tab = 'orders') {
    if (!user) {
        openAuth('login');
        return;
    }

    $('accountName').textContent = `Hola, ${displayName()}`;
    $('accountEmail').textContent = user.email;
    fillProfileForm();
    showAccountTab(tab);
    show($('accountOverlay'));
}

function fillProfileForm() {
    if (!$('pfName')) return;

    $('pfName').value = profile?.full_name || '';
    $('pfPhone').value = profile?.phone || '';
    $('pfAddress').value = profile?.address || '';
    $('pfCity').value = profile?.city || '';
    $('pfSector').value = profile?.sector || '';
    $('pfReference').value = profile?.reference || '';
}

/* --- Estado de un pedido (barra de progreso con texto, no solo color) --- */

function statusBlock(status) {
    const info = STATUS[status] || { label: status, hint: '' };

    if (status === 'cancelado') {
        return `
            <span class="badge cancelado">${info.label}</span>
            <p class="order-hint">${info.hint}</p>
        `;
    }

    const current = STATUS_FLOW.indexOf(status);

    return `
        <span class="badge ${status}">${info.label}</span>
        <ol class="stepper" aria-label="Progreso del pedido">
            ${STATUS_FLOW.map((step, i) => `
                <li class="${i < current ? 'done' : ''} ${i === current ? 'current' : ''}"
                    ${i === current ? 'aria-current="step"' : ''}>
                    ${STATUS[step].label}
                </li>
            `).join('')}
        </ol>
        <p class="order-hint">${info.hint}</p>
    `;
}

async function loadOrders() {
    const list = $('ordersList');
    if (!list || !user) return;

    list.innerHTML = '<div class="skeleton-line"></div><div class="skeleton-line"></div>';

    const { data, error } = await sb
        .from('orders')
        .select('order_number,status,total,payment_method,created_at,order_items(product_name,quantity,unit_price)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        list.innerHTML = `
            <div class="empty">
                <strong>No pudimos cargar tus pedidos.</strong>
                <button class="btn line" type="button" data-reload-orders>Reintentar</button>
            </div>`;
        return;
    }

    if (!data.length) {
        list.innerHTML = `
            <div class="empty">
                <strong>Aún no tienes pedidos.</strong>
                <span>Cuando compres, aquí verás su estado.</span>
            </div>`;
        return;
    }

    list.innerHTML = data.map(order => {
        const confirming = cancelingOrder === order.order_number;

        const cancel = order.status !== 'pendiente' ? '' : confirming ? `
            <div class="cancel-confirm" role="alert">
                <span>¿Seguro que quieres cancelar este pedido?</span>
                <button class="btn danger" type="button" data-cancel-yes="${esc(order.order_number)}">Sí, cancelar</button>
                <button class="btn line" type="button" data-cancel-no>No, volver</button>
            </div>` : `
            <button class="link-btn danger" type="button" data-cancel="${esc(order.order_number)}">Cancelar pedido</button>`;

        return `
            <article class="order">
                <header>
                    <div>
                        <strong>${esc(order.order_number)}</strong>
                        <small>${formatDate(order.created_at)} · ${esc(order.payment_method)}</small>
                    </div>
                    <strong class="order-total">${money(order.total)}</strong>
                </header>

                ${statusBlock(order.status)}

                <ul class="order-items">
                    ${(order.order_items || []).map(i => `
                        <li><span>${esc(i.product_name)} × ${i.quantity}</span><span>${money(i.unit_price * i.quantity)}</span></li>
                    `).join('')}
                </ul>

                ${cancel}
            </article>
        `;
    }).join('');
}

async function cancelOrder(number) {
    const { error } = await sb.rpc('cancel_my_order', { p_number: number });
    cancelingOrder = null;

    if (error) {
        toast(error.code === 'P0001' ? error.message : 'No pudimos cancelar el pedido. Inténtalo de nuevo.');
    } else {
        toast('Pedido cancelado.');
        loadProducts();   /* el stock se devolvió */
    }

    loadOrders();
}

/* --- Rastrear pedido (invitados) --- */

function openTrack(number = '', phone = '') {
    $('trackNumber').value = number;
    $('trackPhone').value = phone;
    $('trackResult').innerHTML = '';
    show($('trackOverlay'), number ? '#trackPhone' : '#trackNumber');
}


/* =====================================================
   EVENTOS: clics
===================================================== */

document.addEventListener('click', event => {

    const t = event.target;

    /* Copiar dato bancario */
    const copyBtn = t.closest('[data-copy]');
    if (copyBtn) {
        const text = copyBtn.dataset.copy;
        const done = () => {
            const old = copyBtn.textContent;
            copyBtn.textContent = '¡Copiado!';
            copyBtn.classList.add('done');
            setTimeout(() => {
                copyBtn.textContent = old;
                copyBtn.classList.remove('done');
            }, 1600);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
            const area = document.createElement('textarea');
            area.value = text;
            document.body.appendChild(area);
            area.select();
            try { document.execCommand('copy'); } catch (e) { /* nada */ }
            area.remove();
            done();
        }
        return;
    }

    /* Mostrar / ocultar contraseña */
    const passToggle = t.closest('[data-toggle-pass]');
    if (passToggle) {
        const input = $(passToggle.dataset.togglePass);
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        passToggle.textContent = visible ? 'Mostrar' : 'Ocultar';
        passToggle.setAttribute('aria-pressed', String(!visible));
        return;
    }

    /* Abrir ventana de cuenta (desde enlaces) */
    const authLink = t.closest('[data-auth]');
    if (authLink) {
        openAuth(authLink.dataset.auth);
        return;
    }

    const authTab = t.closest('[data-auth-tab]');
    if (authTab) {
        showAuthPanel(authTab.dataset.authTab);
        return;
    }

    const accountTab = t.closest('[data-tab]');
    if (accountTab) {
        showAccountTab(accountTab.dataset.tab);
        return;
    }

    /* Pedidos: cancelar con confirmación */
    const cancelBtn = t.closest('[data-cancel]');
    if (cancelBtn) { cancelingOrder = cancelBtn.dataset.cancel; loadOrders(); return; }

    if (t.closest('[data-cancel-no]')) { cancelingOrder = null; loadOrders(); return; }

    const cancelYes = t.closest('[data-cancel-yes]');
    if (cancelYes) {
        withBusy(cancelYes, 'Cancelando…', () => cancelOrder(cancelYes.dataset.cancelYes));
        return;
    }

    if (t.closest('[data-reload-orders]')) { loadOrders(); return; }
    if (t.closest('[data-open-track]')) { closeMenu(); openTrack(); return; }

    /* Reintentar catálogo / quitar filtros */
    if (t.closest('[data-retry]')) {
        catalogStatus = 'loading';
        refreshCatalogUI();
        loadProducts();
        return;
    }
    if (t.closest('[data-clear-filters]')) { clearFilters(); return; }

    /* Chips del catálogo */
    const chip = t.closest('.chip');
    if (chip) {
        state.cat = chip.dataset.chip;
        syncChips();
        render();
        return;
    }

    /* Tarjetas de categoría */
    const category = t.closest('.cat');
    if (category) {
        state.cat = category.dataset.cat;
        syncChips();
        render();
        $('catalogo')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    /* Agregar desde catálogo */
    const add = t.closest('.add');
    if (add) {
        if (addToCart(add.dataset.id)) openCart();
        return;
    }

    /* Agregar desde destacados */
    const featured = t.closest('[data-featured]');
    if (featured) {
        if (addToCart(featured.dataset.featured)) openCart();
        return;
    }

    /* Cantidad / quitar en el carrito */
    const quantityButton = t.closest('[data-d]');
    if (quantityButton) {
        changeQuantity(quantityButton.dataset.d, Number(quantityButton.dataset.dir));
        return;
    }

    const removeBtn = t.closest('[data-remove]');
    if (removeBtn) { removeFromCart(removeBtn.dataset.remove); return; }

    /* Detalle de producto */
    const open = t.closest('[data-open]');
    if (open) { openProduct(open.dataset.open); return; }

    /* Cerrar menú móvil al elegir un enlace */
    if (t.closest('#navLinks a')) closeMenu();
});


/* =====================================================
   EVENTOS: botones y campos
===================================================== */

$('q')?.addEventListener('input', event => {
    state.q = event.target.value;
    render();
});

$('price')?.addEventListener('change', event => {
    state.pr = event.target.value;
    render();
});

$('open')?.addEventListener('click', openCart);
$('close')?.addEventListener('click', closeCart);
$('drawerOverlay')?.addEventListener('click', closeCart);
$('buy')?.addEventListener('click', openCheckout);

$('menuBtn')?.addEventListener('click', () => {
    const open = $('navLinks').classList.toggle('open');
    $('menuBtn').setAttribute('aria-expanded', String(open));
});

$('accountBtn')?.addEventListener('click', () => user ? openAccount() : openAuth('login'));

$('productClose')?.addEventListener('click', closeProduct);
$('productOverlay')?.addEventListener('click', event => {
    if (event.target === $('productOverlay')) closeProduct();
});
$('productModalAdd')?.addEventListener('click', () => {
    const id = currentProductId;
    if (id && addToCart(id)) {
        closeProduct();
        openCart();
    }
});

$('checkoutClose')?.addEventListener('click', closeCheckout);
$('checkoutOverlay')?.addEventListener('click', event => {
    if (event.target === $('checkoutOverlay')) closeCheckout();
});

$('paymentMethod')?.addEventListener('change', () => {
    renderPaymentInfo();
    clearCheckoutError();
});

$('checkoutForm')?.addEventListener('input', event => {
    event.target.classList.remove('invalid');
});

$('successClose')?.addEventListener('click', closeSuccess);
$('successTrack')?.addEventListener('click', event => {
    const { number, phone } = event.currentTarget.dataset;
    closeSuccess();
    if (user) openAccount('orders');
    else openTrack(number, phone);
});

/* Cierre de las ventanas nuevas (botón × y clic fuera) */
['authOverlay', 'accountOverlay', 'trackOverlay'].forEach(id => {
    const overlay = $(id);
    overlay?.addEventListener('click', event => {
        if (event.target === overlay || event.target.closest('[data-close-modal]')) hide(overlay);
    });
});


/* =====================================================
   FORMULARIO DE CHECKOUT
===================================================== */

$('checkoutForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    clearCheckoutError();

    if (!Object.keys(cart).length) {
        showCheckoutError('Tu carrito está vacío.');
        return;
    }

    if (!sb) {
        showCheckoutError('No hay conexión con el servidor. Recarga la página e inténtalo de nuevo.');
        return;
    }

    const fields = {
        name: $('customerName'),
        phone: $('customerPhone'),
        address: $('customerAddress'),
        city: $('customerCity'),
        sector: $('customerSector'),
        reference: $('customerReference'),
        payment: $('paymentMethod'),
        proof: $('paymentProof')
    };

    const v = key => fields[key].value.trim();
    const digits = phoneDigits(v('phone'));

    if (v('name').length < 3) {
        return showCheckoutError('Escribe tu nombre completo.', fields.name);
    }
    if (!v('phone')) {
        return showCheckoutError('Escribe tu número de teléfono.', fields.phone);
    }
    if (digits.length < 9 || digits.length > 13) {
        return showCheckoutError('Revisa tu teléfono. Ejemplo: 0987654321.', fields.phone);
    }
    if (v('address').length < 5) {
        return showCheckoutError('Escribe tu dirección de entrega.', fields.address);
    }
    if (!v('city')) {
        return showCheckoutError('Selecciona tu ciudad.', fields.city);
    }
    if (!v('payment')) {
        return showCheckoutError('Elige cómo quieres pagar.', fields.payment);
    }
    if (v('payment') === 'Transferencia bancaria' && v('proof').length < 4) {
        return showCheckoutError(
            'Escribe el número de comprobante de tu transferencia. Lo encuentras en la app de tu banco.',
            fields.proof
        );
    }

    const isTransfer = v('payment') === 'Transferencia bancaria';
    const submit = event.target.querySelector('.checkout-submit');

    await withBusy(submit, 'Enviando tu pedido…', async () => {

        const { data, error } = await sb.rpc('create_order', {
            p_name: v('name'),
            p_phone: v('phone'),
            p_address: v('address'),
            p_city: v('city'),
            p_sector: v('sector'),
            p_reference: v('reference'),
            p_payment: v('payment'),
            p_proof: isTransfer ? v('proof') : '',
            /* Solo se envía id y cantidad: el precio lo pone el servidor */
            p_items: Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }))
        });

        if (error || !data) {
            console.error(error);
            showCheckoutError(orderErrorMessage(error));

            /* Si el problema fue de stock, se actualiza el catálogo en pantalla */
            if (/stock|disponible/i.test(String(error?.message || ''))) {
                await loadProducts();
                renderCheckoutSummary();
            }
            return;
        }

        const order = {
            number: data.order_number,
            total: data.total,
            phone: v('phone'),
            city: v('city'),
            payment: v('payment'),
            proof: isTransfer ? v('proof') : ''
        };

        /* Guardar los datos en su cuenta si lo pidió */
        if (user && $('saveProfile')?.checked) {
            sb.from('profiles').upsert({
                id: user.id,
                full_name: v('name'),
                phone: v('phone'),
                address: v('address'),
                city: v('city'),
                sector: v('sector'),
                reference: v('reference'),
                updated_at: new Date().toISOString()
            }).then(({ error: e }) => { if (!e) loadProfile(); });
        }

        closeCheckout();
        showSuccess(order);

        Object.keys(cart).forEach(id => delete cart[id]);
        saveCart();
        renderCart();
        event.target.reset();
        renderPaymentInfo();

        loadProducts();   /* el stock cambió */
    });
});


/* =====================================================
   FORMULARIOS DE CUENTA
===================================================== */

$('loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('loginEmail').value.trim();
    const password = $('loginPass').value;

    if (!isEmail(email)) return setMsg($('loginError'), 'Escribe un correo válido.');
    if (!password) return setMsg($('loginError'), 'Escribe tu contraseña.');
    setMsg($('loginError'), '');

    await withBusy(event.target.querySelector('button[type=submit]'), 'Ingresando…', async () => {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return setMsg($('loginError'), authMessage(error));

        event.target.reset();
        afterLogin();
    });
});

$('registerForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('regName').value.trim();
    const email = $('regEmail').value.trim();
    const password = $('regPass').value;
    const box = $('registerError');

    if (name.length < 2) return setMsg(box, 'Escribe tu nombre.');
    if (!isEmail(email)) return setMsg(box, 'Escribe un correo válido.');
    if (password.length < 8) return setMsg(box, 'La contraseña debe tener al menos 8 caracteres.');
    setMsg(box, '');

    await withBusy(event.target.querySelector('button[type=submit]'), 'Creando cuenta…', async () => {
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) return setMsg(box, authMessage(error));

        /* Supabase no da error si el correo ya existe: devuelve un usuario sin identidades */
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            return setMsg(box, 'Ya existe una cuenta con ese correo. Prueba iniciar sesión.');
        }

        event.target.reset();

        if (data?.session) {
            closeAuth();
            toast('¡Cuenta creada! Ya puedes comprar.');
        } else {
            setMsg(box, 'Te enviamos un correo para confirmar tu cuenta. Revísalo y luego inicia sesión.', 'ok');
        }
    });
});

$('recoverForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('recEmail').value.trim();

    if (!isEmail(email)) return setMsg($('recoverMsg'), 'Escribe un correo válido.');

    await withBusy(event.target.querySelector('button[type=submit]'), 'Enviando…', async () => {
        const options = location.protocol.startsWith('http')
            ? { redirectTo: location.origin + location.pathname }
            : {};

        const { error } = await sb.auth.resetPasswordForEmail(email, options);
        if (error) return setMsg($('recoverMsg'), authMessage(error));

        /* Mismo mensaje exista o no el correo (así no se revela quién tiene cuenta) */
        setMsg($('recoverMsg'), 'Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.', 'ok');
    });
});

$('newPassForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const password = $('newPass').value;

    if (password.length < 8) return setMsg($('newPassError'), 'La contraseña debe tener al menos 8 caracteres.');

    await withBusy(event.target.querySelector('button[type=submit]'), 'Guardando…', async () => {
        const { error } = await sb.auth.updateUser({ password });
        if (error) return setMsg($('newPassError'), authMessage(error));

        event.target.reset();
        closeAuth();
        toast('Contraseña actualizada.');
    });
});

$('profileForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const box = $('profileMsg');
    const phone = $('pfPhone').value.trim();

    if (phone && (phoneDigits(phone).length < 9 || phoneDigits(phone).length > 13)) {
        return setMsg(box, 'Revisa tu teléfono. Ejemplo: 0987654321.');
    }

    await withBusy(event.target.querySelector('button[type=submit]'), 'Guardando…', async () => {
        const row = {
            id: user.id,
            full_name: $('pfName').value.trim(),
            phone,
            address: $('pfAddress').value.trim(),
            city: $('pfCity').value,
            sector: $('pfSector').value.trim(),
            reference: $('pfReference').value.trim(),
            updated_at: new Date().toISOString()
        };

        const { error } = await sb.from('profiles').upsert(row);
        if (error) {
            console.error(error);
            return setMsg(box, 'No pudimos guardar tus datos. Inténtalo de nuevo.');
        }

        profile = row;
        updateHeader();
        $('accountName').textContent = `Hola, ${displayName()}`;
        setMsg(box, '¡Datos guardados! Los usaremos para completar tus próximas compras.', 'ok');
    });
});

$('logoutBtn')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    $('checkoutForm')?.reset();   /* no dejar datos personales en equipos compartidos */
    toast('Cerraste sesión.');
});

$('trackForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const number = $('trackNumber').value.trim();
    const phone = $('trackPhone').value.trim();
    const result = $('trackResult');

    if (!number || !phone) {
        result.innerHTML = '<p class="form-msg error">Escribe el número de pedido y tu teléfono.</p>';
        return;
    }

    await withBusy(event.target.querySelector('button[type=submit]'), 'Buscando…', async () => {
        const { data, error } = await sb.rpc('track_order', { p_number: number, p_phone: phone });

        if (error) {
            result.innerHTML = '<p class="form-msg error">No pudimos consultar el pedido. Inténtalo de nuevo.</p>';
            return;
        }
        if (!data) {
            result.innerHTML = '<p class="form-msg error">No encontramos un pedido con esos datos. Revisa el número (ej. ESS-1A2B3C4D) y el teléfono que usaste al comprar.</p>';
            return;
        }

        result.innerHTML = `
            <article class="order">
                <header>
                    <div>
                        <strong>${esc(data.order_number)}</strong>
                        <small>${formatDate(data.created_at)} · ${esc(data.payment)}</small>
                    </div>
                    <strong class="order-total">${money(data.total)}</strong>
                </header>
                ${statusBlock(data.status)}
            </article>
        `;
    });
});


/* =====================================================
   FORMULARIO DE CONTACTO
===================================================== */

$('form')?.addEventListener('submit', async event => {
    event.preventDefault();

    const name = $('nm').value.trim();
    const email = $('em').value.trim();
    const message = $('ms').value.trim();
    const msg = $('msg');

    const say = (text, type) => {
        msg.textContent = text;
        msg.classList.toggle('error', type === 'error');
    };

    if (!name || !email || !message) return say('Completa todos los campos.', 'error');
    if (!isEmail(email)) return say('Ingresa un correo electrónico válido.', 'error');
    if (!sb) return say('No hay conexión con el servidor. Inténtalo más tarde.', 'error');

    say('Enviando…');

    await withBusy(event.target.querySelector('button[type="submit"]'), 'Enviando…', async () => {
        const { error } = await sb.from('messages').insert({ name, email, message });

        if (error) {
            console.error(error);
            return say('No pudimos enviar tu mensaje. Inténtalo otra vez o escríbenos por WhatsApp.', 'error');
        }

        say('¡Gracias! Recibimos tu mensaje y te responderemos pronto.');
        event.target.reset();
    });
});


/* =====================================================
   TECLADO: Escape cierra solo la ventana de arriba,
   Tab se queda dentro de la ventana abierta
===================================================== */

document.addEventListener('keydown', event => {

    if (event.key === 'Escape') {
        if ($('navLinks')?.classList.contains('open')) { closeMenu(); return; }

        const layer = topLayer();
        if (layer) layer.close();
        return;
    }

    if (event.key !== 'Tab') return;

    const layer = topLayer();
    if (!layer) return;

    const scope = layer.box ? layer.el.querySelector(layer.box) : layer.el;
    if (!scope) return;

    const focusable = [...scope.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])'
    )].filter(el => !el.closest('[hidden]'));

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});


/* =====================================================
   INICIALIZACIÓN
===================================================== */

async function init() {
    fillCities();
    loadCart();
    renderCart();
    refreshCatalogUI();      /* muestra el esqueleto de carga */

    await Promise.all([loadProducts(), initAuth()]);
}

const ready = init();
