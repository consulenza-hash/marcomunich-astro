document.addEventListener('DOMContentLoaded', function () {
  const KEY = 'mm_admin_ok';
  const PWD = 'QXSuH7$UfwYG';

  if (localStorage.getItem(KEY) === '1') return;

  // Overlay password
  document.documentElement.style.visibility = 'hidden';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:sans-serif;';
  overlay.innerHTML = `
    <div style="background:#1e293b;padding:2rem;border-radius:12px;width:320px;text-align:center;">
      <div style="color:#94a3b8;font-size:.85rem;margin-bottom:.5rem;">marcomunich.com</div>
      <h2 style="color:#f1f5f9;margin:0 0 1.5rem;font-size:1.2rem;">Area admin</h2>
      <input id="mm-pwd" type="password" placeholder="Password" autofocus
        style="width:100%;box-sizing:border-box;padding:.75rem 1rem;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:1rem;margin-bottom:.75rem;">
      <div id="mm-err" style="color:#f87171;font-size:.85rem;margin-bottom:.75rem;display:none;">Password errata</div>
      <button id="mm-btn"
        style="width:100%;padding:.75rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
        Accedi
      </button>
    </div>`;
  document.body.appendChild(overlay);
  document.documentElement.style.visibility = '';

  function attempt() {
    const val = document.getElementById('mm-pwd').value;
    if (val === PWD) {
      localStorage.setItem(KEY, '1');
      overlay.remove();
    } else {
      document.getElementById('mm-err').style.display = 'block';
      document.getElementById('mm-pwd').value = '';
      document.getElementById('mm-pwd').focus();
    }
  }

  document.getElementById('mm-btn').addEventListener('click', attempt);
  document.getElementById('mm-pwd').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') attempt();
  });
});
