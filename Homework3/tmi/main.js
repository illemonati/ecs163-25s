// I have a json for the terroism data
// I also have a geojson for the map data i got from a tutorial page
// They have different names for some countries
// I used chatgpt to get all the differences in names to make this map
const countryNameMap = {
    "Bosnia and Herzegovina": "Bosnia-Herzegovina",
    England: "United Kingdom",
    "Guinea Bissau": "Guinea-Bissau",
    "Republic of Serbia": "Serbia",
    Slovakia: "Slovak Republic",
    "The Bahamas": "Bahamas",
    USA: "United States",
    "United Republic of Tanzania": "Tanzania",
    "West Bank": "West Bank and Gaza Strip",
};

// For my visualization, my main is a geographical map
// For my interactivity im allowing use to select countries from the map
// Which is used in my 2 accompanying charts
// This is the initial default country included
// I chose brazil because north america pretty bare
// And south america gave me a better stream graph
let selectedCountries = new Set(["Brazil"]);

// My stream graph uses regions
const regions = new Set();
const countryToRegionMap = {};

// Load the Data
// I split the dataset into 2 files
// Because 1 file is too big (over 100mb)
// So i cannot upload to github
// Chatgpt gave me this trick to do it
// This is an approved dataset
// https://www.kaggle.com/datasets/START-UMD/gtd
Promise.all([
    d3.csv("data/globalterrorismdb_part1.csv"),
    d3.csv("data/globalterrorismdb_part2.csv"),
]).then(([data1, data2]) => {
    const data = [...data1, ...data2];
    console.log(data);

    // Process data

    // Create the regions
    for (let d of data) {
        if (d.region_txt) {
            regions.add(d.region_txt);
            if (d.country_txt) {
                countryToRegionMap[d.country_txt] = d.region_txt;
            }
        }
    }

    console.log(regions);
    console.log(countryToRegionMap);

    // Geographical map
    // This is the overview diagram

    // Layouts + setup
    // Chatgpt told me to use clientWidth instead of width
    // Solved my paddingish problem
    const mapContainer = document.querySelector(".map-container");
    const mapWidth = mapContainer.clientWidth;
    const mapHeight = mapContainer.clientHeight;
    const mapMargin = { top: 200, right: 20, bottom: 20, left: 20 };
    const mapChartWidth = mapWidth - mapMargin.left - mapMargin.right;
    const mapChartHeight = mapHeight - mapMargin.top - mapMargin.bottom;

    // Make the svg
    const mapSvg = d3
        .select(".map-container")
        .append("svg")
        .style("width", "100%")
        .style("height", "100%")
        .attr("width", mapChartWidth)
        .attr("height", mapChartHeight);

    const mapChart = mapSvg
        .append("g")
        .attr("width", mapChartWidth + mapMargin.left + mapMargin.right)
        .attr("height", mapChartHeight + mapMargin.top + mapMargin.bottom)
        .attr("transform", `translate(${mapMargin.left}, ${mapMargin.top})`);

    // Zoom
    // Learned from Chatgpt and adapted
    const zoom = d3
        .zoom()
        .scaleExtent([0.5, 8])
        .on("zoom", () => {
            mapChart.attr(
                "transform",
                `translate(${mapMargin.left}, ${mapMargin.top}) ${d3.event.transform}`
            );
        });

    mapSvg.call(zoom);

    // Create the projection
    // Referenced from https://d3-graph-gallery.com/choropleth.html and Chatgpt
    const projection = d3
        .geoMercator()
        .center([0, 0])
        .scale(Math.min(mapChartWidth / 5, mapChartHeight / 2.5))
        .translate([mapChartWidth / 2, mapChartHeight / 2]);
    const path = d3.geoPath().projection(projection);

    // Map title
    mapSvg
        .append("text")
        .attr("x", mapWidth / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "24px")

        .text("Terror in the World");

    // Load the geojson and draw the map
    // The source of this geojson is from a github repo linked from the tutorial above
    d3.json("data/world.geojson").then((mapData) => {
        console.log(mapData);

        // Process data so each country gets a numerical amount of terroism events
        const countryCounts = {};
        for (let d of data) {
            if (d.country_txt) {
                if (!(d.country_txt in countryCounts)) {
                    countryCounts[d.country_txt] = 0;
                }
                countryCounts[d.country_txt] += 1;
            }
        }
        console.log(countryCounts);

        const maxCountryCount = Math.max(...Object.values(countryCounts));

        // Color, Grey to Red, Grey for no terror, Red for max terror
        const mapColor = d3
            .scaleLinear()
            .domain([0, maxCountryCount])
            .range(["grey", "red"]);

        // Draw the map
        // Used chatgpt to figure out all the properties i needed
        const countryPaths = mapChart
            .selectAll("path")
            .data(mapData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", (d) => {
                // Use the map if needed
                const terrorismCount =
                    countryCounts[
                        d.properties.name in countryNameMap
                            ? countryNameMap[d.properties.name]
                            : d.properties.name
                    ];
                return terrorismCount > 0 ? mapColor(terrorismCount) : "grey";
            })
            .attr("stroke", (d) =>
                selectedCountries.has(d.properties.name) ? "cyan" : "white"
            )
            .attr("stroke-width", (d) =>
                selectedCountries.has(d.properties.name) ? 2 : 0.5
            )
            .style("opacity", 0.9)
            .on("click", (e, d) => {
                const clickedFeature = mapData.features[d];

                const clickedCountry = clickedFeature.properties.name;

                // Add or remove from the set for the selection interactivity
                if (selectedCountries.has(clickedCountry)) {
                    selectedCountries.delete(clickedCountry);
                } else {
                    selectedCountries.add(clickedCountry);

                    // Pan to center whenever new country selected
                    // Calculation learned from chatgpt
                    // mostly because the way I tried to do it didn't work well
                    // this just smoother

                    const bounds = path.bounds(clickedFeature);
                    const dx = bounds[1][0] - bounds[0][0];
                    const dy = bounds[1][1] - bounds[0][1];
                    const x = (bounds[0][0] + bounds[1][0]) / 2;
                    const y = (bounds[0][1] + bounds[1][1]) / 2;
                    const scale = Math.max(
                        1,
                        Math.min(
                            8,
                            0.9 /
                                Math.max(
                                    dx / mapChartWidth,
                                    dy / mapChartHeight
                                )
                        )
                    );
                    const translate = [
                        mapChartWidth / 2 - scale * x,
                        mapChartHeight / 2 - scale * y,
                    ];

                    mapSvg
                        .transition()
                        .duration(750)
                        .call(
                            zoom.transform,
                            d3.zoomIdentity
                                .translate(translate[0], translate[1])
                                .scale(scale)
                        );
                }

                // Border with cyan to show it is selected
                countryPaths
                    .attr("stroke", (countryD_path) =>
                        selectedCountries.has(countryD_path.properties.name)
                            ? "cyan"
                            : "white"
                    )
                    .attr("stroke-width", (countryD_path) =>
                        selectedCountries.has(countryD_path.properties.name)
                            ? 3
                            : 1
                    );

                // Call makeScatterPlot after updating the selected countries
                updateCharts();
            });

        // Map Legend
        // I used chatgpt to figure out hoow to position it and how to do the gradient

        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = mapChartWidth - legendWidth - 20;
        const legendY = 20;

        const legendScale = d3
            .scaleLinear()
            .domain([0, maxCountryCount])
            .range([0, legendWidth]);

        mapSvg
            .append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .selectAll("stop")
            .data([
                { offset: "0%", color: "grey" },
                { offset: "100%", color: "red" },
            ])
            .join("stop")
            .attr("offset", (d) => d.offset)
            .attr("stop-color", (d) => d.color);

        const legend = mapSvg
            .append("g")
            .attr("class", "map-legend")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        legend
            .append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .style("stroke", "#333")
            .style("stroke-width", 1);

        legend
            .append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(
                d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format("d"))
            );

        legend
            .append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -3)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text("Terrorism Events");
    });

    // Line plot
    // I originally called it a scatter plot but I realized line works better
    // So instead of points i just plot the lines
    //

    /**
     * Reran everytime new country selection changes
     * Draws the scatter plot
     */
    const makeScatterPlot = () => {
        // Delete the old chart so we can put in the new one
        d3.select(".secondary-chart-container").selectAll("svg").remove();

        /**
         * Gets data for country
         * @param {string} country
         * @returns the appropriate scatterplot data
         */
        const getCountryScatterData = (country) => {
            const countryName = countryNameMap[country] || country;
            const countryData = data.filter(
                (d) => d.country_txt === countryName
            );

            console.log(countryData);

            // Sort events by year
            // Learn about array functions via Chatgpt
            const eventsByYear = countryData.reduce((acc, d) => {
                const year = d.iyear;
                if (!(year in acc)) {
                    acc[year] = 0;
                }
                acc[year]++;
                return acc;
            }, {});

            console.log(eventsByYear);

            const scatterData = Object.entries(eventsByYear)
                .map(([year, count]) => ({
                    year: year,
                    count: count,
                }))
                .sort((a, b) => a.year - b.year);

            return {
                countryName,
                scatterData,
            };
        };

        const scatterDatas = Array.from(selectedCountries).map((c) =>
            getCountryScatterData(c)
        );
        console.log(scatterDatas);

        console.log(scatterDatas);

        // Set up the positions
        const scatterContainer = document.querySelector(
            ".secondary-chart-container"
        );
        const scatterWidth = scatterContainer.clientWidth;
        const scatterHeight = scatterContainer.clientHeight;
        const scatterMargin = { top: 40, right: 30, bottom: 60, left: 70 };
        const scatterPlotWidth =
            scatterWidth - scatterMargin.left - scatterMargin.right;
        const scatterPlotHeight =
            scatterHeight - scatterMargin.top - scatterMargin.bottom;

        // Make the svg
        const scatterSvg = d3
            .select(".secondary-chart-container")
            .append("svg")
            .attr("width", scatterWidth)
            .attr("height", scatterHeight);

        // Make the chart
        const scatterChart = scatterSvg
            .append("g")
            .attr(
                "transform",
                `translate(${scatterMargin.left}, ${scatterMargin.top})`
            );

        // Axis
        const scatterX = scatterChart
            .append("g")
            .attr("transform", `translate(0, ${scatterPlotHeight})`);

        scatterChart
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", scatterPlotWidth / 2)
            .attr("y", scatterPlotHeight + scatterMargin.bottom - 10)
            .text("Year");

        const scatterY = scatterChart.append("g");

        // Lookup rotation & position for this on gpt
        scatterChart
            .append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -scatterPlotHeight / 2)
            .attr("y", -scatterMargin.left + 20)
            .text("Number of events");

        const scatterTitle = scatterChart
            .append("text")

            .attr("x", scatterPlotWidth / 2)
            .attr("y", -scatterMargin.top / 2 + 5)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold");

        if (selectedCountries.size == 0) {
            scatterTitle = "Select Some Countries Plz";
            return;
        }
        scatterTitle.text(
            `Terroism over Time in ${Array.from(selectedCountries).join(", ")}`
        );

        const years = scatterDatas.flatMap((d) =>
            d.scatterData.map((item) => item.year)
        );

        const counts = scatterDatas.flatMap((d) =>
            d.scatterData.map((i) => i.count)
        );

        // Make the d3 scalers
        const xScale = d3
            .scaleLinear()
            .domain([Math.min(...years), Math.max(...years)])
            .range([0, scatterPlotWidth]);

        const yScale = d3
            .scaleLinear()
            .domain([0, Math.max(...counts) || 1])
            .range([scatterPlotHeight, 0]);

        // Animation to transition in, useful for changing the countries
        scatterX.transition().duration(1000).call(d3.axisBottom(xScale));
        scatterY.transition().duration(1000).call(d3.axisLeft(yScale));

        // Make color
        const color = d3
            .scaleOrdinal(d3.schemeTableau10)
            .domain(Array.from(selectedCountries));

        // Make lines
        const line = d3
            .line()
            .x((d) => xScale(d.year))
            .y((d) => yScale(d.count));

        // Make the edges, documentation said to use .enter() etc
        // But chatgpt said using this join then doing these sub ones is better
        scatterChart
            .selectAll(".country-line")
            .data(scatterDatas, (d) => d.countryName)
            .join(
                (enter) =>
                    enter
                        .append("path")
                        .attr("class", "country-line")
                        .attr("fill", "none")
                        .attr("stroke", (d) => color(d.countryName))
                        .attr("stroke-width", 2)
                        .attr("d", (d) => line(d.scatterData))
                        .style("opacity", 0)
                        .call((enter) =>
                            enter
                                .transition()
                                .duration(500)
                                .style("opacity", 0.8)
                        ),
                (update) =>
                    update.call((update) =>
                        update
                            .transition()
                            .duration(500)
                            .attr("d", (d) => line(d.scatterData))
                            .attr("stroke", (d) => color(d.countryName))
                    ),
                (exit) =>
                    exit.call((exit) =>
                        exit
                            .transition()
                            .duration(500)
                            .style("opacity", 0)
                            .remove()
                    )
            );
    };

    // Stream graph
    // Terrorism events over time in regions of countries selected

    /**
     * Also reran everytime new country selection changes
     * Draws the stream graph
     */
    const makeStreamGraph = () => {
        // Delete the old chart so we can put in the new one
        d3.select(".bottom-right-placeholder").selectAll("svg").remove();

        // Set up the positions
        const streamContainer = document.querySelector(
            ".bottom-right-placeholder"
        );
        const streamWidth = streamContainer.clientWidth;
        const streamHeight = streamContainer.clientHeight;
        const streamMargin = { top: 40, right: 120, bottom: 60, left: 70 };
        const streamPlotWidth =
            streamWidth - streamMargin.left - streamMargin.right;
        const streamPlotHeight =
            streamHeight - streamMargin.top - streamMargin.bottom;

        // Make the svg
        const streamSvg = d3
            .select(".bottom-right-placeholder")
            .append("svg")
            .attr("width", streamWidth)
            .attr("height", streamHeight);

        // Make the chart
        const streamChart = streamSvg
            .append("g")
            .attr(
                "transform",
                `translate(${streamMargin.left}, ${streamMargin.top})`
            );

        // Title
        const streamTitle = streamChart
            .append("text")

            .attr("x", streamPlotWidth / 2)
            .attr("y", -streamMargin.top / 2 + 5)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold");

        if (selectedCountries.size == 0) {
            streamTitle.text("Select Some Countries Plz");
            return;
        }

        // Get regions for selected countries
        const selectedRegions = new Set();
        Array.from(selectedCountries).forEach((country) => {
            const countryName = countryNameMap[country] || country;
            if (countryToRegionMap[countryName]) {
                selectedRegions.add(countryToRegionMap[countryName]);
            }
        });

        if (selectedRegions.size == 0) {
            streamTitle.text("No Region Data Available");
            return;
        }

        streamTitle.text(
            `Terrorism in ${Array.from(selectedRegions).join(", ")}`
        );

        // Get all countries in the selected regions
        const regionCountries = new Set();
        for (let d of data) {
            if (selectedRegions.has(d.region_txt) && d.country_txt) {
                regionCountries.add(d.country_txt);
            }
        }

        // Process data to get events by year and country for the stream
        const streamData = {};
        for (let d of data) {
            if (regionCountries.has(d.country_txt) && d.iyear) {
                const year = d.iyear;
                const country = d.country_txt;

                if (!(year in streamData)) {
                    streamData[year] = {};
                }
                if (!(country in streamData[year])) {
                    streamData[year][country] = 0;
                }
                streamData[year][country]++;
            }
        }

        // Convert to array format for the stack
        // https://d3-graph-gallery.com/graph/streamgraph_template.html
        // Also ofcourse, gpt
        const years = Object.keys(streamData).sort((a, b) => a - b);
        const countries = Array.from(regionCountries).sort();

        const stackData = years.map((year) => {
            const yearData = { year: +year };
            countries.forEach((country) => {
                yearData[country] = streamData[year][country] || 0;
            });
            return yearData;
        });

        console.log(stackData);

        if (stackData.length === 0) {
            streamTitle.text("Select Smth my Guy");
            return;
        }

        // Start making the actual chart
        const stack = d3
            .stack()
            .keys(countries)
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderAppearance);

        const series = stack(stackData);

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(stackData, (d) => d.year))
            .range([0, streamPlotWidth]);

        const maxValue = d3.max(series, (layer) =>
            d3.max(layer, (d) => Math.max(Math.abs(d[0]), Math.abs(d[1])))
        );

        const yScale = d3
            .scaleLinear()
            .domain([-maxValue, maxValue])
            .range([streamPlotHeight, 0]);

        // Color scale
        const color = d3.scaleOrdinal(d3.schemeTableau10).domain(countries);

        // Area generator
        const area = d3
            .area()
            .x((d) => xScale(d.data.year))
            .y0((d) => yScale(d[0]))
            .y1((d) => yScale(d[1]))
            .curve(d3.curveBasis);

        // Draw the streams
        // Again gpt says to do this instead of enter, update, exit function
        streamChart
            .selectAll(".stream-layer")
            .data(series)
            .join(
                (enter) =>
                    enter
                        .append("path")

                        .attr("d", area)
                        .attr("fill", (d) => color(d.key))
                        .style("opacity", 0)
                        .call((enter) =>
                            enter
                                .transition()
                                .duration(500)
                                .style("opacity", 0.8)
                        ),
                (update) =>
                    update.call((update) =>
                        update
                            .transition()
                            .duration(500)
                            .attr("d", area)
                            .attr("fill", (d) => color(d.key))
                    ),
                (exit) =>
                    exit.call((exit) =>
                        exit
                            .transition()
                            .duration(500)
                            .style("opacity", 0)
                            .remove()
                    )
            );

        // Axes
        const streamX = streamChart
            .append("g")
            .attr("transform", `translate(0, ${streamPlotHeight})`);

        streamChart
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", streamPlotWidth / 2)
            .attr("y", streamPlotHeight + streamMargin.bottom - 10)
            .text("Year");

        const streamY = streamChart.append("g");

        streamChart
            .append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -streamPlotHeight / 2)
            .attr("y", -streamMargin.left + 20)
            .text("Events in Country");

        // Animation for axes
        streamX.transition().duration(1000).call(d3.axisBottom(xScale));
        streamY.transition().duration(1000).call(d3.axisLeft(yScale));

        // Legend
        const legend = streamChart
            .append("g")

            .attr("transform", `translate(${streamPlotWidth + 20}, 20)`);

        const legendItems = legend
            .selectAll(".legend-item")
            .data(countries.slice(0, 10))
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", (d) => color(d));

        legendItems
            .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text((d) => (d.length > 12 ? d.substring(0, 12) + "..." : d));
    };

    /**
     * Update both of them
     * So I don't forget to call 1
     */
    const updateCharts = () => {
        makeScatterPlot();
        makeStreamGraph();
    };

    // For the initial, cause all the other ones are in the click
    // First load no click
    updateCharts();
});
