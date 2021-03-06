
// Copyright: 2017 AlignAlytics
// License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
// Source: /src/internal/dom/populatePanel.js
Scrollgrid.prototype.internal.dom.populatePanel = function () {
    "use strict";

    var elems = this.elements,
        panel = {};

    panel.svg = elems.container.append('svg');
    panel.transform = panel.svg.append('g');
    panel.content = panel.transform.append('g');

    return panel;
};
