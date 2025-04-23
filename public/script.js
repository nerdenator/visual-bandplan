const form = document.getElementById('input-form');
const cityInput = document.getElementsByName('city')[0];
const bandSelect = document.getElementById('band-select');
const svg = d3.select('#bandplan-svg');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  // Get the values from the form
  const city = encodeURIComponent(cityInput.value);

  // Construct the API URL
  const baseUrl = 'https://www.repeaterbook.com/api/export.php?&format=json';
  const url = `${baseUrl}&city=${city}`;
  console.log(url);
  // Call the API
  fetch(url, {
    headers: {
      'User-Agent': 'visual-bandplan(kj7yjm@icloud.com)'
    }
  })
    .then(response => response.json())
    .then(data => {
      console.log("Data received:", data);
      drawBandPlan(svg, data);
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

    // Get the width of the svg
    const svgWidth = svg.node().getBoundingClientRect().width;

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
        svg.append('rect')
          .attr('x', x)
          .attr('y', 50)
          .attr('width', width)
          .attr('height', 20)
          .attr('fill', 'blue')
          .attr('stroke', 'black');
      }
    });
  }
});