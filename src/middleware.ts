import { defineMiddleware } from 'astro:middleware';

const ADMIN_GUARD_SCRIPT = `<script>
(function(){
  var KEY='mm_admin_ok';
  var PWD='QXSuH7$UfwYG';
  var stored; try{stored=localStorage.getItem(KEY);}catch(e){stored='ERROR:'+e;}
  console.log('[ADMIN-GUARD] localStorage key='+KEY+' value='+stored);
  if(stored==='1')return;
  document.documentElement.style.visibility='hidden';
  function show(){
    var o=document.createElement('div');
    o.id='mm-overlay';
    o.style.cssText='position:fixed;inset:0;background:#0f172a;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:sans-serif;';
    o.innerHTML='<div style="background:#1e293b;padding:2rem;border-radius:12px;width:320px;text-align:center;">'
      +'<div style="color:#94a3b8;font-size:.85rem;margin-bottom:.5rem;">marcomunich.com</div>'
      +'<h2 style="color:#f1f5f9;margin:0 0 1.5rem;font-size:1.2rem;">Area admin</h2>'
      +'<input id="mm-p" type="password" placeholder="Password" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:.75rem 1rem;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:1rem;margin-bottom:.75rem;">'
      +'<div id="mm-e" style="color:#f87171;font-size:.85rem;margin-bottom:.75rem;display:none;">Password errata</div>'
      +'<button id="mm-b" style="width:100%;padding:.75rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">Accedi</button>'
      +'</div>';
    document.body.appendChild(o);
    document.documentElement.style.visibility='';
    setTimeout(function(){var p=document.getElementById('mm-p');if(p)p.focus();},50);
    function go(){
      var v=document.getElementById('mm-p').value;
      if(v===PWD){var err=null;try{localStorage.setItem(KEY,'1');}catch(e){err=e;}console.log('[ADMIN-GUARD] setItem result, error='+err+' readback='+localStorage.getItem(KEY));document.getElementById('mm-overlay').remove();}
      else{document.getElementById('mm-e').style.display='block';document.getElementById('mm-p').value='';document.getElementById('mm-p').focus();}
    }
    document.getElementById('mm-b').addEventListener('click',go);
    document.getElementById('mm-p').addEventListener('keydown',function(e){if(e.key==='Enter')go();});
  }
  if(document.body){show();}else{document.addEventListener('DOMContentLoaded',show);}
})();
</script>`;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = ctx.url;
  const response = await next();
  const ct = response.headers.get('content-type') ?? '';
  if (!ct.includes('text/html')) return response;

  const isAdmin = url.pathname.startsWith('/admin') && url.pathname !== '/admin/login';
  const isKeystatic = url.pathname.startsWith('/keystatic');

  if (!isAdmin && !isKeystatic) return response;

  const html = await response.text();
  let patched = html;

  if (isAdmin) {
    patched = patched.includes('</body>')
      ? patched.replace('</body>', `${ADMIN_GUARD_SCRIPT}</body>`)
      : patched + ADMIN_GUARD_SCRIPT;
  }

  if (isKeystatic) {
    const scripts = `<script src="/admin-stats-btn.js"></script><script src="/admin-ai-btn.js"></script>`;
    patched = patched.includes('</body>')
      ? patched.replace('</body>', `${scripts}</body>`)
      : patched + scripts;
  }

  return new Response(patched, { status: response.status, headers: response.headers });
});
