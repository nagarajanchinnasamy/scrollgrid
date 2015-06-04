
    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/renderRegion.js
    Scrollgrid.prototype.internal.render.renderRegion = function (target, physicalOffset, xVirtual, yVirtual) {

        var self = this,
            int = self.internal,
            render = int.render,
            interaction = int.interaction,
            sizes = int.sizes,
            physical = sizes.physical,
            dom = int.dom,
            cells,
            viewData = render.getDataInBounds.call(this, {
                startX: physicalOffset.x || 0,
                startY: physicalOffset.y || 0,
                top: yVirtual.top || 0,
                bottom: yVirtual.bottom || 0,
                left: xVirtual.left || 0,
                right: xVirtual.right || 0
            });

        target.content.selectAll(".sg-no-style--sort-icon-selector").remove();

        cells = target.content
            .selectAll(".sg-no-style--cell-selector")
            .data(viewData, function (d) { return d.key; });

        cells.enter()
            .append("g")
            .attr("class", "sg-no-style--cell-selector")
            .each(function (d) {
                render.renderCell.call(self, d3.select(this), d, true);
            });

        cells
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .each(function (d) {
                render.renderCell.call(self, d3.select(this), d, false);
            });

        cells.exit()
            .remove();

        // Add some interaction to the headers
        if (target === dom.top || target === dom.top.left || target === dom.top.right) {
            // Add sorting
            if (interaction.allowSorting) {
                interaction.addSortButtons.call(this, target.content, viewData);
            }
            // Add column resizing
            if (interaction.allowColumnResizing) {
                interaction.addResizeHandles.call(this, target.content, viewData, target === dom.top.right && physical.totalInnerWidth > physical.visibleInnerWidth);
            }
        }

    };