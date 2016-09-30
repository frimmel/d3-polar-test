function parseRow (d) {
    return {
        "year": d[0],
        day: +d[1],
        locc: +d[2],
        locd: d[3],
        loce: d[4],
        locf: d[5],
        locg: d[6],
        loch: d[7],
        loci: d[8],
        locj: d[9],
        lock: d[10],
        locl: d[11]
    }
}

function makeLineGraph (data) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    // Set the ranges
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    var xAxis = d3.axisBottom(x)
        .ticks(5);

    var yAxis = d3.axisLeft(y)
        .ticks(5);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.day); })
        .y(function(d) { return y(d.locc); });
    
    // Adds the svg canvas
    var svg = d3.select("body")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data
    x.domain([0, d3.max(data, function(d) { return d.day; })]);
    y.domain([0, d3.max(data, function(d) { return d.locc; })]);

    // Add the valueline path.
    svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(data));

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
}

function drawPolar(data) {
    var width = 960,
        height = 500,
        radius = Math.min(width, height) / 2 - 30;

    var r = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 220]);

    var line = d3.radialLine()
        .radius(function(d) { return r(d.locc); })
        .angle(function(d) { return -((((d.day - 1)%365)/365) * (2*Math.PI)) + (Math.PI / 2); });

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var gr = svg.append("g")
        .attr("class", "r axis")
        .selectAll("g")
        .data(r.ticks(5).slice(1))
        .enter().append("g");

    gr.append("circle")
        .attr("r", r);

    gr.append("text")
        .attr("y", function(d) { return -r(d) - 4; })
        .attr("transform", "rotate(15)")
        .style("text-anchor", "middle")
        .text(function(d) { return d/100; });

    var ga = svg.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 30))
        .enter().append("g")
        .attr("transform", function(d) { return "rotate(" + (-d - 90) + ")"; });

    ga.append("line")
        .attr("x2", radius);

    ga.append("text")
        .attr("x", radius + 6)
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { return d < 180 && d > 0 ? "end" : null; })
        .attr("transform", function(d) { return d < 180 && d > 0 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { console.log("d: " + d);return d + "°"; });

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
}

d3.request("data/modis_ndvi_samp.csv")
    .mimeType("text/csv")
    .response(function (xhr) { return d3.csvParseRows(xhr.responseText, parseRow)})
    .get(function (data) {
        makeLineGraph(data);
        drawPolar(data);
    })

d3.request("data/modis_ndvi_samp_simp.csv")
    .mimeType("text/csv")
    .response(function (xhr) { return d3.csvParseRows(xhr.responseText, parseRow)})
    .get(function (data) {
        makeLineGraph(data);
        drawPolar(data);
    })

