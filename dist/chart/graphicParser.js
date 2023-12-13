var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var TRANSLATOR = {
    /** @typedef {'right' | 'left' | 'both' | 'none'} ExtendValue */
    extend: {
        r: 'right',
        l: 'left',
        b: 'both',
        n: 'none',
    },
    /** @typedef {'price' | 'abovebar' | 'belowbar'} yLocValue */
    yLoc: {
        pr: 'price',
        ab: 'abovebar',
        bl: 'belowbar',
    },
    /**
     * @typedef {'none' | 'xcross' | 'cross' | 'triangleup'
     * | 'triangledown' | 'flag' | 'circle' | 'arrowup'
     * | 'arrowdown' | 'label_up' | 'label_down' | 'label_left'
     * | 'label_right' | 'label_lower_left' | 'label_lower_right'
     * | 'label_upper_left' | 'label_upper_right' | 'label_center'
     * | 'square' | 'diamond'
     * } LabelStyleValue
     * */
    labelStyle: {
        n: 'none',
        xcr: 'xcross',
        cr: 'cross',
        tup: 'triangleup',
        tdn: 'triangledown',
        flg: 'flag',
        cir: 'circle',
        aup: 'arrowup',
        adn: 'arrowdown',
        lup: 'label_up',
        ldn: 'label_down',
        llf: 'label_left',
        lrg: 'label_right',
        llwlf: 'label_lower_left',
        llwrg: 'label_lower_right',
        luplf: 'label_upper_left',
        luprg: 'label_upper_right',
        lcn: 'label_center',
        sq: 'square',
        dia: 'diamond',
    },
    /**
     * @typedef {'solid' | 'dotted' | 'dashed'| 'arrow_left'
     * | 'arrow_right' | 'arrow_both'} LineStyleValue
     */
    lineStyle: {
        sol: 'solid',
        dot: 'dotted',
        dsh: 'dashed',
        al: 'arrow_left',
        ar: 'arrow_right',
        ab: 'arrow_both',
    },
    /** @typedef {'solid' | 'dotted' | 'dashed'} BoxStyleValue */
    boxStyle: {
        sol: 'solid',
        dot: 'dotted',
        dsh: 'dashed',
    },
};
/**
 * @typedef {'auto' | 'huge' | 'large'
 * | 'normal' | 'small' | 'tiny'} SizeValue
 */
/** @typedef {'top' | 'center' | 'bottom'} VAlignValue */
/** @typedef {'left' | 'center' | 'right'} HAlignValue */
/** @typedef {'none' | 'auto'} TextWrapValue */
/**
 * @typedef {'top_left' | 'top_center' | 'top_right'
 * | 'middle_left' | 'middle_center' | 'middle_right'
 * | 'bottom_left' | 'bottom_center' | 'bottom_right'
 * } TablePositionValue
 */
/**
 * @typedef {Object} GraphicLabel
 * @prop {number} id Drawing ID
 * @prop {number} x Label x position
 * @prop {number} y Label y position
 * @prop {yLocValue} yLoc yLoc mode
 * @prop {string} text Label text
 * @prop {LabelStyleValue} style Label style
 * @prop {number} color
 * @prop {number} textColor
 * @prop {SizeValue} size Label size
 * @prop {HAlignValue} textAlign Text horizontal align
 * @prop {string} toolTip Tooltip text
 */
/**
 * @typedef {Object} GraphicLine
 * @prop {number} id Drawing ID
 * @prop {number} x1 First x position
 * @prop {number} y1 First y position
 * @prop {number} x2 Second x position
 * @prop {number} y2 Second y position
 * @prop {ExtendValue} extend Horizontal extend
 * @prop {LineStyleValue} style Line style
 * @prop {number} color Line color
 * @prop {number} width Line width
 */
/**
 * @typedef {Object} GraphicBox
 * @prop {number} id Drawing ID
 * @prop {number} x1 First x position
 * @prop {number} y1 First y position
 * @prop {number} x2 Second x position
 * @prop {number} y2 Second y position
 * @prop {number} color Box color
 * @prop {number} bgColor Background color
 * @prop {ExtendValue} extend Horizontal extend
 * @prop {BoxStyleValue} style Box style
 * @prop {number} width Box width
 * @prop {string} text Text
 * @prop {SizeValue} textSize Text size
 * @prop {number} textColor Text color
 * @prop {VAlignValue} textVAlign Text vertical align
 * @prop {HAlignValue} textHAlign Text horizontal align
 * @prop {TextWrapValue} textWrap Text wrap
 */
/**
 * @typedef {Object} TableCell
 * @prop {number} id Drawing ID
 * @prop {string} text Cell text
 * @prop {number} width Cell width
 * @prop {number} height Cell height
 * @prop {number} textColor Text color
 * @prop {HAlignValue} textHAlign Text horizontal align
 * @prop {VAlignValue} textVAlign Text Vertical align
 * @prop {SizeValue} textSize Text size
 * @prop {number} bgColor Background color
 */
/**
 * @typedef {Object} GraphicTable
 * @prop {number} id Drawing ID
 * @prop {TablePositionValue} position Table position
 * @prop {number} rows Number of rows
 * @prop {number} columns Number of columns
 * @prop {number} bgColor Background color
 * @prop {number} frameColor Frame color
 * @prop {number} frameWidth Frame width
 * @prop {number} borderColor Border color
 * @prop {number} borderWidth Border width
 * @prop {() => TableCell[][]} cells Table cells matrix
 */
/**
 * @typedef {Object} GraphicHorizline
 * @prop {number} id Drawing ID
 * @prop {number} level Y position of the line
 * @prop {number} startIndex Start index of the line (`chart.periods[line.startIndex]`)
 * @prop {number} endIndex End index of the line (`chart.periods[line.endIndex]`)
 * @prop {boolean} extendRight Is the line extended to the right
 * @prop {boolean} extendLeft Is the line extended to the left
 */
/**
 * @typedef {Object} GraphicPoint
 * @prop {number} index X position of the point
 * @prop {number} level Y position of the point
 */
/**
 * @typedef {Object} GraphicPolygon
 * @prop {number} id Drawing ID
 * @prop {GraphicPoint[]} points List of polygon points
 */
/**
 * @typedef {Object} GraphicHorizHist
 * @prop {number} id Drawing ID
 * @prop {number} priceLow Low Y position
 * @prop {number} priceHigh High Y position
 * @prop {number} firstBarTime First X position
 * @prop {number} lastBarTime Last X position
 * @prop {number[]} rate List of values
 */
/**
 * @typedef {Object} GraphicData List of drawings indexed by type
 * @prop {GraphicLabel[]} labels List of labels drawings
 * @prop {GraphicLine[]} lines List of lines drawings
 * @prop {GraphicBox[]} boxes List of boxes drawings
 * @prop {GraphicTable[]} tables List of tables drawings
 * @prop {GraphicPolygon[]} polygons List of polygons drawings
 * @prop {GraphicHorizHist[]} horizHists List of horizontal histograms drawings
 * @prop {GraphicHorizline[]} horizLines List of horizontal lines drawings
 */
/**
 * @param {Object} rawGraphic Raw graphic data
 * @param {Object} indexes Drawings xPos indexes
 * @returns {GraphicData}
 */
module.exports = function graphicParse(rawGraphic, indexes) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (rawGraphic === void 0) { rawGraphic = {}; }
    if (indexes === void 0) { indexes = []; }
    // console.log('indexes', indexes);
    return {
        labels: Object.values((_a = rawGraphic.dwglabels) !== null && _a !== void 0 ? _a : {}).map(function (l) {
            var _a, _b;
            return ({
                id: l.id,
                x: indexes[l.x],
                y: l.y,
                yLoc: (_a = TRANSLATOR.yLoc[l.yl]) !== null && _a !== void 0 ? _a : l.yl,
                text: l.t,
                style: (_b = TRANSLATOR.labelStyle[l.st]) !== null && _b !== void 0 ? _b : l.st,
                color: l.ci,
                textColor: l.tci,
                size: l.sz,
                textAlign: l.ta,
                toolTip: l.tt,
            });
        }),
        lines: Object.values((_b = rawGraphic.dwglines) !== null && _b !== void 0 ? _b : {}).map(function (l) {
            var _a, _b;
            return ({
                id: l.id,
                x1: indexes[l.x1],
                y1: l.y1,
                x2: indexes[l.x2],
                y2: l.y2,
                extend: (_a = TRANSLATOR.extend[l.ex]) !== null && _a !== void 0 ? _a : l.ex,
                style: (_b = TRANSLATOR.lineStyle[l.st]) !== null && _b !== void 0 ? _b : l.st,
                color: l.ci,
                width: l.w,
            });
        }),
        boxes: Object.values((_c = rawGraphic.dwgboxes) !== null && _c !== void 0 ? _c : {}).map(function (b) {
            var _a, _b;
            return ({
                id: b.id,
                x1: indexes[b.x1],
                y1: b.y1,
                x2: indexes[b.x2],
                y2: b.y2,
                color: b.c,
                bgColor: b.bc,
                extend: (_a = TRANSLATOR.extend[b.ex]) !== null && _a !== void 0 ? _a : b.ex,
                style: (_b = TRANSLATOR.boxStyle[b.st]) !== null && _b !== void 0 ? _b : b.st,
                width: b.w,
                text: b.t,
                textSize: b.ts,
                textColor: b.tc,
                textVAlign: b.tva,
                textHAlign: b.tha,
                textWrap: b.tw,
            });
        }),
        tables: Object.values((_d = rawGraphic.dwgtables) !== null && _d !== void 0 ? _d : {}).map(function (t) { return ({
            id: t.id,
            position: t.pos,
            rows: t.rows,
            columns: t.cols,
            bgColor: t.bgc,
            frameColor: t.frmc,
            frameWidth: t.frmw,
            borderColor: t.brdc,
            borderWidth: t.brdw,
            cells: function () {
                var _a;
                var matrix = [];
                Object.values((_a = rawGraphic.dwgtablecells) !== null && _a !== void 0 ? _a : {}).forEach(function (cell) {
                    if (cell.tid !== t.id)
                        return;
                    if (!matrix[cell.row])
                        matrix[cell.row] = [];
                    matrix[cell.row][cell.col] = {
                        id: cell.id,
                        text: cell.t,
                        width: cell.w,
                        height: cell.h,
                        textColor: cell.tc,
                        textHAlign: cell.tha,
                        textVAlign: cell.tva,
                        textSize: cell.ts,
                        bgColor: cell.bgc,
                    };
                });
                return matrix;
            },
        }); }),
        horizLines: Object.values((_e = rawGraphic.horizlines) !== null && _e !== void 0 ? _e : {}).map(function (h) { return (__assign(__assign({}, h), { startIndex: indexes[h.startIndex], endIndex: indexes[h.endIndex] })); }),
        polygons: Object.values((_f = rawGraphic.polygons) !== null && _f !== void 0 ? _f : {}).map(function (p) { return (__assign(__assign({}, p), { points: p.points.map(function (pt) { return (__assign(__assign({}, pt), { index: indexes[pt.index] })); }) })); }),
        horizHists: Object.values((_g = rawGraphic.hhists) !== null && _g !== void 0 ? _g : {}).map(function (h) { return (__assign(__assign({}, h), { firstBarTime: indexes[h.firstBarTime], lastBarTime: indexes[h.lastBarTime] })); }),
        raw: function () { return rawGraphic; },
    };
};
