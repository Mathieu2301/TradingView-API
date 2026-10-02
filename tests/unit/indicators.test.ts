import { describe, expect, it } from 'vitest';
import { BuiltInIndicator } from '../../src/indicators/builtin-indicator.js';
import { parseIndicatorDefinition } from '../../src/http/indicators.js';
import { makePine } from '../helpers/indicators.js';

describe('PineIndicator', () => {
  it('serialises inputs for create_study (colours are sent by position)', () => {
    const pine = makePine();
    expect(pine.type).toBe('Script@tv-scripting-101!');
    expect(pine.toStudyInputs()).toEqual({
      text: 'bmI9Ii...IL',
      pineId: 'PUB;test',
      pineVersion: '3.0',
      in_0: { v: 14, f: false, t: 'integer' },
      in_1: { v: 'close', f: false, t: 'source' },
      in_2: { v: 2, f: true, t: 'color' },
      in_3: { v: true, f: false, t: 'bool' },
    });
  });

  it('finds inputs by ID, number, inline name or internal ID and validates values', () => {
    const pine = makePine();
    pine.setInput('in_0', 20).setInput(0, 21).setInput('Length', 22).setInput('length', 23);
    expect(pine.inputs.in_0.value).toBe(23);
    pine.setInputs({ src: 'open', Show: false });
    expect(pine.inputs.in_1.value).toBe('open');
    expect(() => pine.setInput('length', '5')).toThrow(/must be a number/);
    expect(() => pine.setInput('src', 'hl2')).toThrow(/must be one of: close, open/);
    expect(() => pine.setInput('missing', 1)).toThrow(/not found/);
  });

  it('clones independently and changes study type', () => {
    const pine = makePine();
    const copy = pine.clone().setType('StrategyScript@tv-scripting-101!');
    copy.setInput('length', 99);
    expect(pine.inputs.in_0.value).toBe(14);
    expect(pine.type).toBe('Script@tv-scripting-101!');
    expect(copy.type).toBe('StrategyScript@tv-scripting-101!');
  });
});

describe('BuiltInIndicator', () => {
  it('starts from defaults and validates option names and types', () => {
    const volume = new BuiltInIndicator('Volume@tv-basicstudies-241');
    expect(volume.toStudyInputs()).toEqual({ length: 20, col_prev_close: false });
    volume.setOption('length', 50);
    expect(() => volume.setOption('length', '50')).toThrow(/must be a number/);
    expect(() => volume.setOption('rows', 1)).toThrow(/not allowed/);
    volume.setOption('rows', 1, true);
    expect(volume.options.rows).toBe(1);
  });

  it('computes time defaults at construction and accepts unknown types', () => {
    const before = Date.now();
    const profile = new BuiltInIndicator('VbPFixed@tv-basicstudies-241!', { first_bar_time: 123 });
    expect(profile.options.last_bar_time).toBeGreaterThanOrEqual(before);
    expect(profile.options.first_bar_time).toBe(123);
    const custom = new BuiltInIndicator('Custom@tv-basicstudies-1', { anything: 'x' });
    expect(custom.options).toEqual({ anything: 'x' });
    expect(() => new BuiltInIndicator('')).toThrow(/required/);
  });
});

describe('parseIndicatorDefinition', () => {
  it('builds inputs and unique plot names from pine-facade metadata', () => {
    const indicator = parseIndicatorDefinition({
      ilTemplate: 'IL',
      metaInfo: {
        scriptIdPart: 'STD;Test',
        description: 'Test',
        shortDescription: 'T',
        pine: { version: '12.0' },
        inputs: [
          { id: 'text', name: 'text', defval: 'x', type: 'text' },
          { id: 'pineId', name: 'pineId', defval: 'x', type: 'text' },
          { id: 'in_0', name: 'Fast length!', defval: 9, type: 'integer', options: undefined },
          { id: 'in_1', name: 'Mode', inline: 'mode', internalID: 'modeId', defval: 'A', type: 'text', options: ['A', 'B'], isHidden: true },
        ],
        styles: { plot_0: { title: 'MA line' }, plot_1: { title: 'MA line' }, plot_2: { title: 'MA line' } },
        plots: [{ id: 'plot_3', type: 'colorer', target: 'plot_0' }, { id: 'plot_0', type: 'line' }],
      },
    }, 'STD%3BTest', 'last');
    expect(indicator.id).toBe('STD;Test');
    expect(indicator.version).toBe('12.0');
    expect(Object.keys(indicator.inputs)).toEqual(['in_0', 'in_1']);
    expect(indicator.inputs.in_0).toMatchObject({ inline: 'Fast_length', internalID: 'Fast_length', value: 9 });
    expect(indicator.inputs.in_1).toMatchObject({ inline: 'mode', internalID: 'modeId', isHidden: true, options: ['A', 'B'] });
    expect(indicator.plots).toEqual({
      plot_0: 'MA_line', plot_1: 'MA_line_2', plot_2: 'MA_line_3', plot_3: 'MA_line_colorer',
    });
  });
});
