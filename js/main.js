// ========================================
// MathLoo Portfolio - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // Smooth reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.featured-card, .about-content, .project-card, .explore-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add revealed styles
    const style = document.createElement('style');
    style.textContent = `
        .revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Disclaimer popup
    const disclaimerOverlay = document.getElementById('disclaimer-overlay');
    const disclaimerClose = document.getElementById('disclaimer-close');

    if (disclaimerOverlay) {
        if (sessionStorage.getItem('disclaimerSeen')) {
            disclaimerOverlay.remove();
        } else {
            disclaimerClose.addEventListener('click', () => {
                disclaimerOverlay.classList.add('hidden');
                sessionStorage.setItem('disclaimerSeen', '1');
                setTimeout(() => disclaimerOverlay.remove(), 300);
            });
        }
    }

    // Service card deck - tab switching
    document.querySelectorAll('.ht-service-deck').forEach(deck => {
        const tabs = deck.querySelectorAll('.ht-deck-tab');
        const panels = deck.querySelectorAll('.ht-deck-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-deck-target');

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                panels.forEach(p => {
                    p.classList.remove('active');
                    p.style.animation = 'none';
                });

                const panel = deck.querySelector(`[data-deck-index="${target}"]`);
                if (panel) {
                    // Force reflow to restart animation
                    void panel.offsetWidth;
                    panel.style.animation = '';
                    panel.classList.add('active');
                }
            });
        });
    });

    // ── Expansion page: scroll-driven sticky panel ──
    const expItems = document.querySelectorAll('.ht-tl-item[data-index]');
    if (expItems.length) {
        const counterNum  = document.getElementById('exp-counter-num');
        const counterYear = document.getElementById('exp-counter-year');
        const countryList = document.getElementById('exp-country-list');

        // Cumulative state per timeline index
        const STEPS = [
            { year: '2001', reveal: ['Allemagne'],          total: 7  },
            { year: '2002', reveal: ['Italie'],             total: 7  },
            { year: '2005', reveal: ['Suisse', 'Autriche'], total: 9  },
            { year: '2007', reveal: ['Royaume-Uni'],        total: 9  },
            { year: '2008', reveal: ['Danemark'],           total: 10 },
            { year: '2010', reveal: ['Tchéquie'],           total: 11 },
            { year: '2012', reveal: ['Espagne'],            total: 12 },
        ];

        const FOUNDERS = ['France', 'Belgique', 'Pays-Bas', 'Luxembourg',
                          'Allemagne', 'Royaume-Uni', 'Italie'];

        let activeIndex = -1;

        function updateExpansionPanel(idx) {
            if (idx === activeIndex) return;
            activeIndex = idx;

            expItems.forEach(item => {
                item.classList.toggle('active',
                    Number(item.dataset.index) === idx);
            });

            const revealed = new Set(FOUNDERS);
            const highlighted = new Set();
            for (let i = 0; i <= idx; i++) {
                STEPS[i].reveal.forEach(c => revealed.add(c));
                if (i === idx) STEPS[i].reveal.forEach(c => highlighted.add(c));
            }

            document.querySelectorAll('.cov-country').forEach(g => {
                const name = g.dataset.country;
                if (revealed.has(name)) {
                    g.classList.remove('cov-hidden');
                    g.classList.add('cov-revealed');
                } else {
                    g.classList.add('cov-hidden');
                    g.classList.remove('cov-revealed');
                }
            });

            const step = STEPS[idx] || STEPS[0];
            if (counterNum)  counterNum.textContent  = step.total;
            if (counterYear) counterYear.textContent = step.year;

            if (countryList) {
                countryList.querySelectorAll('li').forEach(li => {
                    const name = li.dataset.name;
                    li.classList.toggle('active', revealed.has(name));
                    li.classList.toggle('highlight', highlighted.has(name));
                });
            }
        }

        function initMapState() {
            document.querySelectorAll('.cov-country').forEach(g => {
                const name = g.dataset.country;
                if (!FOUNDERS.includes(name)) {
                    g.classList.add('cov-hidden');
                }
            });
        }

        const mapCheck = setInterval(() => {
            if (document.querySelectorAll('.cov-country').length > 0) {
                clearInterval(mapCheck);
                initMapState();
            }
        }, 200);

        const observer = new IntersectionObserver(entries => {
            let best = null;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.dataset.index);
                    if (best === null || idx > best) best = idx;
                }
            });
            if (best !== null) updateExpansionPanel(best);
        }, {
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        });

        expItems.forEach(item => observer.observe(item));
    }
});
