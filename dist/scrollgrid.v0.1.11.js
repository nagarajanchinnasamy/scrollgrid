(function (context, library) {
    "use strict";

    if (typeof exports === "object") {
        // CommonJS
        module.exports = library(require('d3'));
    } else {
        if (typeof define === "function" && define.amd) {
            // RequireJS | AMD
            define(["d3"], function (d3) {
                // publish scrollgrid to the global namespace for backwards compatibility
                // and define it as an AMD module
                context.Scrollgrid = library(d3);
                return context.Scrollgrid;
            });
        } else {
            // No AMD, expect d3 to exist in the current context and publish
            // dimple to the global namespace
            if (!context.d3) {
                if (console && console.warn) {
                    console.warn("scrollgrid requires d3 to run.  Are you missing a reference to the d3 library?");
                } else {
                    throw "scrollgrid requires d3 to run.  Are you missing a reference to the d3 library?";
                }
            } else {
                context.Scrollgrid = library(context.d3);
            }
        }
    }

}(this, function (d3) {
    "use strict";

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    var Scrollgrid = function (options) {

        var int = this.internal,
            sizes = int.sizes,
            interaction = int.interaction,
            render = int.render,
            dom = int.dom,
            virtual = sizes.virtual,
            physical = sizes.physical;

        options = options || {};

        if (!options.target) {
            int.raise('target is a required field, please provide a selector string for the container. ' +
                'The selector string should be a d3/jquery selector identifying a single div.  E.g. "#tableContainer" ' +
                'where you have a div with id "tableContainer".');
        } else if (d3.select(options.target).length !== 1) {
            int.raise('target should be a d3/jquery selector identifying a single div.  E.g. "#tableContainer" ' +
                'where you have a div with id "tableContainer".  Please check that your selector is matching 1 and only 1 div.');
        } else {

            // Set the display options
            physical.rowHeight = options.rowHeight || 30;
            physical.dragHandleWidth = options.dragHandleWidth || 8;
            physical.headerRowHeight = options.headerRowHeight || physical.rowHeight;
            physical.footerRowHeight = options.footerRowHeight || physical.rowHeight;
            physical.defaultColumnWidth = options.defaultColumnWidth || 100;
            physical.cellPadding = options.cellPadding || 6;
            physical.verticalAlignment = options.verticalAlignment || 'top';

            // Set the interaction options
            interaction.allowColumnResizing = options.allowColumnResizing || true;
            interaction.allowSorting = options.allowSorting || true;

            // Set the number of header or footer rows or columns
            virtual.top = options.headerRows || 0;
            virtual.bottom = options.footerRows || 0;
            virtual.left = options.headerColumns || 0;
            virtual.right = options.footerColumns || 0;

            // Set a reference to the parent object
            this.target = options.target;

            render.setDefaultStyles.call(this);
            render.formatRules = options.formatRules || [];
            render.cellWaitText = options.cellWaitText || "loading...";
            render.sortIconSize = options.sortIconSize || 7;

            // Create the DOM shapes required
            dom.populateDOM.call(this);

            // Pass the data or adapter through to setData
            this.data(options.data || options.adapter);

            if (options.autoResize) {
                dom.setAutoResize.call(this);
            }
        }
    };

    Scrollgrid.init = function (target, options) {
        options.target = target;
        var scrollgrid = new Scrollgrid(options);
        return scrollgrid;
    };

    // Build namespaces
    Scrollgrid.adapters = {};
    Scrollgrid.prototype.internal = {
        sizes: {
            virtual: {},
            physical: {}
        },
        interaction: {},
        dom: {},
        render: {}
    };


    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/getTopMargin.js
    Scrollgrid.prototype.internal.dom.getTopMargin = function (containerSize, parent) {

        var int = this.internal,
            sizes = int.sizes,
            physical = sizes.physical,
            topMargin = 0,
            parentHeight;

        if (containerSize && containerSize.height && parent) {
            parentHeight = parent.node().offsetHeight;
            if (physical.verticalAlignment === 'middle') {
                topMargin = ((parentHeight - containerSize.height) / 2);
            } else if (physical.verticalAlignment === 'bottom') {
                topMargin = parentHeight - containerSize.height - 1;
            }
        }

        return topMargin;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/layoutDOM.js
    Scrollgrid.prototype.internal.dom.layoutDOM = function (fixedSize) {

        var self = this,
            int = self.internal,
            dom = int.dom,
            sizes = int.sizes,
            render = int.render,
            physical = sizes.physical,
            topMargin;

        // This is required so content can size relative to it
        dom.parent
            .style('position', 'relative');

        topMargin = dom.getTopMargin.call(self, fixedSize, dom.parent);

        dom.container
            .style('position', 'relative')
            .style('width', (fixedSize && fixedSize.width ? fixedSize.width + 'px' : '100%'))
            .style('height', (fixedSize && fixedSize.height ? (fixedSize.height) + 'px' : '100%'))
            .style('padding-top', topMargin + 'px')
            .style('font-size', 0);

        // If the fixed size is too great, reset to 100%, this gives the effect of
        // pinning the edges when they reach the limit of available space
        if (dom.container.node().offsetWidth > dom.parent.node().offsetWidth) {
            dom.container.style('width', '100%');
        }
        if (dom.container.node().offsetHeight > dom.parent.node().offsetHeight) {
            dom.container
                .style('margin-top', '0px')
                .style('height', '100%');
        }

        // Set the physical dimensions of the various data elements in memory
        sizes.calculatePhysicalBounds.call(self, topMargin);

        // Set all panels
        dom.setAbsolutePosition.call(self, dom.left.svg, 0, physical.top + topMargin, physical.left, physical.visibleInnerHeight);
        dom.setRelativePosition.call(self, dom.top.svg, physical.left, physical.visibleInnerWidth, physical.top, 'hidden');
        dom.setRelativePosition.call(self, dom.main.viewport, physical.left, physical.visibleInnerWidth, physical.visibleInnerHeight, 'auto');
        dom.setAbsolutePosition.call(self, dom.right.svg, physical.left + physical.visibleInnerWidth, physical.top + topMargin, physical.right, physical.visibleInnerHeight);
        dom.setRelativePosition.call(self, dom.bottom.svg, physical.left, physical.visibleInnerWidth, physical.bottom, 'hidden');
        dom.setAbsolutePosition.call(self, dom.top.left.svg, 0, topMargin, physical.left + physical.dragHandleWidth / 2, physical.top);
        dom.setAbsolutePosition.call(self, dom.top.right.svg, physical.left + physical.visibleInnerWidth - physical.dragHandleWidth / 2, topMargin, physical.right + physical.dragHandleWidth / 2, physical.top);
        dom.setAbsolutePosition.call(self, dom.bottom.left.svg, 0, physical.top + physical.visibleInnerHeight + topMargin, physical.left, physical.bottom);
        dom.setAbsolutePosition.call(self, dom.bottom.right.svg, physical.left + physical.visibleInnerWidth, physical.top + physical.visibleInnerHeight + topMargin,  physical.right, physical.bottom);
        dom.setAbsolutePosition.call(self, dom.main.svg, physical.left, physical.top + topMargin,  physical.visibleInnerWidth, physical.visibleInnerHeight);

        // Top right panel needs a small offset for the handle
        dom.top.right.transform.attr('transform', 'translate(' + physical.dragHandleWidth / 2 + ', 0)');

        // Invoke draw on scroll
        dom.main.viewport.on('scroll', function () { render.draw.call(self); });

        // Set the scrollable area
        dom.setScrollerSize.call(self);

        // Get the scroll bar bounds
        physical.verticalScrollbarWidth = dom.main.viewport.node().offsetWidth - dom.main.viewport.node().clientWidth;
        physical.horizontalScrollbarHeight = dom.main.viewport.node().offsetHeight - dom.main.viewport.node().clientHeight;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/populateDOM.js
    Scrollgrid.prototype.internal.dom.populateDOM = function () {

        var int = this.internal,
            style = this.style,
            dom = int.dom;

        // Get the parent container
        dom.parent = d3.select(this.target);
        // Add a container to the target which will house everything
        dom.container = dom.parent.append('div');

        // Populate the 5 regions of the control
        dom.left = dom.populatePanel.call(this, style.left.panel);
        dom.top = dom.populatePanel.call(this, style.top.panel);
        dom.top.left = dom.populatePanel.call(this, style.top.left.panel);
        dom.top.right = dom.populatePanel.call(this, style.top.right.panel);
        dom.main = dom.populatePanel.call(this, style.main.panel);

        // Add the viewport which is the fixed area with scroll bars
        dom.main.viewport = dom.container.append('div');

        dom.right = dom.populatePanel.call(this, style.right.panel);
        dom.bottom = dom.populatePanel.call(this, style.bottom.panel);
        dom.bottom.left = dom.populatePanel.call(this, style.bottom.left.panel);
        dom.bottom.right = dom.populatePanel.call(this, style.bottom.right.panel);

        // The scroller is going to be as large as the virtual size of
        // the data (as if it had all been rendered) this is so that
        // the scroll bars behave as expected
        dom.main.scroller = dom.main.viewport.append('div');

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/populatePanel.js
    Scrollgrid.prototype.internal.dom.populatePanel = function (css) {

        var dom = this.internal.dom,
            panel = {};

        panel.svg = dom.container.append('svg');
        panel.svg.attr('class', css);
        panel.transform = panel.svg.append('g');
        panel.content = panel.transform.append('g');

        return panel;
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/setAbsolutePosition.js
    Scrollgrid.prototype.internal.dom.setAbsolutePosition = function (element, x, y, width, height) {
        return element
            .style('position', 'absolute')
            .style('overflow', 'hidden')
            .style('left', x + 'px')
            .style('top', y + 'px')
            .style('width', width + 'px')
            .style('height', height + 'px');
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/setAutoResize.js
    Scrollgrid.prototype.internal.dom.setAutoResize = function () {

        // Pick up any existing resize handlers
        var self = this,
            existingHandler = window.onresize;

        // Add a new handler
        window.onresize = function () {
            // Invoke the non-scrollgrid resize handlers
            if (existingHandler) {
                existingHandler();
            }
            // Call the instantiated layout refresh
            self.refresh();
        };

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/setRelativePosition.js
    Scrollgrid.prototype.internal.dom.setRelativePosition = function (element, x, width, height, overflow) {
        return element
            .style('overflow', overflow)
            .style('position', 'relative')
            .style('margin-left', x + 'px')
            .style('width', width + 'px')
            .style('height', height + 'px');
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/dom/setScrollerSize.js
    Scrollgrid.prototype.internal.dom.setScrollerSize = function () {
        var int = this.internal,
            dom = int.dom,
            sizes = int.sizes,
            physical = sizes.physical;

        dom.main.scroller
            .style('width', physical.totalInnerWidth + 'px')
            .style('height', physical.totalInnerHeight + 'px');

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/addResizeHandles.js
    Scrollgrid.prototype.internal.interaction.addResizeHandles = function (g, data, left) {

        var self = this,
            int = self.internal,
            style = self.style,
            sizes = int.sizes,
            interaction = int.interaction,
            physical = sizes.physical;

        // Unlike cell content we need to remove and re-add handles so they stay on top
        g.selectAll(".sg-no-style--resize-handle-selector")
            .remove();

        g.selectAll(".sg-no-style--resize-handle-selector")
            .data(data, function (d) { return d.key; })
            .enter()
            .append("rect")
            .attr("class", "sg-no-style--resize-handle-selector " + style.resizeHandle)
            .attr("transform", "translate(" + (-1 * physical.dragHandleWidth / 2) + ", 0)")
            .attr("x", function (d) { return d.x + (left ? 0 : d.boxWidth); })
            .attr("y", 0)
            .attr("width", physical.dragHandleWidth)
            .attr("height", physical.top)
            .on("dblclick", function (d) { interaction.autoResizeColumn.call(self, d); })
            .call(interaction.getColumnResizer.call(self, left));

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/addSortButtons.js
    Scrollgrid.prototype.internal.interaction.addSortButtons = function (g, data) {

        var buttons,
            self = this,
            int = self.internal,
            interaction = int.interaction;

        buttons = g
            .selectAll(".sg-no-style--sort-button-selector")
            .data(data, function (d) { return d.key; });

        buttons.enter()
            .append("rect")
            .attr("class", "sg-no-style--sort-button-selector")
            .style("opacity", 0)
            .style("cursor", "pointer")
            .on("click", function (d) { return interaction.sortColumn.call(self, d.columnIndex, true); });

        buttons.attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return d.y; })
            .attr("width", function (d) { return d.boxWidth; })
            .attr("height", function (d) { return d.boxHeight; });

        buttons.exit()
            .remove();

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/autoResizeColumn.js
    Scrollgrid.prototype.internal.interaction.autoResizeColumn = function (d) {

        var int = this.internal,
            dom = int.dom,
            sizes = int.sizes,
            panels = [dom.top.left, dom.top, dom.top.right, dom.left, dom.main, dom.right, dom.bottom.left, dom.bottom, dom.bottom.right],
            i;

        if (d && d.column && d.columnIndex) {

            // Do not allow the width to be less than 0
            d.column.width = 0;

            // Get the widest from the various panels (some panels may not apply to the given cell but those panels will return zero anyway)
            for (i = 0; i < panels.length; i += 1) {
                d.column.width = Math.max(d.column.width, sizes.getExistingTextBound.call(this, panels[i].svg, d.columnIndex).width);
            }

            // Update the container size because the width will have changed
            this.refresh();

        }
    };


    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/columnResizeEnd.js
    Scrollgrid.prototype.internal.interaction.columnResizeEnd = function (shape) {
        shape.classed('dragging', false);
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/columnResizeStart.js
    Scrollgrid.prototype.internal.interaction.columnResizeStart = function (shape) {
        d3.event.sourceEvent.stopPropagation();
        shape.classed('dragging', true);
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/columnResizing.js
    Scrollgrid.prototype.internal.interaction.columnResizing = function (shape, d, invert) {

        // Some resize handle should be inverted
        if (invert) {
            d.column.width += d.x - d3.event.x;
        } else {
            d.column.width -= d.x - d3.event.x;
        }

        // Update the x coordinate for the drag
        d.x = d3.event.x;

        // If the column width is below 0 reset it, negative widths cause problems
        if (d.column.width < 0) {
            d.column.width = 0;
        }

        // Move the drag handle itself
        shape.attr('x', d.x);

        // Redraw
        this.refresh();

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/defaultComparer.js
    Scrollgrid.prototype.internal.interaction.defaultComparer = function (a, b) {
        var order;
        if (isNaN(a) || isNaN(b)) {
            order = (new Date(a)) - (new Date(b));
        } else {
            order = parseFloat(a) - parseFloat(b);
        }
        if (isNaN(order)) {
            order = (a < b ? -1 : (a > b ? 1 : 0));
        }
        return order;
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/getColumnResizer.js
    Scrollgrid.prototype.internal.interaction.getColumnResizer = function (invert) {

        var int = this.internal,
            interaction = int.interaction,
            self = this;

        return d3.behavior.drag()
            .origin(function (d) { return d; })
            .on('dragstart', function (d) { interaction.columnResizeStart.call(self, d3.select(this), d); })
            .on('drag', function (d) { interaction.columnResizing.call(self, d3.select(this), d, invert); })
            .on('dragend', function (d) { interaction.columnResizeEnd.call(self, d3.select(this), d); });

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/interaction/sortColumn.js
    Scrollgrid.prototype.internal.interaction.sortColumn = function (index, toggle) {
        var int = this.internal,
            interaction = int.interaction,
            sizes = int.sizes,
            virtual = sizes.virtual,
            c;
        // Clear existing sorts and set the new one
        for (c = 0; c < this.columns.length; c += 1) {
            if (c !== index) {
                delete this.columns[c].sort;
            } else if (toggle) {
                this.columns[c].sort = (this.columns[c].sort === 'desc' ? 'asc' : 'desc');
            }
        }
        // Instruct the adapter to perform a sort
        this.adapter.sort(index, virtual.top, virtual.bottom, this.columns[index].sort === 'desc', this.columns[index].compareFunction || interaction.defaultComparer);
        this.refresh();
    };


    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/raise.js
    Scrollgrid.prototype.internal.raise = function (err) {
        var log = this.reporter || console;
        if (log && log.error) {
            log.error(err);
        } else {
            throw err;
        }
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/applyRules.js
    Scrollgrid.prototype.internal.render.applyRules = function (data) {

        var int = this.internal,
            render = int.render,
            sizes = int.sizes,
            virtual = sizes.virtual,
            rule,
            key,
            ruleDefinition = {},
            i,
            k,
            r,
            c;

        if (render.formatRules) {

            // Iterate the focus data
            for (i = 0; i < data.length; i += 1) {

                ruleDefinition = {};

                // Rules use 1 based indices for rows and columns, this is because they use negative
                // notation to refer to elements from the end e.g. row: -1 = last row.  This would be
                // inconsistent if 0 was the first row.
                r = data[i].rowIndex + 1;
                c = data[i].columnIndex + 1;

                for (k = 0; k < render.formatRules.length; k += 1) {
                    rule = render.formatRules[k];
                    if (render.matchRule.call(this, rule.row, r, virtual.outerHeight) && render.matchRule.call(this, rule.column, c, virtual.outerWidth)) {
                        // Iterate the rule properties and apply them to the object
                        for (key in rule) {
                            if (rule.hasOwnProperty(key) && key !== "row" && key !== "column") {
                                ruleDefinition[key] = rule[key];
                            }
                        }
                    }
                }

                // Apply the combined rules
                if (ruleDefinition.formatter) {
                    data[i].formatter = ruleDefinition.formatter;
                }
                if (ruleDefinition.alignment) {
                    data[i].alignment = ruleDefinition.alignment;
                }
                if (ruleDefinition.cellPadding) {
                    data[i].cellPadding = ruleDefinition.cellPadding;
                }
                if (ruleDefinition.backgroundStyle) {
                    data[i].backgroundStyle += " " + ruleDefinition.backgroundStyle;
                }
                if (ruleDefinition.foregroundStyle) {
                    data[i].foregroundStyle += " " + ruleDefinition.foregroundStyle;
                }
                if (ruleDefinition.backgroundRender) {
                    data[i].renderStack[0] = ruleDefinition.backgroundRender;
                }
                if (ruleDefinition.foregroundRender) {
                    data[i].renderStack[1] = ruleDefinition.foregroundRender;
                }
                if (ruleDefinition.textRender) {
                    data[i].renderStack[2] = ruleDefinition.textRender;
                }
                if (ruleDefinition.fullRender) {
                    data[i].renderStack = []
                        .concat(ruleDefinition.fullRender)
                        .concat(render.renderSortIcon);
                }
            }
        }
    };


    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/calculateCellAdjustments.js
    Scrollgrid.prototype.internal.render.calculateCellAdjustments = function (row, column) {

        var int = this.internal,
            sizes = int.sizes,
            virtual = sizes.virtual,
            physical = sizes.physical,
            extension = {
                x: 0,
                y: 0,
                boxHeight: 0,
                boxWidth: 0,
                textHeight: 0,
                textWidth: 0
            };

        // If the cell is a columns header or footer and the column is the last in the dataset we need to extend the width
        // to remove the gap for the scrollbar
        if ((row < virtual.top || row >= virtual.outerHeight - virtual.bottom) && column === virtual.outerWidth - virtual.right - 1) {
            extension.boxWidth += physical.verticalScrollbarWidth;
        }
        // If the cell is a row header or footer and the row is the last in the dataset we need to extend the height to
        // remove the gap for the scrollbar
        if ((column < virtual.left || column >= virtual.outerWidth - virtual.right) && row === virtual.outerHeight - virtual.bottom - 1) {
            extension.boxHeight += physical.horizontalScrollbarHeight;
        }
        // If the cell is the last column header reduce height by 1 to show the bottom gridline
        if (row === virtual.top - 1) {
            extension.boxHeight -= 1;
        }
        // If the cell is the first row after a column header and there is a column header extend it up to hide the top line
        if (row === virtual.top && row > 0) {
            extension.boxHeight += 1;
            extension.y -= 1;
        }
        // If the cell is the last row header reduce width by 1 to show the right gridline
        if (column === virtual.left - 1) {
            extension.boxWidth -= 1;
        }
        // If the cell is the first column after a row header and there is a row header extend it left to hide the top line
        if (column === virtual.left && column > 0) {
            extension.boxWidth += 1;
            extension.x -= 1;
        }
        // If the cell is in the last row shrink it to show the bottom line
        if (row === virtual.outerHeight - 1) {
            extension.boxHeight -= 1;
        }
        // If the cell is in the last column shrink it to show the right line
        if (column === virtual.outerWidth - 1) {
            extension.boxWidth -= 1;
        }
        // If the cell is in the last row of the column headers and the column is being sorted
        if (row === virtual.top - 1) {
            // Set the sort icon to that of the column
            extension.sortIcon = (this.columns[column] ? this.columns[column].sort : undefined);
        }

        return extension;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/cropText.js
    Scrollgrid.prototype.internal.render.cropText = function (textShape, width) {

        var textWidth = textShape.node().getBBox().width,
            text = textShape.text(),
            avgChar = textWidth / text.length,
            // Deliberately overestimate to start with and reduce toward target
            chars = Math.ceil(width / avgChar) + 1;

        // Store the unabbreviated text
        textShape.datum().originalText = text;

        // Handle cases where chars is < 0 (negative width) so it never enters while loop
        if (chars <= 0) {
            textShape.text("");
        }

        while (textWidth > width && chars >= 0) {
            if (chars === 0) {
                textShape.text("");
            } else {
                textShape.text(text.substring(0, chars));
            }
            textWidth = textShape.node().getBBox().width;
            chars -= 1;
        }

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/draw.js
    Scrollgrid.prototype.internal.render.draw = function () {

        var int = this.internal,
            render = int.render,
            sizes = int.sizes,
            dom = int.dom,
            virtual = sizes.virtual,
            physical = sizes.physical,
            physicalViewArea = render.getVisibleRegion.call(this),
            viewArea = render.getDataBounds.call(this, physicalViewArea),
            totalWidth,
            totalHeight,
            fixedSize = {},
            p = viewArea.physical,
            v = viewArea.virtual,
            y = {
                top: { top: 0, bottom: virtual.top },
                middle: { top: virtual.top + v.top, bottom: virtual.top + v.bottom },
                bottom: { top: virtual.outerHeight - virtual.bottom, bottom: virtual.outerHeight }
            },
            x = {
                left: { left: 0, right: virtual.left },
                middle: { left: virtual.left + v.left, right: virtual.left + v.right },
                right: { left: virtual.outerWidth - virtual.right, right: virtual.outerWidth }
            };

        // Draw the separate regions
        render.renderRegion.call(this, dom.top.left, {}, x.left, y.top);
        render.renderRegion.call(this, dom.top, { x: p.x }, x.middle, y.top);
        render.renderRegion.call(this, dom.top.right, {}, x.right, y.top);
        render.renderRegion.call(this, dom.left, { y: p.y }, x.left, y.middle);
        render.renderRegion.call(this, dom.main, { x: p.x, y: p.y }, x.middle, y.middle);
        render.renderRegion.call(this, dom.right, { y: p.y }, x.right, y.middle);
        render.renderRegion.call(this, dom.bottom.left, {}, x.left, y.bottom);
        render.renderRegion.call(this, dom.bottom, { x: p.x }, x.middle, y.bottom);
        render.renderRegion.call(this, dom.bottom.right, {}, x.right, y.bottom);

        // Calculate if the rendering means that the width of the
        // whole table should change and layout accordingly
        totalWidth = (physical.left + physical.totalInnerWidth + physical.right + physical.verticalScrollbarWidth);
        fixedSize.width = (totalWidth < dom.parent.node().offsetWidth ? totalWidth : null);
        totalHeight = (physical.top + physical.totalInnerHeight + physical.bottom + physical.horizontalScrollbarHeight);
        fixedSize.height = (totalHeight < dom.parent.node().offsetHeight ? totalHeight : null);
        dom.layoutDOM.call(this, fixedSize);

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/getDataBounds.js
    Scrollgrid.prototype.internal.render.getDataBounds = function (physicalViewArea) {

        var i,
            int = this.internal,
            cols = this.columns,
            sizes = int.sizes,
            virtual = sizes.virtual,
            physical = sizes.physical,
            runningX = 0,
            columnWidth,
            left,
            right,
            bounds = {
                physical: {
                    x: 0,
                    y: 0
                },
                virtual: {
                    top: Math.max(Math.floor(virtual.innerHeight * (physicalViewArea.top / physical.totalInnerHeight) - 1), 0),
                    bottom: Math.min(Math.ceil(virtual.innerHeight * (physicalViewArea.bottom / physical.totalInnerHeight) + 1), virtual.innerHeight)
                }
            };

        bounds.physical.y = bounds.virtual.top * physical.rowHeight - physicalViewArea.top;
        for (i = 0; i < virtual.innerWidth; i += 1) {
            columnWidth = cols[i + virtual.left].width;
            if (left === undefined && (i === virtual.innerWidth - 1 || runningX + columnWidth > physicalViewArea.left)) {
                left = i;
                bounds.physical.x = runningX - physicalViewArea.left;
            }
            if (right === undefined && (i === virtual.innerWidth - 1 || runningX + columnWidth > physicalViewArea.right)) {
                right = i + 1;
                break;
            }
            runningX += columnWidth;
        }

        bounds.virtual.left = Math.max(Math.floor(left), 0);
        bounds.virtual.right = Math.min(Math.ceil(right + 1), virtual.innerWidth);

        return bounds;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/getDataInBounds.js
    Scrollgrid.prototype.internal.render.getDataInBounds = function (viewArea) {

        var i, r, c, x,
            int = this.internal,
            sizes = int.sizes,
            render = int.render,
            physical = sizes.physical,
            cols = this.columns,
            column,
            runningX,
            runningY,
            rowHeight = 0,
            visibleData = [],
            adjustments,
            getValue;

        runningY = viewArea.startY;

        // Load the data range and get the accessor
        getValue = this.adapter.loadDataRange(viewArea);

        for (r = viewArea.top || 0, i = 0; r < viewArea.bottom || 0; r += 1) {
            rowHeight = physical.getRowHeight.call(this, r);
            runningX = viewArea.startX || 0;
            for (c = viewArea.left || 0; c < viewArea.right || 0; c += 1, i += 1) {
                // Get any measurement modifiers based on cell position
                adjustments = render.calculateCellAdjustments.call(this, r, c);
                // Get the column definition
                column = cols[c];
                // Get the x position of the cell
                x = Math.floor(runningX) + adjustments.x + 0.5;
                // Using direct assignment for speed
                visibleData[i] = {
                    key: c + '_' + r,
                    x: x,
                    y: Math.floor(runningY) + adjustments.y + 0.5,
                    boxWidth: Math.ceil(column.width) + adjustments.boxWidth,
                    boxHeight: Math.ceil(rowHeight) + adjustments.boxHeight,
                    textWidth: Math.ceil(column.width) + adjustments.textWidth,
                    textHeight: Math.ceil(rowHeight) + adjustments.textHeight,
                    backgroundStyle: this.style.cellBackgroundPrefix + 'r' + (r + 1) + ' ' + this.style.cellBackgroundPrefix + 'c' + (c + 1),
                    foregroundStyle: this.style.cellForegroundPrefix + 'r' + (r + 1) + ' ' + this.style.cellForegroundPrefix + 'c' + (c + 1),
                    sortIcon: adjustments.sortIcon || 'none',
                    cellPadding: physical.cellPadding,
                    alignment: 'left',
                    rowIndex: r,
                    columnIndex: c,
                    column: column,
                    formatter: null,
                    getValue: getValue,
                    renderStack: [
                        render.renderBackground,
                        render.renderForeground,
                        render.renderText,
                        render.renderSortIcon
                    ]
                };
                runningX += column.width;
            }
            runningY += rowHeight;
        }

        // Modify the data based on the user rules
        render.applyRules.call(this, visibleData);

        return visibleData;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/getTextAnchor.js
    Scrollgrid.prototype.internal.render.getTextAnchor = function (d) {
        var anchor = 'start';
        if (d.alignment === 'center') {
            anchor = 'middle';
        } else if (d.alignment === 'right') {
            anchor = 'end';
        }
        return anchor;
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/getTextPosition.js
    Scrollgrid.prototype.internal.render.getTextPosition = function (d) {
        var int = this.internal,
            render = int.render,
            x;
        if (d.alignment === 'center') {
            x = d.textWidth / 2;
        } else if (d.alignment === 'right') {
            x = d.textWidth - d.cellPadding;
        } else {
            x = d.cellPadding;
            if (d.sortIcon && d.sortIcon !== 'none') {
                x += render.sortIconSize + d.cellPadding;
            }
        }
        return x;
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/getVisibleRegion.js
    Scrollgrid.prototype.internal.render.getVisibleRegion = function () {

        var int = this.internal,
            dom = int.dom,
            visibleRegion;

        visibleRegion = {};

        visibleRegion.left = dom.main.viewport.node().scrollLeft;
        visibleRegion.top = dom.main.viewport.node().scrollTop;
        visibleRegion.right = visibleRegion.left + dom.main.viewport.node().clientWidth;
        visibleRegion.bottom = visibleRegion.top + dom.main.viewport.node().clientHeight;

        return visibleRegion;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/matchRule.js
    Scrollgrid.prototype.internal.render.matchRule = function (ruleSelector, toCompare, extremity) {

        // Default for selection is to match.  So no row or column definition will match all
        var match = false,
            defs,
            rangeMarker,
            lhs,
            rhs,
            i;

        // Valid rule selectors are:
        //      "12"            Match 12th element of dimension
        //      "12,14"         Match 12th and 14th element of dimension
        //      "12:14"         Match 12th, 13th and 14th element of dimension
        //      "12:14,16"      Match 12th, 13th, 14th and 16th element of dimension
        //      "-1"            Match last element of dimension
        //      "-2:-1"         Match last two elements of dimension
        //      "2:-2"          Match all but first and last elements
        //      "*"             Match all elements (same as no selector
        if (!ruleSelector || ruleSelector === "*") {
            match = true;
        } else {
            // Split comma separated into an array, each sub-element can be processed as a rule on its own
            defs = ruleSelector.toString().replace(/\s/g, '').split(",");
            for (i = 0; i < defs.length; i += 1) {
                rangeMarker = defs[i].indexOf(":");
                if (rangeMarker !== -1) {
                    // Handle ranges
                    lhs = parseFloat(defs[i].substring(0, rangeMarker));
                    rhs = parseFloat(defs[i].substring(rangeMarker + 1));
                } else {
                    // Create as a range where both ends match
                    lhs = parseFloat(defs[i]);
                    rhs = lhs;
                }
                // Handle the requirement for negatives to come from the end of the set
                lhs = (lhs < 0 ? extremity + lhs + 1 : lhs);
                rhs = (rhs < 0 ? extremity + rhs + 1 : rhs);
                // Match them from min to max regardless of the way they are defined
                match = match || (Math.min(lhs, rhs) <= toCompare && Math.max(lhs, rhs) >= toCompare);
                // If any match the rule passes
                if (match) {
                    break;
                }
            }
        }

        return match;

    };


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

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/renderCell.js
    Scrollgrid.prototype.internal.render.renderCell = function (target, datum, add) {
        var i;
        if (datum.renderStack && datum.renderStack.length > 0) {
            for (i = 0; i < datum.renderStack.length; i += 1) {
                if (datum.renderStack[i]) {
                    datum.renderStack[i].call(this, target, datum, add);
                }
            }
        }
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/renderText.js
    Scrollgrid.prototype.internal.render.renderText = null;

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

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/render/setDefaultStyles.js
    Scrollgrid.prototype.internal.render.setDefaultStyles = function () {

        // Define default classes, these are kept external as users might want to use their own
        this.style = {
            left: {
                panel: 'sg-fixed sg-left'
            },
            top: {
                panel: 'sg-fixed sg-top',
                left: {
                    panel: 'sg-fixed sg-top-left'
                },
                right: {
                    panel: 'sg-fixed sg-top-right'
                }
            },
            right: {
                panel: 'sg-fixed sg-right',
                left: {
                    panel: 'sg-fixed sg-top-left'
                }
            },
            bottom: {
                panel: 'sg-fixed sg-bottom',
                left: {
                    panel: 'sg-fixed sg-bottom-left'
                },
                right: {
                    panel: 'sg-fixed sg-bottom-right'
                }
            },
            main: {
                panel: 'sg-grid'
            },
            resizeHandle: 'sg-resize-handle',
            cellBackgroundPrefix: 'sg-cell-background-',
            cellForegroundPrefix: 'sg-cell-foreground-',
            sortIcon: 'sg-sort-icon'
        };

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/sizes/calculatePhysicalBounds.js
    Scrollgrid.prototype.internal.sizes.calculatePhysicalBounds = function (topMargin) {

        var int = this.internal,
            sizes = int.sizes,
            virtual = sizes.virtual,
            physical = sizes.physical,
            i;

        // Variable column widths mean horizontal sizes cost O(n) to calculate
        physical.left = 0;
        for (i = 0; i < virtual.left; i += 1) {
            physical.left += this.columns[i].width;
        }
        physical.totalInnerWidth = 0;
        for (i = virtual.left; i < virtual.outerWidth - virtual.right; i += 1) {
            physical.totalInnerWidth += this.columns[i].width;
        }
        physical.right = 0;
        for (i = virtual.outerWidth - virtual.right; i < virtual.outerWidth; i += 1) {
            physical.right += this.columns[i].width;
        }

        // Keeping static row height means vertical position calculations can stay O(1)
        physical.top = virtual.top * physical.headerRowHeight;
        physical.bottom = virtual.bottom * physical.footerRowHeight;
        physical.visibleInnerWidth = int.dom.container.node().offsetWidth - physical.left - physical.right;
        physical.visibleInnerHeight = int.dom.container.node().offsetHeight - physical.top - physical.bottom - topMargin;
        physical.totalInnerHeight = virtual.innerHeight * physical.rowHeight;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/sizes/calculateTextBound.js
    Scrollgrid.prototype.internal.sizes.calculateTextBound = function (surface, text) {

        var toMeasure,
            bounds,
            returnBounds = { width: 0, height: 0 };

        // Append some text for measuring
        toMeasure = surface.append('text').text(text);
        // Get the bounds
        bounds = toMeasure.node().getBBox();
        // Parse into a simpler object because the BBox object
        // has some IE restrictions
        returnBounds.width = bounds.width;
        returnBounds.height = bounds.height;
        // Remove from the dom
        toMeasure.remove();

        return returnBounds;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/sizes/getExistingTextBound.js
    Scrollgrid.prototype.internal.sizes.getExistingTextBound = function (surface, column, row) {

        var int = this.internal,
            render = int.render,
            returnBounds = { width: 0, height: 0 };

        // Measuring header values is easier because they are all rendered
        surface.selectAll("text")
            .filter(function (d) {
                return (column === undefined || d.columnIndex === column) && (row === undefined || d.rowIndex === row);
            })
            .each(function (d) {
                var shape = d3.select(this),
                    originalText = shape.text(),
                    b;
                // Remove any abbreviation
                shape.text(shape.datum().originalText || shape.text());
                // Get the bounds
                b = shape.node().getBBox();
                if (b.width + 2 * d.cellPadding > returnBounds.width) {
                    returnBounds.width = b.width + 2 * d.cellPadding + (d.sortIcon && d.sortIcon !== 'none' ? render.sortIconSize + d.cellPadding : 0);
                }
                if (b.height > returnBounds.height) {
                    returnBounds.height = b.height;
                }
                // Reapply abbreviation
                shape.text(originalText);
            });

        return returnBounds;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/sizes/getRowHeight.js
    Scrollgrid.prototype.internal.sizes.physical.getRowHeight = function (row) {

        var int = this.internal,
            sizes = int.sizes,
            physical = sizes.physical,
            virtual = sizes.virtual,
            rowHeight = 0;

        if (row < virtual.top) {
            rowHeight = physical.headerRowHeight;
        } else if (row < virtual.outerHeight - virtual.bottom) {
            rowHeight = physical.rowHeight;
        } else {
            rowHeight = physical.footerRowHeight;
        }

        return rowHeight;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/internal/sizes/initialiseColumns.js
    Scrollgrid.prototype.internal.sizes.physical.initialiseColumns = function () {

        var i,
            int = this.internal,
            render = int.render,
            sizes = int.sizes,
            physical = sizes.physical,
            virtual = sizes.virtual,
            rule;

        // Initialise the columns if required
        this.columns = this.columns || [];

        for (i = 0; i < virtual.outerWidth; i += 1) {
            // Initialise with a default to ensure we always have a width
            this.columns[i] = this.columns[i] || {};
            this.columns[i].width = this.columns[i].width || physical.defaultColumnWidth;

            if (render.formatRules && render.formatRules.length > 0) {
                for (rule = 0; rule < render.formatRules.length; rule += 1) {
                    if (render.matchRule.call(this, render.formatRules[rule].column, i + 1, virtual.outerWidth)) {
                        this.columns[i] = {
                            width: render.formatRules[rule].columnWidth || this.columns[i].width,
                            sort: render.formatRules[rule].sort || this.columns[i].sort,
                            compareFunction: render.formatRules[rule].compareFunction || this.columns[i].compareFunction
                        };
                    }
                }
            }
        }

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/external/adapters/json.js
    Scrollgrid.adapters.json = function (data, columns, options) {

        options = options || {};

        var columnLookup = {},
            headRow = {},
            cols = columns || [],
            table = data,
            key,
            sampleSize = options.rowSampleSize || 100,
            i;

        // If columns aren't provided find them from the data
        if (cols.length === 0) {
            for (i = 0; i < Math.min(table.length, sampleSize); i += 1) {
                for (key in table[i]) {
                    if (table[i].hasOwnProperty(key)) {
                        if (columnLookup[key] === undefined) {
                            columnLookup[key] = cols.length;
                            cols.push(key);
                        }
                    }
                }
            }
        }

        for (i = 0; i < cols.length; i += 1) {
            headRow[cols[i]] = cols[i];
        }

        table.splice(0, 0, headRow);

        return {
            rowCount: function () { return table.length; },
            columnCount: function () { return cols.length; },
            sort: function (column, headers, footers, descending, compareFunction) {
                var heads = table.splice(0, headers),
                    foots = table.splice(table.length - footers),
                    i;
                table.sort(function (a, b) {
                    return compareFunction(a[cols[column]], b[cols[column]]) * (descending ? -1 : 1);
                });
                for (i = heads.length - 1; i >= 0; i -= 1) {
                    table.splice(0, 0, heads[i]);
                }
                for (i = 0; i < foots.length; i += 1) {
                    table.push(foots[i]);
                }
            },
            loadDataRange: function () {
                return function (row, column, callback) {
                    callback(table[row][cols[column]] || 0);
                };
            }
        };
    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/external/adapters/simple.js
    Scrollgrid.adapters.simple = function (data, options) {

        options = options || {};

        var columnCount = 0,
            table = data,
            sampleSize = options.rowSampleSize || 100,
            i;

        // Find the longest length of the data sub arrays
        for (i = 0; i < Math.min(table.length, sampleSize); i += 1) {
            if (table[i] && Object.prototype.toString.call(table[i]) === '[object Array]') {
                if (table[i].length > columnCount) {
                    columnCount = table[i].length;
                }
            }
        }

        return {
            rowCount: function () { return table.length; },
            columnCount: function () { return columnCount; },
            sort: function (column, headers, footers, descending, compareFunction) {
                var heads = table.splice(0, headers),
                    foots = table.splice(table.length - footers),
                    i;
                table.sort(function (a, b) {
                    return compareFunction(a[column], b[column]) * (descending ? -1 : 1);
                });
                for (i = heads.length - 1; i >= 0; i -= 1) {
                    table.splice(0, 0, heads[i]);
                }
                for (i = 0; i < foots.length; i += 1) {
                    table.push(foots[i]);
                }
            },
            loadDataRange: function () {
                return function (row, column, callback) {
                    callback(table[row][column]);
                };
            }
        };

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/external/data.js
    Scrollgrid.prototype.data = function (data) {
        var int = this.internal,
            sizes = int.sizes,
            physical = sizes.physical,
            virtual = sizes.virtual,
            interaction = int.interaction,
            c;

        if (data) {

            // If the dataAdapter is an array, treat it as the data itself and instantiate with the default adapter
            if (Object.prototype.toString.call(data) === '[object Array]') {
                this.adapter = Scrollgrid.adapters.simple(data);
            } else {
                this.adapter = data;
            }
            virtual.outerHeight = this.adapter.rowCount();
            virtual.outerWidth = this.adapter.columnCount();

            // Set up the columns
            physical.initialiseColumns.call(this);

            // If any of the columns have a sort it should be applied
            for (c = 0; c < this.columns.length; c += 1) {
                if (this.columns[c].sort === 'asc' || this.columns[c].sort === 'desc') {
                    interaction.sortColumn.call(this, c, false);
                }
            }

            // Calculate the bounds of the data displayable in the main grid
            virtual.innerWidth = virtual.outerWidth - virtual.left - virtual.right;
            virtual.innerHeight = virtual.outerHeight - virtual.top - virtual.bottom;

            // Render the control
            this.refresh();

        }

        return this.adapter;

    };

    // Copyright: 2015 AlignAlytics
    // License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
    // Source: /src/external/refresh.js
    Scrollgrid.prototype.refresh = function () {
        var int = this.internal,
            render = int.render,
            dom = int.dom;
        // Call the instantiated layout refresh
        dom.layoutDOM.call(this);
        render.draw.call(this);
        dom.setScrollerSize.call(this);
    };

    return Scrollgrid;

}));
