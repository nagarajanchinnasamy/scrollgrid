
    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/renderText.js
    Scrollgrid.prototype.internal.render.renderText = function (target, cellData, add) {
        var int = this.internal,
            render = int.render,
            sorted = !(!cellData.sortIcon || cellData.sortIcon === 'none'),
            textShape,
            selector = "sg-no-style--foreground-selector";
        if (add) {
            target.append("text")
                .attr("class", selector + " " + cellData.foregroundStyle)
                .style("text-anchor", render.getTextAnchor.call(this, cellData))
                .attr("dy", "0.35em")
                .text(render.cellWaitText);
        } else {
            textShape = target.selectAll("." + selector)
                .attr("x", render.getTextPosition.call(this, cellData))
                .attr("y", cellData.boxHeight / 2);
            cellData.getValue(cellData.rowIndex, cellData.columnIndex, function (value) {
                if (cellData.formatter) {
                    textShape.text(cellData.formatter(value));
                } else {
                    textShape.text(value);
                }
                render.cropText.call(this, textShape, cellData.textWidth - cellData.cellPadding - (sorted ? render.sortIconSize + cellData.cellPadding : 0));
            });
        }
    };