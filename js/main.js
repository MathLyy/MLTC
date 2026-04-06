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

    // ── Expansion page: phase-based event expand/collapse ──
    const evtItems = document.querySelectorAll('.ht-evt[data-index]');
    if (evtItems.length) {
        // Scroll-based active highlight (declared before click handler)
        let activeIndex = -1;
        let scrollLocked = false;

        function setActive(idx) {
            activeIndex = idx;
            evtItems.forEach(item => {
                const isActive = Number(item.dataset.index) === idx;
                item.classList.toggle('active', isActive);
                if (isActive) {
                    document.querySelectorAll('.ht-phase').forEach(p =>
                        p.classList.remove('ht-phase-active'));
                    const phase = item.closest('.ht-phase');
                    if (phase) phase.classList.add('ht-phase-active');
                }
            });
        }

        // Click to expand/collapse event description
        evtItems.forEach(evt => {
            evt.addEventListener('click', () => {
                const body = evt.querySelector('.ht-evt-body');
                const isOpen = evt.classList.contains('ht-evt-open');

                // Anchor: remember clicked element's viewport position
                const anchorY = evt.getBoundingClientRect().top;

                // Close all others (with proper height collapse)
                evtItems.forEach(other => {
                    if (other !== evt && other.classList.contains('ht-evt-open')) {
                        other.classList.remove('ht-evt-open');
                        const ob = other.querySelector('.ht-evt-body');
                        if (ob) {
                            ob.style.maxHeight = ob.scrollHeight + 'px';
                            requestAnimationFrame(() => {
                                ob.style.maxHeight = '0px';
                                ob.classList.remove('ht-evt-visible');
                            });
                        }
                    }
                });

                if (isOpen) {
                    // Collapse: set explicit height first, then animate to 0
                    body.style.maxHeight = body.scrollHeight + 'px';
                    requestAnimationFrame(() => {
                        body.style.maxHeight = '0px';
                        body.classList.remove('ht-evt-visible');
                        evt.classList.remove('ht-evt-open');
                    });
                } else {
                    // Expand: animate from 0 to actual content height
                    evt.classList.add('ht-evt-open');
                    body.classList.add('ht-evt-visible');
                    body.style.maxHeight = '0px';
                    requestAnimationFrame(() => {
                        body.style.maxHeight = body.scrollHeight + 'px';
                    });
                    // Clean up inline style after transition so content can reflow
                    body.addEventListener('transitionend', function cleanup(e) {
                        if (e.propertyName === 'max-height' && evt.classList.contains('ht-evt-open')) {
                            body.style.maxHeight = 'none';
                        }
                        body.removeEventListener('transitionend', cleanup);
                    });
                }

                // Restore scroll so the clicked item stays at the same viewport Y
                requestAnimationFrame(() => {
                    const newY = evt.getBoundingClientRect().top;
                    const drift = newY - anchorY;
                    if (Math.abs(drift) > 2) {
                        window.scrollBy({ top: drift, behavior: 'instant' });
                    }
                });

                // Force this event as active and lock scroll highlight briefly
                setActive(Number(evt.dataset.index));
                scrollLocked = true;
                setTimeout(() => { scrollLocked = false; }, 600);
            });
        });

        const observer = new IntersectionObserver(entries => {
            if (scrollLocked) return;
            let best = null;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.dataset.index);
                    if (best === null || idx > best) best = idx;
                }
            });
            if (best !== null && best !== activeIndex) {
                setActive(best);
            }
        }, {
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        });

        evtItems.forEach(item => observer.observe(item));
    }
});
