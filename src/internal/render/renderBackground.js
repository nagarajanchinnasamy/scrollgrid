
    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/renderBackground.js
    Scrollgrid.prototype.internal.render.renderBackground = function (target, cellData, add) {
        var selector = "sg-no-style--background-selector";
        if (add) {
            target.append("rect")
                .attr("class", selector + " " + cellData.backgroundStyle);
        } else {
            target
                .selectAll("." + selector)
                .attr("width", cellData.boxWidth)
                .attr("height", cellData.boxHeight);
        }
    };