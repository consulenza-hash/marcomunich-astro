/**
 * analytics.ts
 * Fetch dati da GA4 Data API + Google Search Console API
 * usando un Service Account Google (JWT auth, no OAuth interattivo).
 *
 * Env vars richieste (Vercel):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — JSON del service account (o base64 del JSON)
 *   GA4_PROPERTY_ID              — ID numerico proprietà GA4 (es. "123456789")
 *   GSC_SITE_URL                 — URL sito Search Console (es. "https://marcomunich.com/")
 */

import crypto from 'node:crypto';

// ── JWT / Token ──────────────────────────────────────────────────────────────

interface TokenCache { token: string; exp: number }
const _cache: Record<string, TokenCache> = {};

async function getAccessToken(saJson: string, scopes: string[]): Promise<string> {
  const key = scopes.join(',');
  const now = Math.floor(Date.now() / 1000);
  if (_cache[key] && _cache[key].exp > now + 60) return _cache[key].token;

  const sa = JSON.parse(saJson);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const signer = crypto.createSign('RSA-SHA256');
  signer.write(`${header}.${payload}`);
  signer.end();
  const sig = signer.sign(sa.private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${sig}`,
    }),
  });
  if (!res.ok) throw new Error(`Google auth error: ${await res.text()}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  _cache[key] = { token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSaJson(): string {
  const raw = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '';
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON mancante');
  // Supporta JSON diretto o base64
  try { JSON.parse(raw); return raw; } catch { return Buffer.from(raw, 'base64').toString('utf8'); }
}

async function ga4(propertyId: string, token: string, body: object): Promise<any> {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!r.ok) throw new Error(`GA4 ${r.status}: ${await r.text()}`);
  return r.json();
}

async function gsc(siteUrl: string, token: string, body: object): Promise<any> {
  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!r.ok) throw new Error(`GSC ${r.status}: ${await r.text()}`);
  return r.json();
}

const mV = (row: any, i: number) => parseFloat(row?.metricValues?.[i]?.value ?? '0') || 0;
const dV = (row: any, i: number) => row?.dimensionValues?.[i]?.value ?? '';
const delta = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

// ── Types ────────────────────────────────────────────────────────────────────

export interface StatsOverview {
  sessions: number;      sessionsDelta: number;
  users: number;         usersDelta: number;
  pageviews: number;     pageviewsDelta: number;
  avgDuration: number;   // secondi
  bounceRate: number;    // 0-100
}
export interface DailyPoint  { date: string; sessions: number }
export interface TopPage     { path: string; pageviews: number; users: number }
export interface TrafficSrc  { channel: string; sessions: number; pct: number }
export interface Keyword     { query: string; clicks: number; impressions: number; ctr: number; position: number }
export interface GscPage     { page: string; clicks: number; impressions: number }

export interface AnalyticsData {
  overview:    StatsOverview;
  daily:       DailyPoint[];
  topPages:    TopPage[];
  sources:     TrafficSrc[];
  keywords:    Keyword[];
  gscPages:    GscPage[];
  period:      { start: string; end: string };
  gscPeriod:   { start: string; end: string };
}

// ── Main fetch ────────────────────────────────────────────────────────────────

/**
 * @param days  Numero di giorni (7|14|30|90|180|0=sempre). Ignorato se from+to forniti.
 * @param from  Data inizio custom YYYY-MM-DD (opzionale)
 * @param to    Data fine custom YYYY-MM-DD (opzionale)
 */
export async function fetchAnalyticsData(days = 30, from?: string, to?: string): Promise<AnalyticsData> {
  const saJson      = getSaJson();
  const propertyId  = import.meta.env.GA4_PROPERTY_ID ?? '';
  const siteUrl     = import.meta.env.GSC_SITE_URL ?? 'https://marcomunich.com/';
  if (!propertyId)  throw new Error('GA4_PROPERTY_ID mancante');

  const GA4_SCOPE = ['https://www.googleapis.com/auth/analytics.readonly'];
  const GSC_SCOPE = ['https://www.googleapis.com/auth/webmasters.readonly'];

  const [ga4Token, gscToken] = await Promise.all([
    getAccessToken(saJson, GA4_SCOPE),
    getAccessToken(saJson, GSC_SCOPE),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Determina il range GA4
  let startDate: string;
  let endDate = 'today';
  let prevDays: number;

  if (from && to) {
    // Intervallo custom
    startDate = from;
    endDate   = to;
    const ms  = new Date(to).getTime() - new Date(from).getTime();
    prevDays  = Math.max(1, Math.round(ms / 86400_000));
  } else if (days === 0) {
    // Sempre — dal lancio GA4 (2020-01-01) a oggi
    startDate = '2020-01-01';
    prevDays  = 365;
  } else {
    startDate = `${days}daysAgo`;
    prevDays  = days;
  }

  // Periodo precedente (per delta): stessa ampiezza, subito prima
  let prevStart: string;
  let prevEnd: string;
  if (from && to) {
    const ms     = new Date(to).getTime() - new Date(from).getTime();
    const prev2  = new Date(new Date(from).getTime() - ms - 86400_000);
    const prev1  = new Date(new Date(from).getTime() - 86400_000);
    prevStart    = prev2.toISOString().split('T')[0];
    prevEnd      = prev1.toISOString().split('T')[0];
  } else if (days === 0) {
    prevStart = '2018-01-01'; prevEnd = '2019-12-31';
  } else {
    prevStart = `${prevDays * 2}daysAgo`;
    prevEnd   = `${prevDays + 1}daysAgo`;
  }

  // GSC ha 3gg di ritardo; usa lo stesso intervallo (max 16 mesi indietro)
  const gscEndDate   = new Date(Date.now() - 3 * 86400_000).toISOString().split('T')[0];
  const gscMinDate   = new Date(Date.now() - 480 * 86400_000).toISOString().split('T')[0]; // ~16 mesi
  let   gscStartDate: string;
  if (from) {
    gscStartDate = from < gscMinDate ? gscMinDate : from;
  } else if (days === 0) {
    gscStartDate = gscMinDate;
  } else {
    const d = new Date(Date.now() - prevDays * 86400_000).toISOString().split('T')[0];
    gscStartDate = d < gscMinDate ? gscMinDate : d;
  }

  // Alias per compatibilità con il codice sotto
  const gscEnd   = gscEndDate;
  const gscStart = gscStartDate;

  const [rCur, rPrev, rDaily, rPages, rSources, rKeywords, rGscPages] = await Promise.all([
    ga4(propertyId, ga4Token, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' },
        { name: 'averageSessionDuration' }, { name: 'bounceRate' },
      ],
    }),
    ga4(propertyId, ga4Token, {
      dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
    }),
    ga4(propertyId, ga4Token, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    ga4(propertyId, ga4Token, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 15,
    }),
    ga4(propertyId, ga4Token, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    gsc(siteUrl, gscToken, {
      startDate: gscStart, endDate: gscEnd,
      dimensions: ['query'], rowLimit: 25,
      orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    }),
    gsc(siteUrl, gscToken, {
      startDate: gscStart, endDate: gscEnd,
      dimensions: ['page'], rowLimit: 10,
      orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    }),
  ]);

  // Overview
  const curTot  = rCur.totals?.[0]  ?? rCur.rows?.[0];
  const prevTot = rPrev.totals?.[0] ?? rPrev.rows?.[0];
  const overview: StatsOverview = {
    sessions:      Math.round(mV(curTot, 0)),
    sessionsDelta: delta(mV(curTot, 0), mV(prevTot, 0)),
    users:         Math.round(mV(curTot, 1)),
    usersDelta:    delta(mV(curTot, 1), mV(prevTot, 1)),
    pageviews:     Math.round(mV(curTot, 2)),
    pageviewsDelta:delta(mV(curTot, 2), mV(prevTot, 2)),
    avgDuration:   Math.round(mV(curTot, 3)),
    bounceRate:    Math.round(mV(curTot, 4) * 100 * 10) / 10,
  };

  // Daily
  const daily: DailyPoint[] = (rDaily.rows ?? []).map((r: any) => ({
    date: dV(r, 0),
    sessions: Math.round(mV(r, 0)),
  }));

  // Top pages
  const topPages: TopPage[] = (rPages.rows ?? []).map((r: any) => ({
    path: dV(r, 0), pageviews: Math.round(mV(r, 0)), users: Math.round(mV(r, 1)),
  }));

  // Sources
  const totalSess = (rSources.rows ?? []).reduce((s: number, r: any) => s + mV(r, 0), 0);
  const sources: TrafficSrc[] = (rSources.rows ?? []).map((r: any) => {
    const s = Math.round(mV(r, 0));
    return { channel: dV(r, 0), sessions: s, pct: totalSess > 0 ? Math.round(s / totalSess * 100) : 0 };
  });

  // Keywords
  const keywords: Keyword[] = (rKeywords.rows ?? []).map((r: any) => ({
    query: r.keys?.[0] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: Math.round((r.ctr ?? 0) * 1000) / 10,
    position: Math.round((r.position ?? 0) * 10) / 10,
  }));

  // GSC pages
  const gscPages: GscPage[] = (rGscPages.rows ?? []).map((r: any) => ({
    page: r.keys?.[0] ?? '', clicks: r.clicks ?? 0, impressions: r.impressions ?? 0,
  }));

  const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtShort = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

  // Determina le date di inizio/fine effettive per la label
  let periodStartD: Date;
  let periodEndD:   Date;
  if (from && to) {
    periodStartD = new Date(from); periodEndD = new Date(to);
  } else if (days === 0) {
    periodStartD = new Date('2020-01-01'); periodEndD = new Date();
  } else {
    periodEndD   = new Date();
    periodStartD = new Date(periodEndD.getTime() - days * 86400_000);
  }

  return {
    overview, daily, topPages, sources, keywords, gscPages,
    period:    { start: fmt(periodStartD), end: fmt(periodEndD) },
    gscPeriod: { start: fmtShort(new Date(gscStart)), end: fmtShort(new Date(gscEnd)) },
  };
}
