const form = document.getElementById('input-form');
const cityInput = document.getElementsByName('city')[0];
const bandSelect = document.getElementById('band-select');
const svg = d3.select('#bandplan-svg');

let lastSubmitTime = 0;
const COOLDOWN_PERIOD = 10000; // 10 seconds in milliseconds

form.addEventListener('submit', (event) => {
  event.preventDefault();

  // Check if enough time has passed since last submit
  const currentTime = Date.now();
  if (currentTime - lastSubmitTime < COOLDOWN_PERIOD) {
    const remainingTime = Math.ceil((COOLDOWN_PERIOD - (currentTime - lastSubmitTime)) / 1000);
    alert(`Please wait ${remainingTime} seconds before submitting again`);
    return;
  }

  // Update last submit time
  lastSubmitTime = currentTime;

  // Get the values from the form
  const city = encodeURIComponent(cityInput.value);
  const url = `https://us-central1-visual-bandplan.cloudfunctions.net/api/repeaters?city=${city}`;
  console.log('Requesting:', url);

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'visual-bandplan(kj7yjm@icloud.com)'
    },
    mode: 'cors'
  })
  .then(response => {
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (!data || !data.results) {
      throw new Error('Invalid data format received');
    }
    console.log("Data received:", data);
    // Band definitions
    const bands = {
      "2m": { minFrequency: 144, maxFrequency: 148 },
      "70cm": { minFrequency: 420, maxFrequency: 450 },
      "6m": { minFrequency: 50, maxFrequency: 54 },
      "10m": { minFrequency: 28, maxFrequency: 29.7 }
    };

    // Get selected band
    const selectedBand = bandSelect.value;
    const band = bands[selectedBand];

    // If no band is selected, return
    if (!band) {
      console.log("No band selected");
      return;
    }

    // Filter results to only include frequencies within the selected band
    const filteredResults = data.results.filter(result => {
      const frequency = parseFloat(result.Frequency);
      return frequency >= band.minFrequency && frequency <= band.maxFrequency;
    });

    // Update data object with filtered results
    const filteredData = { ...data, results: filteredResults };

    // Draw the band plan with filtered data
    drawBandPlan(svg, filteredData);
    
    // Get the repeater details container
    const detailsList = document.getElementById('repeater-details');
    // Clear existing content
    detailsList.innerHTML = '';
    
    // Add each repeater's details
    filteredResults.forEach(repeater => {
      const listItem = document.createElement('div');
      listItem.className = 'repeater-item';
      listItem.innerHTML = `
        <h3>${repeater.Frequency} MHz</h3>
        <p>Call Sign: ${repeater.Callsign}</p>
        <p>Input Freq: ${repeater['Input Freq']} MHz</p>
        <p>Location: ${repeater.Location}</p>
      `;
      detailsList.appendChild(listItem);
    });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    alert('Error fetching repeater data. Please try again later.');
  });

  function drawBandPlan(svg, data) {
    // Band definitions
    const bands = {
      "2m": { minFrequency: 144, maxFrequency: 148 },
      "70cm": { minFrequency: 420, maxFrequency: 450 },
      "6m": { minFrequency: 50, maxFrequency: 54 },
      "10m": { minFrequency: 28, maxFrequency: 29.7 }
    };

    // Get selected band
    const selectedBand = bandSelect.value;

    // Get the band definition
    const band = bands[selectedBand];

    // If no band is selected, return
    if (!band) {
      console.log("No band selected");
      return;
    }

    // Get the results
    const results = data.results;

    // Get the min and max frequency of the band
    const minFrequency = band.minFrequency;
    const maxFrequency = band.maxFrequency;

    // Filter results to only include frequencies within the selected band
    const filteredResults = results.filter(result => {
      const frequency = parseFloat(result.Frequency);
      return frequency >= minFrequency && frequency <= maxFrequency;
    });

    if (filteredResults.length === 0) {
      console.log("No repeaters found in selected band");
      return;
    }

    // Get the width of the svg
    const svgWidth = svg.node().getBoundingClientRect().width;
    // Clear any existing content in the SVG
    svg.selectAll("*").remove();

    // Add a background rectangle spanning the full width
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 50)
      .attr('width', svgWidth)
      .attr('height', 20)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#cccccc');

    // Calculate the frequency range
    const frequencyRange = maxFrequency - minFrequency;

    // Iterate over the results
    console.log("Drawing band plan for band:", selectedBand);

    results.forEach(result => {
      console.log("Processing result:", result);
      // Get the output frequency
      const output_frequency = parseFloat(result.Frequency);
      console.log("Output frequency:", output_frequency);
      // Check if the repeater is in the selected band
      if (output_frequency >= minFrequency && output_frequency <= maxFrequency) {
        console.log(`Drawing repeater at frequency: ${output_frequency} MHz`);
        // Calculate the x position
        const x = ((output_frequency - minFrequency) / frequencyRange) * svgWidth;

        // Get the input frequency
        const input_frequency = parseFloat(result["Input Freq"]);

        // Calculate the repeater frequency range
        const repeaterFrequencyRange = Math.abs(output_frequency - input_frequency);

        // Calculate the width
        const width = (repeaterFrequencyRange / frequencyRange) * svgWidth;
        debugger
        // Draw a rectangle
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
        // Draw the repeater rectangle
        svg.append('rect')
          .attr('x', x)
          .attr('y', 50)
          .attr('width', width)
          .attr('height', 20)
          .attr('fill', colors[Math.floor(Math.random() * colors.length)])
          .attr('stroke', 'black');
          // Add frequency labels with band-specific steps
          let step;
          switch (selectedBand) {
            case '2m':
            case '6m':
              step = 0.5; // 500 kHz
              break;
            case '10m':
              step = 0.05; // 50 kHz
              break;
            default:
              step = 5; // 5 MHz (for 70cm/UHF)
          }

        for (let freq = Math.ceil(minFrequency/step)*step; freq <= maxFrequency; freq += step) {
          const labelX = ((freq - minFrequency) / frequencyRange) * svgWidth;
          svg.append('text')
            .attr('x', labelX)
            .attr('y', 90)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(freq);

          // Add small tick marks
          svg.append('line')
            .attr('x1', labelX)
            .attr('y1', 70)
            .attr('x2', labelX)
            .attr('y2', 75)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);
        }
      }
    });
  }
});