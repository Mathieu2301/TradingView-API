export = BuiltInIndicator;
declare class BuiltInIndicator {
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
declare namespace BuiltInIndicator {
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
