const d3 = require('d3');
const MG = require('metrics-graphics');

require('bootstrap/dist/css/bootstrap.css');
require('metrics-graphics/dist/metricsgraphics.css');
require('./index.css');

const renderChart = (data) => {
  MG.data_graphic({
    title: 'Followers',
    data: data.followers.map(d => ({
      date: new Date(d.date),
      count: d.count,
    })),
    width: 1100,
    height: 650,
    left: 60,
    target: '#chart',
    x_accessor: 'date',
    y_accessor: 'count',
    min_y: 15600,
    inflator: 1000 / 999,
    yax_format: d3.format(','),
    markers: data.tweets.map(t => ({
      date: new Date(t.date),
      label: '',
    })),
    interpolate: d3.curveMonotoneX,
  });
};

fetch('https://s3-eu-west-1.amazonaws.com/twitter-stats/stats.json')
  .then(res => res.json())
  .then(data => renderChart(data));
