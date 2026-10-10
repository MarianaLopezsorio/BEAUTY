// ===============================
// SUCHA SKINCARE
// script.js
// ===============================

// MENÚ QUE CAMBIA AL HACER SCROLL

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.style.background = "#ffffff";
        header.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";

    } else {

        header.style.background = "rgba(255,255,255,0.95)";
        header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.10)";

    }

});


// CARRUSEL DE IMÁGENES DE PRODUCTOS

const productCarousels = document.querySelectorAll(".product-carousel");
const carouselIntervalMs = 2500;
let activeCarouselSlides = [];
let modalIndex = 0;
let modalInterval = null;
let activeImageCard = null;
let resumeActiveCardCarousel = null;
let isImageZoomed = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragStartX = 0;
let dragStartY = 0;
let isDraggingImage = false;
let hasDraggedImage = false;

const modalOverlay = document.getElementById("imageModal");
const modalImg = modalOverlay?.querySelector("img");
const modalClose = document.getElementById("modalClose");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");
let selectedProduct = "";

const parseCardVariants = (card) => {
    if (!card?.dataset?.variants) return null;

    try {
        const parsed = JSON.parse(card.dataset.variants);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        return null;
    }
};

const getActiveCardVariant = (card) => {
    const variants = parseCardVariants(card);
    const activeIndex = Number(card?.dataset?.activeVariant || 0);

    if (variants?.[activeIndex]) {
        return variants[activeIndex];
    }

    return {
        product: card?.dataset?.product || "Producto",
        price: card?.dataset?.price || "0",
        desc: card?.dataset?.desc || "Producto destacado.",
        aroma: card?.dataset?.aroma || "",
        image: card?.dataset?.image || "",
        images: card?.dataset?.images ? card.dataset.images.split(",") : []
    };
};

const updateCardVariant = (card, index = 0) => {
    const variants = parseCardVariants(card);
    if (!variants?.[index]) return;

    card.dataset.activeVariant = String(index);
    const variant = variants[index];
    const priceEl = card.querySelector(".card-price");
    const descEl = card.querySelector("p");
    const statusLabel = card.querySelector(".carousel-status");

    if (card.querySelector(".splash-carousel")) {
        card.dataset.product = variant.product;
        card.dataset.price = variant.price;
        card.dataset.desc = variant.desc;
        card.dataset.aroma = variant.aroma;
        card.dataset.image = variant.image;
        card.dataset.images = variants.map((item) => item.image).join(",");
        return;
    }

    if (priceEl && descEl) {
        card.classList.add("is-switching");
        setTimeout(() => {
            if (priceEl) priceEl.textContent = `$${variant.price}`;
            if (descEl) descEl.textContent = variant.desc;
            card.classList.remove("is-switching");
        }, 120);
    } else {
        if (priceEl) priceEl.textContent = `$${variant.price}`;
        if (descEl) descEl.textContent = variant.desc;
    }

    card.dataset.product = variant.product;
    card.dataset.price = variant.price;
    card.dataset.desc = variant.desc;
    card.dataset.aroma = variant.aroma;
    card.dataset.image = variant.image;
    card.dataset.images = variants.map((item) => item.image).join(",");

    if (statusLabel) {
        statusLabel.textContent = `${variant.product} • ${variant.aroma || "Producto destacado"}`;
    }
};

const stopModalAuto = () => {
    clearInterval(modalInterval);
    modalInterval = null;
};

const updateImageTransform = () => {
    modalImg.style.setProperty('--img-scale', isImageZoomed ? '3' : '1');
    modalImg.style.setProperty('--img-x', `${dragOffsetX}px`);
    modalImg.style.setProperty('--img-y', `${dragOffsetY}px`);
    modalImg.classList.toggle('zoomed', isImageZoomed);
};

const showModalSlide = (newIndex) => {
    modalIndex = (newIndex + activeCarouselSlides.length) % activeCarouselSlides.length;
    modalImg.src = activeCarouselSlides[modalIndex].src;
    modalImg.alt = activeCarouselSlides[modalIndex].alt;
    isImageZoomed = false;
    dragOffsetX = 0;
    dragOffsetY = 0;
    updateImageTransform();
};

const startModalAuto = () => {
    clearInterval(modalInterval);
    modalInterval = setInterval(() => {
        showModalSlide(modalIndex + 1);
    }, carouselIntervalMs);
};

const hideModalImage = () => {
    if (resumeActiveCardCarousel) {
        resumeActiveCardCarousel();
        resumeActiveCardCarousel = null;
    }
    modalOverlay.classList.remove("show");
    if (activeImageCard) {
        activeImageCard.classList.remove("is-image-open");
    }
    activeImageCard = null;
    isImageZoomed = false;
    dragOffsetX = 0;
    dragOffsetY = 0;
    hasDraggedImage = false;
    modalImg.classList.remove("zoomed");
    modalImg.classList.remove("dragging");
    updateImageTransform();
    stopModalAuto();
};

const showModalImage = (slides, newIndex, card = null) => {
    if (activeImageCard && activeImageCard !== card) {
        activeImageCard.classList.remove("is-image-open");
    }

    activeImageCard = card;
    if (activeImageCard) {
        activeImageCard.classList.add("is-image-open");
    }

    activeCarouselSlides = slides;
    showModalSlide(newIndex);
    isImageZoomed = false;
    dragOffsetX = 0;
    dragOffsetY = 0;
    hasDraggedImage = false;
    modalImg.classList.remove("zoomed");
    modalImg.classList.remove("dragging");
    updateImageTransform();
    modalOverlay.classList.add("show");
};

const changeModalSlide = (direction) => {
    if (!activeCarouselSlides.length) return;
    showModalSlide(modalIndex + direction);
};

modalPrev?.addEventListener("click", (event) => {
    event.stopPropagation();
    changeModalSlide(-1);
});

modalNext?.addEventListener("click", (event) => {
    event.stopPropagation();
    changeModalSlide(1);
});

document.addEventListener("keydown", (event) => {
    if (!modalOverlay?.classList.contains("show")) return;
    if (event.key === "ArrowLeft") changeModalSlide(-1);
    if (event.key === "ArrowRight") changeModalSlide(1);
    if (event.key === "Escape") hideModalImage();
});

productCarousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll("img"));
    const card = carousel.closest('.card');
    let index = 0;
    let cardInterval = null;
    let isPaused = false;
    const variants = parseCardVariants(card);
    const updateSplashBackdrop = () => {
        if (carousel.classList.contains("splash-carousel")) {
            carousel.style.setProperty("--splash-background", `url("${slides[index].src}")`);
        }
    };

    const stopCardAuto = () => {
        if (cardInterval !== null) {
            clearInterval(cardInterval);
            cardInterval = null;
        }
    };

    const pauseCardAuto = () => {
        isPaused = true;
        stopCardAuto();
        if (card) {
            let badge = card.querySelector('.paused-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'paused-badge';
                badge.textContent = 'Pausado';
                card.appendChild(badge);
            }
        }
    };

    const statusLabel = card?.querySelector('.carousel-status');
    const updateStatus = () => {
        if (statusLabel) {
            const currentVariant = variants?.[index];
            statusLabel.textContent = currentVariant
                ? `${currentVariant.product} • ${currentVariant.aroma || "Producto destacado"}`
                : `Imagen actual: ${slides[index].alt}`;
        }
    };

    if (variants?.length) {
        updateCardVariant(card, 0);
    }
    updateSplashBackdrop();

    const startCardAuto = () => {
        if (isPaused) return;
        if (cardInterval !== null) return;
        cardInterval = setInterval(() => {
            slides[index].classList.remove("active");
            index = (index + 1) % slides.length;
            slides[index].classList.add("active");
            updateSplashBackdrop();
            if (variants?.length) {
                updateCardVariant(card, index);
            }
            updateStatus();
        }, carouselIntervalMs);
    };

    const resumeCardAuto = () => {
        isPaused = false;
        card?.querySelector('.paused-badge')?.remove();
        startCardAuto();
    };

    if (slides.length > 1) {
        startCardAuto();
    }

    slides.forEach((slide, i) => {
        slide.addEventListener("click", () => {
            resumeActiveCardCarousel = resumeCardAuto;
            pauseCardAuto();
            const currentCard = slide.closest('.card');
            showModalImage(slides, i, currentCard);
            index = i;
            updateSplashBackdrop();
            if (variants?.length) {
                updateCardVariant(card, index);
            }
            updateStatus();
        });

    });

    const button = card?.querySelector('button');
    if (button) {
        const openInstagramForCard = (cardRef) => {
            const active = getActiveCardVariant(cardRef);
            const title = active.product || cardRef.dataset.product || 'Producto';
            const price = active.price || cardRef.dataset.price || '';
            const message = `Hola, quiero comprar ${title}. Precio: $${price}.`;
            const url = `https://www.instagram.com/direct/inbox/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        };

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            pauseCardAuto();
            openInstagramForCard(card);
        });
    }

    // clicking the card (outside the carousel images) opens Instagram to buy
    card?.addEventListener('click', (event) => {
        // if click happened inside the carousel images, let image handler run
        if (event.target.closest('.product-carousel')) return;
        pauseCardAuto();
        openInstagramForCard(card);
    });

    updateStatus();
});

if (modalOverlay && modalImg && modalClose) {
    modalImg.addEventListener("pointerdown", (event) => {
        if (!isImageZoomed) return;
        event.preventDefault();
        event.stopPropagation();
        isDraggingImage = true;
        hasDraggedImage = false;
        dragStartX = event.clientX - dragOffsetX;
        dragStartY = event.clientY - dragOffsetY;
        modalImg.classList.add("dragging");
        modalImg.setPointerCapture(event.pointerId);
    });

    modalImg.addEventListener("pointermove", (event) => {
        if (!isDraggingImage || !isImageZoomed) return;
        event.preventDefault();
        const nextX = event.clientX - dragStartX;
        const nextY = event.clientY - dragStartY;
        if (Math.abs(nextX - dragOffsetX) > 2 || Math.abs(nextY - dragOffsetY) > 2) {
            hasDraggedImage = true;
        }
        dragOffsetX = nextX;
        dragOffsetY = nextY;
        updateImageTransform();
    });

    const stopImageDrag = (event) => {
        if (!isDraggingImage) return;
        isDraggingImage = false;
        modalImg.classList.remove("dragging");
        if (event?.pointerId !== undefined) {
            modalImg.releasePointerCapture(event.pointerId);
        }
    };

    modalImg.addEventListener("pointerup", stopImageDrag);
    modalImg.addEventListener("pointercancel", stopImageDrag);

    modalImg.addEventListener("click", (event) => {
        event.stopPropagation();
        if (hasDraggedImage) {
            hasDraggedImage = false;
            return;
        }
        isImageZoomed = !isImageZoomed;
        updateImageTransform();
    });

    modalClose.addEventListener("click", () => {
        hideModalImage();
    });

    modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
            hideModalImage();
        }
    });
}

// MENSAJE EN LOS BOTONES "COMPRAR"

const botones = document.querySelectorAll(".card button");
const cards = document.querySelectorAll(".card");



// VALIDACIÓN DEL FORMULARIO

const formulario = document.querySelector("form");

formulario.addEventListener("submit", function(e){

    e.preventDefault();

    const nombre = document.querySelector('input[type="text"]').value;
    const correo = document.querySelector('input[type="email"]').value;
    const mensaje = document.querySelector("textarea").value;

    if(nombre === "" || correo === "" || mensaje === ""){

        alert("Por favor completa todos los campos.");

        return;

    }

    alert("¡Mensaje enviado correctamente!");

    formulario.reset();

});


// ANIMACIÓN AL HACER SCROLL

const elementos = document.querySelectorAll(
".card, .beneficio, .testimonio, .imagenes img:not(.gallery-splash)"
);

const mostrarElementos = () => {

    elementos.forEach((elemento) => {

        const posicion = elemento.getBoundingClientRect().top;

        const pantalla = window.innerHeight;

        if(posicion < pantalla - 100){

            elemento.style.opacity = "1";
            if(elemento.matches(".imagenes img")){
                elemento.style.translate = "0 0";
            } else {
                elemento.style.transform = "translateY(0px)";
            }

        }

    });

};

elementos.forEach((elemento)=>{

    elemento.style.opacity = "0";
    if(elemento.matches(".imagenes img")){
        elemento.style.translate = "0 40px";
    } else {
        elemento.style.transform = "translateY(40px)";
    }
    elemento.style.transition = "all .8s ease";

});

window.addEventListener("scroll", mostrarElementos);

mostrarElementos();


// EFECTO EN EL TÍTULO PRINCIPAL

const titulo = document.querySelector(".hero-texto h1");

titulo.style.opacity = "0";
titulo.style.transform = "translateY(-30px)";

window.onload = () => {

    setTimeout(() => {

        titulo.style.transition = "1s";

        titulo.style.opacity = "1";

        titulo.style.transform = "translateY(0px)";

    },300);

};


// DESPLAZAMIENTO SUAVE DEL MENÚ

const enlaces = document.querySelectorAll('nav a');

enlaces.forEach((enlace)=>{

    enlace.addEventListener("click",(e)=>{

        e.preventDefault();

        const destino = document.querySelector(
            enlace.getAttribute("href")
        );

        destino.scrollIntoView({

            behavior:"smooth"

        });

    });

});


// MENSAJE DE BIENVENIDA

setTimeout(()=>{

    console.log("Bienvenido a Sucha Skincare 🌸");

},1000);