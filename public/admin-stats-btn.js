// Floating button "Statistiche" visibile solo su /keystatic
(function() {
  if (!window.location.pathname.startsWith('/keystatic')) return;

  function addBtn() {
    if (document.getElementById('mm-stats-btn')) return;
    const btn = document.createElement('a');
    btn.id = 'mm-stats-btn';
    btn.href = '/admin/statistiche';
    btn.title = 'Statistiche sito';
    btn.innerHTML = '📊';
    btn.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
      'background:#6366f1', 'color:#fff', 'border-radius:50%',
      'width:48px', 'height:48px', 'display:flex', 'align-items:center',
      'justify-content:center', 'font-size:22px', 'text-decoration:none',
      'box-shadow:0 4px 14px rgba(99,102,241,.5)', 'transition:transform .2s'
    ].join(';');
    btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    document.body.appendChild(btn);
  }

  // Aspetta che il body sia pronto e riprova su ogni navigazione SPA
  const observer = new MutationObserver(addBtn);
  document.addEventListener('DOMContentLoaded', () => {
    addBtn();
    observer.observe(document.body, { childList: true, subtree: true });
  });
  if (document.readyState !== 'loading') addBtn();
})();
