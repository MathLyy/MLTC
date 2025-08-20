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
  window._lvAssessStack = function(card){
    const frame = card?.querySelector('.lv-imgframe');
    const img = frame?.querySelector('img');
    if(!img || !frame) return;
    const need = isStackNeeded(img);
    card.classList.toggle('stack', need);
    // Sync background when stacked
    if (need) {
      const src = img.getAttribute('src');
      frame.style.backgroundImage = src ? `url("${src}")` : '';
    } else {
      frame.style.backgroundImage = '';
    }
  };
  function init(){
    document.querySelectorAll('.lv-engine').forEach(card => {
      const frame = card.querySelector('.lv-imgframe');
      const img = frame?.querySelector('img');
      if(!img) return;
      const assess = () => window._lvAssessStack(card);
      // Keep background in sync on load too
      img.addEventListener('load', () => {
        if (card.classList.contains('stack')) {
          const src = img.getAttribute('src');
          frame.style.backgroundImage = src ? `url("${src}")` : '';
        }
      });
      if (img.complete) assess(); else img.addEventListener('load', assess, { once: true });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
