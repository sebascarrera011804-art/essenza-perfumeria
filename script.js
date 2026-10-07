const PHONE = '593983098535';

/* =====================================================
   PRODUCTOS ESSENZA
===================================================== */

const P = [

    /* =========================
       MUJER
    ========================= */

    {
        id: 1,
        n: 'Good Girl',
        brand: 'Carolina Herrera',
        c: 'Mujer',
        p: 120,
        t: 'Almendra, jazmín, tuberosa, cacao y haba tonka',
        image: 'img/GOOD-GIRL.jpg',
        tag: 'MÁS VENDIDO'
    },

    {
        id: 2,
        n: 'Libre',
        brand: 'Yves Saint Laurent',
        c: 'Mujer',
        p: 125,
        t: 'Lavanda, flor de azahar, jazmín, vainilla y almizcle',
        image: 'img/libre.jpg',
        tag: 'NUEVO'
    },

    {
        id: 3,
        n: 'La Vie Est Belle',
        brand: 'Lancôme',
        c: 'Mujer',
        p: 115,
        t: 'Iris, jazmín, vainilla, praliné y pachulí',
        image: 'img/la-vie-est-belle.jpg',
        tag: 'FAVORITO'
    },


    /* =========================
       HOMBRE
    ========================= */

    {
        id: 4,
        n: 'Sauvage',
        brand: 'Dior',
        c: 'Hombre',
        p: 135,
        t: 'Bergamota, ambroxan, elemi y maderas',
        image: 'img/sauvage.jpg',
        tag: 'MÁS VENDIDO'
    },

    {
        id: 5,
        n: '1 Million',
        brand: 'Rabanne',
        c: 'Hombre',
        p: 110,
        t: 'Mandarina sanguina, canela, cuero y ámbar',
        image: 'img/one-million.jpg',
        tag: 'CLÁSICO'
    },

    {
        id: 6,
        n: 'Eros',
        brand: 'Versace',
        c: 'Hombre',
        p: 105,
        t: 'Limón, mandarina, menta, manzana, vainilla y cedro',
        image: 'img/EROS-FOR-MEN.jpg',
        tag: 'FAVORITO'
    },


    /* =========================
       NIÑOS
    ========================= */

    {
        id: 7,
        n: 'Tous Kids',
        brand: 'TOUS',
        c: 'Niños',
        p: 58,
        t: 'Cítricos, naranja, mandarina, manzana y almizcles',
        image: 'img/Tous.jpg',
        tag: 'NIÑOS'
    },

    {
        id: 8,
        n: 'Agua de Colonia',
        brand: 'Nenuco',
        c: 'Niños',
        p: 28,
        t: 'Aroma fresco, limpio y suave para niños',
        image: 'img/375x500.36417.jpg',
        tag: 'CLÁSICO'
    },

    {
        id: 9,
        n: 'Petits et Mamans',
        brand: 'Bvlgari',
        c: 'Niños',
        p: 62,
        t: 'Bergamota, naranja, palo de rosa, manzanilla y vainilla',
        image: 'img/petits-et-mamans.jpg',
        tag: 'ESPECIAL'
    },


    /* =========================
       SETS DE REGALO
    ========================= */

    {
        id: 10,
        n: 'Good Girl Gift Set',
        brand: 'Carolina Herrera',
        c: 'Sets de regalo',
        p: 155,
        t: 'Good Girl Eau de Parfum + productos complementarios',
        image: 'img/set-good-girl.jpg',
        tag: 'REGALO'
    },

    {
        id: 11,
        n: 'Sauvage Gift Set',
        brand: 'Dior',
        c: 'Sets de regalo',
        p: 175,
        t: 'Sauvage + productos complementarios de la línea',
        image: 'img/set-sauvage.jpg',
        tag: 'REGALO'
    },

    {
        id: 12,
        n: '1 Million Gift Set',
        brand: 'Rabanne',
        c: 'Sets de regalo',
        p: 145,
        t: '1 Million Eau de Toilette + productos complementarios',
        image: 'img/set-one-million.jpg',
        tag: 'REGALO'
    }

];


/* =====================================================
   CATEGORÍAS
===================================================== */

const CATS = [
    'Mujer',
    'Hombre',
    'Niños',
    'Sets de regalo'
];


/* =====================================================
   ESTADO
===================================================== */

const state = {
    cat: 'Todos',
    q: '',
    pr: 'all'
};

const cart = {};


/* =====================================================
   HELPERS
===================================================== */

const $ = id => document.getElementById(id);

const money = value =>
    `$${Number(value).toFixed(0)}`;


/* =====================================================
   CATEGORÍAS
===================================================== */

function buildCategories() {

    const container = $('cats');

    if (!container) return;

    container.innerHTML = CATS.map(cat => `
        <button
            class="cat"
            data-cat="${cat}"
            type="button"
        >
            ${cat}
        </button>
    `).join('');
}


/* =====================================================
   FILTROS DE PRECIO
===================================================== */

function buildPriceChips() {

    const container = $('chips');

    if (!container) return;

    container.innerHTML = `
        <button class="chip active" data-price="all">
            Todos
        </button>

        <button class="chip" data-price="0-60">
            Hasta $60
        </button>

        <button class="chip" data-price="61-100">
            $61 - $100
        </button>

        <button class="chip" data-price="101-150">
            $101 - $150
        </button>

        <button class="chip" data-price="151-999">
            Más de $150
        </button>
    `;
}


/* =====================================================
   PRODUCTOS DESTACADOS
===================================================== */

function renderFeatured() {

    const container = $('featuredGrid');

    if (!container) return;

    const featured = [0, 3, 4];

    container.innerHTML = featured.map(index => {

        const p = P[index];

        return `
            <article class="featured-card">

                <div class="product-image">

                    <img
                        src="${p.image}"
                        alt="${p.brand} ${p.n}"
                        loading="lazy"
                    >

                    ${p.tag ? `
                        <span class="product-tag">
                            ${p.tag}
                        </span>
                    ` : ''}

                </div>

                <div class="featured-info">

                    <span class="product-brand">
                        ${p.brand}
                    </span>

                    <h3>
                        ${p.n}
                    </h3>

                    <p>
                        ${p.t}
                    </p>

                    <div class="featured-bottom">

                        <strong>
                            ${money(p.p)}
                        </strong>

                        <button
                            class="featured-add"
                            data-featured="${p.id}"
                            type="button"
                        >
                            Agregar
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join('');
}


/* =====================================================
   RENDER CATÁLOGO
===================================================== */

function render() {

    const container = $('grid');

    if (!container) return;

    let products = [...P];

    /* Categoría */

    if (state.cat !== 'Todos') {

        products = products.filter(
            p => p.c === state.cat
        );

    }


    /* Búsqueda */

    if (state.q.trim()) {

        const q = state.q
            .toLowerCase()
            .trim();

        products = products.filter(p =>

            p.n.toLowerCase().includes(q) ||

            p.brand.toLowerCase().includes(q) ||

            p.c.toLowerCase().includes(q) ||

            p.t.toLowerCase().includes(q)

        );

    }


    /* Precio */

    if (state.pr !== 'all') {

        const [min, max] =
            state.pr.split('-').map(Number);

        products = products.filter(
            p => p.p >= min && p.p <= max
        );

    }


    /* Sin resultados */

    if (!products.length) {

        container.innerHTML = `
            <div class="empty">
                <strong>No encontramos perfumes.</strong>
                <span>Prueba con otra búsqueda o categoría.</span>
            </div>
        `;

        return;
    }


    /* Productos */

    container.innerHTML = products.map(p => `

        <article class="card">

            <div class="img">

                <img
                    class="product-photo"
                    src="${p.image}"
                    alt="${p.brand} ${p.n}"
                    loading="lazy"
                >

                ${p.tag ? `
                    <span class="product-tag">
                        ${p.tag}
                    </span>
                ` : ''}

            </div>


            <div class="in">

                <span class="product-brand">
                    ${p.brand}
                </span>

                <h3>
                    ${p.n}
                </h3>

                <small>
                    ${p.c}
                </small>

                <p class="notes">
                    ${p.t}
                </p>


                <div class="row">

                    <strong class="price">
                        ${money(p.p)}
                    </strong>

                    <button
                        class="add"
                        data-id="${p.id}"
                        type="button"
                    >
                        Agregar
                    </button>

                </div>

            </div>

        </article>

    `).join('');
}


/* =====================================================
   CARRITO
===================================================== */

function getCartTotal() {

    return Object.entries(cart)
        .reduce((total, [id, quantity]) => {

            const product =
                P.find(p => p.id === Number(id));

            if (!product) return total;

            return total +
                product.p * quantity;

        }, 0);

}


function getCartCount() {

    return Object.values(cart)
        .reduce(
            (total, quantity) => total + quantity,
            0
        );

}


/* =====================================================
   RENDER CARRITO
===================================================== */

function renderCart() {

    const container = $('items');

    if (!container) return;

    const ids = Object.keys(cart);


    /* Carrito vacío */

    if (!ids.length) {

        container.innerHTML = `
            <div class="empty">
                <strong>Tu carrito está vacío.</strong>
                <span>Agrega un perfume para comenzar.</span>
            </div>
        `;

    } else {

        container.innerHTML = ids.map(id => {

            const product =
                P.find(p => p.id === Number(id));

            const quantity = cart[id];

            if (!product) return '';

            return `

                <div class="it">

                    <img
                        class="cart-image"
                        src="${product.image}"
                        alt="${product.brand} ${product.n}"
                    >

                    <div class="cart-product">

                        <span class="cart-category">
                            ${product.brand}
                        </span>

                        <strong>
                            ${product.n}
                        </strong>

                        <div class="q">

                            <button
                                data-d="${product.id}"
                                data-dir="-1"
                                type="button"
                                aria-label="Disminuir cantidad"
                            >
                                −
                            </button>

                            <span>
                                ${quantity}
                            </span>

                            <button
                                data-d="${product.id}"
                                data-dir="1"
                                type="button"
                                aria-label="Aumentar cantidad"
                            >
                                +
                            </button>

                        </div>

                    </div>

                    <strong class="cart-price">
                        ${money(product.p * quantity)}
                    </strong>

                </div>

            `;

        }).join('');

    }


    if ($('count')) {
        $('count').textContent =
            getCartCount();
    }

    if ($('total')) {
        $('total').textContent =
            money(getCartTotal());
    }

    if ($('buy')) {
        $('buy').disabled =
            ids.length === 0;
    }

}


/* =====================================================
   AGREGAR AL CARRITO
===================================================== */

function addToCart(id) {

    id = Number(id);

    if (!cart[id]) {
        cart[id] = 0;
    }

    cart[id]++;

    renderCart();

}


/* =====================================================
   CAMBIAR CANTIDAD
===================================================== */

function changeQuantity(id, direction) {

    id = Number(id);

    if (!cart[id]) return;

    cart[id] += direction;

    if (cart[id] <= 0) {
        delete cart[id];
    }

    renderCart();

}


/* =====================================================
   RESUMEN DEL CHECKOUT
===================================================== */

function renderCheckoutSummary() {

    const container =
        $('checkoutSummary');

    if (!container) return;

    const ids = Object.keys(cart);

    if (!ids.length) {

        container.innerHTML = `
            <p>No hay productos en el carrito.</p>
        `;

        return;
    }


    container.innerHTML = `

        ${ids.map(id => {

            const product =
                P.find(p => p.id === Number(id));

            const quantity =
                cart[id];

            return `

                <div class="summary-item">

                    <span>
                        ${product.brand} - ${product.n}
                        × ${quantity}
                    </span>

                    <strong>
                        ${money(product.p * quantity)}
                    </strong>

                </div>

            `;

        }).join('')}


        <div class="summary-total">

            <span>
                Total
            </span>

            <strong>
                ${money(getCartTotal())}
            </strong>

        </div>

    `;

}


/* =====================================================
   ABRIR CARRITO
===================================================== */

function openCart() {

    const drawer =
        $('drawer');

    const overlay =
        $('drawerOverlay');

    if (drawer) {
        drawer.classList.add('open');
    }

    if (overlay) {
        overlay.classList.add('open');
    }

}


/* =====================================================
   CERRAR CARRITO
===================================================== */

function closeCart() {

    const drawer =
        $('drawer');

    const overlay =
        $('drawerOverlay');

    if (drawer) {
        drawer.classList.remove('open');
    }

    if (overlay) {
        overlay.classList.remove('open');
    }

}


/* =====================================================
   ABRIR CHECKOUT
===================================================== */

function openCheckout() {

    if (!Object.keys(cart).length) {
        return;
    }

    closeCart();

    renderCheckoutSummary();

    const overlay =
        $('checkoutOverlay');

    if (overlay) {
        overlay.classList.add('open');
    }

}


/* =====================================================
   CERRAR CHECKOUT
===================================================== */

function closeCheckout() {

    const overlay =
        $('checkoutOverlay');

    if (overlay) {
        overlay.classList.remove('open');
    }

}


/* =====================================================
   MODAL ÉXITO
===================================================== */

function closeSuccess() {

    const overlay =
        $('successOverlay');

    if (overlay) {
        overlay.classList.remove('open');
    }

}


/* =====================================================
   EVENTOS GENERALES
===================================================== */

document.addEventListener('click', event => {

    const chip =
        event.target.closest('.chip');

    if (chip) {

        document
            .querySelectorAll('.chip')
            .forEach(c =>
                c.classList.remove('active')
            );

        chip.classList.add('active');

        state.pr =
            chip.dataset.price || 'all';

        render();

        return;
    }


    /* Categorías */

    const category =
        event.target.closest('.cat');

    if (category) {

        state.cat =
            category.dataset.cat;

        render();

        const catalog =
            $('catalogo');

        if (catalog) {
            catalog.scrollIntoView({
                behavior: 'smooth'
            });
        }

        return;
    }


    /* Agregar producto */

    const add =
        event.target.closest('.add');

    if (add) {

        addToCart(
            add.dataset.id
        );

        openCart();

        return;
    }


    /* Agregar destacado */

    const featured =
        event.target.closest(
            '[data-featured]'
        );

    if (featured) {

        addToCart(
            featured.dataset.featured
        );

        openCart();

        return;
    }


    /* Cambiar cantidad */

    const quantityButton =
        event.target.closest('[data-d]');

    if (quantityButton) {

        changeQuantity(
            quantityButton.dataset.d,
            Number(quantityButton.dataset.dir)
        );

        return;
    }

});


/* =====================================================
   BUSCADOR
===================================================== */

const search =
    $('q');

if (search) {

    search.addEventListener(
        'input',
        event => {

            state.q =
                event.target.value;

            render();

        }
    );

}


/* =====================================================
   SELECT PRECIO
===================================================== */

const price =
    $('price');

if (price) {

    price.addEventListener(
        'change',
        event => {

            state.pr =
                event.target.value;

            render();

        }
    );

}


/* =====================================================
   BOTÓN CARRITO
===================================================== */

const openButton =
    $('open');

if (openButton) {
    openButton.addEventListener(
        'click',
        openCart
    );
}


const closeButton =
    $('close');

if (closeButton) {
    closeButton.addEventListener(
        'click',
        closeCart
    );
}


const drawerOverlay =
    $('drawerOverlay');

if (drawerOverlay) {

    drawerOverlay.addEventListener(
        'click',
        closeCart
    );

}


/* =====================================================
   BOTÓN COMPRAR
===================================================== */

const buyButton =
    $('buy');

if (buyButton) {

    buyButton.addEventListener(
        'click',
        openCheckout
    );

}


/* =====================================================
   CERRAR CHECKOUT
===================================================== */

const checkoutClose =
    $('checkoutClose');

if (checkoutClose) {

    checkoutClose.addEventListener(
        'click',
        closeCheckout
    );

}


const checkoutOverlay =
    $('checkoutOverlay');

if (checkoutOverlay) {

    checkoutOverlay.addEventListener(
        'click',
        event => {

            if (
                event.target ===
                checkoutOverlay
            ) {
                closeCheckout();
            }

        }
    );

}


/* =====================================================
   FORMULARIO DE CHECKOUT
===================================================== */

const checkoutForm =
    $('checkoutForm');

if (checkoutForm) {

    checkoutForm.addEventListener(
        'submit',
        event => {

            event.preventDefault();


            const name =
                $('customerName')?.value.trim();

            const phone =
                $('customerPhone')?.value.trim();

            const address =
                $('customerAddress')?.value.trim();

            const city =
                $('customerCity')?.value.trim();

            const sector =
                $('customerSector')?.value.trim();

            const reference =
                $('customerReference')?.value.trim();

            const payment =
                $('paymentMethod')?.value;


            /* Validaciones */

            if (!name) {

                alert(
                    'Por favor ingresa tu nombre.'
                );

                return;
            }


            if (!phone) {

                alert(
                    'Por favor ingresa tu número de teléfono.'
                );

                return;
            }


            if (phone.replace(/\D/g, '').length < 7) {

                alert(
                    'Ingresa un número de teléfono válido.'
                );

                return;
            }


            if (!address) {

                alert(
                    'Por favor ingresa la dirección de envío.'
                );

                return;
            }


            if (!city) {

                alert(
                    'Por favor ingresa la ciudad.'
                );

                return;
            }


            if (!payment) {

                alert(
                    'Selecciona un método de pago.'
                );

                return;
            }


            /* Construcción del pedido */

            let message =
                `*NUEVO PEDIDO - ESSENZA PERFUMERÍA*%0A`;

            message +=
                `%0A*DATOS DEL CLIENTE*`;

            message +=
                `%0ANombre: ${name}`;

            message +=
                `%0ATeléfono: ${phone}`;


            message +=
                `%0A%0A*DIRECCIÓN DE ENVÍO*`;

            message +=
                `%0ACiudad: ${city}`;

            message +=
                `%0ASector: ${sector || 'No especificado'}`;

            message +=
                `%0ADirección: ${address}`;

            message +=
                `%0AReferencia: ${reference || 'No especificada'}`;


            message +=
                `%0A%0A*PRODUCTOS*`;


            Object.entries(cart).forEach(
                ([id, quantity]) => {

                    const product =
                        P.find(
                            p => p.id === Number(id)
                        );

                    message +=
                        `%0A• ${product.brand} - ${product.n} x${quantity} - ${money(product.p * quantity)}`;

                }
            );


            message +=
                `%0A%0A*TOTAL: ${money(getCartTotal())}*`;

            message +=
                `%0AMétodo de pago: ${payment}`;


            /* WhatsApp */

            const whatsappURL =
                `https://wa.me/${PHONE}?text=${encodeURIComponent(
                    decodeURIComponent(message)
                )}`;


            const whatsappButton =
                $('successWhatsapp');

            if (whatsappButton) {

                whatsappButton.href =
                    whatsappURL;

            }


            /* Cerrar checkout */

            closeCheckout();


            /* Vaciar carrito */

            Object.keys(cart).forEach(
                id => delete cart[id]
            );

            renderCart();


            /* Limpiar formulario */

            checkoutForm.reset();


            /* Mostrar éxito */

            const success =
                $('successOverlay');

            if (success) {

                success.classList.add('open');

            }

        }
    );

}


/* =====================================================
   MODAL ÉXITO
===================================================== */

const successClose =
    $('successClose');

if (successClose) {

    successClose.addEventListener(
        'click',
        closeSuccess
    );

}


const successContinue =
    $('successContinue');

if (successContinue) {

    successContinue.addEventListener(
        'click',
        closeSuccess
    );

}


/* =====================================================
   FORMULARIO DE CONTACTO
===================================================== */

const contactForm =
    $('form');

if (contactForm) {

    contactForm.addEventListener(
        'submit',
        event => {

            event.preventDefault();

            const name =
                $('nm')?.value.trim();

            const email =
                $('em')?.value.trim();

            const message =
                $('ms')?.value.trim();

            const msg =
                $('msg');


            if (!name || !email || !message) {

                if (msg) {

                    msg.textContent =
                        'Completa todos los campos.';

                }

                return;
            }


            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                if (msg) {

                    msg.textContent =
                        'Ingresa un correo electrónico válido.';

                }

                return;
            }


            if (msg) {

                msg.textContent =
                    '¡Gracias! Hemos recibido tu mensaje.';

            }


            contactForm.reset();

        }
    );

}


/* =====================================================
   ESCAPE
===================================================== */

document.addEventListener(
    'keydown',
    event => {

        if (event.key !== 'Escape') {
            return;
        }

        closeCart();
        closeCheckout();
        closeSuccess();

    }
);


/* =====================================================
   INICIALIZACIÓN
===================================================== */

buildCategories();

buildPriceChips();

renderFeatured();

render();

renderCart();
