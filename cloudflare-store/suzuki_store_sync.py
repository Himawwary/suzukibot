"""Pull paid Suzuki Store orders from the public Worker into the local bot."""

import asyncio
import inspect
import os
from pathlib import Path

import aiohttp


async def rotina_entrega_pedidos(aplicar_pedido):
    """Apply paid orders once, then acknowledge them to the Worker."""
    config_path = Path(__file__).with_name("suzuki_store.env")
    try:
        for line in config_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() in {"SUZUKI_STORE_API_URL", "SUZUKI_STORE_BOT_TOKEN"}:
                os.environ.setdefault(key.strip(), value.strip().strip('"\''))
    except OSError:
        pass
    api_url = os.getenv("SUZUKI_STORE_API_URL", "").strip().rstrip("/")
    bot_token = os.getenv("SUZUKI_STORE_BOT_TOKEN", "").strip()
    if not api_url.startswith("https://") or not bot_token:
        print("ℹ️ Entrega da Loja Premium aguardando SUZUKI_STORE_API_URL e SUZUKI_STORE_BOT_TOKEN.")
        return

    timeout = aiohttp.ClientTimeout(total=20)
    headers = {"X-Suzuki-Store-Token": bot_token}
    async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
        while True:
            try:
                async with session.get(f"{api_url}/internal/orders", params={"limit": 100}) as response:
                    if response.status == 401:
                        print("⚠️ A Loja Premium recusou a conexão do bot. Confira SUZUKI_STORE_BOT_TOKEN.")
                    elif response.status == 200:
                        data = await response.json()
                        for order in data.get("orders", []):
                            try:
                                result = aplicar_pedido(order)
                                if inspect.isawaitable(result):
                                    result = await result
                                if not result:
                                    continue
                                order_id = str(order.get("id", ""))
                                async with session.post(f"{api_url}/internal/orders/{order_id}/delivered") as ack:
                                    if ack.status == 200:
                                        print(f"✅ Pedido da Loja Premium entregue: {order_id}")
                                    else:
                                        print(f"⚠️ Não consegui confirmar a entrega do pedido {order_id}.")
                            except (aiohttp.ClientError, asyncio.TimeoutError, ValueError, TypeError) as erro:
                                print(f"⚠️ Erro ao entregar um pedido da Loja Premium: {type(erro).__name__}.")
                    else:
                        print(f"⚠️ A Loja Premium respondeu HTTP {response.status} ao consultar pedidos.")
            except (aiohttp.ClientError, asyncio.TimeoutError) as erro:
                print(f"⚠️ Loja Premium indisponível: {type(erro).__name__}.")
            await asyncio.sleep(20)

