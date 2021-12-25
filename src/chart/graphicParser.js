/**
 * @typedef {Object} GraphicLabel
 * @prop {number} id Drawing ID
 */

/**
 * @typedef {Object} GraphicLine
 * @prop {number} id Drawing ID
 */

/**
 * @typedef {Object} GraphicBox
 * @prop {number} id Drawing ID
 */

/**
 * @typedef {Object} GraphicTable
 * @prop {number} id Drawing ID
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
module.exports = function graphicParse(rawGraphic = {}, indexes = []) {
  // console.log('indexes', indexes);
  return {
    labels: Object.values(rawGraphic.dwglabels ?? {}).map((l) => ({
      ...l,
    })),

    lines: Object.values(rawGraphic.dwglines ?? {}).map((l) => ({
      ...l,
    })),

    boxes: Object.values(rawGraphic.dwgboxes ?? {}).map((b) => ({
      ...b,
    })),

    tables: Object.values(rawGraphic.dwgtables ?? {}).map((t) => ({
      ...t,
    })),

    horizLines: Object.values(rawGraphic.horizlines ?? {}).map((h) => ({
      ...h,
      startIndex: indexes[h.startIndex],
      endIndex: indexes[h.endIndex],
    })),

    polygons: Object.values(rawGraphic.polygons ?? {}).map((p) => ({
      ...p,
      points: p.points.map((pt) => ({
        ...pt,
        index: indexes[pt.index],
      })),
    })),

    horizHists: Object.values(rawGraphic.hhists ?? {}).map((h) => ({
      ...h,
      firstBarTime: indexes[h.firstBarTime],
      lastBarTime: indexes[h.lastBarTime],
    })),

    raw: () => rawGraphic,
  };
};
