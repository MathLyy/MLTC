// ========================================
// Livrées Transition System
// Smooth overlay panel with dark mode transition
// Used on livrees.html only
// ========================================

(function () {
  'use strict';

  // ── Configuration ──
  var DARK_DELAY    = 0;       // ms before dark mode starts
  var SLIDE_DELAY   = 250;     // ms before panel slides in (after dark starts)
  var CLOSE_SLIDE   = 0;       // ms before slide-out starts on close
  var CLOSE_LIGHT   = 300;     // ms after slide-out starts before reverting to light
  var SLIDE_DURATION = 550;    // matches CSS transition duration

  // ── State ──
  var overlayEl, panelEl, loaderEl;
  var isOpen = false;
  var isAnimating = false;
  var currentSubpageUrl = null;
  var originalTitle = document.title;
  var originalUrl = window.location.href;
  var originalScrollY = 0;

  // ── Build overlay DOM ──
  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'lv-overlay';

    panelEl = document.createElement('div');
    panelEl.id = 'lv-overlay-panel';

    loaderEl = document.createElement('div');
    loaderEl.id = 'lv-overlay-loader';
    loaderEl.innerHTML = '<span class="spinner"></span><span>Chargement…</span>';

    overlayEl.appendChild(panelEl);
    overlayEl.appendChild(loaderEl);
    document.body.appendChild(overlayEl);
  }

  // ── Mark body as host ──
  function init() {
    document.body.classList.add('lv-host');
    buildOverlay();

    // Fix relative URL resolution: pushState changes the browser URL,
    // which would break navbar/subnav relative links.
    // A <base> tag anchors all relative URLs to the original page directory.
    if (!document.querySelector('base')) {
      var baseTag = document.createElement('base');
      baseTag.href = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
      document.head.prepend(baseTag);
    }

    // Intercept clicks on livree icon links
    document.addEventListener('click', onLinkClick);

    // Handle browser back/forward
    window.addEventListener('popstate', onPopState);
  }

  // ── Link click handler ──
  function onLinkClick(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank') return;

    // Only intercept links to livrees_pages/
    if (href.indexOf('livrees_pages/') === -1) {
      // If overlay is open and they click a non-subpage link, close overlay first
      if (isOpen) {
        e.preventDefault();
        closeOverlay(function () {
          window.location.href = link.href;
        });
      }
      return;
    }

    e.preventDefault();
    if (isAnimating) return;

    // Extract the anchor if present (e.g. services-urbains.html#urbahn)
    var fullUrl = link.href;

    openOverlay(fullUrl, href);
  }

  // ── Open overlay ──
  function openOverlay(fullUrl, relativeHref) {
    if (isAnimating) return;
    isAnimating = true;
    currentSubpageUrl = fullUrl;
    originalScrollY = window.scrollY;

    // Step A: transition to dark mode
    setTimeout(function () {
      document.body.classList.add('lv-dark');
    }, DARK_DELAY);

    // Start fetching content immediately
    var fetchPromise = fetchSubpage(fullUrl);

    // Step B: slide in panel
    setTimeout(function () {
      overlayEl.classList.add('active');
      overlayEl.classList.remove('closing', 'loaded');

      fetchPromise.then(function (result) {
        if (!result) {
          // Fetch failed — fallback to normal navigation
          isAnimating = false;
          window.location.href = fullUrl;
          return;
        }

        // Inject content
        panelEl.innerHTML = '';
        panelEl.appendChild(result.content);
        overlayEl.classList.add('loaded');

        // Update document title
        if (result.title) {
          document.title = result.title;
        }

        // Push state for URL update (use absolute URL to avoid resolution issues)
        history.pushState(
          { lvOverlay: true, url: fullUrl },
          result.title || '',
          fullUrl
        );

        // Initialize subpage JS (flip buttons, stack layout)
        initSubpageScripts(panelEl);

        // Handle anchor scrolling within the overlay
        // Wait for the slide-in animation to complete before scrolling
        var hash = extractHash(fullUrl);
        if (hash) {
          setTimeout(function () {
            var target = panelEl.querySelector('#' + CSS.escape(hash));
            if (target) {
              panelEl.scrollTo({ top: target.offsetTop - 130, behavior: 'smooth' });
            }
          }, SLIDE_DURATION + 50);
        } else {
          panelEl.scrollTop = 0;
        }

        isOpen = true;
        isAnimating = false;
      });
    }, SLIDE_DELAY);
  }

  // ── Close overlay ──
  function closeOverlay(callback) {
    if (isAnimating && !callback) return;
    isAnimating = true;

    // Step 1: slide panel down
    setTimeout(function () {
      overlayEl.classList.add('closing');
      overlayEl.classList.remove('active');
    }, CLOSE_SLIDE);

    // Step 2: revert to light mode
    setTimeout(function () {
      document.body.classList.remove('lv-dark');
    }, CLOSE_SLIDE + CLOSE_LIGHT);

    // Step 3: cleanup after animation
    setTimeout(function () {
      overlayEl.classList.remove('closing', 'loaded');
      panelEl.innerHTML = '';
      document.title = originalTitle;
      currentSubpageUrl = null;
      isOpen = false;
      isAnimating = false;

      // Restore scroll position
      window.scrollTo(0, originalScrollY);

      if (callback) callback();
    }, CLOSE_SLIDE + SLIDE_DURATION + 50);
  }

  // ── Popstate (back/forward) ──
  function onPopState(e) {
    if (isOpen) {
      // Going back from subpage to livrees
      closeOverlay();
    } else if (e.state && e.state.lvOverlay) {
      // Going forward to a subpage
      openOverlay(e.state.url, e.state.url);
    }
  }

  // ── Fetch subpage content ──
  function fetchSubpage(url) {
    // Strip hash for fetch
    var fetchUrl = url.split('#')[0];

    return fetch(fetchUrl)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // Resolve base URL for relative paths in the fetched document
        var baseUrl = fetchUrl.substring(0, fetchUrl.lastIndexOf('/') + 1);

        // Extract main content and footer
        var mainEl = doc.querySelector('main.lv-page') || doc.querySelector('main');
        var footerEl = doc.querySelector('footer.footer');
        var title = doc.querySelector('title');

        if (!mainEl) return null;

        // Rebase relative URLs in the content
        rebaseUrls(mainEl, baseUrl);
        if (footerEl) rebaseUrls(footerEl, baseUrl);

        // Build a fragment with main + footer
        var fragment = document.createDocumentFragment();

        // Clone main
        var mainClone = mainEl.cloneNode(true);
        fragment.appendChild(mainClone);

        // Clone footer if found
        if (footerEl) {
          var footerClone = footerEl.cloneNode(true);
          fragment.appendChild(footerClone);
        }

        return {
          content: fragment,
          title: title ? title.textContent : null
        };
      })
      .catch(function (err) {
        console.error('[lv-transition] Fetch error:', err);
        return null;
      });
  }

  // ── Rebase relative URLs so they work from the host page context ──
  function rebaseUrls(container, baseUrl) {
    // Rebase images
    container.querySelectorAll('img[src]').forEach(function (img) {
      var src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
        img.setAttribute('src', new URL(src, baseUrl).href);
      }
      // Also rebase data-r attribute for flip images
      var dataR = img.getAttribute('data-r');
      if (dataR && !dataR.startsWith('http') && !dataR.startsWith('/')) {
        img.setAttribute('data-r', new URL(dataR, baseUrl).href);
      }
    });
    // Rebase links (but keep anchors and livrees_pages/ relative for our handler)
    container.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('javascript:') && !href.startsWith('/') && !href.startsWith('mailto:')) {
        a.setAttribute('href', new URL(href, baseUrl).href);
      }
    });
    // Rebase background images in style attributes
    container.querySelectorAll('[style]').forEach(function (el) {
      var style = el.getAttribute('style');
      if (style && style.indexOf('url(') !== -1) {
        el.setAttribute('style', style.replace(/url\(["']?([^"')]+)["']?\)/g, function (match, path) {
          if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('/')) return match;
          try {
            return 'url("' + new URL(path, baseUrl).href + '")';
          } catch (_) { return match; }
        }));
      }
    });
  }

  // ── Initialize subpage scripts on dynamic content ──
  function initSubpageScripts(container) {
    // Re-run stack layout assessment
    var engines = container.querySelectorAll('.lv-engine');
    engines.forEach(function (card) {
      var frame = card.querySelector('.lv-imgframe');
      var img = frame ? frame.querySelector('img') : null;
      if (!img) return;

      var assess = function () {
        if (window._lvAssessStack) window._lvAssessStack(card);
      };

      if (img.complete) assess();
      else img.addEventListener('load', assess, { once: true });
    });

    // Intercept links inside the overlay
    container.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.startsWith('javascript:') || link.target === '_blank') return;

      // Anchor links within overlay — scroll inside panel + update URL
      if (href.startsWith('#')) {
        e.preventDefault();
        var target = panelEl.querySelector(href);
        if (target) {
          panelEl.scrollTo({ top: target.offsetTop - 130, behavior: 'smooth' });
        }
        // Update URL with the anchor
        var baseUrl = (currentSubpageUrl || '').split('#')[0];
        var newUrl = baseUrl + href;
        history.replaceState(
          { lvOverlay: true, url: newUrl },
          document.title,
          newUrl
        );
        return;
      }

      // Resolve the full URL for comparison
      var resolvedUrl;
      try {
        resolvedUrl = new URL(href, currentSubpageUrl || window.location.href).href;
      } catch (_) {
        resolvedUrl = href;
      }

      // Links going back to livrees.html
      if (resolvedUrl.indexOf('livrees.html') !== -1 && resolvedUrl.indexOf('livrees_pages') === -1) {
        e.preventDefault();
        history.pushState(null, originalTitle, originalUrl);
        closeOverlay();
        return;
      }

      // Links to other subpages (livrees_pages/)
      if (resolvedUrl.indexOf('livrees_pages/') !== -1) {
        e.preventDefault();
        if (isAnimating) return;

        var fullUrl = resolvedUrl;

        // Quick transition: slide content, no full dark/light cycle
        panelEl.style.opacity = '0';
        panelEl.style.transition = 'opacity 0.25s ease';

        setTimeout(function () {
          fetchSubpage(fullUrl).then(function (result) {
            if (!result) {
              window.location.href = fullUrl;
              return;
            }

            panelEl.innerHTML = '';
            panelEl.appendChild(result.content);
            panelEl.scrollTop = 0;

            if (result.title) document.title = result.title;

            currentSubpageUrl = fullUrl;

            history.pushState(
              { lvOverlay: true, url: fullUrl },
              result.title || '',
              fullUrl
            );

            initSubpageScripts(panelEl);

            // Handle anchor
            var hash = extractHash(fullUrl);
            if (hash) {
              setTimeout(function () {
                var target = panelEl.querySelector('#' + CSS.escape(hash));
                if (target) panelEl.scrollTo({ top: target.offsetTop - 130, behavior: 'smooth' });
              }, 300);
            }

            panelEl.style.opacity = '1';
          });
        }, 250);

        return;
      }

      // External or other links: close overlay, then navigate
      e.preventDefault();
      closeOverlay(function () {
        window.location.href = link.href;
      });
    });
  }

  // ── Helpers ──
  function extractHash(url) {
    var idx = url.indexOf('#');
    return idx !== -1 ? url.substring(idx + 1) : null;
  }

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
