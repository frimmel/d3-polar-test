/**
 * startDay is actually the seasonality index, if it occurs after july it should be flipped
 */
function findPolarThresholds (data, loc, startDay) {
    console.log(data)
    console.log(startDay)
    var startIndex;

    var i, j, length, arr;
    var totalSum = 0;
    var sum;
    length = 46;

    for (i = 0; i < data.length; i++) {
        if (data[i].day === startDay) {
            startIndex = i;
            break;
        }
    }

    if (startIndex > 22) {
        startIndex = startIndex - 23;
    }

    for (i = 0; i < length; i++) {
        j = (startIndex + i) % length;
        totalSum += data[j][loc];
    }

    var fifteenThreshold = totalSum * .15;
    var eightyThreshold = totalSum * .80;
    var eightyfiveThreshold = totalSum * .85;
    var fifteenIndexFound = false, 
        eightyIndexFound = false,
        eightyfiveIndexFound = false;
    var fifteenIndex, eightyIndex, eightyfiveIndex;

    totalSum = 0;
    for (i = 0; i < length; i++) {
        j = (startIndex + i) % length;
        totalSum += data[j][loc];
        if (!fifteenIndexFound && totalSum > fifteenThreshold) {
            fifteenIndex = j;
            fifteenIndexFound = true;
            continue;
        }
        if (!eightyIndexFound && totalSum > eightyThreshold) {
            eightyIndex = j;
            eightyIndexFound = true;
            continue;
        }
        if (!eightyfiveIndexFound && totalSum > eightyfiveThreshold) {
            eightyfiveIndex = j;
            eightyfiveIndexFound = true;
            break;
        }
    }

    var circleCenter = {
        "day": 0
    }
    circleCenter[loc] = 0;

    var fifteenEnd = {
        "day": data[fifteenIndex].day
    }
    fifteenEnd[loc] = 100;
    var eightyEnd = {
        "day": data[eightyIndex].day
    }
    eightyEnd[loc] = 100;
    var eightyfiveEnd = {
        "day": data[eightyfiveIndex].day
    }
    eightyfiveEnd[loc] = 100;

    return [
        {
            "label" : "15%",
            "data" : [circleCenter, fifteenEnd]
        },
        {
            "label" : "80%",
            "data" : [circleCenter, eightyEnd]
        },
        {
            "label" : "85%",
            "data" : [circleCenter, eightyfiveEnd]
        }
    ];
}

function drawUpDownPolarWithCheckboxesAndThresholds (data, loc, selector) {
    var width = 500,
        height = 500,
        radius = Math.min(width, height) / 2 - 30;

    var averages = processColorData(data, loc);
    var reprocessedData = reprocessData(data, averages, loc);
    var center = findPolarCenter(reprocessedData, loc);
    var thresholds = findPolarThresholds(reprocessedData["avg"], loc, center[1].day)

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
     * Draws the threshold lines
     */
    var thresholdElem = svg.append("g")
        .selectAll("g")
        .data(thresholds)
        .enter().append("g")
        .attr("transform", function(d) { return "rotate(" + (d.data[1].day - 90) + ")"; });

    thresholdElem.append("line")
        .attr("class", "line")
        .attr("x2", radius);

    thresholdElem.append("text")
        .attr("x", radius + 6)
        .attr("y", function (d) { return ((((d.data[1].day - 1)%365)/365) * (2*Math.PI)); })
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { var day = d.data[1].day; return day < 360 && day > 180 ? "end" : null; })
        .attr("transform", function(d) { var day = d.data[1].day; return day < 360 && day > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
        .text(function(d) { return d.label; });

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
    
    var charts = {};

    /**
     * This block of code draws the line that the data follows
     */
    charts["avg"] = {
        "path" : svg.append("path")
            .datum(reprocessedData["avg"])
            .attr("class", "line")
            .attr("d", line)
    };

    charts["2015"] = {
        "path" : svg.append("path")
            .datum(reprocessedData["2015"])
            .attr("class", "line")
            .attr("d", line)
    };

    /**
     * This block of code draws the point at each data point
     */
    charts.avg.points = svg.selectAll("point")
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

    charts["2015"].points = svg.selectAll("point")
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

    reprocessedData.keys.forEach(function (key) {
        var checkboxWrapper = inputwrapper.append("div");

        checkboxWrapper.append("input")
            .attr("type", "checkbox")
            .attr("id", "polar-threshold-" + key)
            .attr("value", key)
            .property("checked", (key === "2015") ? true : false)
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
                        .datum(reprocessedData[newYear])
                        .attr("class", "line")
                        .attr("d", line);

                    charts[newYear].points = svg.selectAll("point")
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
                }
            });

        checkboxWrapper.append("label")
            .text(key)
            .attr("for", "polar-threshold-" + key);
    });

    var checkboxWrapper = inputwrapper.append("div");

    checkboxWrapper.append("input")
        .attr("type", "checkbox")
        .attr("id", "polar-average-threshold")
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

                charts.avg.path = svg.append("path")
                    .datum(reprocessedData["avg"])
                    .attr("class", "line")
                    .attr("d", line)

                charts.avg.points = svg.selectAll("point")
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
            }
        });

    checkboxWrapper.append("label")
        .text("Baseline")
        .attr("for", "polar-average-threshold");

    var thresholdCheckbox= inputwrapper.append("div")
        .classed("threshold-checkbox", true);

    thresholdCheckbox.append("input")
        .attr("type", "checkbox")
        .attr("id", "threshold-checkbox")
        .property("checked", true)
        .on("change", function (e) {
            thresholdElem.style("opacity", (this.checked) ? 1 : 0);
        });

    thresholdCheckbox.append("label")
        .text("Thresholds")
        .attr("for", "threshold-checkbox");
}
