function parseRow (d) {
    return {
        "year": d[0],
        day: +d[1],
        locc: +d[2],
        locd: +d[3],
        loce: +d[4],
        locf: +d[5],
        locg: +d[6],
        loch: +d[7],
        loci: +d[8],
        locj: +d[9],
        lock: +d[10],
        locl: +d[11]
    }
}

var MONTH_LABELS = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sep",
    9: "Oct",
    10: "Nov",
    11: "Dec"
};

var tip = d3.tip().attr('class', 'd3-tip').html(function (d) { return d; });

function processColorData (data, loc) {
//    var loc_data = data[loc]
    var averages = [];
    var loc_averages;
    var median;
    var i, j;

    for (i = 0; i < 46; i++) {
        loc_averages = [];
        for (j = i; j < data.length; j += 46) {
            loc_averages.push(data[j][loc]);
        }

        median = loc_averages.sort()[Math.floor(loc_averages.length/2)];
        averages.push(median);
    }

    return averages;
}

function findOverallMedian (data, loc) {
    var averages = [];
    var i;

    for (i = 0; i < data.length; i++) {
        averages.push(data[i][loc]);
    }

    return averages.sort()[Math.floor(averages.length/2)];
}

function computeColor (value, median, scale) {
    var diff = value - median;
    var percent_diff = (Math.abs(diff)/median) * 100 * scale;
    var lightness = (100 - percent_diff) + "%";

    if (diff > 0) {
        return "hsl(8, 79%, " + lightness + ")";
    } else {
        return "hsl(219, 79%, " + lightness + ")";
    }
}

function makeUpDownLineGraph (data, loc, selector) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var averages = processColorData(data, loc);

    // Set the ranges
    var x = d3.scaleLinear().range([0, width])
        .domain([0, d3.max(data, function(d) { return d.day; })]);
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, 100]);


    // Define the axes
    var xAxis = d3.axisBottom(x)
        .ticks(16)
        .tickFormat(function (d) {
            return Math.floor(parseInt(d, 10) / 356) + 2000;
        });
    
    var yAxis = d3.axisLeft(y)
        .ticks(6);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.day); })
        .y(function(d) { return y(d[loc]); });
    
    // Adds the svg canvas
    var svg = d3.select(selector)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

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
    /**
     * This block of code draws the point at each data point
     */
    svg.selectAll("point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("transform", function(d) {
        var coors = valueline([d]).slice(1).slice(0, -1);
        return "translate(" + coors + ")"
      })
      .attr("r", 3)
      .attr("stroke", "#000")
      .attr("fill",function(d,i){
        return computeColor(d[loc], averages[i%46], 3);
      })
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date[1] + ", " + date[0] + ": "  + d[loc]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 3);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });
}

function makeUpDownAverageLineGraph (data, loc, selector) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var median = findOverallMedian(data, loc);

    // Set the ranges
    var x = d3.scaleLinear().range([0, width])
        .domain([0, d3.max(data, function(d) { return d.day; })]);
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, 100]);


    // Define the axes
    var xAxis = d3.axisBottom(x)
        .ticks(16)
        .tickFormat(function (d) {
            return Math.floor(parseInt(d, 10) / 356) + 2000;
        });
    
    var yAxis = d3.axisLeft(y)
        .ticks(6);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.day); })
        .y(function(d) { return y(d[loc]); });
    
    // Adds the svg canvas
    var svg = d3.select(selector)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

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
    /**
     * This block of code draws the point at each data point
     */
    svg.selectAll("point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("transform", function(d) {
        var coors = valueline([d]).slice(1).slice(0, -1);
        return "translate(" + coors + ")"
      })
      .attr("r", 3)
      .attr("stroke", "#000")
      .attr("fill",function(d,i){
        return computeColor(d[loc], median, 1.5);
      })
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date[1] + ", " + date[0] + ": "  + d[loc]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 3);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });
}

function makeUpDownOverlapingLineGraph (data, loc, selector) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var averages = processColorData(data, loc);

    // Set the ranges
    var x = d3.scaleLinear().range([0, width])
        .domain([0, 365]);
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, 100]);

    // Define the axes
    function formatMonth (d) {
        return (MONTH_LABELS[(d-15)/30]);
    }
    var xAxis = d3.axisBottom(x)
        .ticks(11)
        .tickValues([15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345])
        .tickFormat(formatMonth);
    
    var yAxis = d3.axisLeft(y)
        .ticks(6);

    // Define the line
    var valueline = d3.line()
        .x(function(d) { return x((d.day%365)); })
        .y(function(d) { return y(d[loc]); });
    
    // Adds the svg canvas
    var svg = d3.select(selector)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Reprocess the data
    var yeardata = [];
    var index;
    for (index = 0; index < data.length; index += 46) {
      yeardata.push(data.slice(index, index+46));
    }
    // Add the valueline path.
    svg.selectAll("svg")
        .data(d3.range(0,yeardata.length,1))
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", function (d) { return valueline(yeardata[d]); });
    /**
     * This block of code draws the point at each data point
     */
    svg.selectAll("point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("transform", function(d) {
        var coors = valueline([d]).slice(1).slice(0, -1);
        return "translate(" + coors + ")"
      })
      .attr("r", 3)
      .attr("stroke", "#000")
      .attr("fill",function(d,i){
        return computeColor(d[loc], averages[i%46], 3);
      })
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date[1] + ", " + date[0] + ": "  + d[loc]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 3);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });
}

function drawUpDownPolar(data, loc, selector) {
    var width = 500,
        height = 500,
        radius = Math.min(width, height) / 2 - 30;

    var averages = processColorData(data, loc);

    /**
     * Sets up scaling of data. We know that the ndvi values fall between
     * 0 & 100 so we set our domain to that. The range controls where the
     * points will lie in our graph, so we set them to be between 0 and the
     * radius.
     */
    var r = d3.scaleLinear()
        .domain([0, 100])
        .range([0, radius]);

    /**
     * function which will draw each point. To compute the distance from the
     * center each point is we pass the datapoint to the function defined above.
     * To determine the angle from the origin we need to convert the day to
     * radians, so we convert the day to a number between 0 & 1 and then multiply
     * it by 2 pi.
     */
    var line = d3.radialLine()
        .radius(function(d) { return r(d[loc]); })
        .angle(function(d) { return ((((d.day - 1)%365)/365) * (2*Math.PI)); });

    /**
     * Sets up the canvas where the circle will be drawn.
     */
    var svg = d3.select(selector).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.call(tip);

    /**
     * This block of code draws the big circles of the graph & their labels
     */
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
        .text(function(d) { return d; });

    /**
     * This block of code draws the labels for each month and the lines
     * that go out to them.
     */
    var ga = svg.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 30))
        .enter().append("g")
        .attr("transform", function(d) { return "rotate(" + (d - 90) + ")"; });

    ga.append("line")
        .attr("x2", radius);

    ga.append("text")
        .attr("x", radius + 6)
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { return d < 360 && d > 180 ? "end" : null; })
        .attr("transform", function(d) { return d < 360 && d > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { return MONTH_LABELS[d/30]; });

    /**
     * This block of code draws the line that the data follows
     */
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

    /**
     * This block of code draws the point at each data point
     */
    svg.selectAll("point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("transform", function(d) {
        var coors = line([d]).slice(1).slice(0, -1);
        return "translate(" + coors + ")"
      })
      .attr("r", 3)
      .attr("stroke", "#000")
      .attr("fill",function(d,i){
        return computeColor(d[loc], averages[i%46], 3);
      })
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date[1] + ", " + date[0] + ": "  + d[loc]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 3);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });
}
