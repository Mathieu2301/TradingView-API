export = PineIndicator;
declare class PineIndicator {
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
declare namespace PineIndicator {
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
