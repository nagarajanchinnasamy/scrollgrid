
// Copyright: 2017 AlignAlytics
// License: "https://github.com/PMSI-AlignAlytics/scrollgrid/blob/master/MIT-LICENSE.txt"
// Source: /src/external/allowColumnResizing.js
Scrollgrid.prototype.allowColumnResizing = function (value, silent) {
    "use strict";

    var props = this.properties,
        result;

    if (value === undefined) {
        result = props.allowColumnResizing;
    } else {
        // Set the value and redraw but return self for chaining
        props.allowColumnResizing = value;
        result = this;
        if (!silent) {
            this.refresh();
        }
    }

    return result;

};
