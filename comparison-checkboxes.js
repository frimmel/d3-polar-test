function makeUpDownOverlapingLineGraphWithCheckboxes (data, loc, selector, year) {
    year = "2015";

    var charts = {};

    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    var averages = processColorData(data, loc);

    var reprocessedData = reprocessData(data, averages, loc);
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

    var wrapper = d3.select(selector).append("div");
    
    // Adds the svg canvas
    var svg = wrapper
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

    charts["avg"] = {
        "path" : svg.append("path")
            .attr("class", "line")
            .attr("d", valueline(reprocessedData["avg"]))
    };
        
    charts[year] = {
        "path" : svg.append("path")
            .attr("class", "line")
            .attr("d", valueline(reprocessedData[year]))
    };
        
    /**
     * This block of code draws the point at each data point
     */
    charts["avg"]["points"] = svg.selectAll("point")
        .data(reprocessedData["avg"])
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("transform", function(d) {
        var coors = valueline([d]).slice(1).slice(0, -1);
            return "translate(" + coors + ")"
        })
        .attr("r", 2.5)
        .attr("stroke", "#000")
        .attr("fill",function(d,i){
            return computeColor(d[loc], averages[i%46], 3);
        })
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date + ": "  + d[loc]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 2.5);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });

    charts[year]["points"] = svg.selectAll("point")
        .data(reprocessedData[year])
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

    var inputwrapper = wrapper.append("div").classed("input-wrapper", true);

    reprocessedData.keys.forEach(function (key) {
        var checkboxWrapper = inputwrapper.append("div");

        checkboxWrapper.append("input")
            .attr("type", "checkbox")
            .attr("id", "timeseries-" + key)
            .attr("value", key)
            .property("checked", (key === year) ? true : false)
            .on("change", function (e) {
                var newYear = this.value;
                if (!this.checked) {
                    charts[newYear].path.remove();
                    charts[newYear].points.remove();
                } else {
                    if (!charts.hasOwnProperty(newYear)) {
                        charts[newYear] = {};
                    }
                    charts[newYear].path = svg.append("path")
                        .attr("class", "line")
                        .attr("d", valueline(reprocessedData[newYear]));

                    charts[newYear].points = svg.selectAll("point")
                        .data(reprocessedData[newYear])
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
            });

        checkboxWrapper.append("label")
            .text(key)
            .attr("for", "timeseries-" + key);
    });

    var checkboxWrapper = inputwrapper.append("div");

    checkboxWrapper.append("input")
        .attr("type", "checkbox")
        .attr("id", "timeseries-average")
        .attr("value", "avg")
        .property("checked", true)
        .on("change", function (e) {
            var newYear = this.value;
            if (!this.checked) {
                charts[newYear].path.remove();
                charts[newYear].points.remove();
            } else {
                if (!charts.hasOwnProperty(newYear)) {
                    charts[newYear] = {};
                }
                charts[newYear].path = svg.append("path")
                    .attr("class", "line")
                    .attr("d", valueline(reprocessedData[newYear]));

                charts[newYear].points = svg.selectAll("point")
                    .data(reprocessedData[newYear])
                    .enter()
                    .append("circle")
                    .attr("class", "point")
                    .attr("transform", function(d) {
                        var coors = valueline([d]).slice(1).slice(0, -1);
                        return "translate(" + coors + ")"
                    })
                    .attr("r", 2.5)
                    .attr("stroke", "#000")
                    .attr("fill",function(d,i){
                        return computeColor(d[loc], averages[i%46], 3);
                    })
                    .on("mouseover", function(d) {
                        var date = dateToMonthDay(d.year)
                        tip.show(date + ": "  + d[loc]);
                        this.setAttribute("r", 5);
                        this.setAttribute("stroke-width", "2px");
                        d3.select(this).classed("active", true);
                    })
                    .on("mouseout", function (d) {
                        tip.hide();
                        this.setAttribute("r", 2.5);
                        this.setAttribute("stroke-width", "1px");
                        d3.select(this).classed("active", true);
                    });
            }
        });

    checkboxWrapper.append("label")
        .text("Average")
        .attr("for", "timeseries-average");
}

function drawUpDownPolarWithCheckboxes (data, loc, selector) {
    var width = 500,
        height = 500,
        radius = Math.min(width, height) / 2 - 30;

    var averages = processColorData(data, loc);
    var reprocessedData = reprocessData(data, averages, loc);
    var center = findPolarCenter(reprocessedData, loc);

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
    var wrapper = d3.select(selector).append("div");
    var svg = wrapper.append("svg")
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
     * Draws the line to the center of the data
     */
    var centerDay = center[1].day;
    var centerDayOpposite = (centerDay + (365/2)) % 365;
    var centerDayData = {
        "day": centerDay
    };
    centerDayData[loc] = 100;
    var centerDayOppositeData = {
        "day": centerDayOpposite
    };
    centerDayOppositeData[loc] = 100;
    var growingSeasonData = [centerDayData, centerDayOppositeData]
//    console.log(growingSeasonData)

    svg.append("path")
        .datum(growingSeasonData)
        .attr("class", "line")
        .attr("d", line)
        .classed("growing-season-line", "true");

    svg.append("path")
        .datum(center)
        .attr("class", "line")
        .attr("d", line)
        .classed("center-line", "true");

    svg.selectAll("point")
        .data([center[1]])
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("transform", function(d) {
            var coors = line([d]).slice(1).slice(0, -1);
            return "translate(" + coors + ")"
        })
        .attr("r", 2.5)
        .attr("stroke", "#000")
        .attr("fill", "#dd82d2")
        .on("mouseover", function(d) {
            tip.show("Center: "  + String(d[loc]).substring(0, 7));
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 2.5);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });
    
    /**
     * This block of code draws the line that the data follows
     */
    svg.append("path")
        .datum(reprocessedData["avg"])
        .attr("class", "line")
        .attr("d", line);

    var chartLine = svg.append("path")
        .datum(reprocessedData["2015"])
        .attr("class", "line")
        .attr("d", line);

    /**
     * This block of code draws the point at each data point
     */
    svg.selectAll("point")
      .data(reprocessedData["avg"])
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("transform", function(d) {
        var coors = line([d]).slice(1).slice(0, -1);
        return "translate(" + coors + ")"
      })
      .attr("r", 2.5)
      .attr("stroke", "#000")
      .attr("fill",function(d,i){
        return computeColor(d[loc], averages[i%46], 3);
      })
        .on("mouseover", function(d) {
            var date = dateToMonthDay(d.year)
            tip.show(date + ": "  + d[loc]);
            this.setAttribute("r", 5);
            this.setAttribute("stroke-width", "2px");
            d3.select(this).classed("active", true);
        })
        .on("mouseout", function (d) {
            tip.hide();
            this.setAttribute("r", 2.5);
            this.setAttribute("stroke-width", "1px");
            d3.select(this).classed("active", true);
        });

    var charts = svg.selectAll("point")
      .data(reprocessedData["2015"])
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

    var inputwrapper = wrapper.append("div").classed("input-wrapper", true);

    inputwrapper.append("input")
        .attr("type", "range")
        .attr("min", reprocessedData.keys[0])
        .attr("max", reprocessedData.keys[reprocessedData.keys.length - 1])
        .attr("value", "2015")
        .attr("step", 1)
        .on("input", function (e) {
            charts.remove();
            chartLine.remove();
            var newYear = this.value;

            chartLine = svg.append("path")
                .datum(reprocessedData[newYear])
                .attr("class", "line")
                .attr("d", line);

            charts = svg.selectAll("point")
                .data(reprocessedData[newYear])
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
        })

    reprocessedData.keys.forEach(function (key) {
        inputwrapper.append("span").text(key).classed("range-label", true);
    });

}
