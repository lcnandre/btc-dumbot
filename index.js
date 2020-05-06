const request = require('request-promise-native');
const express = require('express');
const { Server } = require('http');
const { SMA } = require('technicalindicators');

const API_URL = 'https://api.coincap.io/v2';
const PERIODO_MA = 10;
const LIMITE = 10;
const STOP = -1;
const BTC_COMPRA = 1;

const candles = [];
let saldoUsd = 10000;
let saldoBtc = 0;
let tradeAtual;
let sma;

const app = express();
const http = new Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

function montarParametros() {
  const params = {
    uri: `${API_URL}/candles`,
    qs: {
      interval: 'm1',
      exchange: 'binance',
      baseId: 'bitcoin',
      quoteId: 'tether',
    },
    json: true
  };

  return params;
}

async function buscarCandles() {
  let dados = await request(
    montarParametros()
  );

  dados = dados.data.map(candle => {
    return {
      date: new Date(candle.period),
      low: +candle.low,
      open: +candle.open,
      close: +candle.close,
      high: +candle.high,
      volume: +candle.volume,
      ma: 0,
      pos: null,
      balanco: null,
    };
  });

  adicionarLista(dados);
}

function adicionarLista(dados) {
  if(candles.length >= 1000) {
    candles.splice(0, candles.length - dados.length);
  }

  sma = new SMA({
    period: PERIODO_MA,
    values: candles.map(c => c.close)
  });

  for (const candle of dados) {
    candle.ma = sma.nextValue(candle.close);
    candles.push(candle);
    analisarPosicao(candle);
    calcularPosicao(candle);
  }

  io.emit('candles', candles);
  io.emit('repaint');
  io.emit('saldo', {
    saldoUsd,
    saldoBtc,
  });
}

function iniciarSocket() {
  io.on('connection', (socket) => {
    io.emit('candles', candles);
    io.emit('repaint');
    io.emit('saldo', {
      saldoUsd,
      saldoBtc,
    });

    socket.on('trade', ({ tipo, valor }) => {
      if (tipo === 'C') {
        saldoUsd -= valor * candles.slice(-1)[0].close;
        saldoBtc += valor;
        tradeAtual = {
          tipo,
          valor,
          closeComprado: candles.slice(-1)[0].close,
          dataComprada: candles.slice(-1)[0].date,
        };
      } else {
        saldoUsd += valor * candles.slice(-1)[0].close;
        saldoBtc -= valor;
        tradeAtual = null;
      }
  
      calcularPosicao(candles.slice(-1)[0]);
  
      io.emit('candles', candles);
      io.emit('repaint');
      io.emit('saldo', {
        saldoUsd,
        saldoBtc,
      });
    });
  });
}

function analisarPosicao(candle) {
  if (candle.close >= candle.ma) {
    if (!tradeAtual) {
      saldoUsd -= BTC_COMPRA * candle.close;
      saldoBtc += BTC_COMPRA;
      tradeAtual = {
        tipo: 'C',
        valor: BTC_COMPRA,
        closeComprado: candle.close,
        dataComprada: candle.date,
      };
    } else if ((candle.close - tradeAtual.closeComprado) >= LIMITE) {
      saldoUsd += BTC_COMPRA * candle.close;
      saldoBtc -= BTC_COMPRA;
      tradeAtual = null;
    } else if ((candle.close - tradeAtual.closeComprado) <= STOP) {
      saldoUsd += BTC_COMPRA * candle.close;
      saldoBtc -= BTC_COMPRA;
      tradeAtual = null;
    }
  } else if (candle.close < candle.ma) {
    if (tradeAtual && (candle.close - tradeAtual.closeComprado) <= STOP) {
      saldoUsd += BTC_COMPRA * candle.close;
      saldoBtc -= BTC_COMPRA;
      tradeAtual = null;
    }
  }
}

function calcularPosicao(candle) {
  if (tradeAtual && candle.date >= tradeAtual.dataComprada) {
    candle.pos = +candle.close;
    candle.balanco = +candle.close - +tradeAtual.closeComprado;

    if (candle.balanco < 0) {
      candle.posColor = '#ff0000';
    } else {
      candle.posColor = '#00ff00';
    }
  }
}

http.listen(3001, async () => {
  console.log('Servidor iniciado na porta 3001');

  await buscarCandles();

  setInterval(async () => {
    await buscarCandles();
  }, 60000);

  iniciarSocket();
});