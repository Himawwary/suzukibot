const PRODUCTS = Object.freeze({
  docinhos_10000: { name: "10.000 docinhos", amountCents: 1099, kind: "docinhos", quantity: 10000 },
  docinhos_1000: { name: "1.000 docinhos", amountCents: 399, kind: "docinhos", quantity: 1000 },
  cores_perfil: { name: "Cores perfil", amountCents: 399, kind: "profile_colors", quantity: 1 },
  balinhas_30: { name: "30 balinhas", amountCents: 499, kind: "balinhas", quantity: 30 },
});

const DISCORD_API = "https://discord.com/api/v10";
const MP_API = "https://api.mercadopago.com";
const SESSION_COOKIE = "suzuki_store_session";
const SESSION_SECONDS = 12 * 60 * 60;

function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
}

function page(title, body) {
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(title)} · Suzuki</title><style>
    *{box-sizing:border-box}body{margin:0;padding:22px;background:linear-gradient(135deg,#a7ef55,#ffa9cf);font:700 17px system-ui;color:#2f7a50;min-height:100vh}.card{width:min(850px,100%);margin:20px auto;padding:26px;border:4px solid #2f7a50;border-radius:28px;background:#fff5cf;box-shadow:8px 8px #ffa9cf}h1{margin:0 0 8px;color:#2f7a50}h2{color:#2f7a50}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:18px 0}.item{padding:18px;border:3px solid #2f7a50;border-radius:22px;background:linear-gradient(145deg,#fff18b,#c9ff77);box-shadow:5px 5px #ffa9cf}.item:nth-child(even){background:linear-gradient(145deg,#ffa9cf,#fff18b)}.price{display:inline-block;padding:8px 12px;border:2px solid #2f7a50;border-radius:13px;background:#fff}.button,button{display:inline-block;margin:8px 8px 0 0;padding:12px 16px;border-radius:15px;background:#8ee84f;color:#2f7a50;text-decoration:none;font-weight:900;border:2px solid #2f7a50;font:inherit;cursor:pointer}.secondary{background:#ffa9cf}input{width:min(420px,100%);padding:13px;border:2px solid #2f7a50;border-radius:12px;font:inherit}.row{margin:12px 0;padding:16px;border:2px solid #2f7a50;border-radius:16px;background:#fff}.muted{opacity:.75;font-size:14px}.qr{display:block;max-width:240px;margin:18px auto;border-radius:12px}.copy{overflow-wrap:anywhere;padding:14px;border-radius:12px;background:#fff;font:14px monospace}.notice{padding:14px;border:2px dashed #2f7a50;border-radius:14px;background:#fff18b}.back{display:inline-flex;margin:0 0 18px;color:#2f7a50}.hidden{display:none!important}
  </style><body><main class="card"><a class="back" href="https://himawwary.github.io/suzukibot/#loja">← Voltar para a Loja</a><h1>🌸 Suzuki Bot</h1><h2>${html(title)}</h2>${body}</main></body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer" },
  });
}

function nowSeconds() { return Math.floor(Date.now() / 1000); }

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(left, right) {
  const a = new TextEncoder().encode(String(left ?? ""));
  const b = new TextEncoder().encode(String(right ?? ""));
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function requestOrigin(request) { return new URL(request.url).origin; }
function oauthRedirect(request) { return `${requestOrigin(request)}/auth/callback`; }

async function getSession(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const tokenHash = await sha256Hex(decodeURIComponent(token));
  const session = await env.DB.prepare("SELECT discord_user_id, discord_username FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(tokenHash, nowSeconds()).first();
  return session || null;
}

function productCard(id, product, selected) {
  const action = `/loja?produto=${encodeURIComponent(id)}`;
  return `<article class="item"><div style="font-size:34px">${product.kind === "docinhos" ? "🍬" : product.kind === "balinhas" ? "🍭" : "🎨"}</div><h3>${html(product.name)}</h3><p class="price">R$ ${(product.amountCents / 100).toFixed(2).replace(".", ",")}</p><br><a class="button" href="${action}">${selected ? "Selecionado" : "Escolher"}</a></article>`;
}

async function shopPage(request, env) {
  const url = new URL(request.url);
  const selectedId = url.searchParams.get("produto") || "";
  const selected = PRODUCTS[selectedId] ? selectedId : "";
  const user = await getSession(request, env);
  if (!selected) {
    const cards = Object.entries(PRODUCTS).map(([id, product]) => productCard(id, product, false)).join("");
    return page("Loja Premium", `<p>Escolha um item. O pagamento é feito por Pix e a entrega acontece após a confirmação.</p><div class="grid">${cards}</div><p class="muted">A conta Discord é usada para entregar a compra no perfil correto da Suzuki.</p>`);
  }
  const product = PRODUCTS[selected];
  if (!user) {
    const login = `/auth/start?produto=${encodeURIComponent(selected)}`;
    return page(product.name, `<p>Valor: <strong>R$ ${(product.amountCents / 100).toFixed(2).replace(".", ",")}</strong></p><p>Entre com sua conta Discord para vincular a compra ao seu perfil.</p><a class="button" href="${login}">🔐 Entrar com Discord</a>`);
  }
  const userName = html(user.discord_username);
  return page(`Comprar ${product.name}`, `<p>Conta: <strong>${userName}</strong></p><p>Item: <strong>${html(product.name)}</strong> · <strong>R$ ${(product.amountCents / 100).toFixed(2).replace(".", ",")}</strong></p><label for="email">E-mail para identificar o pagamento no Mercado Pago</label><br><input id="email" type="email" autocomplete="email" maxlength="254" required placeholder="voce@exemplo.com"><br><button id="pay">Gerar Pix</button><p id="message" class="notice hidden" role="status"></p><section id="payment" class="hidden"><img id="qr" class="qr hidden" alt="QR Code Pix"><div id="copy" class="copy hidden"></div><button id="copy-button" class="secondary hidden">Copiar Pix</button><p id="state" class="notice">Aguardando pagamento…</p></section><script>
    const productId=${JSON.stringify(selected)};const btn=document.getElementById("pay");const message=document.getElementById("message");const payment=document.getElementById("payment");let timer=null;
    btn.addEventListener("click",async()=>{btn.disabled=true;message.classList.add("hidden");try{const email=document.getElementById("email").value.trim();const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,email})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Não consegui gerar o Pix.");payment.classList.remove("hidden");document.getElementById("copy").textContent=data.pixCode;document.getElementById("copy").classList.remove("hidden");const qr=document.getElementById("qr");if(data.qrBase64&&/^[A-Za-z0-9+/=]+$/.test(data.qrBase64)){qr.src="data:image/png;base64,"+data.qrBase64;qr.classList.remove("hidden")}const copy=document.getElementById("copy-button");copy.classList.remove("hidden");copy.onclick=()=>navigator.clipboard.writeText(data.pixCode);timer=setInterval(()=>refresh(data.orderId),4000);await refresh(data.orderId)}catch(error){message.textContent=error.message;message.classList.remove("hidden")}finally{btn.disabled=false}});
    async function refresh(id){try{const response=await fetch("/api/orders/"+encodeURIComponent(id),{cache:"no-store"});const data=await response.json();if(data.status==="approved"||data.status==="delivered"){clearInterval(timer);document.getElementById("state").textContent=data.status==="delivered"?"Pagamento confirmado e item entregue!":"Pagamento confirmado! A Suzuki está entregando seu item."}else if(data.status==="expired"||data.status==="refunded"){clearInterval(timer);document.getElementById("state").textContent="Este pagamento expirou ou foi estornado. Gere um novo Pix se quiser tentar novamente."}}catch{}}
  </script>`);
}

async function authStart(request, env) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("produto") || "";
  if (!PRODUCTS[productId]) return page("Item inválido", "Volte à Loja e escolha um item válido.");
  const state = randomToken();
  await env.DB.prepare("INSERT INTO oauth_states (state, product_id, created_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(state), productId, nowSeconds()).run();
  const params = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, redirect_uri: oauthRedirect(request), response_type: "code", scope: "identify", state });
  return Response.redirect(`https://discord.com/oauth2/authorize?${params}`, 302);
}

async function authCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const stateHash = await sha256Hex(state);
  const saved = await env.DB.prepare("SELECT product_id, created_at FROM oauth_states WHERE state = ?")
    .bind(stateHash).first();
  if (!saved || nowSeconds() - saved.created_at > 600) return page("Login expirado", "Volte à Loja e tente entrar novamente.");
  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(stateHash).run();
  if (url.searchParams.has("error")) return page("Login cancelado", "Você cancelou a entrada. Nenhum pedido foi criado.");
  const code = url.searchParams.get("code");
  if (!code) return page("Login não concluído", "O Discord não retornou a autorização. Tente novamente.");
  const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code, redirect_uri: oauthRedirect(request) }) });
  if (!tokenResponse.ok) return page("Falha no login", "Não foi possível confirmar sua conta do Discord. Tente novamente.");
  const token = await tokenResponse.json();
  const userResponse = await fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!userResponse.ok) return page("Falha no login", "O Discord não confirmou sua conta. Tente novamente.");
  const user = await userResponse.json();
  const sessionToken = randomToken();
  const now = nowSeconds();
  await env.DB.prepare("INSERT INTO sessions (token_hash, discord_user_id, discord_username, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256Hex(sessionToken), String(user.id), String(user.global_name || user.username || "Discord").slice(0, 100), now, now + SESSION_SECONDS).run();
  const response = new Response(null, { status: 302, headers: { Location: `/loja?produto=${encodeURIComponent(saved.product_id)}`, "Cache-Control": "no-store" } });
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; Max-Age=${SESSION_SECONDS}; Secure; HttpOnly; SameSite=Lax`);
  return response;
}

async function createCheckout(request, env) {
  const user = await getSession(request, env);
  if (!user) return json({ error: "Entre com o Discord antes de comprar." }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Pedido inválido." }, 400); }
  const product = PRODUCTS[String(body.productId || "")];
  const email = String(body.email || "").trim().toLowerCase();
  if (!product) return json({ error: "Escolha um item válido." }, 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Informe um e-mail válido para o pagamento." }, 400);
  await env.DB.prepare("UPDATE orders SET status = 'expired' WHERE status = 'pending' AND created_at < ?")
    .bind(nowSeconds() - 24 * 60 * 60).run();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS total FROM orders WHERE discord_user_id = ? AND created_at > ? AND status = 'pending'")
    .bind(user.discord_user_id, nowSeconds() - 3600).first();
  if (Number(recent?.total || 0) >= 5) return json({ error: "Há muitos Pix pendentes nessa conta. Aguarde a expiração antes de gerar outro." }, 429);

  const id = crypto.randomUUID();
  const now = nowSeconds();
  await env.DB.prepare("INSERT INTO orders (id, discord_user_id, product_id, amount_cents, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)")
    .bind(id, user.discord_user_id, String(body.productId), product.amountCents, now).run();
  const amount = product.amountCents / 100;
  let mpResponse;
  try {
    mpResponse = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`, "Content-Type": "application/json", "X-Idempotency-Key": id },
      body: JSON.stringify({
        transaction_amount: amount,
        description: `Suzuki Bot - ${product.name}`,
        payment_method_id: "pix",
        external_reference: id,
        notification_url: `${requestOrigin(request)}/webhooks/mercadopago`,
        payer: { email },
        metadata: { order_id: id, discord_user_id: user.discord_user_id, product_id: String(body.productId) },
      }),
    });
  } catch {
    await env.DB.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").bind(id).run();
    return json({ error: "Não consegui conectar ao Mercado Pago. Tente novamente." }, 502);
  }
  const payment = await mpResponse.json().catch(() => ({}));
  if (!mpResponse.ok || !payment.id || !payment.point_of_interaction?.transaction_data?.qr_code) {
    await env.DB.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").bind(id).run();
    return json({ error: "O Mercado Pago não conseguiu criar o Pix. Confira sua conta e tente novamente." }, 502);
  }
  const transaction = payment.point_of_interaction.transaction_data;
  await env.DB.prepare("UPDATE orders SET mp_payment_id = ?, pix_copy_paste = ?, pix_qr_base64 = ? WHERE id = ?")
    .bind(String(payment.id), String(transaction.qr_code), String(transaction.qr_code_base64 || ""), id).run();
  return json({ orderId: id, pixCode: transaction.qr_code, qrBase64: transaction.qr_code_base64 || "" });
}

async function orderStatus(request, env, orderId) {
  const user = await getSession(request, env);
  if (!user) return json({ error: "Entre com o Discord novamente." }, 401);
  const order = await env.DB.prepare("SELECT status, delivered_at FROM orders WHERE id = ? AND discord_user_id = ?")
    .bind(orderId, user.discord_user_id).first();
  if (!order) return json({ error: "Pedido não encontrado." }, 404);
  const status = order.delivered_at ? "delivered" : order.status;
  return json({ status });
}

async function verifyMpSignature(request, dataId, secret) {
  const header = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(header.split(",").map((part) => part.trim().split("=", 2)));
  if (!parts.ts || !parts.v1 || !requestId || !dataId) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return safeEqual(expected, parts.v1);
}

async function mpWebhook(request, env) {
  const url = new URL(request.url);
  let payload = {};
  try { payload = await request.json(); } catch { /* query parameters are enough for Mercado Pago notices */ }
  const dataId = url.searchParams.get("data.id") || payload?.data?.id || "";
  if (!await verifyMpSignature(request, dataId, env.MERCADOPAGO_WEBHOOK_SECRET)) return new Response("Assinatura inválida", { status: 401 });
  const type = url.searchParams.get("type") || payload.type;
  if (type && type !== "payment") return new Response("ok", { status: 200 });
  const paymentResponse = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` } });
  if (!paymentResponse.ok) return new Response("Não consegui consultar o pagamento", { status: 503 });
  const payment = await paymentResponse.json();
  const orderId = String(payment.external_reference || "");
  const order = await env.DB.prepare("SELECT id, discord_user_id, product_id, amount_cents, status FROM orders WHERE id = ?")
    .bind(orderId).first();
  if (!order || order.status === "refunded") return new Response("ok", { status: 200 });
  const product = PRODUCTS[order.product_id];
  const metadata = payment.metadata || {};
  const isExpectedPayment = product
    && String(payment.id) === String(dataId)
    && payment.status === "approved"
    && String(payment.external_reference) === order.id
    && String(metadata.order_id) === order.id
    && String(metadata.discord_user_id) === order.discord_user_id
    && String(metadata.product_id) === order.product_id
    && String(payment.payment_method_id || "").toLowerCase() === "pix"
    && String(payment.currency_id || "") === "BRL"
    && Math.round(Number(payment.transaction_amount) * 100) === Number(order.amount_cents);
  if (isExpectedPayment && order.status !== "approved") {
    await env.DB.prepare("UPDATE orders SET status = 'approved', mp_payment_id = ?, paid_at = ? WHERE id = ? AND status = 'pending'")
      .bind(String(payment.id), nowSeconds(), order.id).run();
  } else if (payment.status === "refunded" && order.status === "approved") {
    await env.DB.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?").bind(order.id).run();
  }
  return new Response("ok", { status: 200 });
}

async function authorizeBot(request, env) {
  const provided = request.headers.get("x-suzuki-store-token") || "";
  return Boolean(env.SUZUKI_STORE_BOT_TOKEN) && safeEqual(provided, env.SUZUKI_STORE_BOT_TOKEN);
}

async function pendingBotOrders(request, env) {
  if (!await authorizeBot(request, env)) return json({ error: "Não autorizado." }, 401);
  const result = await env.DB.prepare("SELECT id, discord_user_id, product_id FROM orders WHERE status = 'approved' AND delivered_at IS NULL ORDER BY paid_at LIMIT 100").all();
  return json({ orders: result.results || [] });
}

async function markDelivered(request, env, orderId) {
  if (!await authorizeBot(request, env)) return json({ error: "Não autorizado." }, 401);
  const order = await env.DB.prepare("SELECT id, status, delivered_at FROM orders WHERE id = ?").bind(orderId).first();
  if (!order || order.status !== "approved") return json({ error: "Pedido ainda não aprovado." }, 409);
  if (!order.delivered_at) await env.DB.prepare("UPDATE orders SET delivered_at = ? WHERE id = ? AND status = 'approved' AND delivered_at IS NULL")
    .bind(nowSeconds(), orderId).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return Response.redirect(`${requestOrigin(request)}/loja`, 302);
    if (request.method === "GET" && url.pathname === "/loja") return shopPage(request, env);
    if (request.method === "GET" && url.pathname === "/auth/start") return authStart(request, env);
    if (request.method === "GET" && url.pathname === "/auth/callback") return authCallback(request, env);
    if (request.method === "POST" && url.pathname === "/api/checkout") return createCheckout(request, env);
    const orderMatch = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})$/i);
    if (request.method === "GET" && orderMatch) return orderStatus(request, env, orderMatch[1]);
    if (request.method === "POST" && url.pathname === "/webhooks/mercadopago") return mpWebhook(request, env);
    if (request.method === "GET" && url.pathname === "/internal/orders") return pendingBotOrders(request, env);
    const deliveredMatch = url.pathname.match(/^\/internal\/orders\/([0-9a-f-]{36})\/delivered$/i);
    if (request.method === "POST" && deliveredMatch) return markDelivered(request, env, deliveredMatch[1]);
    return new Response("Não encontrado", { status: 404 });
  },
};

