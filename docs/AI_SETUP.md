# Vynex AI setup

## Vercel environment variables

Add these server-side variables to the `vynex-studio` Vercel project for Production, Preview, and Development:

- `SUPABASE_URL=https://eumiicbuysfcsjdpxquc.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: copy the secret/service-role key from the Vynex Supabase project. Keep it server-only; never prefix it with `NEXT_PUBLIC_`.
- `GEMINI_MODEL`: the Gemini model identifier you choose.
- `GEMINI_API_TOKEN`: your Gemini API key. Keep it server-only.

The AI route returns a configuration error until the required server variables are present. Never commit real API keys to GitHub.

## Daily credits

The database enforces limits atomically, using the calendar day in `America/Sao_Paulo`:

| Plan | Credits per day |
| --- | ---: |
| Free | 3 |
| Plus | 15 |
| Pro | 50 |
| Studio | 300 |
| Verified Vynex admins | Unlimited |

Usage resets at midnight in Brasília. The AI endpoint requires a verified Google OAuth session or a valid GitHub OAuth session. Admin access is checked on the server using the two configured verified Google emails or the authenticated GitHub login `felpz566`.

## Assigning a plan

Subscriptions are not active in the current Vynex pricing page, so paid plans are not assigned automatically. Until billing is integrated, an administrator can assign a plan in the Supabase SQL editor. Use the account's verified email for Google sign-in or the GitHub login for GitHub sign-in:

```sql
insert into public.vynex_ai_plans (identity_key, plan)
values ('email:user@example.com', 'plus')
on conflict (identity_key)
do update set plan = excluded.plan, updated_at = now();
```

Allowed plan values are `free`, `plus`, `pro`, and `studio`. For a GitHub-only account, use `github:login` as the identity key. Do not grant client-side access to the plan, usage, or proposal tables; the server uses the service-role key and these tables intentionally have no client policies.

## AI approval flow

The AI creates a time-limited proposal and reviews its generated content in a second pass, retrying review/correction up to three passes when its own checks report failures. It does not write project files while generating the proposal. The user must approve the proposal, and the browser then updates the selected project's local draft. Users should still inspect the real editor preview and run their project's own tests; the review endpoint does not execute the project compiler or runtime.

For visual requests, the AI returns a validated `vynex-design.json` proposal and the interface shows a structural preview. This is not an automated screenshot-based visual inspection.


## GoatPay: créditos extras pagos

Configure estas variáveis server-side na Vercel (Production, Preview e Development):

- `GOATPAY_API_TOKEN`: chave de API `gp_live_...` da GoatPay.
- `GOATPAY_WEBHOOK_SECRET`: segredo `whsec_...` mostrado uma única vez ao cadastrar o webhook.

Nunca coloque essas chaves em variáveis `NEXT_PUBLIC_*` nem no GitHub.

### Endpoint do webhook

Cadastre na GoatPay a URL HTTPS:

`https://vynex-studio.vercel.app/api/webhooks/goatpay`

Eventos necessários: `payment.paid`. A rota valida `x-goatpay-signature` com HMAC-SHA256 sobre o corpo bruto, valida a referência externa e o valor da compra e credita o saldo de forma idempotente.

### Pacotes de créditos

- 10 créditos: R$ 19,90 (`credits_10`)
- 50 créditos: R$ 80,00 (`credits_50`)

O endpoint de compra é `POST /api/credits/purchase`. O saldo extra só aumenta após o webhook assinado confirmar o pagamento. Os créditos diários continuam separados e são consumidos primeiro; quando se esgotam, o endpoint de consumo usa automaticamente o saldo extra. Falhas na geração/revisão da IA devolvem o crédito à mesma fonte de onde foi consumido.

### Configuração no painel GoatPay

Cadastre o webhook para o evento `payment.paid`, copie o segredo `whsec_...` e salve-o como `GOATPAY_WEBHOOK_SECRET` na Vercel. Salve também a chave `gp_live_...` como `GOATPAY_API_TOKEN`. Depois de salvar as variáveis, faça redeploy da aplicação.
