// Shared behaviors for livrées subpages
// - Flip handling (R button)
// - Auto stacked layout assessment for long sprites

(function(){
  // Flip handling for liveries: swaps to data-r image when available, else CSS mirror
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.lv-flip-btn');
    if(!btn) return;
    const card = btn.closest('.lv-engine');
    const img = card?.querySelector('.lv-imgframe img');
    if(!img) return;
    const hasR = img.getAttribute('data-r');
    const current = img.getAttribute('src');
    const target = hasR;
    // Toggle between normal and R versions if provided
    if(target) {
      if(current === target) {
        // try to find non-R by stripping _R
        const normal = target.replace('_R', '');
        img.setAttribute('src', normal);
      } else {
        img.setAttribute('src', target);
      }
      img.classList.remove('flip-x');
    } else {
      // Fallback: CSS mirror
      img.classList.toggle('flip-x');
    }

    // Re-evaluate stacked layout after image changes
    const recalc = () => {
      try { window._lvAssessStack && window._lvAssessStack(card); } catch(_) {}
    };
  if (img.complete) recalc(); else img.addEventListener('load', recalc, { once: true });
  });

  // Auto stacked layout for very long sprites
  function isStackNeeded(img){
    const nw = img.naturalWidth || 0;
    const nh = img.naturalHeight || 1;
    const ratio = nw / nh;
    const forced = img.dataset.stack === 'true' || img.closest('.lv-engine')?.dataset.stack === 'true';
    // Long sprites: wide or extreme aspect ratio
    return forced || nw >= 360 || ratio >= 18;
  }
  function syncScrollTrack(card, frame) {
    const hasScroll = frame.scrollWidth > frame.clientWidth;
    card.classList.toggle('has-scroll', hasScroll);
    if (hasScroll) {
      let track = card.querySelector('.lv-scroll-track');
      if (!track) {
        track = document.createElement('div');
        track.className = 'lv-scroll-track';
        const spacer = document.createElement('div');
        track.appendChild(spacer);
        frame.parentNode.insertBefore(track, frame);
        // Sync: track → image
        let syncingFromTrack = false;
        let syncingFromFrame = false;
        track.addEventListener('scroll', () => {
          if (syncingFromFrame) return;
          syncingFromTrack = true;
          frame.scrollLeft = track.scrollLeft;
          syncingFromTrack = false;
        });
        // Sync: image → track (wheel / touch on image)
        frame.addEventListener('scroll', () => {
          if (syncingFromTrack) return;
          syncingFromFrame = true;
          track.scrollLeft = frame.scrollLeft;
          syncingFromFrame = false;
        });
      }
      // Update spacer width to match content
      track.firstElementChild.style.width = frame.scrollWidth + 'px';
    } else {
      const track = card.querySelector('.lv-scroll-track');
      if (track) track.remove();
    }
  }

  window._lvAssessStack = function(card){
    const frame = card?.querySelector('.lv-imgframe');
    const img = frame?.querySelector('img');
    if(!img || !frame) return;
    // Stack when the sprite is explicitly large OR when the image actually overflows the frame
    const need = isStackNeeded(img) || (frame.scrollWidth > frame.clientWidth);
    card.classList.toggle('stack', need);
    // Clear any background-image — we now use the visible <img> with scroll
    frame.style.backgroundImage = '';
    // Detect if the image overflows and needs a scrollbar
    if (need) {
      requestAnimationFrame(() => {
        syncScrollTrack(card, frame);
      });
    } else {
      card.classList.remove('has-scroll');
      const track = card.querySelector('.lv-scroll-track');
      if (track) track.remove();
    }
  };
  function init(){
    document.querySelectorAll('.lv-engine').forEach(card => {
      const frame = card.querySelector('.lv-imgframe');
      const img = frame?.querySelector('img');
      if(!img) return;
      const assess = () => window._lvAssessStack(card);
      if (img.complete) assess(); else img.addEventListener('load', assess, { once: true });
    });
    // Re-evaluate scroll overflow on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.querySelectorAll('.lv-engine.stack').forEach(card => {
          const frame = card.querySelector('.lv-imgframe');
          if (frame) syncScrollTrack(card, frame);
        });
      }, 150);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Only run navbar transition & link interception on actual subpages
  // (not on the livrees host page which uses livrees-transition.js)
  if (document.querySelector('.lv-page') && !document.body.classList.contains('lv-host')) {
    // Navbar enter transition: start light, then transition to dark
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        document.body.classList.add('lv-entered');
      });
    });

    // Page fade-out transition when navigating away
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      // Skip anchors on the same page, javascript: links, and new-tab links
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank') return;
      e.preventDefault();
      document.body.classList.remove('lv-entered');
      document.body.classList.add('lv-leaving');
      setTimeout(function() {
        window.location.href = link.href;
      }, 350);
    });
  }
})();
