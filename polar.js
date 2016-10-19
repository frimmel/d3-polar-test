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

function makeLineGraph (data, loc, selector) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var colors = new Rainbow("#ff4e3d", "#1908ba");
    colors.setNumberRange(0, data.length - 1);

    // Set the ranges
    var x = d3.scaleLinear().range([0, width])
        .domain([0, d3.max(data, function(d) { return d.day; })]);
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, 100]);


    // Define the axes
    var xAxis = d3.axisBottom(x)
        .ticks(5);
    
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
        return "#" + colors.colourAt(i);
      });
}

function makeOverlapingLineGraph (data, loc, selector) {
    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var colors = new Rainbow("#ff4e3d", "#1908ba");
    colors.setNumberRange(0, data.length - 1);

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
        return "#" + colors.colourAt(i);
      });
}

function drawPolar(data, loc, selector) {
    var width = 500,
        height = 500,
        radius = Math.min(width, height) / 2 - 30;

    var tip = d3.tip().attr('class', 'd3-tip').html(function (d) { return d; });

    var colors = new Rainbow("#ff4e3d", "#1908ba");
    colors.setNumberRange(0, data.length - 1);

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
    var wrapper = d3.select(selector).append("div")
        .classed("graph-wrapper", true);

    var svg = wrapper.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.call(tip)

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

    // Define the div for the tooltip
    var div = wrapper.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    /**
     * This block of code draws the point at each data point
     */
    svg.selectAll("point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", function(d) {
            return line([d]).split(",")[0].slice(1);
        })
        .attr("cy", function(d) {
            return line([d]).split(",")[1].slice(0, -1);
        })
        .attr("r", 3)
        .attr("stroke", "#000")
        .attr("fill",function(d,i){
            return "#" + colors.colourAt(i);
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

function dateToMonthDay (date) {
    date = date.split(".");
    var leapYearCounter = (parseInt(date[0], 10) % 4) ? 0 : 1;

    var day = Math.floor(parseFloat("." + date[1]) * (365 + leapYearCounter));

    var jan = 31;
    var feb = jan + 28 + leapYearCounter;
    var mar = feb + 31;
    var apr = mar + 30;
    var may = apr + 31;
    var jun = may + 30;
    var jul = jun + 31;
    var aug = jul + 31;
    var sep = aug + 30;
    var oct = sep + 31;
    var nov = oct + 30;
    var dec = nov + 31;

    if (day < jan) {
        date[1] = "Jan. " + ordinal_suffix_of(day);
    } else if (day < feb) {
        date[1] = "Feb. " + ordinal_suffix_of(day - jan);
    } else if (day < mar) {
        date[1] = "Mar. " + ordinal_suffix_of(day - feb);
    } else if (day < apr) {
        date[1] = "Apr. " + ordinal_suffix_of(day - mar);
    } else if (day < may) {
        date[1] = "May. " + ordinal_suffix_of(day - apr);
    } else if (day < jun) {
        date[1] = "Jun. " + ordinal_suffix_of(day - may);
    } else if (day < jul) {
        date[1] = "Jul. " + ordinal_suffix_of(day - jun);
    } else if (day < aug) {
        date[1] = "Aug. " + ordinal_suffix_of(day - jul);
    } else if (day < sep) {
        date[1] = "Sep. " + ordinal_suffix_of(day - aug);
    } else if (day < oct) {
        date[1] = "Oct. " + ordinal_suffix_of(day - sep);
    } else if (day < nov) {
        date[1] = "Nov. " + ordinal_suffix_of(day - oct);
    } else if (day < dec) {
        date[1] = "Dec. " + ordinal_suffix_of(day - nov);
    }

    return date;
}

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}
