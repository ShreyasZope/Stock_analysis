// src/CandlestickChart.js

import React from 'react';

import Chart from 'react-apexcharts';

function CandlestickChart({ seriesData }) {
  const options = {
    chart: {
      type: 'candlestick',
      height: 400
    },
    title: {
      text: 'Candlestick Chart',
      align: 'left'
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    }
  };

  const series = [{
    name: 'candle',
    data: seriesData
  }];

  return (
    <div id="chart">
      <Chart options={options} series={series} type="candlestick" height={400} />
    </div>
  );
}

export default CandlestickChart;