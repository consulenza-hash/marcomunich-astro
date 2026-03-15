// Floating "Edita con AI" button — visibile solo sulle pagine articolo in Keystatic
(function () {
  if (!window.location.pathname.startsWith('/keystatic')) return;

  const MODI = [
    { label: '🚀 Tutto completo',  modo: 'tutto-completo'  },
    { label: '📝 Solo articolo',   modo: 'solo-articolo'   },
    { label: '🏷️ Solo metadati',  modo: 'solo-metadati'   },
  ];

  function getSlug() {
    // Keystatic SPA: /keystatic/branch/main/collections/articoli/item/SLUG
    const m = window.location.pathname.match(/\/collections\/articoli\/item\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function removeExisting() {
    document.getElementById('mm-ai-btn')?.remove();
    document.getElementById('mm-ai-menu')?.remove();
  }

  function buildMenu(slug) {
    const menu = document.createElement('div');
    menu.id = 'mm-ai-menu';
    Object.assign(menu.style, {
      position: 'fixed',
      bottom: '84px',
      right: '24px',
      zIndex: '99998',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '6px',
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      display: 'none',
      flexDirection: 'column',
      gap: '2px',
      minWidth: '190px',
    });

    MODI.forEach(({ label, modo }) => {
      const a = document.createElement('a');
      a.href = `/admin/genera?slug=${encodeURIComponent(slug)}&modo=${modo}&autostart=1`;
      a.textContent = label;
      a.title = `Apre il Generatore AI con questo articolo pre-selezionato`;
      Object.assign(a.style, {
        color: '#e2e8f0',
        textDecoration: 'none',
        padding: '9px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'block',
        transition: 'background .15s',
        fontFamily: 'system-ui, sans-serif',
      });
      a.onmouseenter = () => (a.style.background = '#334155');
      a.onmouseleave = () => (a.style.background = 'transparent');
      menu.appendChild(a);
    });

    // Separatore + label
    const label = document.createElement('div');
    Object.assign(label.style, {
      fontSize: '10px',
      color: '#475569',
      padding: '6px 14px 4px',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      fontFamily: 'system-ui, sans-serif',
    });
    label.textContent = slug.replace(/-/g, ' ');
    menu.insertBefore(label, menu.firstChild);

    return menu;
  }

  function addBtn() {
    removeExisting();

    const slug = getSlug();
    if (!slug) return; // solo sulle pagine articolo (/item/SLUG)

    // Menu
    const menu = buildMenu(slug);
    document.body.appendChild(menu);

    // Bottone principale
    const btn = document.createElement('button');
    btn.id = 'mm-ai-btn';
    btn.innerHTML = '🤖';
    btn.title = 'Edita con AI';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '80px',
      right: '24px',
      zIndex: '99999',
      background: '#7c3aed',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(124,58,237,.55)',
      transition: 'transform .2s, box-shadow .2s',
    });
    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 6px 20px rgba(124,58,237,.7)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 14px rgba(124,58,237,.55)';
    };

    let menuOpen = false;
    btn.onclick = (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      menu.style.display = menuOpen ? 'flex' : 'none';
    };

    document.addEventListener('click', () => {
      if (menuOpen) {
        menuOpen = false;
        menu.style.display = 'none';
      }
    });

    document.body.appendChild(btn);
  }

  // Rilancia ad ogni navigazione SPA (Keystatic è una SPA con client-side routing)
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    const current = window.location.pathname;
    if (current !== lastPath) {
      lastPath = current;
      addBtn();
    }
  });

  function init() {
    addBtn();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
