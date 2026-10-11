import { createHmac, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dbConfig() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

async function rpc(path, body) {
  const config = dbConfig();
  if (!config) throw new Error('Supabase não está configurado no servidor.');
  const response = await fetch(config.url + '/rest/v1/rpc/' + path, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: 'Bearer ' + config.key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) throw new Error(data?.message || data?.hint || 'Falha ao processar o pagamento confirmado.');
  return data;
}

function validSignature(rawBody, signature, secret) {
  if (!signature?.startsWith('sha256=')) return false;
  const suppliedHex = signature.slice(7);
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const supplied = Buffer.from(suppliedHex, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request) {
  const secret = process.env.GOATPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'Webhook GoatPay não configurado.' }, { status: 503 });
  if (!dbConfig()) return Response.json({ error: 'Supabase não está configurado.' }, { status: 503 });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 1024 * 1024) return Response.json({ error: 'Payload muito grande.' }, { status: 413 });
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (rawBody.length > 1024 * 1024) return Response.json({ error: 'Payload muito grande.' }, { status: 413 });

  const signature = request.headers.get('x-goatpay-signature') || '';
  if (!validSignature(rawBody, signature, secret)) {
    return Response.json({ error: 'Assinatura do webhook inválida.' }, { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody.toString('utf8')); } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const headerEvent = request.headers.get('x-goatpay-event');
  if (headerEvent && event?.event !== headerEvent) {
    return Response.json({ error: 'Evento do header não corresponde ao payload.' }, { status: 400 });
  }

  if (event?.event !== 'payment.paid') {
    return Response.json({ received: true, ignored: true }, { status: 200 });
  }

  const data = event?.data || {};
  if (data.type !== 'PIX_IN' || data.status !== 'COMPLETED') {
    return Response.json({ received: true, ignored: true }, { status: 200 });
  }
  const externalReference = typeof data.externalReference === 'string' ? data.externalReference : '';
  const paymentId = typeof data.id === 'string' ? data.id : '';
  const amount = Number(data.amount);
  if (!externalReference || !paymentId || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ received: true, ignored: true, reason: 'missing_payment_fields' }, { status: 200 });
  }

  try {
    const result = await rpc('vynex_credit_goatpay_purchase', {
      p_external_reference: externalReference,
      p_payment_id: paymentId,
      p_amount_cents: Math.round(amount * 100),
    });
    return Response.json({ received: true, ...result }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Erro temporário ao registrar o pagamento.' }, { status: 503, headers: { 'Retry-After': '60' } });
  }
}
