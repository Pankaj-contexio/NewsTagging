let chart;
let radarChartInstance = null; // global reference
async function loadGraphs(containerId) {
  document.getElementById(containerId).innerHTML = `
  

<div class="container-fluid mt-3">
  <div class="row">
    <!-- Toggle buttons -->
    <div class="col-12 mb-3 d-flex flex-wrap gap-2">
      <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#graph1">Political Party</button>
      <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#graph2">Party Influence</button>
      <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#graph3">Foreign Relation</button>
      <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#graph4">Economic Relation</button>
      <button class="btn btn-success" type="button" data-bs-toggle="collapse" data-bs-target=".multi-collapse">All</button>
    </div>

    <!-- Graphs section (9 columns) -->
    <div class="col-lg-9 col-md-12">
      <div class="row g-3">
        <!-- Graph 1 -->
        <div class="col-md-6">
          <div class="collapse multi-collapse" id="graph1">
              <div class="card card-body">
              <select id="countrySelector" class="form-select" style="width: 200px; margin-bottom: 20px;">
              <option value="">Select a country</option>
              <!-- Options will be populated dynamically -->
              </select>
              <canvas id="partyrating" class="graph-container"></canvas>
            </div>
          </div>
        </div>

        <!-- Graph 2 -->
        <div class="col-md-6">
          <div class="collapse multi-collapse" id="graph2">
            <div class="card card-body">
              <h2>Estimate Political Party Influence</h2>
              <select id="countrySelector2" class="form-select" style="width: 200px; margin-bottom: 20px;">
                <option value="">Select a country</option>
                <!-- Options will be populated dynamically -->
              </select>
              <label for="x-axis-type">Select X Axis:</label>
              <select id="x-axis-type">
                <option value="month">Month</option>
                <option value="days">Days in a Month</option>
              </select>
              <canvas id="lineChart" class="graph-container"></canvas>
              
            </div>
          </div>
        </div>

        <!-- Graph 3 -->
        <div class="col-md-6">
          <div class="collapse multi-collapse" id="graph3">
            <div class="card card-body">
              <select id="countrySelector-relationChart" class="form-select" style="width: 200px; margin-bottom: 20px;">
                <option value="">Select a country</option>
                <!-- Options will be populated dynamically -->
              </select>
              <h2>Foreign Relations Spider Chart</h2>
              <canvas id="relationChart" class="graph-container"></canvas>
            </div>
          </div>
        </div>

        <!-- Graph 4 -->
        <div class="col-md-6">
          <div class="collapse multi-collapse" id="graph4">
            <div class="card card-body">
              <select id="countrySelector-economy" class="form-select" style="width: 200px; margin-bottom: 20px;">
                <option value="">Select a country</option>
                <!-- Options will be populated dynamically -->
              </select>
              <canvas id="economyChart" class="graph-container"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `;


fetchdata();

}

async function updatecountries(country_news, element) {
    country_news.forEach(item => {
        const option = document.createElement('option');
        let countryid = countries.find(country => country.name === item.country)?.id;
        option.value = countryid;
        option.textContent = item.country;
        if (item.country === 'Bangladesh') {
            option.selected = true; // Select Nepal by default
        }
        element.appendChild(option);
        
    });
}

async function fetchdata(startDate = null, endDate = null) {
    // document.getElementById("fetch-loader").style.display = "flex";
    let url = '/api/dashboard';
    if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    
    const dashboardResponse = await fetch(url);
    const dashboardData = await dashboardResponse.json();
    const country_news = dashboardData.country_news;
    let filteredpartyData = dashboardData.party_rating.filter(party => party.country === "country_2");
    // add countries to the dropdown countrySelector
    const filtersResponse = await fetch(`/api/filters?type=project'}`);
    const filtersData = await filtersResponse.json();
    // Store the fetched filters
    countries = filtersData.country;
    const countrySelector = document.getElementById('countrySelector');
    const countrySelector2 = document.getElementById('countrySelector2');
    const countrySelector3 = document.getElementById('countrySelector-relationChart');
    const countrySelector4 = document.getElementById('countrySelector-economy');
    updatecountries(country_news, countrySelector);
    updatecountries(country_news, countrySelector2);
    updatecountries(country_news, countrySelector3);
    updatecountries(country_news, countrySelector4);
    
    document.getElementById("countrySelector").addEventListener("change", function() {
        const countryid = this.value;
        let filteredpartyData = dashboardData.party_rating.filter(party => party.country === countryid);
        createEChartsPieChart('partyrating',
        filteredpartyData.map(item => item.name),
        filteredpartyData);
        
    });

    document.getElementById("countrySelector2").addEventListener("change", function() {
        const countryid = this.value;
        const xaxis = document.getElementById("x-axis-type").value;
        let filteredpartyData = dashboardData.party_rating.filter(party => party.country === countryid);
        fetchDataAndRender(xaxis, countryid);
    });
    document.getElementById('x-axis-type').addEventListener('change', function () {
      country_id = document.getElementById('countrySelector2').value || 'country_2'; // Reset to default country
      fetchDataAndRender(this.value, country_id);
    });
    // Initial load
    fetchDataAndRender('month', 'country_2'); // Default to 'month' and 'country_1'
    let chartel = document.getElementById('relationChart');
    drawChart(countries, chartel);
    document.getElementById("countrySelector-relationChart").addEventListener("change", async function() {
        
        drawChart(countries, chartel);
    });

    let economychartel = document.getElementById('economyChart');
    fetchEconomyData(countries);
    document.getElementById("countrySelector-economy").addEventListener("change", async function() {
        
        fetchEconomyData(countries);
    });

    createEChartsPieChart('partyrating',
        filteredpartyData.map(item => item.name),
        filteredpartyData);
    // document.getElementById("fetch-loader").style.display = "none";
}

    



const fetchDataAndRender = async (xAxisType, country_id) => {
  try {
    const response = await fetch(`/api/chart-data?x_axis=${xAxisType}&country_id=${country_id}`);
    const chartData = await response.json();
    const ctx = document.getElementById('lineChart').getContext('2d');
    // If chart already exists, destroy it to avoid overlap
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading chart data:', error);
  }
};


  

async function fetchRelationData(countries) {
  const countryIdToName = {};
  const countrySelector = document.getElementById('countrySelector-relationChart').value || 'country_2'; // Default to 'country_1' if no selection
  console.log("Selected country ID:", countrySelector);
  const res = await fetch("/api/relations?country_id=" + countrySelector);
  const relationsData = await res.json();
  countries.forEach(({ id, name }) => {
    countryIdToName[id] = name;
  });
  // Step 2: Replace relation keys with names
  const transformedData = relationsData.map(entry => {
    const newRelations = {};
    for (const [countryId, value] of Object.entries(entry.relations)) {
      const countryName = countryIdToName[countryId] || countryId; // fallback to ID if name not found
      newRelations[countryName] = value;
    }
    return {
      country: countryIdToName[entry.country] || entry.country,
      relations: newRelations
    };
  });
  
  return transformedData;
}

async function fetchEconomyData(countries) {
  const selectedCountryId = document.getElementById('countrySelector-economy').value || 'country_2';

  const res = await fetch(`/api/economy?country_id=${selectedCountryId}`);
  const result = await res.json();

  if (!result || !result.sectors || !Array.isArray(result.sectors)) {
    console.error("Invalid data format from API", result);
    alert("No data found for this country.");
    if (window.economyChart) window.economyChart.destroy();
    return;
  }

  renderEconomyChart(result, countries);
}





async function drawChart(countries, chartelement) {
  const data = await fetchRelationData(countries);

  if (!data || !data.length || !data[0].relations) {
    console.error("Invalid data format", data);
    return;
  }

  // Extract labels and values from your data
  const labels = Object.keys(data[0].relations);
  const relationValues = Object.values(data[0].relations);

  const ctx = chartelement.getContext('2d');

  // ✅ Destroy previous chart if it exists
  if (radarChartInstance instanceof Chart) {
    radarChartInstance.destroy();
  }

  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: `Relations of ${data[0].country}`,
        data: relationValues,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Country Relations Radar Chart'
        }
      }
    }
  });
}


async function renderEconomyChart(data, countries) {
  const ctx = document.getElementById('economyChart').getContext('2d');

  const countryIdToName = {};
  countries.forEach(({ id, name }) => {
    countryIdToName[id] = name;
  });

  const sectors = data.sectors.map(s => s.name);
  const partners = [
    ...new Set(data.sectors.flatMap(s => s.trades.map(t => t.partner)))
  ];

  const datasets = partners.map(partner => ({
    label: countryIdToName[partner] || partner,
    data: data.sectors.map(s => {
      const found = s.trades.find(t => t.partner === partner);
      return found ? found.value : 0;
    }),
    backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
  }));

  // ✅ Safe destroy check
  if (window.economyChart && typeof window.economyChart.destroy === 'function') {
    window.economyChart.destroy();
  }

  window.economyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sectors,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Economy Sectors - ${countryIdToName[data.country_id] || data.country_id}`
          }
        },
        scales: {
          x: { stacked: false },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value (in Million $)'   // <-- Axis title
            },
            ticks: {
              callback: function (value) {
                return value + 'M';           // <-- Tick label format
              }
            }
          }
        }
      }
  });

}

  // Function to create an ECharts pie chart
async function createEChartsPieChart(containerId, labels, data) {
  const chart = echarts.init(document.getElementById(containerId));
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    
    series: [
      {
        name: '',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: data.map((item, index) => ({
          value: item.count || item.party_share,
          name: item.sector || item.site || item.name
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  chart.setOption(option);
}

