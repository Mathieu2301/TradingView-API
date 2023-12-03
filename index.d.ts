declare module '@mathieuc/tradingview/main' {
  const _exports: {
      getTA(screener: Screener, id: string): Promise<miscRequests.Periods>;
      searchMarket(search: string, filter?: "index" | "crypto" | "stock" | "futures" | "forex" | "cfd" | "economic"): Promise<{
          /**
           * Market full symbol
           */
          id: string;
          /**
           * Market exchange name
           */
          exchange: string;
          /**
           * Market exchange full name
           */
          fullExchange: string;
          /**
           * Market screener
           */
          screener: any;
          /**
           * Market symbol
           */
          symbol: string;
          /**
           * Market name
           */
          description: string;
          /**
           * Market type
           */
          type: string;
          /**
           * Get market technical analysis
           */
          getTA: () => Promise<miscRequests.Periods>;
      }[]>;
      searchIndicator(search?: string): Promise<{
          /**
           * Script ID
           */
          id: string;
          /**
           * Script version
           */
          version: string;
          /**
           * Script complete name
           */
          name: string;
          /**
           * Author user ID
           */
          author: {
              id: number;
              username: string;
          };
          /**
           * Image ID https://tradingview.com/i/${image}
           */
          image: string;
          /**
           * Script source (if available)
           */
          source: string;
          /**
           * Script type (study / strategy)
           */
          type: "study" | "strategy";
          /**
           * Script access type
           */
          access: "private" | "other" | "closed_source" | "open_source" | "invite_only";
          /**
           * Get the full indicator informations
           */
          get: () => Promise<PineIndicator>;
      }[]>;
      getIndicator(id: string, version?: string): Promise<PineIndicator>;
      loginUser(username: string, password: string, remember?: boolean, UA?: string): Promise<{
          /**
           * User ID
           */
          id: number;
          /**
           * User username
           */
          username: string;
          /**
           * User first name
           */
          firstName: string;
          /**
           * User last name
           */
          lastName: string;
          /**
           * User reputation
           */
          reputation: number;
          /**
           * Number of following accounts
           */
          following: number;
          /**
           * Number of followers
           */
          followers: number;
          /**
           * User's notifications
           */
          notifications: {
              /**
               * User notifications
               */
              user: number;
              /**
               * Notification from following accounts
               */
              following: number;
          };
          /**
           * User session
           */
          session: string;
          /**
           * User session hash
           */
          sessionHash: string;
          /**
           * User session signature
           */
          signature: string;
          /**
           * User private channel
           */
          privateChannel: string;
          /**
           * User auth token
           */
          authToken: string;
          /**
           * Account creation date
           */
          joinDate: Date;
      }>;
      getUser(session: string, signature?: string, location?: string): Promise<{
          /**
           * User ID
           */
          id: number;
          /**
           * User username
           */
          username: string;
          /**
           * User first name
           */
          firstName: string;
          /**
           * User last name
           */
          lastName: string;
          /**
           * User reputation
           */
          reputation: number;
          /**
           * Number of following accounts
           */
          following: number;
          /**
           * Number of followers
           */
          followers: number;
          /**
           * User's notifications
           */
          notifications: {
              /**
               * User notifications
               */
              user: number;
              /**
               * Notification from following accounts
               */
              following: number;
          };
          /**
           * User session
           */
          session: string;
          /**
           * User session hash
           */
          sessionHash: string;
          /**
           * User session signature
           */
          signature: string;
          /**
           * User private channel
           */
          privateChannel: string;
          /**
           * User auth token
           */
          authToken: string;
          /**
           * Account creation date
           */
          joinDate: Date;
      }>;
      getPrivateIndicators(session: string, signature?: string): Promise<{
          /**
           * Script ID
           */
          id: string;
          /**
           * Script version
           */
          version: string;
          /**
           * Script complete name
           */
          name: string;
          /**
           * Author user ID
           */
          author: {
              id: number;
              username: string;
          };
          /**
           * Image ID https://tradingview.com/i/${image}
           */
          image: string;
          /**
           * Script source (if available)
           */
          source: string;
          /**
           * Script type (study / strategy)
           */
          type: "study" | "strategy";
          /**
           * Script access type
           */
          access: "private" | "other" | "closed_source" | "open_source" | "invite_only";
          /**
           * Get the full indicator informations
           */
          get: () => Promise<PineIndicator>;
      }[]>;
      getChartToken(layout: string, credentials?: {
          /**
           * User ID
           */
          id: number;
          /**
           * User session ('sessionid' cookie)
           */
          session: string;
          /**
           * User session signature ('sessionid_sign' cookie)
           */
          signature?: string;
      }): Promise<string>;
      getDrawings(layout: string, symbol?: string, credentials?: {
          /**
           * User ID
           */
          id: number;
          /**
           * User session ('sessionid' cookie)
           */
          session: string;
          /**
           * User session signature ('sessionid_sign' cookie)
           */
          signature?: string;
      }, chartID?: number): Promise<{
          /**
           * Drawing ID (Like: 'XXXXXX')
           */
          id: string;
          /**
           * Layout market symbol (Like: 'BINANCE:BUCEUR')
           */
          symbol: string;
          /**
           * Owner user ID (Like: 'XXXXXX')
           */
          ownerSource: string;
          /**
           * Drawing last update timestamp
           */
          serverUpdateTime: string;
          /**
           * Currency ID (Like: 'EUR')
           */
          currencyId: string;
          /**
           * Unit ID
           */
          unitId: any;
          /**
           * Drawing type
           */
          type: string;
          /**
           * List of drawing points
           */
          points: {
              /**
               * Point X time position
               */
              time_t: number;
              /**
               * Point Y price position
               */
              price: number;
              /**
               * Point offset
               */
              offset: number;
          }[];
          /**
           * Drawing Z order
           */
          zorder: number;
          /**
           * Drawing link key
           */
          linkKey: string;
          /**
           * Drawing state
           */
          state: any;
      }[]>;
      Client: typeof Client;
      BuiltInIndicator: typeof BuiltInIndicator;
      PineIndicator: typeof PineIndicator;
      PinePermManager: typeof PinePermManager;
  };
  export = _exports;
  import miscRequests = require("./src/miscRequests");
  import PineIndicator = require("./src/classes/PineIndicator");
  import Client = require("./src/client");
  import BuiltInIndicator = require("./src/classes/BuiltInIndicator");
  import PinePermManager = require("./src/classes/PinePermManager");
  export { Client, BuiltInIndicator, PineIndicator, PinePermManager };
  //# sourceMappingURL=main.d.ts.map
}
declare module '@mathieuc/tradingview/main.d.ts' {
  {"version":3,"file":"main.d.ts","sourceRoot":"","sources":["../../../../../Documents/coding/TradingView-API/main.js"],"names":[],"mappings":""}
}
declare module '@mathieuc/tradingview/src/chart/graphicParser' {
  function _exports(rawGraphic?: any, indexes?: any): GraphicData;
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
  //# sourceMappingURL=graphicParser.d.ts.map
}
declare module '@mathieuc/tradingview/src/chart/graphicParser.d.ts' {
  {"version":3,"file":"graphicParser.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/chart/graphicParser.js"],"names":[],"mappings":"AA8MiB,4DAFJ,WAAW,CAuGvB;;wBA7OY,MAAM,GAAG,MAAM,GAAG,OAAO,GACjC,QAAQ,GAAG,OAAO,GAAG,MAAM;0BAElB,KAAK,GAAG,QAAQ,GAAG,QAAQ;0BAC3B,MAAM,GAAG,QAAQ,GAAG,OAAO;4BAC3B,MAAM,GAAG,MAAM;iCAEhB,UAAU,GAAG,YAAY,GAAG,WAAW,GAC/C,aAAa,GAAG,eAAe,GAAG,cAAc,GAChD,aAAa,GAAG,eAAe,GAAG,cAAc;;;;;QAM3C,MAAM;;;;OACN,MAAM;;;;OACN,MAAM;;;;;;;;UAEN,MAAM;;;;;WAEN,MAAM;eACN,MAAM;;;;UACN,SAAS;;;;eACT,WAAW;;;;aACX,MAAM;;;;;;QAKN,MAAM;;;;QACN,MAAM;;;;QACN,MAAM;;;;QACN,MAAM;;;;QACN,MAAM;;;;;;;;;;;;WAGN,MAAM;;;;WACN,MAAM;;;;;;QAKN,MAAM;;;;QACN,MAAM;;;;QACN,MAAM;;;;QACN,MAAM;;;;QACN,MAAM;;;;WACN,MAAM;;;;aACN,MAAM;;;;;;;;;;;;WAGN,MAAM;;;;UACN,MAAM;;;;cACN,SAAS;;;;eACT,MAAM;;;;gBACN,WAAW;;;;gBACX,WAAW;;;;cACX,aAAa;;;;;;QAKb,MAAM;;;;UACN,MAAM;;;;WACN,MAAM;;;;YACN,MAAM;;;;eACN,MAAM;;;;gBACN,WAAW;;;;gBACX,WAAW;;;;cACX,SAAS;;;;aACT,MAAM;;;;;;QAKN,MAAM;;;;cACN,kBAAkB;;;;UAClB,MAAM;;;;aACN,MAAM;;;;aACN,MAAM;;;;gBACN,MAAM;;;;gBACN,MAAM;;;;iBACN,MAAM;;;;iBACN,MAAM;;;;WACN,MAAM,SAAS,EAAE,EAAE;;;;;;QAKnB,MAAM;;;;WACN,MAAM;;;;gBACN,MAAM;;;;cACN,MAAM;;;;iBACN,OAAO;;;;gBACP,OAAO;;;;;;WAKP,MAAM;;;;WACN,MAAM;;;;;;QAKN,MAAM;;;;YACN,YAAY,EAAE;;;;;;QAKd,MAAM;;;;cACN,MAAM;;;;eACN,MAAM;;;;kBACN,MAAM;;;;iBACN,MAAM;;;;UACN,MAAM,EAAE;;;;;;;;;YAKR,YAAY,EAAE;;;;WACd,WAAW,EAAE;;;;WACb,UAAU,EAAE;;;;YACZ,YAAY,EAAE;;;;cACd,cAAc,EAAE;;;;gBAChB,gBAAgB,EAAE;;;;gBAClB,gBAAgB,EAAE"}
}
declare module '@mathieuc/tradingview/src/chart/session' {
  function _exports(client: import('@mathieuc/tradingview/src/client').ClientBridge): {
      new (): {
          "__#6@#chartSessionID": string;
          "__#6@#replaySessionID": string;
          "__#6@#replayMode": boolean;
          /** @type {Object<string, (): any>} */
          "__#6@#replayOKCB": {
              [x: string]: () => any;
          };
          /** Parent client */
          "__#6@#client": import("@mathieuc/tradingview/src/client").ClientBridge;
          /** @type {StudyListeners} */
          "__#6@#studyListeners": StudyListeners;
          /**
           * Table of periods values indexed by timestamp
           * @type {Object<number, PricePeriod[]>}
           */
          "__#6@#periods": {
              [x: number]: PricePeriod[];
          };
          /** @return {PricePeriod[]} List of periods values */
          readonly periods: PricePeriod[];
          /**
           * Current market infos
           * @type {MarketInfos}
           */
          "__#6@#infos": MarketInfos;
          /** @return {MarketInfos} Current market infos */
          readonly infos: MarketInfos;
          "__#6@#callbacks": {
              seriesLoaded: any[];
              symbolLoaded: any[];
              update: any[];
              replayLoaded: any[];
              replayPoint: any[];
              replayResolution: any[];
              replayEnd: any[];
              event: any[];
              error: any[];
          };
          /**
           * @param {ChartEvent} ev Client event
           * @param {...{}} data Packet data
           */
          "__#6@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
          "__#6@#handleError"(...msgs: any[]): void;
          "__#6@#seriesCreated": boolean;
          "__#6@#currentSeries": number;
          /**
           * @param {import('@mathieuc/tradingview/src/types').TimeFrame} timeframe Chart period timeframe
           * @param {number} [range] Number of loaded periods/candles (Default: 100)
           * @param {number} [reference] Reference candle timestamp (Default is now)
           */
          setSeries(timeframe?: import('@mathieuc/tradingview/src/types').TimeFrame, range?: number, reference?: number): void;
          /**
           * Set the chart market
           * @param {string} symbol Market symbol
           * @param {Object} [options] Chart options
           * @param {import('@mathieuc/tradingview/src/types').TimeFrame} [options.timeframe] Chart period timeframe
           * @param {number} [options.range] Number of loaded periods/candles (Default: 100)
           * @param {number} [options.to] Last candle timestamp (Default is now)
           * @param {'splits' | 'dividends'} [options.adjustment] Market adjustment
           * @param {'regular' | 'extended'} [options.session] Chart session
           * @param {'EUR' | 'USD' | string} [options.currency] Chart currency
           * @param {ChartType} [options.type] Chart custom type
           * @param {ChartInputs} [options.inputs] Chart custom inputs
           * @param {number} [options.replay] Replay mode starting point (Timestamp)
           */
          setMarket(symbol: string, options?: {
              timeframe?: import('@mathieuc/tradingview/src/types').TimeFrame;
              range?: number;
              to?: number;
              adjustment?: 'splits' | 'dividends';
              session?: 'regular' | 'extended';
              currency?: 'EUR' | 'USD' | string;
              type?: ChartType;
              inputs?: ChartInputs;
              replay?: number;
          }): void;
          /**
           * Set the chart timezone
           * @param {import('@mathieuc/tradingview/src/types').Timezone} timezone New timezone
           */
          setTimezone(timezone: import('@mathieuc/tradingview/src/types').Timezone): void;
          /**
           * Fetch x additional previous periods/candles values
           * @param {number} number Number of additional periods/candles you want to fetch
           */
          fetchMore(number?: number): void;
          /**
           * Fetch x additional previous periods/candles values
           * @param {number} number Number of additional periods/candles you want to fetch
           * @returns {Promise} Raise when the data has been fetched
           */
          replayStep(number?: number): Promise<any>;
          /**
           * Start fetching a new period/candle every x ms
           * @param {number} interval Number of additional periods/candles you want to fetch
           * @returns {Promise} Raise when the replay mode starts
           */
          replayStart(interval?: number): Promise<any>;
          /**
           * Stop fetching a new period/candle every x ms
           * @returns {Promise} Raise when the replay mode stops
           */
          replayStop(): Promise<any>;
          /**
           * When a symbol is loaded
           * @param {() => void} cb
           * @event
           */
          onSymbolLoaded(cb: () => void): void;
          /**
           * When a chart update happens
           * @param {(changes: ('$prices' | string)[]) => void} cb
           * @event
           */
          onUpdate(cb: (changes: ('$prices' | string)[]) => void): void;
          /**
           * When the replay session is ready
           * @param {() => void} cb
           * @event
           */
          onReplayLoaded(cb: () => void): void;
          /**
           * When the replay session has new resolution
           * @param {(
           *   timeframe: import('@mathieuc/tradingview/src/types').TimeFrame,
           *   index: number,
           * ) => void} cb
           * @event
           */
          onReplayResolution(cb: (timeframe: import('@mathieuc/tradingview/src/types').TimeFrame, index: number) => void): void;
          /**
           * When the replay session ends
           * @param {() => void} cb
           * @event
           */
          onReplayEnd(cb: () => void): void;
          /**
           * When the replay session cursor has moved
           * @param {(index: number) => void} cb
           * @event
           */
          onReplayPoint(cb: (index: number) => void): void;
          /**
           * When chart error happens
           * @param {(...any) => void} cb Callback
           * @event
           */
          onError(cb: (...any: any[]) => void): void;
          /** @type {ChartSessionBridge} */
          "__#6@#chartSession": ChartSessionBridge;
          Study: {
              new (indicator: import("@mathieuc/tradingview/src/classes/PineIndicator") | import("../classes/BuiltInIndicator")): {
                  "__#5@#studID": string;
                  "__#5@#studyListeners": {
                      [x: string]: Function[];
                  };
                  "__#5@#periods": {
                      [x: number]: {}[];
                  };
                  readonly periods: {}[];
                  "__#5@#indexes": number[];
                  "__#5@#graphic": {
                      [x: string]: {
                          [x: number]: {};
                      };
                  };
                  readonly graphic: import("@mathieuc/tradingview/src/chart/graphicParser").GraphicData;
                  "__#5@#strategyReport": studyConstructor.StrategyReport;
                  readonly strategyReport: studyConstructor.StrategyReport;
                  "__#5@#callbacks": {
                      studyCompleted: any[];
                      update: any[];
                      event: any[];
                      error: any[];
                  };
                  "__#5@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
                  "__#5@#handleError"(...msgs: any[]): void;
                  instance: import("@mathieuc/tradingview/src/classes/PineIndicator") | import("../classes/BuiltInIndicator");
                  setIndicator(indicator: import("@mathieuc/tradingview/src/classes/PineIndicator") | import("../classes/BuiltInIndicator")): void;
                  onReady(cb: () => void): void; /**
                   * Fetch x additional previous periods/candles values
                   * @param {number} number Number of additional periods/candles you want to fetch
                   */
                  onUpdate(cb: (changes: ("plots" | "report.currency" | "report.settings" | "report.perf" | "report.trades" | "report.history" | "graphic")[]) => void): void;
                  onError(cb: (...any: any[]) => void): void;
                  remove(): void;
              };
          };
          /** Delete the chart session */
          delete(): void;
      };
  };
  export = _exports;
  /**
   * Custom chart type
   */
  export type ChartType = 'HeikinAshi' | 'Renko' | 'LineBreak' | 'Kagi' | 'PointAndFigure' | 'Range';
  /**
   * Custom chart type
   */
  export type ChartInputs = {
      /**
       * Renko/Kagi/PointAndFigure ATR length
       */
      atrLength?: number;
      /**
       * Renko/LineBreak/Kagi source
       */
      source?: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
      /**
       * Renko/Kagi/PointAndFigure style
       */
      style?: 'ATR' | string;
      /**
       * Renko/PointAndFigure box size
       */
      boxSize?: number;
      /**
       * Kagi/PointAndFigure reversal amount
       */
      reversalAmount?: number;
      /**
       * Renko/PointAndFigure sources
       */
      sources?: 'Close';
      /**
       * Renko wicks
       */
      wicks?: boolean;
      /**
       * LineBreak Line break
       */
      lb?: number;
      /**
       * PointAndFigure oneStepBackBuilding
       */
      oneStepBackBuilding?: boolean;
      /**
       * Range phantom bars
       */
      phantomBars?: boolean;
      /**
       * Range range
       */
      range?: number;
  };
  export type StudyListeners = {
      [x: string]: Function[];
  };
  export type ChartSessionBridge = {
      sessionID: string;
      studyListeners: StudyListeners;
      indexes: {
          [x: number]: number;
      };
      send: import('@mathieuc/tradingview/src/client').SendPacket;
  };
  export type ChartEvent = 'seriesLoaded' | 'symbolLoaded' | 'update' | 'error';
  export type PricePeriod = {
      /**
       * Period timestamp
       */
      time: number;
      /**
       * Period open value
       */
      open: number;
      /**
       * Period close value
       */
      close: number;
      /**
       * Period max value
       */
      max: number;
      /**
       * Period min value
       */
      min: number;
      /**
       * Period volume value
       */
      volume: number;
  };
  export type Subsession = {
      /**
       * Subsession ID (ex: 'regular')
       */
      id: string;
      /**
       * Subsession description (ex: 'Regular')
       */
      description: string;
      /**
       * If private
       */
      private: boolean;
      /**
       * Session (ex: '24x7')
       */
      session: string;
      /**
       * Session correction
       */
      "session-correction": string;
      /**
       * Session display (ex: '24x7')
       */
      "session-display": string;
  };
  export type MarketInfos = {
      /**
       * Used series (ex: 'ser_1')
       */
      series_id: string;
      /**
       * Base currency (ex: 'BTC')
       */
      base_currency: string;
      /**
       * Base currency ID (ex: 'XTVCBTC')
       */
      base_currency_id: string;
      /**
       * Market short name (ex: 'BTCEUR')
       */
      name: string;
      /**
       * Market full name (ex: 'COINBASE:BTCEUR')
       */
      full_name: string;
      /**
       * Market pro name (ex: 'COINBASE:BTCEUR')
       */
      pro_name: string;
      /**
       * Market symbol description (ex: 'BTC/EUR')
       */
      description: string;
      /**
       * Market symbol short description (ex: 'BTC/EUR')
       */
      short_description: string;
      /**
       * Market exchange (ex: 'COINBASE')
       */
      exchange: string;
      /**
       * Market exchange (ex: 'COINBASE')
       */
      listed_exchange: string;
      /**
       * Values provider ID (ex: 'coinbase')
       */
      provider_id: string;
      /**
       * Used currency ID (ex: 'EUR')
       */
      currency_id: string;
      /**
       * Used currency code (ex: 'EUR')
       */
      currency_code: string;
      /**
       * Variable tick size
       */
      variable_tick_size: string;
      /**
       * Price scale
       */
      pricescale: number;
      /**
       * Point value
       */
      pointvalue: number;
      /**
       * Session (ex: '24x7')
       */
      session: string;
      /**
       * Session display (ex: '24x7')
       */
      session_display: string;
      /**
       * Market type (ex: 'crypto')
       */
      type: string;
      /**
       * If intraday values are available
       */
      has_intraday: boolean;
      /**
       * If market is fractional
       */
      fractional: boolean;
      /**
       * If the market is curently tradable
       */
      is_tradable: boolean;
      /**
       * Minimum move value
       */
      minmov: number;
      /**
       * Minimum move value 2
       */
      minmove2: number;
      /**
       * Used timezone
       */
      timezone: string;
      /**
       * If the replay mode is available
       */
      is_replayable: boolean;
      /**
       * If the adjustment mode is enabled
       */
      has_adjustment: boolean;
      /**
       * Has extended hours
       */
      has_extended_hours: boolean;
      /**
       * Bar source
       */
      bar_source: string;
      /**
       * Bar transform
       */
      bar_transform: string;
      /**
       * Bar fill gaps
       */
      bar_fillgaps: boolean;
      /**
       * Allowed adjustment (ex: 'none')
       */
      allowed_adjustment: string;
      /**
       * Subsession ID (ex: 'regular')
       */
      subsession_id: string;
      /**
       * Pro permission (ex: '')
       */
      pro_perm: string;
      /**
       * Base name (ex: ['COINBASE:BTCEUR'])
       */
      base_name: [];
      /**
       * Legs (ex: ['COINBASE:BTCEUR'])
       */
      legs: [];
      /**
       * Sub sessions
       */
      subsessions: Subsession[];
      /**
       * Typespecs (ex: [])
       */
      typespecs: [];
      /**
       * Resolutions (ex: [])
       */
      resolutions: [];
      /**
       * Aliases (ex: [])
       */
      aliases: [];
      /**
       * Alternatives (ex: [])
       */
      alternatives: [];
  };
  import studyConstructor = require("./study");
  //# sourceMappingURL=session.d.ts.map
}
declare module '@mathieuc/tradingview/src/chart/session.d.ts' {
  {"version":3,"file":"session.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/chart/session.js"],"names":[],"mappings":"AAoHiB,kCAFN,OAAO,WAAW,EAAE,YAAY;;;;;QASzC,sCAAsC;;gBAApB,MAAM,GAAE,SAAE;;QAG5B,oBAAoB;;QAGpB,6BAA6B;gCAAlB,cAAc;QAGzB;;;WAGG;;gBADc,MAAM,GAAE,WAAW,EAAE;;QAItC,qDAAqD;;QAKrD;;;WAGG;uBADO,WAAW;QAIrB,iDAAiD;;;;;;;;;;;;;QAmBjD;;;WAGG;gCAFQ,UAAU,WACP,EAAE;;;;QAgIhB;;;;WAIG;8BAHQ,OAAO,UAAU,EAAE,SAAS,UAC5B,MAAM,cACN,MAAM;QAwBjB;;;;;;;;;;;;;WAaG;0BAXQ,MAAM;YAEiC,SAAS,GAAhD,OAAO,UAAU,EAAE,SAAS;YACX,KAAK,GAAtB,MAAM;YACW,EAAE,GAAnB,MAAM;YAC2B,UAAU,GAA3C,QAAQ,GAAG,WAAW;YACW,OAAO,GAAxC,SAAS,GAAG,UAAU;YACW,QAAQ,GAAzC,KAAK,GAAG,KAAK,GAAG,MAAM;YACF,IAAI,GAAxB,SAAS;YACa,MAAM,GAA5B,WAAW;YACM,MAAM,GAAvB,MAAM;;QAyDjB;;;WAGG;8BADQ,OAAO,UAAU,EAAE,QAAQ;QAOtC;;;WAGG;2BADQ,MAAM;QAMjB;;;;WAIG;4BAFQ,MAAM;QAgBjB;;;;WAIG;+BAFQ,MAAM;QAgBjB;;;WAGG;;QAcH;;;;WAIG;2BAFQ,MAAM,IAAI;QAOrB;;;;WAIG;+BAFkB,CAAC,SAAS,GAAG,MAAM,CAAC,EAAE,KAAK,IAAI;QAOpD;;;;WAIG;2BAFQ,MAAM,IAAI;QAOrB;;;;;;;WAOG;2CAJa,OAAO,UAAU,EAAE,SAAS,SAChC,MAAM,KACV,IAAI;QAOZ;;;;WAIG;wBAFQ,MAAM,IAAI;QAOrB;;;;WAIG;kCAFgB,MAAM,KAAK,IAAI;QAOlC;;;;WAIG;uCAFoB,IAAI;QAO3B,iCAAiC;8BAAtB,kBAAkB;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;+CA/H7B;;;mBAGG;;;;;;QAsIH,+BAA+B;;;EAOhC;;;;;wBA9hBY,YAAY,GAAG,OAAO,GAAG,WAAW,GAAG,MAAM,GAAG,gBAAgB,GACvE,OAAO;;;;;;;;gBAcH,MAAM;;;;aACN,MAAM,GAAG,MAAM,GAAG,KAAK,GAAG,OAAO,GAAG,KAAK,GAC7C,MAAM,GAAG,OAAO;;;;YACZ,KAAK,GAAG,MAAM;;;;cACd,MAAM;;;;qBACN,MAAM;;;;cACN,OAAO;;;;YACP,OAAO;;;;SACP,MAAM;;;;0BACN,OAAO;;;;kBACP,OAAO;;;;YACP,MAAM;;;QAGK,MAAM,GAAE,UAAU;;;eAI7B,MAAM;oBACN,cAAc;;YACP,MAAM,GAAE,MAAM;;UACrB,OAAO,WAAW,EAAE,UAAU;;yBAI3B,cAAc,GAAG,cAAc,GAAG,QAAQ,GAAG,OAAO;;;;;UAKvD,MAAM;;;;UACN,MAAM;;;;WACN,MAAM;;;;SACN,MAAM;;;;SACN,MAAM;;;;YACN,MAAM;;;;;;QAKN,MAAM;;;;iBACN,MAAM;;;;aACN,OAAO;;;;aACP,MAAM;;;;0BACN,MAAM;;;;uBACN,MAAM;;;;;;eAKN,MAAM;;;;mBACN,MAAM;;;;sBACN,MAAM;;;;UACN,MAAM;;;;eACN,MAAM;;;;cACN,MAAM;;;;iBACN,MAAM;;;;uBACN,MAAM;;;;cACN,MAAM;;;;qBACN,MAAM;;;;iBACN,MAAM;;;;iBACN,MAAM;;;;mBACN,MAAM;;;;wBACN,MAAM;;;;gBACN,MAAM;;;;gBACN,MAAM;;;;aACN,MAAM;;;;qBACN,MAAM;;;;UACN,MAAM;;;;kBACN,OAAO;;;;gBACP,OAAO;;;;iBACP,OAAO;;;;YACP,MAAM;;;;cACN,MAAM;;;;cACN,MAAM;;;;mBACN,OAAO;;;;oBACP,OAAO;;;;wBACP,OAAO;;;;gBACP,MAAM;;;;mBACN,MAAM;;;;kBACN,OAAO;;;;wBACP,MAAM;;;;mBACN,MAAM;;;;cACN,MAAM;;;;eACN,EAAE;;;;UACF,EAAE;;;;iBACF,UAAU,EAAE;;;;eACZ,EAAE;;;;iBACF,EAAE;;;;aACF,EAAE;;;;kBACF,EAAE"}
}
declare module '@mathieuc/tradingview/src/chart/study' {
  function _exports(chartSession: import('@mathieuc/tradingview/src/chart/session').ChartSessionBridge): {
      new (indicator: PineIndicator | BuiltInIndicator): {
          "__#5@#studID": string;
          "__#5@#studyListeners": {
              [x: string]: Function[];
          };
          /**
           * Table of periods values indexed by timestamp
           * @type {Object<number, {}[]>}
           */
          "__#5@#periods": {
              [x: number]: {}[];
          };
          /** @return {{}[]} List of periods values */
          readonly periods: {}[];
          /**
           * List of graphic xPos indexes
           * @type {number[]}
           */
          "__#5@#indexes": number[];
          /**
           * Table of graphic drawings indexed by type and ID
           * @type {Object<string, Object<number, {}>>}
           */
          "__#5@#graphic": {
              [x: string]: {
                  [x: number]: {};
              };
          };
          /**
           * Table of graphic drawings indexed by type
           * @return {import('@mathieuc/tradingview/src/chart/graphicParser').GraphicData}
           */
          readonly graphic: graphicParser.GraphicData;
          /** @type {StrategyReport} */
          "__#5@#strategyReport": StrategyReport;
          /** @return {StrategyReport} Get the strategy report if available */
          readonly strategyReport: StrategyReport;
          "__#5@#callbacks": {
              studyCompleted: any[];
              update: any[];
              event: any[];
              error: any[];
          };
          /**
           * @param {ChartEvent} ev Client event
           * @param {...{}} data Packet data
           */
          "__#5@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
          "__#5@#handleError"(...msgs: any[]): void;
          /** @type {PineIndicator | BuiltInIndicator} Indicator instance */
          instance: PineIndicator | BuiltInIndicator;
          /**
           * @param {PineIndicator | BuiltInIndicator} indicator Indicator instance
           */
          setIndicator(indicator: PineIndicator | BuiltInIndicator): void;
          /**
           * When the indicator is ready
           * @param {() => void} cb
           * @event
           */
          onReady(cb: () => void): void;
          /**
           * @typedef {'plots' | 'report.currency'
           *  | 'report.settings' | 'report.perf'
           *  | 'report.trades' | 'report.history'
           *  | 'graphic'
           * } UpdateChangeType
           */
          /**
           * When an indicator update happens
           * @param {(changes: UpdateChangeType[]) => void} cb
           * @event
           */
          onUpdate(cb: (changes: ("plots" | "report.currency" | "report.settings" | "report.perf" | "report.trades" | "report.history" | "graphic")[]) => void): void;
          /**
           * When indicator error happens
           * @param {(...any) => void} cb Callback
           * @event
           */
          onError(cb: (...any: any[]) => void): void;
          /** Remove the study */
          remove(): void;
      };
  };
  export = _exports;
  /**
   * Trade report
   */
  export type TradeReport = {
      /**
       * Trade entry
       */
      entry: {
          name: string;
          type: 'long' | 'short';
          value: number;
          time: number;
      };
      /**
       * Trade exit
       */
      exit: {
          name: '' | string;
          value: number;
          time: number;
      };
      /**
       * Trade quantity
       */
      quantity: number;
      /**
       * Trade profit
       */
      profit: RelAbsValue;
      /**
       * Trade cummulative profit
       */
      cumulative: RelAbsValue;
      /**
       * Trade run-up
       */
      runup: RelAbsValue;
      /**
       * Trade drawdown
       */
      drawdown: RelAbsValue;
  };
  export type PerfReport = {
      /**
       * Average bars in trade
       */
      avgBarsInTrade: number;
      /**
       * Average bars in winning trade
       */
      avgBarsInWinTrade: number;
      /**
       * Average bars in losing trade
       */
      avgBarsInLossTrade: number;
      /**
       * Average trade gain
       */
      avgTrade: number;
      /**
       * Average trade performace
       */
      avgTradePercent: number;
      /**
       * Average losing trade gain
       */
      avgLosTrade: number;
      /**
       * Average losing trade performace
       */
      avgLosTradePercent: number;
      /**
       * Average winning trade gain
       */
      avgWinTrade: number;
      /**
       * Average winning trade performace
       */
      avgWinTradePercent: number;
      /**
       * Commission paid
       */
      commissionPaid: number;
      /**
       * Gross loss value
       */
      grossLoss: number;
      /**
       * Gross loss percent
       */
      grossLossPercent: number;
      /**
       * Gross profit
       */
      grossProfit: number;
      /**
       * Gross profit percent
       */
      grossProfitPercent: number;
      /**
       * Largest losing trade gain
       */
      largestLosTrade: number;
      /**
       * Largent losing trade performance (percentage)
       */
      largestLosTradePercent: number;
      /**
       * Largest winning trade gain
       */
      largestWinTrade: number;
      /**
       * Largest winning trade performance (percentage)
       */
      largestWinTradePercent: number;
      /**
       * Margin calls
       */
      marginCalls: number;
      /**
       * Max Contracts Held
       */
      maxContractsHeld: number;
      /**
       * Net profit
       */
      netProfit: number;
      /**
       * Net performance (percentage)
       */
      netProfitPercent: number;
      /**
       * Number of losing trades
       */
      numberOfLosingTrades: number;
      /**
       * Number of winning trades
       */
      numberOfWiningTrades: number;
      /**
       * Strategy winrate
       */
      percentProfitable: number;
      /**
       * Profit factor
       */
      profitFactor: number;
      /**
       * Ratio Average Win / Average Loss
       */
      ratioAvgWinAvgLoss: number;
      /**
       * Total open trades
       */
      totalOpenTrades: number;
      /**
       * Total trades
       */
      totalTrades: number;
  };
  export type FromTo = {
      /**
       * From timestamp
       */
      from: number;
      /**
       * To timestamp
       */
      to: number;
  };
  export type StrategyReport = {
      /**
       * Selected currency
       */
      currency?: 'EUR' | 'USD' | 'JPY' | '' | 'CHF';
      /**
       * Backtester settings
       */
      settings?: {
          dateRange?: {
              backtest?: FromTo;
              trade?: FromTo;
          };
      };
      /**
       * Trade list starting by the last
       */
      trades: TradeReport[];
      /**
       * History Chart value
       */
      history: {
          buyHold?: number[];
          buyHoldPercent?: number[];
          drawDown?: number[];
          drawDownPercent?: number[];
          equity?: number[];
          equityPercent?: number[];
      };
      /**
       * Strategy performance
       */
      performance: {
          all?: PerfReport;
          long?: PerfReport;
          short?: PerfReport;
          buyHoldReturn?: number;
          buyHoldReturnPercent?: number;
          maxDrawDown?: number;
          maxDrawDownPercent?: number;
          openPL?: number;
          openPLPercent?: number;
          sharpeRatio?: number;
          sortinoRatio?: number;
      };
  };
  import PineIndicator = require("../classes/PineIndicator");
  import BuiltInIndicator = require("../classes/BuiltInIndicator");
  import graphicParser = require("./graphicParser");
  //# sourceMappingURL=study.d.ts.map
}
declare module '@mathieuc/tradingview/src/chart/study.d.ts' {
  {"version":3,"file":"study.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/chart/study.js"],"names":[],"mappings":"AAmJiB,wCAFN,OAAO,WAAW,EAAE,kBAAkB;oBAgFpC,aAAa,GAAG,gBAAgB;;;;;QAzE3C;;;WAGG;;gBADc,MAAM,GAAE,EAAE,EAAE;;QAI7B,4CAA4C;;QAK5C;;;WAGG;yBADO,MAAM,EAAE;QAIlB;;;WAGG;;gBADc,MAAM;oBAAS,MAAM,GAAE,EAAE;;;QAI1C;;;WAGG;;QAYH,6BAA6B;gCAAlB,cAAc;QAOzB,oEAAoE;;;;;;;;QAapE;;;WAGG;qDADW,EAAE;;QAqBd,kEAAkE;kBAAvD,aAAa,GAAG,gBAAgB;QA2I7C;;WAEG;gCADQ,aAAa,GAAG,gBAAgB;QAkB3C;;;;WAIG;oBAFQ,MAAM,IAAI;QAOrB;;;;;;WAMG;QAEH;;;;WAIG;wJAFyC,IAAI;QAOhD;;;;WAIG;uCAFoB,IAAI;QAO3B,uBAAuB;;;EAQxB;;;;;;;;;;QAvXuB,IAAI,EAAlB,MAAM;QACkB,IAAI,EAA5B,MAAM,GAAG,OAAO;QACF,KAAK,EAAnB,MAAM;QACQ,IAAI,EAAlB,MAAM;;;;;;QAGY,IAAI,EAAtB,EAAE,GAAG,MAAM;QACE,KAAK,EAAlB,MAAM;QACO,IAAI,EAAjB,MAAM;;;;;cAEN,MAAM;;;;;;;;;;;;;;;;;;;;;;oBASN,MAAM;;;;uBACN,MAAM;;;;wBACN,MAAM;;;;cACN,MAAM;;;;qBACN,MAAM;;;;iBACN,MAAM;;;;wBACN,MAAM;;;;iBACN,MAAM;;;;wBACN,MAAM;;;;oBACN,MAAM;;;;eACN,MAAM;;;;sBACN,MAAM;;;;iBACN,MAAM;;;;wBACN,MAAM;;;;qBACN,MAAM;;;;4BACN,MAAM;;;;qBACN,MAAM;;;;4BACN,MAAM;;;;iBACN,MAAM;;;;sBACN,MAAM;;;;eACN,MAAM;;;;sBACN,MAAM;;;;0BACN,MAAM;;;;0BACN,MAAM;;;;uBACN,MAAM;;;;kBACN,MAAM;;;;wBACN,MAAM;;;;qBACN,MAAM;;;;iBACN,MAAM;;;;;;UAKN,MAAM;;;;QACN,MAAM;;;;;;eAKN,KAAK,GAAG,KAAK,GAAG,KAAK,GAAG,EAAE,GAAG,KAAK;;;;;QAEhB,SAAS;YACC,QAAQ,GAApC,MAAM;YACsB,KAAK,GAAjC,MAAM;;;;;;YACN,WAAW,EAAE;;;;;QAEM,OAAO,GAA1B,MAAM,EAAE;QACW,cAAc,GAAjC,MAAM,EAAE;QACW,QAAQ,GAA3B,MAAM,EAAE;QACW,eAAe,GAAlC,MAAM,EAAE;QACW,MAAM,GAAzB,MAAM,EAAE;QACW,aAAa,GAAhC,MAAM,EAAE;;;;;;QAEiB,GAAG,GAA5B,UAAU;QACe,IAAI,GAA7B,UAAU;QACe,KAAK,GAA9B,UAAU;QACW,aAAa,GAAlC,MAAM;QACe,oBAAoB,GAAzC,MAAM;QACe,WAAW,GAAhC,MAAM;QACe,kBAAkB,GAAvC,MAAM;QACe,MAAM,GAA3B,MAAM;QACe,aAAa,GAAlC,MAAM;QACe,WAAW,GAAhC,MAAM;QACe,YAAY,GAAjC,MAAM"}
}
declare module '@mathieuc/tradingview/src/classes/BuiltInIndicator' {
  export = BuiltInIndicator;
  class BuiltInIndicator {
      /**
       * @param {BuiltInIndicatorType} type Buit-in indocator raw type
       */
      constructor(type?: BuiltInIndicatorType);
      /** @return {BuiltInIndicatorType} Indicator script */
      get type(): BuiltInIndicatorType;
      /** @return {Object<string, any>} Indicator script */
      get options(): {
          [x: string]: any;
      };
      /**
       * Set an option
       * @param {BuiltInIndicatorOption} key The option you want to change
       * @param {*} value The new value of the property
       * @param {boolean} FORCE Ignore type and key verifications
       */
      setOption(key: BuiltInIndicatorOption, value: any, FORCE?: boolean): void;
      #private;
  }
  namespace BuiltInIndicator {
      export { BuiltInIndicatorType, BuiltInIndicatorOption };
  }
  /**
   * Built-in indicator type
   */
  type BuiltInIndicatorType = 'Volume@tv-basicstudies-144' | 'VbPFixed@tv-basicstudies-139!' | 'VbPFixed@tv-volumebyprice-53!' | 'VbPSessions@tv-volumebyprice-53' | 'VbPSessionsRough@tv-volumebyprice-53!' | 'VbPSessionsDetailed@tv-volumebyprice-53!' | 'VbPVisible@tv-volumebyprice-53';
  /**
   * Built-in indicator Option
   */
  type BuiltInIndicatorOption = 'rowsLayout' | 'rows' | 'volume' | 'vaVolume' | 'subscribeRealtime' | 'first_bar_time' | 'first_visible_bar_time' | 'last_bar_time' | 'last_visible_bar_time' | 'extendPocRight';
  //# sourceMappingURL=BuiltInIndicator.d.ts.map
}
declare module '@mathieuc/tradingview/src/classes/BuiltInIndicator.d.ts' {
  {"version":3,"file":"BuiltInIndicator.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/classes/BuiltInIndicator.js"],"names":[],"mappings":";AAuEiB;IAiBf;;OAEG;IACH,mBAFW,oBAAoB,EAO9B;IArBD,sDAAsD;IACtD,iCAEC;IAKD,qDAAqD;IACrD;;MAEC;IAYD;;;;;OAKG;IACH,eAJW,sBAAsB,sBAEtB,OAAO,QAqBjB;;CACF;;;;;;;4BA3HY,4BAA4B,GACnC,+BAA+B,GAC/B,+BAA+B,GAC/B,iCAAiC,GACjC,uCAAuC,GACvC,0CAA0C,GAC1C,gCAAgC;;;;8BAIzB,YAAY,GAAG,MAAM,GAAG,QAAQ,GACvC,UAAU,GAAG,mBAAmB,GAChC,gBAAgB,GAAG,wBAAwB,GAC3C,eAAe,GAAG,uBAAuB,GACzC,gBAAgB"}
}
declare module '@mathieuc/tradingview/src/classes/PineIndicator' {
  export = PineIndicator;
  class PineIndicator {
      /** @param {Indicator} options Indicator */
      constructor(options: Indicator);
      /** @return {string} Indicator ID */
      get pineId(): string;
      /** @return {string} Indicator version */
      get pineVersion(): string;
      /** @return {string} Indicator description */
      get description(): string;
      /** @return {string} Indicator short description */
      get shortDescription(): string;
      /** @return {Object<string, IndicatorInput>} Indicator inputs */
      get inputs(): {
          [x: string]: IndicatorInput;
      };
      /** @return {Object<string, string>} Indicator plots */
      get plots(): {
          [x: string]: string;
      };
      /** @return {IndicatorType} Indicator script */
      get type(): IndicatorType;
      /**
       * Set the indicator type
       * @param {IndicatorType} type Indicator type
       */
      setType(type?: IndicatorType): void;
      /** @return {string} Indicator script */
      get script(): string;
      /**
       * Set an option
       * @param {number | string} key The key can be ID of the property (`in_{ID}`),
       * the inline name or the internalID.
       * @param {*} value The new value of the property
       */
      setOption(key: number | string, value: any): void;
      #private;
  }
  namespace PineIndicator {
      export { IndicatorInput, Indicator, IndicatorType };
  }
  type IndicatorInput = {
      /**
       * Input name
       */
      name: string;
      /**
       * Input inline name
       */
      inline: string;
      /**
       * Input internal ID
       */
      internalID?: string;
      /**
       * Input tooltip
       */
      tooltip?: string;
      /**
       * Input type
       */
      type: 'text' | 'source' | 'integer' | 'float' | 'resolution' | 'bool' | 'color';
      /**
       * Input default value
       */
      value: string | number | boolean;
      /**
       * If the input is hidden
       */
      isHidden: boolean;
      /**
       * If the input is fake
       */
      isFake: boolean;
      /**
       * Input options if the input is a select
       */
      options?: string[];
  };
  /**
   * Indicator type
   */
  type IndicatorType = 'Script@tv-scripting-101!' | 'StrategyScript@tv-scripting-101!';
  type Indicator = {
      /**
       * Indicator ID
       */
      pineId: string;
      /**
       * Indicator version
       */
      pineVersion: string;
      /**
       * Indicator description
       */
      description: string;
      /**
       * Indicator short description
       */
      shortDescription: string;
      /**
       * Indicator inputs
       */
      inputs: {
          [x: string]: IndicatorInput;
      };
      /**
       * Indicator plots
       */
      plots: {
          [x: string]: string;
      };
      /**
       * Indicator script
       */
      script: string;
  };
  //# sourceMappingURL=PineIndicator.d.ts.map
}
declare module '@mathieuc/tradingview/src/classes/PineIndicator.d.ts' {
  {"version":3,"file":"PineIndicator.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/classes/PineIndicator.js"],"names":[],"mappings":";AAgCiB;IAMf,2CAA2C;IAC3C,qBADY,SAAS,EAGpB;IAED,oCAAoC;IACpC,qBAEC;IAED,yCAAyC;IACzC,0BAEC;IAED,6CAA6C;IAC7C,0BAEC;IAED,mDAAmD;IACnD,+BAEC;IAED,gEAAgE;IAChE;;MAEC;IAED,uDAAuD;IACvD;;MAEC;IAED,+CAA+C;IAC/C,0BAEC;IAED;;;OAGG;IACH,eAFW,aAAa,QAIvB;IAED,wCAAwC;IACxC,qBAEC;IAED;;;;;OAKG;IACH,eAJW,MAAM,GAAG,MAAM,oBAqCzB;;CACF;;;;;;;;UAjIa,MAAM;;;;YACN,MAAM;;;;iBACN,MAAM;;;;cACN,MAAM;;;;UACN,MAAM,GAAG,QAAQ,GAAG,SAAS,GACrC,OAAO,GAAG,YAAY,GAAG,MAAM,GAAG,OAAO;;;;WAEjC,MAAM,GAAG,MAAM,GAAG,OAAO;;;;cACzB,OAAO;;;;YACP,OAAO;;;;cACP,MAAM,EAAE;;;;;qBAeT,0BAA0B,GACjC,kCAAkC;;;;;YAX1B,MAAM;;;;iBACN,MAAM;;;;iBACN,MAAM;;;;sBACN,MAAM;;;;;YACC,MAAM,GAAE,cAAc;;;;;;YACtB,MAAM,GAAE,MAAM;;;;;YACrB,MAAM"}
}
declare module '@mathieuc/tradingview/src/classes/PinePermManager' {
  export = PinePermManager;
  /**
   * @typedef {Object} AuthorizationUser
   * @prop {id} id User id
   * @prop {string} username User's username
   * @prop {string} userpic User's profile picture URL
   * @prop {string} expiration Authorization expiration date
   * @prop {string} created Authorization creation date
   */
  /** @class */
  class PinePermManager {
      /**
       * Creates a PinePermManager instance
       * @param {string} sessionId Token from `sessionid` cookie
       * @param {string} signature Signature cookie
       * @param {string} pineId Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
       */
      constructor(sessionId: string, signature: string, pineId: string);
      sessionId: string;
      pineId: string;
      signature: string;
      /**
       * Get list of authorized users
       * @param {number} limit Fetching limit
       * @param {'user__username'
       * | '-user__username'
       * | 'created' | 'created'
       * | 'expiration,user__username'
       * | '-expiration,user__username'
       * } order Fetching order
       * @returns {AuthorizationUser[]}
       */
      getUsers(limit?: number, order?: 'user__username' | '-user__username' | 'created' | 'created' | 'expiration,user__username' | '-expiration,user__username'): AuthorizationUser[];
      /**
       * Adds an user to the authorized list
       * @param {string} username User's username
       * @param {Date} [expiration] Expiration date
       * @returns {'ok' | 'exists' | null}
       */
      addUser(username: string, expiration?: Date): 'ok' | 'exists' | null;
      /**
       * Modify an authorization expiration date
       * @param {string} username User's username
       * @param {Date} [expiration] New expiration date
       * @returns {'ok' | null}
       */
      modifyExpiration(username: string, expiration?: Date): 'ok' | null;
      /**
       * Removes an user to the authorized list
       * @param {string} username User's username
       * @returns {'ok' | null}
       */
      removeUser(username: string): 'ok' | null;
  }
  namespace PinePermManager {
      export { AuthorizationUser };
  }
  type AuthorizationUser = {
      /**
       * User id
       */
      id: id;
      /**
       * User's username
       */
      username: string;
      /**
       * User's profile picture URL
       */
      userpic: string;
      /**
       * Authorization expiration date
       */
      expiration: string;
      /**
       * Authorization creation date
       */
      created: string;
  };
  //# sourceMappingURL=PinePermManager.d.ts.map
}
declare module '@mathieuc/tradingview/src/classes/PinePermManager.d.ts' {
  {"version":3,"file":"PinePermManager.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/classes/PinePermManager.js"],"names":[],"mappings":";AAEA;;;;;;;GAOG;AAEH,aAAa;AACb;IAKE;;;;;OAKG;IACH,uBAJW,MAAM,aACN,MAAM,UACN,MAAM,EAShB;IAjBD,kBAAU;IAEV,eAAO;IAaL,kBAA0B;IAI5B;;;;;;;;;;OAUG;IACH,iBATW,MAAM,UACN,gBAAgB,GACtB,iBAAiB,GACjB,SAAS,GAAG,SAAS,GACrB,2BAA2B,GAC3B,4BAA4B,GAEpB,iBAAiB,EAAE,CAoB/B;IAED;;;;;OAKG;IACH,kBAJW,MAAM,eACN,IAAI,GACF,IAAI,GAAG,QAAQ,GAAG,IAAI,CA4BlC;IAED;;;;;OAKG;IACH,2BAJW,MAAM,eACN,IAAI,GACF,IAAI,GAAG,IAAI,CA4BvB;IAED;;;;OAIG;IACH,qBAHW,MAAM,GACJ,IAAI,GAAG,IAAI,CAoBvB;CACF;;;;;;;;;;;;cAtJS,MAAM;;;;aACN,MAAM;;;;gBACN,MAAM;;;;aACN,MAAM"}
}
declare module '@mathieuc/tradingview/src/client' {
  export = Client;
  class Client {
      /**
       * @typedef {Object} ClientOptions
       * @prop {string} [token] User auth token (in 'sessionid' cookie)
       * @prop {string} [signature] User auth token signature (in 'sessionid_sign' cookie)
       * @prop {boolean} [DEBUG] Enable debug mode
       * @prop {'data' | 'prodata' | 'widgetdata'} [server] Server type
       */
      /** Client object
       * @param {ClientOptions} clientOptions TradingView client options
       */
      constructor(clientOptions?: {
          /**
           * User auth token (in 'sessionid' cookie)
           */
          token?: string;
          /**
           * User auth token signature (in 'sessionid_sign' cookie)
           */
          signature?: string;
          /**
           * Enable debug mode
           */
          DEBUG?: boolean;
          /**
           * Server type
           */
          server?: 'data' | 'prodata' | 'widgetdata';
      });
      /** If the client is logged in */
      get isLogged(): boolean;
      /** If the cient was closed */
      get isOpen(): boolean;
      /**
       * When client is connected
       * @param {() => void} cb Callback
       * @event onConnected
       */
      onConnected(cb: () => void): void;
      /**
       * When client is disconnected
       * @param {() => void} cb Callback
       * @event onDisconnected
       */
      onDisconnected(cb: () => void): void;
      /**
       * @typedef {Object} SocketSession
       * @prop {string} session_id Socket session ID
       * @prop {number} timestamp Session start timestamp
       * @prop {number} timestampMs Session start milliseconds timestamp
       * @prop {string} release Release
       * @prop {string} studies_metadata_hash Studies metadata hash
       * @prop {'json' | string} protocol Used protocol
       * @prop {string} javastudies Javastudies
       * @prop {number} auth_scheme_vsn Auth scheme type
       * @prop {string} via Socket IP
       */
      /**
       * When client is logged
       * @param {(SocketSession: SocketSession) => void} cb Callback
       * @event onLogged
       */
      onLogged(cb: (SocketSession: {
          /**
           * Socket session ID
           */
          session_id: string;
          /**
           * Session start timestamp
           */
          timestamp: number;
          /**
           * Session start milliseconds timestamp
           */
          timestampMs: number;
          /**
           * Release
           */
          release: string;
          /**
           * Studies metadata hash
           */
          studies_metadata_hash: string;
          /**
           * Used protocol
           */
          protocol: 'json' | string;
          /**
           * Javastudies
           */
          javastudies: string;
          /**
           * Auth scheme type
           */
          auth_scheme_vsn: number;
          /**
           * Socket IP
           */
          via: string;
      }) => void): void;
      /**
       * When server is pinging the client
       * @param {(i: number) => void} cb Callback
       * @event onPing
       */
      onPing(cb: (i: number) => void): void;
      /**
       * When unparsed data is received
       * @param {(...{}) => void} cb Callback
       * @event onData
       */
      onData(cb: (...{}) => void): void;
      /**
       * When a client error happens
       * @param {(...{}) => void} cb Callback
       * @event onError
       */
      onError(cb: (...{}) => void): void;
      /**
       * When a client event happens
       * @param {(...{}) => void} cb Callback
       * @event onEvent
       */
      onEvent(cb: (...{}) => void): void;
      send(t: string, p: string[]): void;
      /** Send all waiting packets */
      sendQueue(): void;
      /** @namespace Session */
      Session: {
          Quote: {
              new (options?: {
                  /**
                   * Asked quote fields
                   */
                  fields?: "all" | "price";
                  /**
                   * List of asked quote fields
                   */
                  customFields?: quoteSessionGenerator.quoteField[];
              }): {
                  "__#3@#sessionID": string;
                  "__#3@#client": ClientBridge;
                  "__#3@#symbolListeners": {
                      [x: string]: Function[];
                  };
                  "__#3@#quoteSession": quoteSessionGenerator.QuoteSessionBridge;
                  Market: {
                      new (symbol: string, session?: string): {
                          "__#2@#symbolListeners": {
                              [x: string]: Function[];
                          };
                          "__#2@#symbol": string;
                          "__#2@#session": string;
                          "__#2@#symbolKey": string;
                          "__#2@#symbolListenerID": number;
                          "__#2@#lastData": {};
                          "__#2@#callbacks": {
                              loaded: any[];
                              data: any[];
                              /** @typedef {Object<string, Session>} SessionList Session list */
                              /**
                               * @callback SendPacket Send a custom packet
                               * @param {string} t Packet type
                               * @param {string[]} p Packet data
                               * @returns {void}
                              */
                              /**
                               * @typedef {Object} ClientBridge
                               * @prop {SessionList} sessions
                               * @prop {SendPacket} send
                               */
                              /**
                               * @typedef { 'connected' | 'disconnected'
                               *  | 'logged' | 'ping' | 'data'
                               *  | 'error' | 'event'
                               * } ClientEvent
                               */
                              /** @class */
                              event: any[];
                              error: any[];
                          };
                          "__#2@#handleEvent"(ev: import("@mathieuc/tradingview/src/quote/market").MarketEvent, ...data: {}[]): void;
                          "__#2@#handleError"(...msgs: any[]): void;
                          onLoaded(cb: () => void): void;
                          onData(cb: (data: {}) => void): void;
                          onEvent(cb: (...any: any[]) => void): void;
                          onError(cb: (...any: any[]) => void): void; /**
                           * When server is pinging the client
                           * @param {(i: number) => void} cb Callback
                           * @event onPing
                           */
                          close(): void;
                      };
                  };
                  delete(): void;
              };
          };
          Chart: {
              new (): {
                  "__#6@#chartSessionID": string;
                  "__#6@#replaySessionID": string;
                  "__#6@#replayMode": boolean;
                  "__#6@#replayOKCB": {
                      [x: string]: () => any;
                  };
                  "__#6@#client": ClientBridge;
                  "__#6@#studyListeners": {
                      [x: string]: Function[];
                  };
                  "__#6@#periods": {
                      [x: number]: chartSessionGenerator.PricePeriod[];
                  };
                  readonly periods: chartSessionGenerator.PricePeriod[];
                  "__#6@#infos": chartSessionGenerator.MarketInfos;
                  readonly infos: chartSessionGenerator.MarketInfos;
                  "__#6@#callbacks": {
                      seriesLoaded: any[];
                      symbolLoaded: any[];
                      update: any[];
                      replayLoaded: any[];
                      replayPoint: any[];
                      replayResolution: any[];
                      replayEnd: any[];
                      event: any[];
                      error: any[];
                  };
                  "__#6@#handleEvent"(ev: chartSessionGenerator.ChartEvent, ...data: {}[]): void;
                  "__#6@#handleError"(...msgs: any[]): void;
                  "__#6@#seriesCreated": boolean;
                  "__#6@#currentSeries": number;
                  setSeries(timeframe?: import("@mathieuc/tradingview/src/types").TimeFrame, range?: number, reference?: number): void;
                  setMarket(symbol: string, options?: {
                      timeframe?: import("@mathieuc/tradingview/src/types").TimeFrame;
                      range?: number;
                      to?: number;
                      adjustment?: "splits" | "dividends";
                      session?: "regular" | "extended";
                      currency?: string;
                      type?: chartSessionGenerator.ChartType;
                      inputs?: chartSessionGenerator.ChartInputs;
                      replay?: number;
                  }): void;
                  setTimezone(timezone: import("@mathieuc/tradingview/src/types").Timezone): void;
                  fetchMore(number?: number): void;
                  replayStep(number?: number): Promise<any>;
                  replayStart(interval?: number): Promise<any>;
                  replayStop(): Promise<any>;
                  onSymbolLoaded(cb: () => void): void;
                  onUpdate(cb: (changes: string[]) => void): void;
                  onReplayLoaded(cb: () => void): void;
                  onReplayResolution(cb: (timeframe: import("@mathieuc/tradingview/src/types").TimeFrame, index: number) => void): void;
                  onReplayEnd(cb: () => void): void;
                  onReplayPoint(cb: (index: number) => void): void;
                  onError(cb: (...any: any[]) => void): void;
                  "__#6@#chartSession": chartSessionGenerator.ChartSessionBridge;
                  Study: {
                      new (indicator: import("@mathieuc/tradingview/src/classes/PineIndicator") | import("./classes/BuiltInIndicator")): {
                          "__#5@#studID": string;
                          "__#5@#studyListeners": {
                              [x: string]: Function[];
                          };
                          "__#5@#periods": {
                              [x: number]: {}[];
                          };
                          readonly periods: {}[];
                          "__#5@#indexes": number[];
                          "__#5@#graphic": {
                              [x: string]: {
                                  [x: number]: {};
                              };
                          };
                          readonly graphic: import("@mathieuc/tradingview/src/chart/graphicParser").GraphicData;
                          "__#5@#strategyReport": import("@mathieuc/tradingview/src/chart/study").StrategyReport;
                          readonly strategyReport: import("@mathieuc/tradingview/src/chart/study").StrategyReport;
                          "__#5@#callbacks": {
                              studyCompleted: any[];
                              update: any[];
                              event: any[];
                              error: any[];
                          };
                          "__#5@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
                          "__#5@#handleError"(...msgs: any[]): void;
                          instance: import("@mathieuc/tradingview/src/classes/PineIndicator") | import("./classes/BuiltInIndicator");
                          setIndicator(indicator: import("@mathieuc/tradingview/src/classes/PineIndicator") | import("./classes/BuiltInIndicator")): void;
                          onReady(cb: () => void): void;
                          onUpdate(cb: (changes: ("plots" | "report.currency" | "report.settings" | "report.perf" | "report.trades" | "report.history" | "graphic")[]) => void): void;
                          onError(cb: (...any: any[]) => void): void;
                          remove(): void;
                      };
                  };
                  delete(): void;
              };
          };
      };
      /**
       * Close the websocket connection
       * @return {Promise<void>} When websocket is closed
       */
      end(): Promise<void>;
      #private;
  }
  namespace Client {
      export { Session, SessionList, SendPacket, ClientBridge, ClientEvent };
  }
  import quoteSessionGenerator = require("./quote/session");
  type ClientBridge = {
      sessions: SessionList;
      send: SendPacket;
  };
  import chartSessionGenerator = require("./chart/session");
  type Session = {
      /**
       * Session type
       */
      type: 'quote' | 'chart' | 'replay';
      /**
       * When there is a data
       */
      onData: (data: {}) => null;
  };
  /**
   * Session list
   */
  type SessionList = {
      [x: string]: Session;
  };
  /**
   * Send a custom packet
   */
  type SendPacket = (t: string, p: string[]) => void;
  type ClientEvent = 'connected' | 'disconnected' | 'logged' | 'ping' | 'data' | 'error' | 'event';
  //# sourceMappingURL=client.d.ts.map
}
declare module '@mathieuc/tradingview/src/client.d.ts' {
  {"version":3,"file":"client.d.ts","sourceRoot":"","sources":["../../../../../../Documents/coding/TradingView-API/src/client.js"],"names":[],"mappings":";AAqCiB;IAgLf;;;;;;OAMG;IAEH;;OAEG;IACH;;;;gBATU,MAAM;;;;oBACN,MAAM;;;;gBACN,OAAO;;;;iBACP,MAAM,GAAG,SAAS,GAAG,YAAY;OAgD1C;IAhOD,iCAAiC;IACjC,wBAEC;IAED,8BAA8B;IAC9B,sBAEC;IA8BD;;;;OAIG;IACH,gBAHW,MAAM,IAAI,QAKpB;IAED;;;;OAIG;IACH,mBAHW,MAAM,IAAI,QAKpB;IAED;;;;;;;;;;;OAWG;IAEH;;;;OAIG;IACH;;;;oBAhBU,MAAM;;;;mBACN,MAAM;;;;qBACN,MAAM;;;;iBACN,MAAM;;;;+BACN,MAAM;;;;kBACN,MAAM,GAAG,MAAM;;;;qBACf,MAAM;;;;yBACN,MAAM;;;;aACN,MAAM;UAK6B,IAAI,QAKhD;IAED;;;;OAIG;IACH,eAHe,MAAM,KAAK,IAAI,QAK7B;IAED;;;;OAIG;IACH,WAHW,CAAC,GAAG,EAAE,KAAK,IAAI,QAKzB;IAED;;;;OAIG;IACH,YAHW,CAAC,GAAG,EAAE,KAAK,IAAI,QAKzB;IAED;;;;OAIG;IACH,YAHW,CAAC,GAAG,EAAE,KAAK,IAAI,QAKzB;IAzIA,mCAIH;IAuLE,+BAA+B;IAC/B,kBAMC;IA+DD,yBAAyB;IACzB;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4BArQF,kEAAkE;4BAElE;;;;;8BAKE;4BAEF;;;;+BAIG;4BAEH;;;;;+BAKG;4BAEH,aAAa;;;;;;;;;oEAoFX;;;;2BAIG;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;MA0JD;IAEF;;;OAGG;IACH,OAFY,QAAQ,IAAI,CAAC,CAOxB;;CACF;;;;;;cAzQS,WAAW;UACX,UAAU;;;;;;;UAhBV,OAAO,GAAG,OAAO,GAAG,QAAQ;;;;mBACrB,EAAE,KAAK,IAAI;;;;;;QAGP,MAAM,GAAE,OAAO;;;;;sBAIzB,MAAM,KACN,MAAM,EAAE,KACN,IAAI;mBAUH,WAAW,GAAG,cAAc,GACpC,QAAQ,GAAG,MAAM,GAAG,MAAM,GAC1B,OAAO,GAAG,OAAO"}
}
declare module '@mathieuc/tradingview/src/miscRequests' {
  export type advice = number;
  export type Period = {
      Other: advice;
      All: advice;
      MA: advice;
  };
  export type Periods = {
      '1': Period;
      '5': Period;
      '15': Period;
      '60': Period;
      '240': Period;
      '1D': Period;
      '1W': Period;
      '1M': Period;
  };
  import PineIndicator = require("./classes/PineIndicator");
  /**
   * Get technical analysis
   * @function getTA
   * @param {Screener} screener Market screener
   * @param {string} id Full market id (Example: COINBASE:BTCEUR)
   * @returns {Promise<Periods>} results
   */
  function getTA(screener: Screener, id: string): Promise<Periods>;
  /**
   * @typedef {Object} SearchMarketResult
   * @prop {string} id Market full symbol
   * @prop {string} exchange Market exchange name
   * @prop {string} fullExchange Market exchange full name
   * @prop {Screener | 'forex' | 'crypto'} screener Market screener
   * @prop {string} symbol Market symbol
   * @prop {string} description Market name
   * @prop {string} type Market type
   * @prop {() => Promise<Periods>} getTA Get market technical analysis
   */
  /**
   * Find a symbol
   * @function searchMarket
   * @param {string} search Keywords
   * @param {'stock'
   *  | 'futures' | 'forex' | 'cfd'
   *  | 'crypto' | 'index' | 'economic'
   * } [filter] Caterogy filter
   * @returns {Promise<SearchMarketResult[]>} Search results
   */
  function searchMarket(search: string, filter?: "index" | "crypto" | "stock" | "futures" | "forex" | "cfd" | "economic"): Promise<{
      /**
       * Market full symbol
       */
      id: string;
      /**
       * Market exchange name
       */
      exchange: string;
      /**
       * Market exchange full name
       */
      fullExchange: string;
      /**
       * Market screener
       */
      screener: any;
      /**
       * Market symbol
       */
      symbol: string;
      /**
       * Market name
       */
      description: string;
      /**
       * Market type
       */
      type: string;
      /**
       * Get market technical analysis
       */
      getTA: () => Promise<Periods>;
  }[]>;
  /**
   * @typedef {Object} SearchIndicatorResult
   * @prop {string} id Script ID
   * @prop {string} version Script version
   * @prop {string} name Script complete name
   * @prop {{ id: number, username: string }} author Author user ID
   * @prop {string} image Image ID https://tradingview.com/i/${image}
   * @prop {string | ''} source Script source (if available)
   * @prop {'study' | 'strategy'} type Script type (study / strategy)
   * @prop {'open_source' | 'closed_source' | 'invite_only'
   *  | 'private' | 'other'} access Script access type
   * @prop {() => Promise<PineIndicator>} get Get the full indicator informations
   */
  /**
   * Find an indicator
   * @function searchIndicator
   * @param {string} search Keywords
   * @returns {Promise<SearchIndicatorResult[]>} Search results
   */
  function searchIndicator(search?: string): Promise<{
      /**
       * Script ID
       */
      id: string;
      /**
       * Script version
       */
      version: string;
      /**
       * Script complete name
       */
      name: string;
      /**
       * Author user ID
       */
      author: {
          id: number;
          username: string;
      };
      /**
       * Image ID https://tradingview.com/i/${image}
       */
      image: string;
      /**
       * Script source (if available)
       */
      source: string;
      /**
       * Script type (study / strategy)
       */
      type: "study" | "strategy";
      /**
       * Script access type
       */
      access: "private" | "other" | "closed_source" | "open_source" | "invite_only";
      /**
       * Get the full indicator informations
       */
      get: () => Promise<PineIndicator>;
  }[]>;
  /**
   * Get an indicator
   * @function getIndicator
   * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
   * @param {'last' | string} [version] Wanted version of the indicator
   * @returns {Promise<PineIndicator>} Indicator
   */
  function getIndicator(id: string, version?: string): Promise<PineIndicator>;
  /**
   * @typedef {Object} User Instance of User
   * @prop {number} id User ID
   * @prop {string} username User username
   * @prop {string} firstName User first name
   * @prop {string} lastName User last name
   * @prop {number} reputation User reputation
   * @prop {number} following Number of following accounts
   * @prop {number} followers Number of followers
   * @prop {Object} notifications User's notifications
   * @prop {number} notifications.user User notifications
   * @prop {number} notifications.following Notification from following accounts
   * @prop {string} session User session
   * @prop {string} sessionHash User session hash
   * @prop {string} signature User session signature
   * @prop {string} privateChannel User private channel
   * @prop {string} authToken User auth token
   * @prop {Date} joinDate Account creation date
   */
  /**
   * Get user and sessionid from username/email and password
   * @function loginUser
   * @param {string} username User username/email
   * @param {string} password User password
   * @param {boolean} [remember] Remember the session (default: false)
   * @param {string} [UA] Custom UserAgent
   * @returns {Promise<User>} Token
   */
  function loginUser(username: string, password: string, remember?: boolean, UA?: string): Promise<{
      /**
       * User ID
       */
      id: number;
      /**
       * User username
       */
      username: string;
      /**
       * User first name
       */
      firstName: string;
      /**
       * User last name
       */
      lastName: string;
      /**
       * User reputation
       */
      reputation: number;
      /**
       * Number of following accounts
       */
      following: number;
      /**
       * Number of followers
       */
      followers: number;
      /**
       * User's notifications
       */
      notifications: {
          /**
           * User notifications
           */
          user: number;
          /**
           * Notification from following accounts
           */
          following: number;
      };
      /**
       * User session
       */
      session: string;
      /**
       * User session hash
       */
      sessionHash: string;
      /**
       * User session signature
       */
      signature: string;
      /**
       * User private channel
       */
      privateChannel: string;
      /**
       * User auth token
       */
      authToken: string;
      /**
       * Account creation date
       */
      joinDate: Date;
  }>;
  /**
   * Get user from 'sessionid' cookie
   * @function getUser
   * @param {string} session User 'sessionid' cookie
   * @param {string} [signature] User 'sessionid_sign' cookie
   * @param {string} [location] Auth page location (For france: https://fr.tradingview.com/)
   * @returns {Promise<User>} Token
   */
  function getUser(session: string, signature?: string, location?: string): Promise<{
      /**
       * User ID
       */
      id: number;
      /**
       * User username
       */
      username: string;
      /**
       * User first name
       */
      firstName: string;
      /**
       * User last name
       */
      lastName: string;
      /**
       * User reputation
       */
      reputation: number;
      /**
       * Number of following accounts
       */
      following: number;
      /**
       * Number of followers
       */
      followers: number;
      /**
       * User's notifications
       */
      notifications: {
          /**
           * User notifications
           */
          user: number;
          /**
           * Notification from following accounts
           */
          following: number;
      };
      /**
       * User session
       */
      session: string;
      /**
       * User session hash
       */
      sessionHash: string;
      /**
       * User session signature
       */
      signature: string;
      /**
       * User private channel
       */
      privateChannel: string;
      /**
       * User auth token
       */
      authToken: string;
      /**
       * Account creation date
       */
      joinDate: Date;
  }>;
  /**
   * Get user's private indicators from a 'sessionid' cookie
   * @function getPrivateIndicators
   * @param {string} session User 'sessionid' cookie
   * @param {string} [signature] User 'sessionid_sign' cookie
   * @returns {Promise<SearchIndicatorResult[]>} Search results
   */
  function getPrivateIndicators(session: string, signature?: string): Promise<{
      /**
       * Script ID
       */
      id: string;
      /**
       * Script version
       */
      version: string;
      /**
       * Script complete name
       */
      name: string;
      /**
       * Author user ID
       */
      author: {
          id: number;
          username: string;
      };
      /**
       * Image ID https://tradingview.com/i/${image}
       */
      image: string;
      /**
       * Script source (if available)
       */
      source: string;
      /**
       * Script type (study / strategy)
       */
      type: "study" | "strategy";
      /**
       * Script access type
       */
      access: "private" | "other" | "closed_source" | "open_source" | "invite_only";
      /**
       * Get the full indicator informations
       */
      get: () => Promise<PineIndicator>;
  }[]>;
  /**
   * User credentials
   * @typedef {Object} UserCredentials
   * @prop {number} id User ID
   * @prop {string} session User session ('sessionid' cookie)
   * @prop {string} [signature] User session signature ('sessionid_sign' cookie)
   */
  /**
   * Get a chart token from a layout ID and the user credentials if the layout is not public
   * @function getChartToken
   * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
   * @param {UserCredentials} [credentials] User credentials (id + session + [signature])
   * @returns {Promise<string>} Token
   */
  function getChartToken(layout: string, credentials?: {
      /**
       * User ID
       */
      id: number;
      /**
       * User session ('sessionid' cookie)
       */
      session: string;
      /**
       * User session signature ('sessionid_sign' cookie)
       */
      signature?: string;
  }): Promise<string>;
  /**
   * @typedef {Object} DrawingPoint Drawing poitn
   * @prop {number} time_t Point X time position
   * @prop {number} price Point Y price position
   * @prop {number} offset Point offset
   */
  /**
   * @typedef {Object} Drawing
   * @prop {string} id Drawing ID (Like: 'XXXXXX')
   * @prop {string} symbol Layout market symbol (Like: 'BINANCE:BUCEUR')
   * @prop {string} ownerSource Owner user ID (Like: 'XXXXXX')
   * @prop {string} serverUpdateTime Drawing last update timestamp
   * @prop {string} currencyId Currency ID (Like: 'EUR')
   * @prop {any} unitId Unit ID
   * @prop {string} type Drawing type
   * @prop {DrawingPoint[]} points List of drawing points
   * @prop {number} zorder Drawing Z order
   * @prop {string} linkKey Drawing link key
   * @prop {Object} state Drawing state
   */
  /**
   * Get a chart token from a layout ID and the user credentials if the layout is not public
   * @function getDrawings
   * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
   * @param {string | ''} [symbol] Market filter (Like: 'BINANCE:BTCEUR')
   * @param {UserCredentials} [credentials] User credentials (id + session + [signature])
   * @param {number} [chartID] Chart ID
   * @returns {Promise<Drawing[]>} Drawings
   */
  function getDrawings(layout: string, symbol?: string, credentials?: {
      /**
       * User ID
       */
      id: number;
      /**
       * User session ('sessionid' cookie)
       */
      session: string;
      /**
       * User session signature ('sessionid_sign' cookie)
       */
      signature?: string;
  }, chartID?: number): Promise<{
      /**
       * Drawing ID (Like: 'XXXXXX')
       */
      id: string;
      /**
       * Layout market symbol (Like: 'BINANCE:BUCEUR')
       */
      symbol: string;
      /**
       * Owner user ID (Like: 'XXXXXX')
       */
      ownerSource: string;
      /**
       * Drawing last update timestamp
       */
      serverUpdateTime: string;
      /**
       * Currency ID (Like: 'EUR')
       */
      currencyId: string;
      /**
       * Unit ID
       */
      unitId: any;
      /**
       * Drawing type
       */
      type: string;
      /**
       * List of drawing points
       */
      points: {
          /**
           * Point X time position
           */
          time_t: number;
          /**
           * Point Y price position
           */
          price: number;
          /**
           * Point offset
           */
          offset: number;
      }[];
      /**
       * Drawing Z order
       */
      zorder: number;
      /**
       * Drawing link key
       */
      linkKey: string;
      /**
       * Drawing state
       */
      state: any;
  }[]>;
  export {};
  //# sourceMappingURL=miscRequests.d.ts.map
}
declare module '@mathieuc/tradingview/src/miscRequests.d.ts' {
  {"version":3,"file":"miscRequests.d.ts","sourceRoot":"","sources":["../../../../../../Documents/coding/TradingView-API/src/miscRequests.js"],"names":[],"mappings":"qBAmBc,MAAM;qBAGP;IACZ,KAAS,EAAE,MAAM,CAAC;IAClB,GAAO,EAAE,MAAM,CAAC;IAChB,EAAM,EAAE,MAAM,CAAA;CACX;sBAIS;IACZ,GAAM,EAAE,MAAM,CAAC;IACf,GAAM,EAAE,MAAM,CAAC;IACf,IAAO,EAAE,MAAM,CAAC;IAChB,IAAO,EAAE,MAAM,CAAC;IAChB,KAAQ,EAAE,MAAM,CAAC;IACjB,IAAO,EAAE,MAAM,CAAC;IAChB,IAAO,EAAE,MAAM,CAAC;IAChB,IAAO,EAAE,MAAM,CAAA;CACZ;;AAsCF;;;;;;GAMG;AACH,yEAkBC;AAED;;;;;;;;;;GAUG;AAEH;;;;;;;;;GASG;AACH;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;KAgCC;AAED;;;;;;;;;;;;GAYG;AAEH;;;;;GAKG;AACH;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;KA0DC;AAED;;;;;;GAMG;AACH,oFAoEC;AAED;;;;;;;;;;;;;;;;;;GAkBG;AAEH;;;;;;;;GAQG;AACH;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;GAwCC;AAED;;;;;;;GAOG;AACH;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;GA+BC;AAED;;;;;;GAMG;AACH;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;KAwBC;AAED;;;;;;GAMG;AAEH;;;;;;GAMG;AACH;;;;;;;;;;;;;oBAsBC;AAED;;;;;GAKG;AAEH;;;;;;;;;;;;;GAaG;AAEH;;;;;;;;GAQG;AACH;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;KAqBC"}
}
declare module '@mathieuc/tradingview/src/protocol' {
  export type TWPacket = {
      /**
       * Packet type
       */
      m?: string;
      /**
       * Packet data
       */
      p?: [session: string, {}];
  };
  /**
   * Parse websocket packet
   * @function parseWSPacket
   * @param {string} str Websocket raw data
   * @returns {TWPacket[]} TradingView packets
   */
  function parseWSPacket(str: string): TWPacket[];
  /**
   * Format websocket packet
   * @function formatWSPacket
   * @param {TWPacket} packet TradingView packet
   * @returns {string} Websocket raw data
   */
  function formatWSPacket(packet: TWPacket): string;
  /**
   * Parse compressed data
   * @function parseCompressed
   * @param {string} data Compressed data
   * @returns {Promise<{}>} Parsed data
   */
  function parseCompressed(data: string): Promise<{}>;
  export {};
  //# sourceMappingURL=protocol.d.ts.map
}
declare module '@mathieuc/tradingview/src/protocol.d.ts' {
  {"version":3,"file":"protocol.d.ts","sourceRoot":"","sources":["../../../../../../Documents/coding/TradingView-API/src/protocol.js"],"names":[],"mappings":";;;;QAIU,MAAM;;;;QACN,CAAC,OAAO,EAAE,MAAM,EAAE,EAAE,CAAC;;AAO7B;;;;;GAKG;AACH,wDAYC;AAED;;;;;GAKG;AACH,0DAKC;AAED;;;;;GAKG;AACH,4DAOC"}
}
declare module '@mathieuc/tradingview/src/quote/market' {
  function _exports(quoteSession: import('@mathieuc/tradingview/src/quote/session').QuoteSessionBridge): {
      new (symbol: string, session?: string): {
          "__#2@#symbolListeners": {
              [x: string]: Function[];
          };
          "__#2@#symbol": string;
          "__#2@#session": string;
          "__#2@#symbolKey": string;
          "__#2@#symbolListenerID": number;
          "__#2@#lastData": {};
          "__#2@#callbacks": {
              loaded: any[];
              data: any[];
              event: any[];
              error: any[];
          };
          /**
           * @param {MarketEvent} ev Client event
           * @param {...{}} data Packet data
           */
          "__#2@#handleEvent"(ev: MarketEvent, ...data: {}[]): void;
          "__#2@#handleError"(...msgs: any[]): void;
          /**
           * When quote market is loaded
           * @param {() => void} cb Callback
           * @event
           */
          onLoaded(cb: () => void): void;
          /**
           * When quote data is received
           * @param {(data: {}) => void} cb Callback
           * @event
           */
          onData(cb: (data: {}) => void): void;
          /**
           * When quote event happens
           * @param {(...any) => void} cb Callback
           * @event
           */
          onEvent(cb: (...any: any[]) => void): void;
          /**
           * When quote error happens
           * @param {(...any) => void} cb Callback
           * @event
           */
          onError(cb: (...any: any[]) => void): void;
          /** Close this listener */
          close(): void;
      };
  };
  export = _exports;
  export type MarketEvent = 'loaded' | 'data' | 'error';
  //# sourceMappingURL=market.d.ts.map
}
declare module '@mathieuc/tradingview/src/quote/market.d.ts' {
  {"version":3,"file":"market.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/quote/market.js"],"names":[],"mappings":"AAQiB,wCAHN,OAAO,WAAW,EAAE,kBAAkB;iBAuCpC,MAAM,YACN,MAAM;;;;;;;;;;;;;;;QAhBjB;;;WAGG;gCAFQ,WAAW,WACR,EAAE;;QAsDhB;;;;WAIG;qBAFQ,MAAM,IAAI;QAOrB;;;;WAIG;0BAFe,EAAE,KAAK,IAAI;QAO7B;;;;WAIG;uCAFoB,IAAI;QAO3B;;;;WAIG;uCAFoB,IAAI;QAO3B,0BAA0B;;;EAU3B;;0BAlIY,QAAQ,GAAG,MAAM,GAAG,OAAO"}
}
declare module '@mathieuc/tradingview/src/quote/session' {
  function _exports(client: import('@mathieuc/tradingview/src/client').ClientBridge): {
      new (options?: {
          /**
           * Asked quote fields
           */
          fields?: 'all' | 'price';
          /**
           * List of asked quote fields
           */
          customFields?: quoteField[];
      }): {
          "__#3@#sessionID": string;
          /** Parent client */
          "__#3@#client": import("@mathieuc/tradingview/src/client").ClientBridge;
          /** @type {SymbolListeners} */
          "__#3@#symbolListeners": SymbolListeners;
          /** @type {QuoteSessionBridge} */
          "__#3@#quoteSession": QuoteSessionBridge;
          /** @constructor */
          Market: {
              new (symbol: string, session?: string): {
                  "__#2@#symbolListeners": {
                      [x: string]: Function[];
                  };
                  "__#2@#symbol": string;
                  "__#2@#session": string;
                  "__#2@#symbolKey": string;
                  "__#2@#symbolListenerID": number;
                  "__#2@#lastData": {};
                  "__#2@#callbacks": {
                      loaded: any[];
                      data: any[];
                      event: any[];
                      error: any[];
                  };
                  "__#2@#handleEvent"(ev: quoteMarketConstructor.MarketEvent, ...data: {}[]): void;
                  "__#2@#handleError"(...msgs: any[]): void;
                  onLoaded(cb: () => void): void;
                  onData(cb: (data: {}) => void): void;
                  onEvent(cb: (...any: any[]) => void): void;
                  onError(cb: (...any: any[]) => void): void;
                  close(): void;
              };
          };
          /** Delete the quote session */
          delete(): void;
      };
  };
  export = _exports;
  export type SymbolListeners = {
      [x: string]: Function[];
  };
  export type QuoteSessionBridge = {
      sessionID: string;
      symbolListeners: SymbolListeners;
      send: import('@mathieuc/tradingview/src/client').SendPacket;
  };
  /**
   * Quote data field
   */
  export type quoteField = 'base-currency-logoid' | 'ch' | 'chp' | 'currency-logoid' | 'provider_id' | 'currency_code' | 'current_session' | 'description' | 'exchange' | 'format' | 'fractional' | 'is_tradable' | 'language' | 'local_description' | 'logoid' | 'lp' | 'lp_time' | 'minmov' | 'minmove2' | 'original_name' | 'pricescale' | 'pro_name' | 'short_name' | 'type' | 'update_mode' | 'volume' | 'ask' | 'bid' | 'fundamentals' | 'high_price' | 'low_price' | 'open_price' | 'prev_close_price' | 'rch' | 'rchp' | 'rtc' | 'rtc_time' | 'status' | 'industry' | 'basic_eps_net_income' | 'beta_1_year' | 'market_cap_basic' | 'earnings_per_share_basic_ttm' | 'price_earnings_ttm' | 'sector' | 'dividends_yield' | 'timezone' | 'country_code';
  import quoteMarketConstructor = require("./market");
  //# sourceMappingURL=session.d.ts.map
}
declare module '@mathieuc/tradingview/src/quote/session.d.ts' {
  {"version":3,"file":"session.d.ts","sourceRoot":"","sources":["../../../../../../../Documents/coding/TradingView-API/src/quote/session.js"],"names":[],"mappings":"AAwDiB,kCAFN,OAAO,WAAW,EAAE,YAAY;;;;;iBAa/B,KAAK,GAAG,OAAO;;;;uBACf,UAAU,EAAE;;;QATtB,oBAAoB;;QAGpB,8BAA8B;iCAAnB,eAAe;QA+C1B,iCAAiC;8BAAtB,kBAAkB;QAO7B,mBAAmB;;;;;;;;;;;;;;;;;;;;;;;;;;QAGnB,+BAA+B;;;EAKhC;;;QAxHoB,MAAM,GAAE,UAAU;;;eAI7B,MAAM;qBACN,eAAe;UACf,OAAO,WAAW,EAAE,UAAU;;;;;yBAI3B,sBAAsB,GAC9B,IAAI,GAAG,KAAK,GAAG,iBAAiB,GAAG,aAAa,GAChD,eAAe,GAAG,iBAAiB,GAAG,aAAa,GACnD,UAAU,GAAG,QAAQ,GAAG,YAAY,GAAG,aAAa,GACpD,UAAU,GAAG,mBAAmB,GAAG,QAAQ,GAAG,IAAI,GAClD,SAAS,GAAG,QAAQ,GAAG,UAAU,GAAG,eAAe,GACnD,YAAY,GAAG,UAAU,GAAG,YAAY,GAAG,MAAM,GACjD,aAAa,GAAG,QAAQ,GAAG,KAAK,GAAG,KAAK,GAAG,cAAc,GACzD,YAAY,GAAG,WAAW,GAAG,YAAY,GAAG,kBAAkB,GAC9D,KAAK,GAAG,MAAM,GAAG,KAAK,GAAG,UAAU,GAAG,QAAQ,GAAG,UAAU,GAC3D,sBAAsB,GAAG,aAAa,GAAG,kBAAkB,GAC3D,8BAA8B,GAAG,oBAAoB,GACrD,QAAQ,GAAG,iBAAiB,GAAG,UAAU,GAAG,cAAc"}
}
declare module '@mathieuc/tradingview/src/types' {
  /**
   * Market symbol (like: 'BTCEUR' or 'KRAKEN:BTCEUR')
   */
  export type MarketSymbol = string;
  /**
   * (Chart) timezone
   */
  export type Timezone = 'Etc/UTC' | 'exchange' | 'Pacific/Honolulu' | 'America/Juneau' | 'America/Los_Angeles' | 'America/Phoenix' | 'America/Vancouver' | 'US/Mountain' | 'America/El_Salvador' | 'America/Bogota' | 'America/Chicago' | 'America/Lima' | 'America/Mexico_City' | 'America/Caracas' | 'America/New_York' | 'America/Toronto' | 'America/Argentina/Buenos_Aires' | 'America/Santiago' | 'America/Sao_Paulo' | 'Atlantic/Reykjavik' | 'Europe/Dublin' | 'Africa/Lagos' | 'Europe/Lisbon' | 'Europe/London' | 'Europe/Amsterdam' | 'Europe/Belgrade' | 'Europe/Berlin' | 'Europe/Brussels' | 'Europe/Copenhagen' | 'Africa/Johannesburg' | 'Africa/Cairo' | 'Europe/Luxembourg' | 'Europe/Madrid' | 'Europe/Malta' | 'Europe/Oslo' | 'Europe/Paris' | 'Europe/Rome' | 'Europe/Stockholm' | 'Europe/Warsaw' | 'Europe/Zurich' | 'Europe/Athens' | 'Asia/Bahrain' | 'Europe/Helsinki' | 'Europe/Istanbul' | 'Asia/Jerusalem' | 'Asia/Kuwait' | 'Europe/Moscow' | 'Asia/Qatar' | 'Europe/Riga' | 'Asia/Riyadh' | 'Europe/Tallinn' | 'Europe/Vilnius' | 'Asia/Tehran' | 'Asia/Dubai' | 'Asia/Muscat' | 'Asia/Ashkhabad' | 'Asia/Kolkata' | 'Asia/Almaty' | 'Asia/Bangkok' | 'Asia/Jakarta' | 'Asia/Ho_Chi_Minh' | 'Asia/Chongqing' | 'Asia/Hong_Kong' | 'Australia/Perth' | 'Asia/Shanghai' | 'Asia/Singapore' | 'Asia/Taipei' | 'Asia/Seoul' | 'Asia/Tokyo' | 'Australia/Brisbane' | 'Australia/Adelaide' | 'Australia/Sydney' | 'Pacific/Norfolk' | 'Pacific/Auckland' | 'Pacific/Fakaofo' | 'Pacific/Chatham';
  export type TimeFrame = '1' | '3' | '5' | '15' | '30' | '45' | '60' | '120' | '180' | '240' | '1D' | '1W' | '1M' | 'D' | 'W' | 'M';
  //# sourceMappingURL=types.d.ts.map
}
declare module '@mathieuc/tradingview/src/types.d.ts' {
  {"version":3,"file":"types.d.ts","sourceRoot":"","sources":["../../../../../../Documents/coding/TradingView-API/src/types.js"],"names":[],"mappings":";;;2BACa,MAAM;;;;uBAIN,SAAS,GAAG,UAAU,GAC9B,kBAAkB,GAAG,gBAAgB,GAAG,qBAAqB,GAC7D,iBAAiB,GAAG,mBAAmB,GAAG,aAAa,GACvD,qBAAqB,GAAG,gBAAgB,GAAG,iBAAiB,GAC5D,cAAc,GAAG,qBAAqB,GAAG,iBAAiB,GAC1D,kBAAkB,GAAG,iBAAiB,GAAG,gCAAgC,GACzE,kBAAkB,GAAG,mBAAmB,GAAG,oBAAoB,GAC/D,eAAe,GAAG,cAAc,GAAG,eAAe,GAAG,eAAe,GACpE,kBAAkB,GAAG,iBAAiB,GAAG,eAAe,GACxD,iBAAiB,GAAG,mBAAmB,GAAG,qBAAqB,GAC/D,cAAc,GAAG,mBAAmB,GAAG,eAAe,GAAG,cAAc,GACvE,aAAa,GAAG,cAAc,GAAG,aAAa,GAAG,kBAAkB,GACnE,eAAe,GAAG,eAAe,GAAG,eAAe,GAAG,cAAc,GACpE,iBAAiB,GAAG,iBAAiB,GAAG,gBAAgB,GAAG,aAAa,GACxE,eAAe,GAAG,YAAY,GAAG,aAAa,GAAG,aAAa,GAC9D,gBAAgB,GAAG,gBAAgB,GAAG,aAAa,GAAG,YAAY,GAClE,aAAa,GAAG,gBAAgB,GAAG,cAAc,GAAG,aAAa,GACjE,cAAc,GAAG,cAAc,GAAG,kBAAkB,GAAG,gBAAgB,GACvE,gBAAgB,GAAG,iBAAiB,GAAG,eAAe,GAAG,gBAAgB,GACzE,aAAa,GAAG,YAAY,GAAG,YAAY,GAAG,oBAAoB,GAClE,oBAAoB,GAAG,kBAAkB,GAAG,iBAAiB,GAC7D,kBAAkB,GAAG,iBAAiB,GAAG,iBAAiB;wBAIlD,GAAG,GAAG,GAAG,GAAG,GAAG,GAAG,IAAI,GAAG,IAAI,GACrC,IAAI,GAAG,IAAI,GAAG,KAAK,GAAG,KAAK,GAAG,KAAK,GACnC,IAAI,GAAG,IAAI,GAAG,IAAI,GAAG,GAAG,GAAG,GAAG,GAAG,GAAG"}
}
declare module '@mathieuc/tradingview/src/utils' {
  /**
   * Generates a session id
   * @function genSessionID
   * @param {String} type Session type
   * @returns {string}
   */
  export function genSessionID(type?: string): string;
  //# sourceMappingURL=utils.d.ts.map
}
declare module '@mathieuc/tradingview/src/utils.d.ts' {
  {"version":3,"file":"utils.d.ts","sourceRoot":"","sources":["../../../../../../Documents/coding/TradingView-API/src/utils.js"],"names":[],"mappings":"AACE;;;;;GAKG;AACH,oDAKC"}
}
declare module '@mathieuc/tradingview' {
  import main = require('@mathieuc/tradingview/main');
  export = main;
}