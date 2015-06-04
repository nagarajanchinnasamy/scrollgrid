
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