/** Raw graphics as sent by TradingView, indexed by type then drawing ID. */
export type RawGraphics = Record<string, Record<string, any>>;

export type ExtendValue = 'right' | 'left' | 'both' | 'none';
export type YLocValue = 'price' | 'abovebar' | 'belowbar';
export type LabelStyleValue =
  | 'none' | 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag' | 'circle'
  | 'arrowup' | 'arrowdown' | 'label_up' | 'label_down' | 'label_left' | 'label_right'
  | 'label_lower_left' | 'label_lower_right' | 'label_upper_left' | 'label_upper_right'
  | 'label_center' | 'square' | 'diamond';
export type LineStyleValue = 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both';
export type BoxStyleValue = 'solid' | 'dotted' | 'dashed';
export type SizeValue = 'auto' | 'huge' | 'large' | 'normal' | 'small' | 'tiny';
export type VAlignValue = 'top' | 'center' | 'bottom';
export type HAlignValue = 'left' | 'center' | 'right';
export type TextWrapValue = 'none' | 'auto';
export type TablePositionValue =
  | 'top_left' | 'top_center' | 'top_right'
  | 'middle_left' | 'middle_center' | 'middle_right'
  | 'bottom_left' | 'bottom_center' | 'bottom_right';

const TRANSLATOR = {
  extend: {
    r: 'right', l: 'left', b: 'both', n: 'none',
  } as Record<string, ExtendValue>,
  yLoc: { pr: 'price', ab: 'abovebar', bl: 'belowbar' } as Record<string, YLocValue>,
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
  } as Record<string, LabelStyleValue>,
  lineStyle: {
    sol: 'solid', dot: 'dotted', dsh: 'dashed', al: 'arrow_left', ar: 'arrow_right', ab: 'arrow_both',
  } as Record<string, LineStyleValue>,
  boxStyle: { sol: 'solid', dot: 'dotted', dsh: 'dashed' } as Record<string, BoxStyleValue>,
};

/**
 * X positions are expressed in bars back from the most recent bar loaded on
 * the chart (0 = latest bar). They are `undefined` when the bar is not loaded.
 */
export interface GraphicLabel {
  id: number;
  x: number | undefined;
  y: number;
  yLoc: YLocValue;
  text: string;
  style: LabelStyleValue;
  color: number;
  textColor: number;
  size: SizeValue;
  textAlign: HAlignValue;
  toolTip: string;
}

export interface GraphicLine {
  id: number;
  x1: number | undefined;
  y1: number;
  x2: number | undefined;
  y2: number;
  extend: ExtendValue;
  style: LineStyleValue;
  color: number;
  width: number;
}

export interface GraphicBox {
  id: number;
  x1: number | undefined;
  y1: number;
  x2: number | undefined;
  y2: number;
  color: number;
  bgColor: number;
  extend: ExtendValue;
  style: BoxStyleValue;
  width: number;
  text: string;
  textSize: SizeValue;
  textColor: number;
  textVAlign: VAlignValue;
  textHAlign: HAlignValue;
  textWrap: TextWrapValue;
}

export interface TableCell {
  id: number;
  text: string;
  width: number;
  height: number;
  textColor: number;
  textHAlign: HAlignValue;
  textVAlign: VAlignValue;
  textSize: SizeValue;
  bgColor: number;
}

export interface GraphicTable {
  id: number;
  position: TablePositionValue;
  rows: number;
  columns: number;
  bgColor: number;
  frameColor: number;
  frameWidth: number;
  borderColor: number;
  borderWidth: number;
  /** Cells as a `[row][column]` matrix. */
  cells: TableCell[][];
}

export interface GraphicHorizLine {
  id: number;
  level: number;
  startIndex: number | undefined;
  endIndex: number | undefined;
  extendRight: boolean;
  extendLeft: boolean;
  [key: string]: unknown;
}

export interface GraphicPoint {
  index: number | undefined;
  level: number;
  [key: string]: unknown;
}

export interface GraphicPolygon {
  id: number;
  points: GraphicPoint[];
  [key: string]: unknown;
}

export interface GraphicHorizHist {
  id: number;
  priceLow: number;
  priceHigh: number;
  firstBarTime: number | undefined;
  lastBarTime: number | undefined;
  rate: number[];
  [key: string]: unknown;
}

/** Drawings produced by an indicator, grouped by type. */
export interface GraphicsData {
  labels: GraphicLabel[];
  lines: GraphicLine[];
  boxes: GraphicBox[];
  tables: GraphicTable[];
  polygons: GraphicPolygon[];
  horizLines: GraphicHorizLine[];
  horizHists: GraphicHorizHist[];
  /** Unparsed graphics, including types this parser does not know. */
  raw: RawGraphics;
}

/**
 * Converts raw indicator graphics into readable objects.
 * @param indexes Maps graphic X indexes to "bars back" positions.
 */
export function parseGraphics(raw: RawGraphics = {}, indexes: ReadonlyArray<number | undefined> = []): GraphicsData {
  const values = (type: string) => Object.values(raw[type] ?? {});
  const x = (index: number) => indexes[index];

  return {
    labels: values('dwglabels').map((l) => ({
      id: l.id,
      x: x(l.x),
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

    lines: values('dwglines').map((l) => ({
      id: l.id,
      x1: x(l.x1),
      y1: l.y1,
      x2: x(l.x2),
      y2: l.y2,
      extend: TRANSLATOR.extend[l.ex] ?? l.ex,
      style: TRANSLATOR.lineStyle[l.st] ?? l.st,
      color: l.ci,
      width: l.w,
    })),

    boxes: values('dwgboxes').map((b) => ({
      id: b.id,
      x1: x(b.x1),
      y1: b.y1,
      x2: x(b.x2),
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

    tables: values('dwgtables').map((t) => {
      const cells: TableCell[][] = [];
      for (const cell of values('dwgtablecells')) {
        if (cell.tid !== t.id) continue;
        cells[cell.row] ??= [];
        cells[cell.row][cell.col] = {
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
      }
      return {
        id: t.id,
        position: t.pos,
        rows: t.rows,
        columns: t.cols,
        bgColor: t.bgc,
        frameColor: t.frmc,
        frameWidth: t.frmw,
        borderColor: t.brdc,
        borderWidth: t.brdw,
        cells,
      };
    }),

    horizLines: values('horizlines').map((h) => ({
      ...h,
      startIndex: x(h.startIndex),
      endIndex: x(h.endIndex),
    })),

    polygons: values('polygons').map((p) => ({
      ...p,
      points: (p.points ?? []).map((point: any) => ({ ...point, index: x(point.index) })),
    })),

    horizHists: values('hhists').map((h) => ({
      ...h,
      firstBarTime: x(h.firstBarTime),
      lastBarTime: x(h.lastBarTime),
    })),

    raw,
  };
}

/** Applies `graphicsCmds` (erase then create) to raw graphics in place. */
export function applyGraphicsCommands(graphics: RawGraphics, commands: any): void {
  for (const instruction of commands?.erase ?? []) {
    if (instruction.action === 'all') {
      if (!instruction.type) {
        for (const type of Object.keys(graphics)) graphics[type] = {};
      } else delete graphics[instruction.type];
    } else if (instruction.action === 'one' && instruction.type) {
      delete graphics[instruction.type]?.[instruction.id];
    }
  }

  for (const [type, groups] of Object.entries<any[]>(commands?.create ?? {})) {
    graphics[type] ??= {};
    for (const group of groups ?? []) {
      for (const item of group.data ?? []) graphics[type][item.id] = item;
    }
  }
}
