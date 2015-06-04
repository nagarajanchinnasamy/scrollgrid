
    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/renderSortIcon.js
    Scrollgrid.prototype.internal.render.renderSortIcon = function (target, cellData) {

        var self = this,
            int = self.internal,
            render = int.render,
            size = render.sortIconSize,
            sorted = !(!cellData.sortIcon || cellData.sortIcon === 'none'),
            icon,
            measured,
            selector = "sg-no-style--sorticon-selector";

        // Always clear and redraw, this is because the add parameter will not be set
        // if sorting has changed.
        target.selectAll("." + selector).remove();

        // If we are to display a sort icon
        if (sorted && cellData.textWidth > cellData.cellPadding + render.sortIconSize) {

            // Add a sort icon
            icon = target.append("path").attr("class", selector + " " + this.style.sortIcon);

            // Render an up or down arrow
            if (cellData.sortIcon === 'asc') {
                icon.attr("d", "M " + (size / 2) + " 0 L " + size + " " + size + " L 0 " + size + " z");
            } else if (cellData.sortIcon === 'desc') {
                icon.attr("d", "M 0 0 L " + size + " 0 L " + (size / 2) + " " + size + " z");
            }

            // Transform into the correct position
            measured = icon.node().getBBox();
            icon.attr("transform", "translate(" + (cellData.cellPadding + render.sortIconSize / 2 + measured.width / -2) + "," + (cellData.textHeight / 2 + icon.node().getBBox().height / -2) + ")");

        }

    };