const renderChart = (data) => {
  MG.data_graphic({
    title: "Followers",
    data: data.stats.map(s => ({
      date: new Date(s[0]),
      followers: s[1],
    })),
    width: 1100,
    height: 650,
    target: '#chart',
    x_accessor: 'date',
    y_accessor: 'followers',
    min_y_from_data: true,
    inflator: 1000/999,
    yax_format: d3.format(','),
  });
};

fetch('https://s3-eu-west-1.amazonaws.com/twitter-stats/stats.json')
  .then(res => res.json())
  .then(data => renderChart(data));