# Loja Premium com Pix (Suzuki)

Esta pasta contém o serviço público da loja. Ele roda no Cloudflare Workers com D1; o Mercado Pago confirma pagamentos por webhook e o bot busca apenas pedidos aprovados. Nenhuma chave de pagamento fica no HTML público.

## Itens entregues

- `docinhos_10000`: soma 10.000 ao saldo de docinhos.
- `docinhos_1000`: soma 1.000 ao saldo de docinhos.
- `cores_perfil`: libera os temas de perfil já existentes (`rosa`, `lavanda` e `menta`).
- `balinhas_30`: soma 30 balinhas ao inventário normal da Suzuki.

O Discord OAuth vincula o pedido ao ID da conta; e-mail é solicitado somente para criar o Pix no Mercado Pago. As entregas são idempotentes no bot, portanto uma repetição do aviso não duplica o item.

## Publicação inicial

1. No painel da Cloudflare, crie um banco D1 chamado `suzuki-store` e execute `schema.sql` nele.
2. Instale Node.js e Wrangler neste computador, abra um terminal nesta pasta e execute `npx wrangler login`.
3. Copie o `database_id` do D1 para `wrangler.toml` e publique com `npx wrangler deploy`.
4. A URL do Worker será `https://suzuki-store.<seu-subdominio>.workers.dev`.
5. Configure os segredos do Worker (não os publique no GitHub):

   ```powershell
   npx wrangler secret put DISCORD_CLIENT_ID
   npx wrangler secret put DISCORD_CLIENT_SECRET
   npx wrangler secret put MERCADOPAGO_ACCESS_TOKEN
   npx wrangler secret put MERCADOPAGO_WEBHOOK_SECRET
   npx wrangler secret put SUZUKI_STORE_BOT_TOKEN
   ```

   Informe os valores no prompt seguro do Wrangler, um comando por vez.

6. No Portal de Desenvolvedores do Discord, adicione `https://suzuki-store.<seu-subdominio>.workers.dev/auth/callback` aos redirecionamentos OAuth da aplicação Suzuki.
7. No Mercado Pago Developers, configure Webhooks de **Pagamentos** apontando para `https://suzuki-store.<seu-subdominio>.workers.dev/webhooks/mercadopago` e copie o segredo de assinatura para `MERCADOPAGO_WEBHOOK_SECRET`.
8. No computador do bot, configure `SUZUKI_STORE_API_URL` com a URL do Worker e `SUZUKI_STORE_BOT_TOKEN` com o mesmo token secreto salvo no Worker. Reinicie o bot.
9. Configure os botões da Loja para abrir `/loja?produto=docinhos_10000`, `/loja?produto=docinhos_1000`, `/loja?produto=cores_perfil` e `/loja?produto=balinhas_30` na URL do Worker.

Gere o token `SUZUKI_STORE_BOT_TOKEN` aleatoriamente e guarde-o em segredo. Não use o token do bot do Discord nem o token do Mercado Pago nesse campo.

## Teste e produção

Use primeiro as credenciais de teste do Mercado Pago e uma conta de teste. Só depois de conferir Pix, webhook e entrega no Discord use as credenciais de produção. Para pagamentos reais, a conta precisa aceitar Pix e o webhook deve permanecer HTTPS.

