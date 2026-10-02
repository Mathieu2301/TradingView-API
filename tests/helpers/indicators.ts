import { PineIndicator } from '../../src/indicators/pine-indicator.js';

/** Small Pine indicator definition used across tests. */
export function makePine() {
  return new PineIndicator({
    id: 'PUB;test',
    version: '3.0',
    description: 'Test indicator',
    shortDescription: 'TEST',
    script: 'bmI9Ii...IL',
    inputs: {
      in_0: { name: 'Length', inline: 'Length', internalID: 'length', type: 'integer', value: 14, isHidden: false, isFake: false },
      in_1: { name: 'Source', inline: 'Source', internalID: 'src', type: 'source', value: 'close', isHidden: false, isFake: false, options: ['close', 'open'] },
      in_2: { name: 'Color', inline: 'Color', internalID: 'color', type: 'color', value: '#ff0000', isHidden: false, isFake: true },
      in_3: { name: 'Show', inline: 'Show', type: 'bool', value: true, isHidden: false, isFake: false },
    },
    plots: { plot_0: 'Value', plot_1: 'Value', plot_2: 'Signal' },
  });
}
