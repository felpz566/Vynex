import { randomUUID } from 'node:crypto';
import { decryptCloudSession, CLOUD_SESSION_COOKIE } from '../../../../src/lib/cloud-session.js';
import { decryptSession, GITHUB_SESSION_COOKIE } from '../../../../src/lib/github-session.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PACKAGES = Object.freeze({
  credits_10: { credits: 10, amountCents: 1990, amount: 19.9, priceLabel: 'R$ 19,90' },
  credits_50: { credits: 50, amountCents: 8000, amount: 80, priceLabel: 'R$ 80,00' },
});
const ADMIN_EMAILS = new Set(['felipe.anastacio1904@gmail.com', 'felipinho.anastacio13@gmail.com']);

function identityFrom(request) {
  let google = null;
  let github = null;
  try { google = decryptCloudSession(request.cookies.get(CLOUD_SESSION_COOKIE)?.value); } catch {}
  try { github = decryptSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value); } catch {}
  if (!google && !github) return null;
  const email = google?.email?.trim().toLowerCase() || '';
  const login = github?.login?.trim().toLowerCase() || '';
  const identityKey = email ? 'email:' + email : 'github:' + login;
  if (identityKey.length <= 7) return null;
  return { identityKey, isAdmin: ADMIN_EMAILS.has(email) || login === 'felpz566' };
}

function dbConfig() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

async function db(path, { method = 'GET', body, prefer } = {}) {
  const config = dbConfig();
  if (!config) throw new Error('Supabase não está configurado no servidor.');
  const response = await fetch(config.url + '/rest/v1/' + path, {
    method,
    headers: {
      apikey: config.key,
      Authorization: 'Bearer ' + config.key,
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) throw new Error(data?.message || data?.hint || 'Falha ao acessar o banco de créditos.');
  return data;
}

export async function POST(request) {
  const identity = identityFrom(request);
  if (!identity) return Response.json({ error: 'Conecte sua conta Google ou GitHub antes de comprar créditos.' }, { status: 401 });
  if (identity.isAdmin) return Response.json({ error: 'A conta administradora já possui créditos de IA ilimitados.' }, { status: 400 });
  const token = process.env.GOATPAY_API_TOKEN;
  if (!token) return Response.json({ error: 'A GoatPay ainda não está configurada. Adicione GOATPAY_API_TOKEN na Vercel.' }, { status: 503 });
  if (!dbConfig()) return Response.json({ error: 'Supabase não está configurado no servidor.' }, { status: 503 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Envie JSON válido.' }, { status: 400 }); }
  const pack = PACKAGES[body?.packageId];
  if (!pack) return Response.json({ error: 'Pacote de créditos inválido.' }, { status: 400 });

  const externalReference = 'vynex-credit-' + randomUUID();
  let purchaseId;
  try {
    const rows = await db('vynex_ai_credit_purchases', {
      method: 'POST',
      body: [{
        identity_key: identity.identityKey,
        package_id: body.packageId,
        credits: pack.credits,
        amount_cents: pack.amountCents,
        external_reference: externalReference,
        status: 'pending',
      }],
      prefer: 'return=representation',
    });
    purchaseId = rows?.[0]?.id;
    if (!purchaseId) throw new Error('O banco não confirmou a criação do pedido.');

    const response = await fetch('https://api.goatpay.com.br/v1/payment-pix/create', {
      method: 'POST',
      headers: { 'X-API-Key': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: pack.amount,
        description: 'Vynex AI - ' + pack.credits + ' créditos extras',
        externalReference,
        expirationSeconds: 86400,
        coverFee: false,
        emitFiscalInvoice: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success !== true || !payload?.data?.id) {
      await db('vynex_ai_credit_purchases?id=eq.' + encodeURIComponent(purchaseId), {
        method: 'PATCH', body: { status: 'failed', updated_at: new Date().toISOString() },
      }).catch(() => {});
      return Response.json({ error: payload?.message || 'A GoatPay não conseguiu criar a cobrança PIX.' }, { status: response.status >= 400 && response.status < 500 ? 400 : 502 });
    }

    await db('vynex_ai_credit_purchases?id=eq.' + encodeURIComponent(purchaseId), {
      method: 'PATCH',
      body: { payment_id: String(payload.data.id), updated_at: new Date().toISOString() },
    });

    return Response.json({
      purchase: {
        id: purchaseId,
        credits: pack.credits,
        priceLabel: pack.priceLabel,
        status: 'pending',
        paymentId: payload.data.id,
        copyPaste: payload.data.copyPaste || '',
        qrCodeBase64: payload.data.qrCodeBase64 || '',
        qrcodeUrl: payload.data.qrcodeUrl || '',
        expiresAt: payload.data.expiresAt || null,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (purchaseId) {
      await db('vynex_ai_credit_purchases?id=eq.' + encodeURIComponent(purchaseId), {
        method: 'PATCH', body: { status: 'failed', updated_at: new Date().toISOString() },
      }).catch(() => {});
    }
    return Response.json({ error: String(error.message || 'Não foi possível criar a cobrança.').slice(0, 500) }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
