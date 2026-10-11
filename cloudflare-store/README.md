# Pagamentos Pix da loja Suzuki

O Worker desta pasta cria pedidos Pix no Mercado Pago, confirma a aprovação por webhook assinado e mantém os pedidos até o bot entregar o item. A conta Discord fica vinculada ao pedido pelo OAuth. Não publique tokens ou segredos no GitHub.

## Itens

- `docinhos_10000`: adiciona 10.000 docinhos ao perfil.
- `docinhos_1000`: adiciona 1.000 docinhos ao perfil.
- `cores_perfil`: libera os temas rosa, lavanda e menta já existentes no bot.
- `balinhas_30`: adiciona 30 balinhas ao inventário normal.

O bot consulta pedidos aprovados a cada 20 segundos. Os registros locais impedem que um aviso repetido entregue o mesmo pedido duas vezes.

## Preparar o Cloudflare

1. Crie um banco D1 chamado `suzuki-store` no painel da Cloudflare.
2. Copie o ID do banco para `database_id` em `wrangler.toml`.
3. No terminal, nesta pasta, execute `npx wrangler login`.
4. Aplique a estrutura do banco: `npx wrangler d1 execute suzuki-store --remote --file=schema.sql`.
5. Publique: `npx wrangler deploy`. Anote a URL `https://suzuki-store.<subdominio>.workers.dev`.
6. Configure os segredos do Worker, executando um comando por vez. O Wrangler pedirá cada valor sem colocá-lo no código:

   ```powershell
   npx wrangler secret put DISCORD_CLIENT_ID
   npx wrangler secret put DISCORD_CLIENT_SECRET
   npx wrangler secret put MERCADOPAGO_ACCESS_TOKEN
   npx wrangler secret put MERCADOPAGO_WEBHOOK_SECRET
   npx wrangler secret put SUZUKI_STORE_BOT_TOKEN
   ```

7. No Portal de Desenvolvedores do Discord, adicione `https://suzuki-store.<subdominio>.workers.dev/auth/callback` aos redirecionamentos OAuth da aplicação da Suzuki.
8. No Mercado Pago Developers, configure o webhook **Pagamentos** para `https://suzuki-store.<subdominio>.workers.dev/webhooks/mercadopago`. Use o segredo de assinatura fornecido pelo Mercado Pago em `MERCADOPAGO_WEBHOOK_SECRET`.

## Preparar o bot

Ao lado de `suzuki.py`, deixe `suzuki_store_sync.py` e crie `suzuki_store.env` com:

```text
SUZUKI_STORE_API_URL=https://suzuki-store.<subdominio>.workers.dev
SUZUKI_STORE_BOT_TOKEN=COLE_A_MESMA_CHAVE_SECRETA_CONFIGURADA_NO_WORKER
```

Use uma chave aleatória exclusiva para `SUZUKI_STORE_BOT_TOKEN`; não reutilize o token do Discord nem do Mercado Pago. Reinicie o bot depois de configurar. Depois que o Worker estiver publicado e as credenciais estiverem salvas, a Loja do site pode apontar os botões para as rotas `/loja?produto=...` deste Worker.

O endpoint do bot só entrega pedidos cuja aprovação foi conferida consultando o Mercado Pago e validando valor, moeda, produto, usuário e assinatura do webhook.

