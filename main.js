// Ensure CSS `--vh` matches the real viewport height on mobile
// (fixes the 100vh problem on mobile browsers with dynamic UI chrome).
(function () {
    // Set `--vh` for mobile browser UI reliability and make the header
    // height robust by also setting `--navbar-height` and an inline
    // height fallback on the header element.
    function setVh() {
        try {
            document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
        } catch (e) {
            // ignore in older browsers
        }
    }

    function setNavbarAndHeader() {
        try {
            var root = document.documentElement;
            var navbar = document.getElementById('myNavbar');
            var header = document.querySelector('.site-header');

            // Determine navbar height (fallback to existing CSS var if not present)
            var navbarHeight = 0;
            if (navbar) navbarHeight = navbar.offsetHeight;
            else {
                var cssVar = getComputedStyle(root).getPropertyValue('--navbar-height');
                if (cssVar) navbarHeight = parseInt(cssVar, 10) || 0;
            }

            // Set CSS variable so CSS calc() can use it reliably
            root.style.setProperty('--navbar-height', navbarHeight + 'px');

            // Clear any previously-set inline heights so CSS (using --vh)
            // controls the header size. We only expose --navbar-height.
            if (header) {
                try {
                    header.style.removeProperty('height');
                    header.style.removeProperty('min-height');
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            // silent fail
        }
    }

    setVh();
    setNavbarAndHeader();

    // Update on viewport/rotation changes
    window.addEventListener('resize', function () { setVh(); setNavbarAndHeader(); }, { passive: true });
    window.addEventListener('orientationchange', function () { setVh(); setNavbarAndHeader(); }, { passive: true });

    // Observe navbar size changes (e.g., menu opens/closes that change height)
    if (window.ResizeObserver) {
        try {
            var navEl = document.getElementById('myNavbar');
            if (navEl) {
                var ro = new ResizeObserver(function () { setNavbarAndHeader(); });
                ro.observe(navEl);
            }
        } catch (e) {
            // ignore
        }
    }
})();
// Language selector: toggle, click-outside close, and persistence
window.toggleLangMenu = function (event) {
    if (event && event.stopPropagation) event.stopPropagation();
    var btn = event && event.currentTarget ? event.currentTarget : document.querySelector('.lang-button');
    var menu = document.getElementById('lang-menu');
    if (!btn || !menu) return;
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    if (!expanded) {
        // If mobile menu is open, close it and disable the menu toggle
        try { if (window.closeMobileMenu) window.closeMobileMenu(); } catch (e) {}
        try { disableMenuToggle(); } catch (e) {}

        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('is-open');
        // close when clicking outside
        document.addEventListener('click', closeLangMenuOnClickOutside);
    } else {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-open');
        document.removeEventListener('click', closeLangMenuOnClickOutside);
        // Re-enable menu toggle when language menu closed
        try { enableMenuToggle(); } catch (e) {}
    }
};

function closeLangMenuOnClickOutside(e) {
    var menu = document.getElementById('lang-menu');
    var btn = document.querySelector('.lang-button');
    if (!menu || !btn) return;
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('is-open');
    document.removeEventListener('click', closeLangMenuOnClickOutside);
    try { enableMenuToggle(); } catch (e) {}
}

window.setLang = function (lang) {
    var map = { fr: 'FR', de: 'DE', en: 'EN' };
    var code = (map[lang] || String(lang || '').toUpperCase()).slice(0, 3);
    var label = document.querySelector('.lang-button .lang-label');
    var flagEl = document.querySelector('.lang-button .lang-flag');
    if (label) label.textContent = code;
    // Copy the SVG markup from the selected option so colors and sizing match
    try {
        var opt = document.querySelector('.lang-option[data-lang="' + lang + '"]');
        if (opt) {
            var optFlag = opt.querySelector('.lang-flag');
            if (optFlag && flagEl) flagEl.innerHTML = optFlag.innerHTML;
        }
    } catch (e) {
        // fallback: clear flag
        if (flagEl) flagEl.textContent = '';
    }
    try {
        localStorage.setItem('siteLang', lang);
    } catch (e) {
        // ignore storage errors
    }
    // close menu after selection
    var menu = document.getElementById('lang-menu');
    var btn = document.querySelector('.lang-button');
    if (menu) menu.classList.remove('is-open'), menu.setAttribute('aria-hidden', 'true');
    if (btn) btn.setAttribute('aria-expanded', 'false'), btn.classList.remove('is-open');
    document.removeEventListener('click', closeLangMenuOnClickOutside);
    // emit a custom event so other scripts can react to language change
    try {
        document.dispatchEvent(new CustomEvent('site:language-changed', { detail: { lang: lang } }));
    } catch (e) {
        // ignore if CustomEvent isn't supported
    }
};

// Allow other scripts to close the lang menu immediately without toggling
window.closeLangMenuImmediate = function () {
    try {
        var menu = document.getElementById('lang-menu');
        var btn = document.querySelector('.lang-button');
        if (menu) {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
        }
        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.classList.remove('is-open');
            document.removeEventListener('click', closeLangMenuOnClickOutside);
        }
    } catch (e) {}
};

// Helpers to disable/enable the hamburger/menu-toggle while lang menu is active
function disableMenuToggle() {
    try {
        var btn = document.querySelector('.menu-toggle');
        if (btn) {
            btn.setAttribute('aria-disabled', 'true');
            btn.style.pointerEvents = 'none';
        }
    } catch (e) {}
}
function enableMenuToggle() {
    try {
        var btn = document.querySelector('.menu-toggle');
        if (btn) {
            btn.removeAttribute('aria-disabled');
            btn.style.pointerEvents = '';
        }
    } catch (e) {}
}

// Initialize from localStorage on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    try {
        var saved = localStorage.getItem('siteLang');
        if (saved) {
            var map = { fr: 'FR', de: 'DE', en: 'EN' };
            var code = (map[saved] || String(saved).toUpperCase()).slice(0, 3);
            var label = document.querySelector('.lang-button .lang-label');
            var flagEl = document.querySelector('.lang-button .lang-flag');
            if (label) label.textContent = code;
            try {
                var opt = document.querySelector('.lang-option[data-lang="' + saved + '"]');
                if (opt && flagEl) {
                    var optFlag = opt.querySelector('.lang-flag');
                    if (optFlag) flagEl.innerHTML = optFlag.innerHTML;
                }
            } catch (e) {
                // ignore
            }
        }
    } catch (e) {
        // ignore
    }
});

// JS minimal pour la navigation et la réactivité
// 1. Gestion du menu mobile principal
(function () {
    var mobileMenu = document.getElementById('mobileMenu');
    var toggleButton = document.querySelector('.menu-toggle');
    // We'll animate a CSS hamburger (three bars). Toggle the `open` class on the button.
    var menuIcon = null; // no longer used; kept for backward compatibility in older code paths
    if (!mobileMenu || !toggleButton) return;
    function openMenu() {
        if (mobileMenu.classList.contains('is-open')) return;
        // If language menu is open, close it and disable the lang switcher
        try { if (window.closeLangMenuImmediate) window.closeLangMenuImmediate(); } catch (e) {}
        try { disableLangSwitcher(); } catch (e) {}
        mobileMenu.classList.add('is-open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        toggleButton.setAttribute('aria-expanded', 'true');
        // add class to the toggle button so CSS performs the animation
        try { toggleButton.classList.add('open'); } catch (e) {}
        // mark page as menu-open so CSS can adjust header/navbar styles
        try { document.body.classList.add('menu-open'); } catch (e) {}
    }
    function closeMenu() {
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        toggleButton.setAttribute('aria-expanded', 'false');
        try { toggleButton.classList.remove('open'); } catch (e) {}
        try { document.body.classList.remove('menu-open'); } catch (e) {}
        // Re-enable language switcher when menu closed
        try { enableLangSwitcher(); } catch (e) {}
        // Return focus to the menu toggle for accessibility
        try { toggleButton.focus(); } catch (e) {}
    }
    window.toggleMobileMenu = function (event) {
        if (event) event.preventDefault();
        if (mobileMenu.classList.contains('is-open')) closeMenu(); else openMenu();
    };
    window.closeMobileMenu = function () { closeMenu(); };
    document.addEventListener('click', function (event) {
        if (!mobileMenu.classList.contains('is-open')) return;
        if (mobileMenu.contains(event.target) || toggleButton.contains(event.target)) return;
        closeMenu();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
            closeMenu();
            toggleButton.focus();
        }
    });
    window.addEventListener('resize', function () {
        if (window.innerWidth > 999 && mobileMenu.classList.contains('is-open')) closeMenu();
    });
})();
// Helpers to disable/enable language switcher when mobile menu is active
function disableLangSwitcher() {
    try {
        var btn = document.querySelector('.lang-button');
        if (btn) {
            btn.setAttribute('aria-disabled', 'true');
            btn.style.pointerEvents = 'none';
        }
    } catch (e) {}
}
function enableLangSwitcher() {
    try {
        var btn = document.querySelector('.lang-button');
        if (btn) {
            btn.removeAttribute('aria-disabled');
            btn.style.pointerEvents = '';
        }
    } catch (e) {}
}
// 7. Progressive black overlay when header scrolls out
(function () {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var root = document.documentElement;
    var ticking = false;

    function updateHeaderHidden() {
        try {
            var rect = header.getBoundingClientRect();
            var progress = 0;
            if (rect && rect.height > 0) {
                // progress from 0 (header fully in view) to 1 (header fully scrolled past)
                progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
            }
            root.style.setProperty('--header-hidden', progress.toFixed(3));
        } catch (e) {
            // ignore
        }
    }

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                updateHeaderHidden();
                ticking = false;
            });
            ticking = true;
        }
    }

    // initial
    updateHeaderHidden();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateHeaderHidden, { passive: true });
    window.addEventListener('orientationchange', updateHeaderHidden, { passive: true });
    document.addEventListener('readystatechange', updateHeaderHidden);
})();
// 6. Hide navbar on scroll down, show on scroll up
(function () {
    var navbar = document.getElementById('myNavbar');
    if (!navbar) return;

    var lastScroll = window.scrollY || 0;
    var ticking = false;
    var threshold = 10; // minimal scroll delta to trigger

    // initialize state
    navbar.classList.add('nav-visible');

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                var current = window.scrollY || 0;
                var delta = current - lastScroll;

                if (Math.abs(delta) > threshold) {
                    if (delta > 0 && current > 50) {
                        // scrolling down
                        navbar.classList.add('nav-hidden');
                        navbar.classList.remove('nav-visible');
                    } else if (delta < 0) {
                        // scrolling up
                        navbar.classList.remove('nav-hidden');
                        navbar.classList.add('nav-visible');
                    }
                    lastScroll = current;
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
})();
// 2. Gestion du menu secteur mobile
window.toggleSecteurMobileMenu = function(event) {
    event.stopPropagation();
    var menu = document.getElementById('secteur-mobile-menu');
    var expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
    if (menu) {
        if (!expanded) menu.classList.add('is-open'); else menu.classList.remove('is-open');
        event.currentTarget.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    }
    if (!expanded) document.addEventListener('click', closeSecteurMenuOnClickOutside);
    else document.removeEventListener('click', closeSecteurMenuOnClickOutside);
}
function closeSecteurMenuOnClickOutside(e) {
    var menu = document.getElementById('secteur-mobile-menu');
    var btn = document.querySelector('button[aria-controls="secteur-mobile-menu"]');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', closeSecteurMenuOnClickOutside);
    }
}
// 3. Gestion du dropdown desktop
(function () {
    var dropdown = document.querySelector('[data-dropdown]');
    if (!dropdown) return;
    var toggle = dropdown.querySelector('.af-dropdown-toggle');
    var menu = dropdown.querySelector('.af-dropdown-content');
    if (!toggle || !menu) return;
    var isOpen = false;
    function openMenu() {
        if (isOpen) return;
        isOpen = true;
        dropdown.setAttribute('data-dropdown-open', 'true');
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
        if (!isOpen) return;
        isOpen = false;
        dropdown.removeAttribute('data-dropdown-open');
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function (event) {
        event.preventDefault();
        if (isOpen) closeMenu(); else openMenu();
    });
    document.addEventListener('click', function (event) {
        if (!isOpen) return;
        if (!dropdown.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
        if (!isOpen) return;
        if (event.key === 'Escape' || event.key === 'Esc') {
            closeMenu();
            toggle.focus();
        }
    });
})();
// 4. Effet de disparition du hero au scroll
(function () {
    // Target hero content AND header icons/social so they hide together on scroll
    var targets = document.querySelectorAll('.hero-content, .hero-social, header .fa, header i[class*="fa"]');
    if (!targets || !targets.length) return;
    var threshold = 120;
    // increase threshold by ~10% to delay hiding the hero content slightly
    // (previously 120px -> now 132px)
    threshold = Math.round(threshold * 1.1);

    function update() {
        if (window.scrollY > threshold) {
            targets.forEach(function (el) { el.classList.add('is-hidden'); });
        } else {
            targets.forEach(function (el) { el.classList.remove('is-hidden'); });
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
})();
// 5. Header slideshow controller (reliable stacking + crossfade)
// Slideshow robuste : gère l'absence de slides et réinitialise toujours le premier slide
(function () {
    var slides = document.querySelectorAll('.header-slideshow .slide');
    if (!slides || !slides.length) {
        console.error('[Slideshow] Aucun élément .header-slideshow .slide trouvé.');
        return;
    }
    var current = 0;
    var reduceMotion = false;
    try {
        reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
        reduceMotion = false;
    }
    // Initialisation : tout cacher
    slides.forEach(function (s) {
        s.style.opacity = '0';
        s.style.zIndex = '0';
        s.style.animation = 'none';
        s.classList.remove('is-active');
    });

    function activateSlide(index) {
        if (!slides.length) return;
        index = index % slides.length;
        // hide previous
        slides[current].classList.remove('is-active');
        slides[current].style.opacity = '0';
        slides[current].style.zIndex = '0';
        slides[current].style.animation = 'none';

        // show next
        current = index;
        slides[current].classList.add('is-active');
        slides[current].style.zIndex = '2';
        slides[current].style.opacity = '0';
        slides[current].style.animation = 'none';
        if (!reduceMotion) {
            slides[current].offsetHeight;
            slides[current].style.animation = 'slidePan 30s linear forwards';
        } else {
            slides[current].style.transform = 'none';
            slides[current].style.backgroundPosition = '0% 100%';
        }
        requestAnimationFrame(function () {
            slides[current].style.opacity = '1';
        });
    }

    // Affiche le premier slide même si l'animation échoue
    slides[0].classList.add('is-active');
    slides[0].style.opacity = '1';
    slides[0].style.zIndex = '2';
    if (!reduceMotion) slides[0].style.animation = 'slidePan 30s linear forwards';

    // Cycle slides
    var animationDuration = 30000; // 30s per image (matches CSS)
    var pauseAfter = 500;
    var total = animationDuration + pauseAfter;

    setInterval(function () {
        if (!document.body.contains(slides[current])) return;
        var next = (current + 1) % slides.length;
        activateSlide(next);
    }, total);
})();
