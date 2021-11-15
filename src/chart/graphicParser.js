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
 * @typedef {Object} GraphicData List of drawings indexed by type
 * @prop {GraphicLabel[]} labels List of labels drawings
 * @prop {GraphicLine[]} lines List of lines drawings
 * @prop {GraphicBox[]} boxes List of boxes drawings
 * @prop {GraphicTable[]} tables List of tables drawings
 */

/**
 * @param {Object} rawGraphic Raw graphic data
 * @param {Object} indexes Drawings xPos indexes
 * @returns {GraphicData}
 */
module.exports = function graphicParse(rawGraphic = {}, indexes = []) {
  // console.log(rawGraphic, indexes);
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

    raw: rawGraphic,
  };
};
