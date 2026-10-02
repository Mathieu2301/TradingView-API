export { PineIndicator } from './pine-indicator.js';
export type {
  PineIndicatorDefinition, PineInput, PineInputType, PineStudyType,
} from './pine-indicator.js';
export { BuiltInIndicator } from './builtin-indicator.js';
export type { BuiltInIndicatorOption, BuiltInIndicatorType } from './builtin-indicator.js';

import type { BuiltInIndicator } from './builtin-indicator.js';
import type { PineIndicator } from './pine-indicator.js';

/** Anything that can run as a study on a chart. */
export type Indicator = PineIndicator | BuiltInIndicator;
