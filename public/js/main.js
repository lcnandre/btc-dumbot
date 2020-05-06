var app = angular.module('AppModule', []);

app.controller('MainCtr', function ($scope, $timeout) {
  $scope.comboTrade = [
    { chave: 'V', valor: 'Vender' },
    { chave: 'C', valor: 'Comprar'},
  ];
  
  $scope.saldoUsd = 0;
  $scope.saldoBtc = 0;
  $scope.valorTrade = 0.0;
  $scope.tipoTrade = 'C';

  var candles = [];
  var socket = io();
  var chart = AmCharts.makeChart("chartdiv", {
    "type": "serial",
    "theme": "light",
    "dataDateFormat": "YYYY-MM-DD JJ:NN:SS",
    "valueAxes": [{
      "position": "left"
    }],
    "graphs": [{
        "id": "g1",
        "proCandlesticks": true,
        "balloonText": "Open:<b>[[open]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b><br>Close:<b>[[close]]</b><br>",
        "closeField": "close",
        "fillColors": "#7f8da9",
        "highField": "high",
        "lineColor": "#7f8da9",
        "lineAlpha": 1,
        "lowField": "low",
        "fillAlphas": 0.9,
        "negativeFillColors": "#db4c3c",
        "negativeLineColor": "#db4c3c",
        "openField": "open",
        "title": "Price:",
        "type": "candlestick",
        "valueField": "close"
      },
      {
        "balloonText": "MA:<b>[[ma]]",
        "bullet": "square",
        "id": "AmGraph-2",
        "title": "graph 2",
        "type": "smoothedLine",
        "valueField": "ma"
      },
      {
        "balloonText": "POS:<b>[[pos]]</b><br>PRF:<b>[[balanco]]",
        "bullet": "square",
        "id": "AmGraph-3",
        "title": "graph 3",
        "type": "smoothedLine",
        "valueField": "pos",
        "colorField": "posColor"
      }
    ],
    "chartScrollbar": {
      "graph": "g1",
      "graphType": "line",
      "scrollbarHeight": 30
    },
    "chartCursor": {
      "valueLineEnabled": true,
      "valueLineBalloonEnabled": true
    },
    "categoryField": "date",
    "categoryAxis": {
      "parseDates": true,
      "minPeriod": "ss"
    },
    "dataProvider": candles,
    "export": {
      "enabled": true,
      "position": "bottom-right"
    }
  });

  function zoomChart() {
    chart.zoomToIndexes(candles.length - 50, candles.length - 1);
  }

  chart.addListener("rendered", zoomChart);

  socket.on('candles', function (candlesInit) {
    $timeout(function() {
      candles.length = 0;
  
      candlesInit.forEach(function(candle) {
        candles.push(candle);
      });
    });
  });

  socket.on('saldo', function (saldos) {
    $timeout(function() {
      $scope.saldoUsd = saldos.saldoUsd;
      $scope.saldoBtc = saldos.saldoBtc;
    }, 0);
  });

  socket.on('repaint', function() {
    $timeout(function() {
      chart.validateData();
      zoomChart();
    });
  });

  $scope.executarTrade = function() {
    socket.emit('trade', {
      tipo: $scope.tipoTrade.chave,
      valor: $scope.valorTrade,
    });

    $scope.valorTrade = 0;
  };
});