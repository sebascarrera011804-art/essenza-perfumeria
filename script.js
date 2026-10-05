const PHONE = '593983098535';


/* =====================================================
   PRODUCTOS
===================================================== */

const P = [

    {
        n: 'Rosa Imperial',
        c: 'Mujer',
        p: 78,
        t: 'Rosa, peonía, ámbar',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80',
        tag: 'MÁS VENDIDO'
    },

    {
        n: 'Noche de Jazmín',
        c: 'Mujer',
        p: 92,
        t: 'Jazmín, vainilla, almizcle',
        image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=80',
        tag: 'NUEVO'
    },

    {
        n: 'Velo de Seda',
        c: 'Mujer',
        p: 56,
        t: 'Pera, iris, cedro',
        image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=700&q=80',
        tag: ''
    },

    {
        n: 'Flor de Oro',
        c: 'Mujer',
        p: 118,
        t: 'Azahar, miel, sándalo',
        image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=700&q=80',
        tag: 'PREMIUM'
    },

    {
        n: 'Black Oud',
        c: 'Hombre',
        p: 110,
        t: 'Oud, cuero, pimienta negra',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=80',
        tag: 'MÁS VENDIDO'
    },

    {
        n: 'Cedro Noble',
        c: 'Hombre',
        p: 64,
        t: 'Cedro, bergamota, vetiver',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80',
        tag: ''
    },

    {
        n: 'Medianoche',
        c: 'Hombre',
        p: 85,
        t: 'Lavanda, tabaco, haba tonka',
        image: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&w=700&q=80',
        tag: ''
    },

    {
        n: 'Brisa Sur',
        c: 'Hombre',
        p: 42,
        t: 'Cítricos, sal marina, madera',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80',
        tag: 'NUEVO'
    },

    {
        n: 'Chispa',
        c: 'Niños',
        p: 28,
        t: 'Manzana verde, algodón de azúcar',
        image: 'https://images.unsplash.com/photo-1590156206657-bf8d8f7f5c2b?auto=format&fit=crop&w=700&q=80',
        tag: ''
    },

    {
        n: 'Nube Dulce',
        c: 'Niños',
        p: 32,
        t: 'Vainilla suave, durazno',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80',
        tag: ''
    },

    {
        n: 'Set Reina',
        c: 'Sets de regalo',
        p: 135,
        t: 'Perfume 100 ml + crema + mini 15 ml',
        image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=700&q=80',
        tag: 'REGALO'
    },

    {
        n: 'Set Caballero',
        c: 'Sets de regalo',
        p: 128,
        t: 'Perfume 100 ml + gel + desodorante',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80',
        tag: 'REGALO'
    }

];


const CATS = [
    'Mujer',
    'Hombre',
    'Niños',
    'Sets de regalo'
];


let state = {
    cat: 'Todos',
    q: '',
    pr: 'all'
};


let cart = {};


const $ = id => document.getElementById(id);


const money = number => {
    return '$' + Number(number)
        .toFixed(2)
        .replace('.00', '');
};


/* =====================================================
   CATEGORÍAS
===================================================== */

$('cats').innerHTML = CATS.map(category => {

    const count =
        P.filter(product => product.c === category).length;

    return `
        <button
            class="cat"
            data-c="${category}"
            type="button"
        >
            <h3>${category}</h3>
            <span>${count} productos</span>
        </button>
    `;

}).join('');


/* =====================================================
   FILTROS
===================================================== */

$('chips').innerHTML =
    ['Todos', ...CATS]
        .map(category => {

            return `
                <button
                    class="chip ${category === 'Todos' ? 'on' : ''}"
                    data-c="${category}"
                    type="button"
                >
                    ${category}
                </button>
            `;

        })
        .join('');


/* =====================================================
   DESTACADOS
===================================================== */

const featuredIndexes = [0, 4, 1];


$('featuredGrid').innerHTML =
    featuredIndexes
        .map(index => {

            const p = P[index];

            return `
                <article class="featured-card">

                    <div class="product-image">

                        <img
                            src="${p.image}"
                            alt="${p.n}"
                            loading="lazy"
                        >

                    </div>

                    <div class="featured-info">

                        <span class="product-category">
                            ${p.c}
                        </span>

                        <h3>
                            ${p.n}
                        </h3>

                        <p>
                            ${p.t}
                        </p>

                        <div class="featured-bottom">

                            <span class="featured-price">
                                ${money(p.p)}
                            </span>

                            <button
                                class="featured-add"
                                data-featured="${index}"
                                type="button"
                            >
                                Agregar
                            </button>

                        </div>

                    </div>

                </article>
            `;

        })
        .join('');


/* =====================================================
   CATÁLOGO
===================================================== */

function render() {

    const [lo, hi] =
        state.pr === 'all'
            ? [0, 9999]
            : state.pr.split('-').map(Number);


    const query =
        state.q.trim().toLowerCase();


    const list =
        P
            .map((product, index) => ({
                ...product,
                index
            }))
            .filter(product => {

                const categoryOK =
                    state.cat === 'Todos' ||
                    product.c === state.cat;


                const priceOK =
                    product.p >= lo &&
                    product.p <= hi;


                const searchOK =
                    !query ||
                    (
                        product.n +
                        ' ' +
                        product.t +
                        ' ' +
                        product.c
                    )
                        .toLowerCase()
                        .includes(query);


                return (
                    categoryOK &&
                    priceOK &&
                    searchOK
                );

            });


    if (!list.length) {

        $('grid').innerHTML = `
            <div class="empty">

                <h3>
                    No encontramos esa fragancia
                </h3>

                <p>
                    Prueba con otra palabra o cambia los filtros.
                </p>

            </div>
        `;

        return;
    }


    $('grid').innerHTML =
        list
            .map(product => {

                return `
                    <article class="card">

                        <div class="img">

                            ${
                                product.tag
                                    ? `
                                        <span class="product-tag">
                                            ${product.tag}
                                        </span>
                                    `
                                    : ''
                            }

                            <img
                                class="product-photo"
                                src="${product.image}"
                                alt="${product.n}"
                                loading="lazy"
                            >

                        </div>

                        <div class="in">

                            <small>
                                ${product.c}
                            </small>

                            <h3>
                                ${product.n}
                            </h3>

                            <p class="notes">
                                ${product.t}
                            </p>

                            <div class="row">

                                <span class="price">
                                    ${money(product.p)}
                                </span>

                                <button
                                    class="add"
                                    data-i="${product.index}"
                                    type="button"
                                >
                                    Agregar
                                </button>

                            </div>

                        </div>

                    </article>
                `;

            })
            .join('');


    document
        .querySelectorAll('.chip')
        .forEach(button => {

            button.classList.toggle(
                'on',
                button.dataset.c === state.cat
            );

        });

}


/* =====================================================
   CARRITO
===================================================== */

function getCartTotal() {

    return Object.keys(cart)
        .reduce((total, index) => {

            return total +
                (P[index].p * cart[index]);

        }, 0);

}


function getCartCount() {

    return Object.keys(cart)
        .reduce((total, index) => {

            return total + cart[index];

        }, 0);

}


function renderCart() {

    const ids = Object.keys(cart);


    if (!ids.length) {

        $('items').innerHTML = `
            <div class="empty">

                <h3>
                    Tu carrito está vacío
                </h3>

                <p>
                    Agrega una fragancia para comenzar tu pedido.
                </p>

            </div>
        `;

    } else {

        $('items').innerHTML =
            ids
                .map(index => {

                    const product = P[index];
                    const quantity = cart[index];

                    const subtotal =
                        product.p * quantity;


                    return `
                        <div class="it">

                            <div>

                                <strong>
                                    ${product.n}
                                </strong>

                                <div class="q">

                                    <button
                                        data-d="-1"
                                        data-i="${index}"
                                        type="button"
                                    >
                                        −
                                    </button>

                                    <span>
                                        ${quantity}
                                    </span>

                                    <button
                                        data-d="1"
                                        data-i="${index}"
                                        type="button"
                                    >
                                        +
                                    </button>

                                </div>

                            </div>

                            <span>
                                ${money(subtotal)}
                            </span>

                        </div>
                    `;

                })
                .join('');

    }


    $('count').textContent =
        getCartCount();


    $('total').textContent =
        money(getCartTotal());


    $('buy').disabled =
        ids.length === 0;


    $('buy').style.opacity =
        ids.length ? '1' : '.45';

}


/* =====================================================
   RESUMEN DEL CHECKOUT
===================================================== */

function renderCheckoutSummary() {

    const ids = Object.keys(cart);

    let html = `
        <h3>
            Resumen de tu pedido
        </h3>
    `;


    ids.forEach(index => {

        const product = P[index];
        const quantity = cart[index];

        html += `
            <div class="summary-item">

                <span>
                    ${quantity} × ${product.n}
                </span>

                <strong>
                    ${money(product.p * quantity)}
                </strong>

            </div>
        `;

    });


    html += `
        <div class="summary-total">

            <span>
                Total
            </span>

            <strong>
                ${money(getCartTotal())}
            </strong>

        </div>
    `;


    $('checkoutSummary').innerHTML =
        html;

}


/* =====================================================
   CARRITO - ABRIR / CERRAR
===================================================== */

const drawer =
    $('drawer');

const overlay =
    $('drawerOverlay');


function openCart() {

    drawer.classList.add('open');
    overlay.classList.add('open');

    document.body.style.overflow =
        'hidden';

}


function closeCart() {

    drawer.classList.remove('open');
    overlay.classList.remove('open');

    document.body.style.overflow =
        '';

}


$('open').onclick =
    openCart;


$('close').onclick =
    closeCart;


overlay.onclick =
    closeCart;


/* =====================================================
   CHECKOUT
===================================================== */

const checkoutOverlay =
    $('checkoutOverlay');


function openCheckout() {

    if (!Object.keys(cart).length) {

        return;

    }


    renderCheckoutSummary();


    $('checkoutError')
        .classList.remove('show');


    checkoutOverlay.classList.add('open');


    document.body.style.overflow =
        'hidden';

}


function closeCheckout() {

    checkoutOverlay.classList.remove('open');

    document.body.style.overflow =
        '';

}


$('buy').addEventListener(
    'click',
    openCheckout
);


$('checkoutClose').addEventListener(
    'click',
    closeCheckout
);


/* =====================================================
   CONFIRMAR COMPRA
===================================================== */

$('checkoutForm')
    .addEventListener('submit', event => {

        event.preventDefault();


        const name =
            $('customerName')
                .value
                .trim();


        const phone =
            $('customerPhone')
                .value
                .trim();


        const address =
            $('customerAddress')
                .value
                .trim();


        const city =
            $('customerCity')
                .value;


        const sector =
            $('customerSector')
                .value
                .trim();


        const reference =
            $('customerReference')
                .value
                .trim();


        const payment =
            $('paymentMethod')
                .value;


        const error =
            $('checkoutError');


        if (
            !name ||
            !phone ||
            !address ||
            !city ||
            !payment
        ) {

            error.textContent =
                'Por favor completa todos los campos obligatorios marcados con *.';

            error.classList.add('show');

            return;

        }


        if (
            phone.replace(/\D/g, '').length < 7
        ) {

            error.textContent =
                'Ingresa un número de teléfono válido.';

            error.classList.add('show');

            return;

        }


        error.classList.remove('show');


        /* CREAR MENSAJE WHATSAPP */

        const ids =
            Object.keys(cart);


        let message =
            `🛍️ *NUEVO PEDIDO - ESSENZA*`;


        message +=
            `\n\n*CLIENTE*`;


        message +=
            `\nNombre: ${name}`;


        message +=
            `\nTeléfono: ${phone}`;


        message +=
            `\n\n*ENTREGA*`;


        message +=
            `\nCiudad: ${city}`;


        if (sector) {

            message +=
                `\nSector: ${sector}`;

        }


        message +=
            `\nDirección: ${address}`;


        if (reference) {

            message +=
                `\nReferencia: ${reference}`;

        }


        message +=
            `\n\n*MÉTODO DE PAGO*`;


        message +=
            `\n${payment}`;


        message +=
            `\n\n*PRODUCTOS*`;


        ids.forEach(index => {

            const product = P[index];
            const quantity = cart[index];

            message +=
                `\n• ${quantity} x ${product.n} - ${money(product.p * quantity)}`;

        });


        message +=
            `\n\n*TOTAL: ${money(getCartTotal())}*`;


        const whatsappURL =
            `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;


        $('successWhatsapp').href =
            whatsappURL;


        /* CERRAR CHECKOUT */

        closeCheckout();


        /* MOSTRAR ÉXITO */

        $('successOverlay')
            .classList.add('open');


        /* VACIAR CARRITO */

        cart = {};

        renderCart();


        /* LIMPIAR FORMULARIO */

        $('checkoutForm').reset();

    });


/* =====================================================
   MODAL ÉXITO
===================================================== */

$('successClose')
    .addEventListener('click', () => {

        $('successOverlay')
            .classList.remove('open');

        document.body.style.overflow =
            '';

    });


/* =====================================================
   CLICS GENERALES
===================================================== */

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest('button');


        if (!button) {
            return;
        }


        /* FILTRO */

        if (
            button.classList.contains('chip')
        ) {

            state.cat =
                button.dataset.c;

            render();

        }


        /* CATEGORÍA */

        if (
            button.classList.contains('cat')
        ) {

            state.cat =
                button.dataset.c;

            render();


            $('catalogo')
                .scrollIntoView({
                    behavior: 'smooth'
                });

        }


        /* AGREGAR */

        if (
            button.classList.contains('add')
        ) {

            const index =
                button.dataset.i;


            cart[index] =
                (cart[index] || 0) + 1;


            renderCart();

            openCart();

        }


        /* DESTACADO */

        if (
            button.dataset.featured !== undefined
        ) {

            const index =
                button.dataset.featured;


            cart[index] =
                (cart[index] || 0) + 1;


            renderCart();

            openCart();

        }


        /* CANTIDAD */

        if (
            button.dataset.d !== undefined
        ) {

            const index =
                button.dataset.i;


            cart[index] +=
                Number(button.dataset.d);


            if (cart[index] <= 0) {

                delete cart[index];

            }


            renderCart();

        }

    }
);


/* =====================================================
   BUSCADOR
===================================================== */

$('q').addEventListener(
    'input',
    event => {

        state.q =
            event.target.value;

        render();

    }
);


/* =====================================================
   PRECIO
===================================================== */

$('price').addEventListener(
    'change',
    event => {

        state.pr =
            event.target.value;

        render();

    }
);


/* =====================================================
   FORMULARIO DE CONTACTO
===================================================== */

$('form').addEventListener(
    'submit',
    event => {

        event.preventDefault();


        const name =
            $('nm').value.trim();


        const email =
            $('em').value.trim();


        const message =
            $('ms').value.trim();


        const validEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(email);


        if (
            !name ||
            !validEmail ||
            !message
        ) {

            $('msg').textContent =
                'Completa tu nombre, un correo válido y tu mensaje.';

            return;

        }


        $('msg').textContent =
            `Gracias, ${name}. Recibimos tu mensaje y te responderemos pronto.`;


        event.target.reset();

    }
);


/* =====================================================
   ESCAPE
===================================================== */

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Escape'
        ) {

            closeCart();
            closeCheckout();

            $('successOverlay')
                .classList.remove('open');

            document.body.style.overflow =
                '';

        }

    }
);


/* =====================================================
   INICIAR
===================================================== */

render();

renderCart();