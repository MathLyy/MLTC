// Simple burger menu toggle
(function(){
  const navbars = document.querySelectorAll('.navbar');
  navbars.forEach(nb => {
    if(nb.querySelector('.burger-toggle')) return; // already done
    const btn = document.createElement('button');
    btn.className = 'burger-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label','Menu');
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML = '\u2630'; // ☰
    const links = nb.querySelector('.nav-links');
    if(!links) return;
    nb.insertBefore(btn, links); // place before list
    btn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true':'false');
    });
    // Close on link click (mobile UX)
    links.addEventListener('click', e => {
      if(e.target.tagName === 'A' && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      }
    });
    // Close on outside click
    document.addEventListener('click', e => {
      if(!nb.contains(e.target) && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      }
    });
  });
})();
