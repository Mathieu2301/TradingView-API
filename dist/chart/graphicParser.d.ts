declare function _exports(rawGraphic?: any, indexes?: any): GraphicData;
export = _exports;
export type SizeValue = 'auto' | 'huge' | 'large' | 'normal' | 'small' | 'tiny';
export type VAlignValue = 'top' | 'center' | 'bottom';
export type HAlignValue = 'left' | 'center' | 'right';
export type TextWrapValue = 'none' | 'auto';
export type TablePositionValue = 'top_left' | 'top_center' | 'top_right' | 'middle_left' | 'middle_center' | 'middle_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';
export type GraphicLabel = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * Label x position
     */
    x: number;
    /**
     * Label y position
     */
    y: number;
    /**
     * yLoc mode
     */
    yLoc: "price" | "abovebar" | "belowbar";
    /**
     * Label text
     */
    text: string;
    /**
     * Label style
     */
    style: "none" | "square" | "circle" | "xcross" | "cross" | "triangleup" | "triangledown" | "flag" | "arrowup" | "arrowdown" | "label_up" | "label_down" | "label_left" | "label_right" | "label_lower_left" | "label_lower_right" | "label_upper_left" | "label_upper_right" | "label_center" | "diamond";
    color: number;
    textColor: number;
    /**
     * Label size
     */
    size: SizeValue;
    /**
     * Text horizontal align
     */
    textAlign: HAlignValue;
    /**
     * Tooltip text
     */
    toolTip: string;
};
export type GraphicLine = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * First x position
     */
    x1: number;
    /**
     * First y position
     */
    y1: number;
    /**
     * Second x position
     */
    x2: number;
    /**
     * Second y position
     */
    y2: number;
    /**
     * Horizontal extend
     */
    extend: "both" | "none" | "left" | "right";
    /**
     * Line style
     */
    style: "solid" | "dotted" | "dashed" | "arrow_left" | "arrow_right" | "arrow_both";
    /**
     * Line color
     */
    color: number;
    /**
     * Line width
     */
    width: number;
};
export type GraphicBox = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * First x position
     */
    x1: number;
    /**
     * First y position
     */
    y1: number;
    /**
     * Second x position
     */
    x2: number;
    /**
     * Second y position
     */
    y2: number;
    /**
     * Box color
     */
    color: number;
    /**
     * Background color
     */
    bgColor: number;
    /**
     * Horizontal extend
     */
    extend: "both" | "none" | "left" | "right";
    /**
     * Box style
     */
    style: "solid" | "dotted" | "dashed";
    /**
     * Box width
     */
    width: number;
    /**
     * Text
     */
    text: string;
    /**
     * Text size
     */
    textSize: SizeValue;
    /**
     * Text color
     */
    textColor: number;
    /**
     * Text vertical align
     */
    textVAlign: VAlignValue;
    /**
     * Text horizontal align
     */
    textHAlign: HAlignValue;
    /**
     * Text wrap
     */
    textWrap: TextWrapValue;
};
export type TableCell = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * Cell text
     */
    text: string;
    /**
     * Cell width
     */
    width: number;
    /**
     * Cell height
     */
    height: number;
    /**
     * Text color
     */
    textColor: number;
    /**
     * Text horizontal align
     */
    textHAlign: HAlignValue;
    /**
     * Text Vertical align
     */
    textVAlign: VAlignValue;
    /**
     * Text size
     */
    textSize: SizeValue;
    /**
     * Background color
     */
    bgColor: number;
};
export type GraphicTable = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * Table position
     */
    position: TablePositionValue;
    /**
     * Number of rows
     */
    rows: number;
    /**
     * Number of columns
     */
    columns: number;
    /**
     * Background color
     */
    bgColor: number;
    /**
     * Frame color
     */
    frameColor: number;
    /**
     * Frame width
     */
    frameWidth: number;
    /**
     * Border color
     */
    borderColor: number;
    /**
     * Border width
     */
    borderWidth: number;
    /**
     * Table cells matrix
     */
    cells: () => TableCell[][];
};
export type GraphicHorizline = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * Y position of the line
     */
    level: number;
    /**
     * Start index of the line (`chart.periods[line.startIndex]`)
     */
    startIndex: number;
    /**
     * End index of the line (`chart.periods[line.endIndex]`)
     */
    endIndex: number;
    /**
     * Is the line extended to the right
     */
    extendRight: boolean;
    /**
     * Is the line extended to the left
     */
    extendLeft: boolean;
};
export type GraphicPoint = {
    /**
     * X position of the point
     */
    index: number;
    /**
     * Y position of the point
     */
    level: number;
};
export type GraphicPolygon = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * List of polygon points
     */
    points: GraphicPoint[];
};
export type GraphicHorizHist = {
    /**
     * Drawing ID
     */
    id: number;
    /**
     * Low Y position
     */
    priceLow: number;
    /**
     * High Y position
     */
    priceHigh: number;
    /**
     * First X position
     */
    firstBarTime: number;
    /**
     * Last X position
     */
    lastBarTime: number;
    /**
     * List of values
     */
    rate: number[];
};
/**
 * List of drawings indexed by type
 */
export type GraphicData = {
    /**
     * List of labels drawings
     */
    labels: GraphicLabel[];
    /**
     * List of lines drawings
     */
    lines: GraphicLine[];
    /**
     * List of boxes drawings
     */
    boxes: GraphicBox[];
    /**
     * List of tables drawings
     */
    tables: GraphicTable[];
    /**
     * List of polygons drawings
     */
    polygons: GraphicPolygon[];
    /**
     * List of horizontal histograms drawings
     */
    horizHists: GraphicHorizHist[];
    /**
     * List of horizontal lines drawings
     */
    horizLines: GraphicHorizline[];
};
