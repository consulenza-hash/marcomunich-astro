import type { APIRoute } from 'astro';

export const prerender = false;

const REPO = 'consulenza-hash/marcomunich-astro';
const FILE_PATH = 'src/data/clienti.json';
const BRANCH = 'main';
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function checkAuth(request: Request): Response | null {
  const cookie = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }
  return null;
}

function ghHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'marcomunich-astro',
  };
}

interface ClienteHistoryEntry {
  data: string;
  azione: string;
}

interface Cliente {
  id: string;
  [key: string]: unknown;
  storico?: ClienteHistoryEntry[];
}

interface GHFileResponse {
  content: string;
  sha: string;
}

async function fetchClienti(): Promise<{ clienti: Cliente[]; sha: string }> {
  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!ghToken) throw new Error('GITHUB_TOKEN mancante');

  const res = await fetch(`${API_URL}?ref=${BRANCH}`, { headers: ghHeaders() });

  if (!res.ok) {
    if (res.status === 404) {
      return { clienti: [], sha: '' };
    }
    throw new Error(`GitHub GET fallito: ${res.status}`);
  }

  const data = await res.json() as GHFileResponse;
  const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  const clienti = JSON.parse(decoded) as Cliente[];
  return { clienti, sha: data.sha };
}

async function saveClienti(clienti: Cliente[], sha: string, message: string): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(clienti, null, 2), 'utf-8').toString('base64');

  const payload: Record<string, string> = {
    message,
    content: encoded,
    branch: BRANCH,
  };
  if (sha) payload.sha = sha;

  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub PUT fallito: ${res.status} — ${body}`);
  }
}

// GET — Read all clients
export const GET: APIRoute = async ({ request }) => {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  try {
    const { clienti } = await fetchClienti();
    return new Response(JSON.stringify(clienti), { status: 200, headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
};

// POST — Create, update, or add_note
export const POST: APIRoute = async ({ request }) => {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json() as {
      action: string;
      cliente?: Cliente;
      id?: string;
      nota?: string;
    };
    const { action } = body;

    if (action === 'create') {
      if (!body.cliente) {
        return new Response(JSON.stringify({ error: 'Campo cliente mancante' }), { status: 400, headers });
      }
      const { clienti, sha } = await fetchClienti();
      const nuovo: Cliente = { ...body.cliente, id: crypto.randomUUID() };
      clienti.push(nuovo);
      await saveClienti(clienti, sha, `Nuovo cliente: ${nuovo.id}`);
      return new Response(JSON.stringify(nuovo), { status: 201, headers });
    }

    if (action === 'update') {
      if (!body.cliente || !body.cliente.id) {
        return new Response(JSON.stringify({ error: 'Campo cliente con id mancante' }), { status: 400, headers });
      }
      const { clienti, sha } = await fetchClienti();
      const idx = clienti.findIndex(c => c.id === body.cliente!.id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Cliente non trovato' }), { status: 404, headers });
      }
      clienti[idx] = { ...clienti[idx], ...body.cliente };
      await saveClienti(clienti, sha, `Aggiornato cliente: ${body.cliente.id}`);
      return new Response(JSON.stringify(clienti[idx]), { status: 200, headers });
    }

    if (action === 'add_note') {
      if (!body.id || !body.nota) {
        return new Response(JSON.stringify({ error: 'Campi id e nota richiesti' }), { status: 400, headers });
      }
      const { clienti, sha } = await fetchClienti();
      const cliente = clienti.find(c => c.id === body.id);
      if (!cliente) {
        return new Response(JSON.stringify({ error: 'Cliente non trovato' }), { status: 404, headers });
      }
      if (!Array.isArray(cliente.storico)) {
        cliente.storico = [];
      }
      cliente.storico.push({
        data: new Date().toISOString().split('T')[0],
        azione: body.nota,
      });
      await saveClienti(clienti, sha, `Nota aggiunta a cliente: ${body.id}`);
      return new Response(JSON.stringify(cliente), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: `Azione non valida: ${action}` }), { status: 400, headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
};

// DELETE — Remove a client
export const DELETE: APIRoute = async ({ request }) => {
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json() as { action: string; id: string };

    if (body.action !== 'delete' || !body.id) {
      return new Response(JSON.stringify({ error: 'Campi action:"delete" e id richiesti' }), { status: 400, headers });
    }

    const { clienti, sha } = await fetchClienti();
    const filtered = clienti.filter(c => c.id !== body.id);

    if (filtered.length === clienti.length) {
      return new Response(JSON.stringify({ error: 'Cliente non trovato' }), { status: 404, headers });
    }

    await saveClienti(filtered, sha, `Rimosso cliente: ${body.id}`);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
};
