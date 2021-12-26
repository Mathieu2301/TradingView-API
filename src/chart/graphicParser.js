const TRANSLATOR = {
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
module.exports = function graphicParse(rawGraphic = {}, indexes = []) {
  // console.log('indexes', indexes);
  return {
    labels: Object.values(rawGraphic.dwglabels ?? {}).map((l) => ({
      id: l.id,
      x: indexes[l.x],
      y: l.y,
      yLoc: TRANSLATOR.yLoc[l.yl] ?? l.yl,
      text: l.t,
      style: TRANSLATOR.labelStyle[l.st] ?? l.st,
      color: l.ci,
      textColor: l.tci,
      size: l.sz,
      textAlign: l.ta,
      toolTip: l.tt,
    })),

    lines: Object.values(rawGraphic.dwglines ?? {}).map((l) => ({
      id: l.id,
      x1: indexes[l.x1],
      y1: l.y1,
      x2: indexes[l.x2],
      y2: l.y2,
      extend: TRANSLATOR.extend[l.ex] ?? l.ex,
      style: TRANSLATOR.lineStyle[l.st] ?? l.st,
      color: l.ci,
      width: l.w,
    })),

    boxes: Object.values(rawGraphic.dwgboxes ?? {}).map((b) => ({
      id: b.id,
      x1: indexes[b.x1],
      y1: b.y1,
      x2: indexes[b.x2],
      y2: b.y2,
      color: b.c,
      bgColor: b.bc,
      extend: TRANSLATOR.extend[b.ex] ?? b.ex,
      style: TRANSLATOR.boxStyle[b.st] ?? b.st,
      width: b.w,
      text: b.t,
      textSize: b.ts,
      textColor: b.tc,
      textVAlign: b.tva,
      textHAlign: b.tha,
      textWrap: b.tw,
    })),

    tables: Object.values(rawGraphic.dwgtables ?? {}).map((t) => ({
      id: t.id,
      position: t.pos,
      rows: t.rows,
      columns: t.cols,
      bgColor: t.bgc,
      frameColor: t.frmc,
      frameWidth: t.frmw,
      borderColor: t.brdc,
      borderWidth: t.brdw,
      cells: () => {
        const matrix = [];
        Object.values(rawGraphic.dwgtablecells ?? {}).forEach((cell) => {
          if (cell.tid !== t.id) return;
          if (!matrix[cell.row]) matrix[cell.row] = [];
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
