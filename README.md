# btc-dumbot
Simulador de trading quantitativo em BTC usando uma estratégia extremamente simples e burra. Requer uma chave comercial de API Nomics.

> **Atenção:** este projeto foi desenvolvido apenas para fins de estudo com paper trading. Não recomenda-se seu uso em trading real.

## Funcionamento
O simulador possui uma interface web com um gráfico de candles e uma área de compra e venda. O simulador inicia com 10.000 USD e 0 BTC (paper trading).

A interface web comunica-se com o backend por websocket e é atualizada a cada minuto.

![web](https://i.imgur.com/PH6WYIC.png)

## Estratégia
Para cada tick é calculado o SMA de 10 candles. Caso o último tick seja maior, é realizada uma compra.

Se o tick for menor que o SMA ou se a operação atingir o limite (10 USD de gain ou 1 USD de loss), é realizada a venda.