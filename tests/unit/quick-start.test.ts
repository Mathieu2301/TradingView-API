import { describe, expect, it } from 'vitest';
import { AGENT_PROMPT, HELP, LANDING_URL, PACKAGE_SPEC, main, runChoice } from '../../src/quick-start.js';

describe('quick-start', () => {
  const ok = { status: 0, signal: null, error: undefined };
  it.each(['linux', 'darwin', 'win32'] as const)('opens the hosted path on %s without installing anything', (platform) => {
    const commands: string[] = [];
    const messages: string[] = [];
    expect(runChoice('1', { platform, log: (s) => messages.push(s), run: (cmd, args) => {
      commands.push(cmd);
      expect(args).toContain(LANDING_URL);
      return ok;
    } })).toBe(0);
    expect(commands).toEqual([platform === 'linux' ? 'xdg-open' : platform === 'darwin' ? 'open' : 'rundll32.exe']);
    expect(messages.join('\n')).toContain(LANDING_URL);
  });
  it('leaves a usable link when opening a browser fails', () => {
    const messages: string[] = [];
    expect(runChoice('1', { log: (s) => messages.push(s), run: () => ({ ...ok, status: null, error: new Error('ENOENT') }) })).toBe(0);
    expect(messages.join('\n')).toContain('Open the link above');
  });
  it.each([['2', 'claude'], ['3', 'codex']])('hands the prompt to %s as one argument with terminal inheritance', (choice, command) => {
    expect(runChoice(choice!, { platform: 'linux', log: () => {}, run: (cmd, args, options) => {
      expect(cmd).toBe(command);
      expect(args).toEqual([AGENT_PROMPT]);
      expect(options.stdio).toBe('inherit');
      expect(options.shell).toBeUndefined();
      return ok;
    } })).toBe(0);
  });
  it.each(['2', '3', '5'])('uses a fixed Windows launcher for choice %s', (choice) => {
    expect(runChoice(choice, { platform: 'win32', log: () => {}, run: (cmd, args, options) => {
      expect(cmd).toBe('powershell.exe');
      expect(args.join(' ')).not.toContain(AGENT_PROMPT);
      expect(options.env?.TRADINGVIEW_QUICK_START_PROMPT).toBe(AGENT_PROMPT);
      expect(args.at(-1)).toContain(choice === '5' ? `install '${PACKAGE_SPEC}'` : '$env:TRADINGVIEW_QUICK_START_PROMPT');
      return ok;
    } })).toBe(0);
  });
  it('only prints the prompt for another agent', () => {
    const messages: string[] = [];
    expect(runChoice('4', { log: (s) => messages.push(s), run: () => { throw new Error('must not spawn'); } })).toBe(0);
    expect(messages.join('\n')).toContain(AGENT_PROMPT);
  });
  it('only installs the V4 next package', () => {
    expect(runChoice('5', { platform: 'linux', log: () => {}, run: (cmd, args) => {
      expect(cmd).toBe('npm');
      expect(args).toEqual(['install', PACKAGE_SPEC]);
      return ok;
    } })).toBe(0);
  });
  it('preserves a failing child exit status and provides the fallback prompt', () => {
    const messages: string[] = [];
    expect(runChoice('2', { log: (s) => messages.push(s), run: () => ({ ...ok, status: 7 }) })).toBe(7);
    expect(messages.join('\n')).toContain(AGENT_PROMPT);
  });
  it('handles a missing CLI and interrupted installation without reporting success', () => {
    expect(runChoice('3', { log: () => {}, run: () => ({ ...ok, status: null, error: new Error('ENOENT') }) })).toBe(1);
    const messages: string[] = [];
    expect(runChoice('5', { log: (s) => messages.push(s), run: () => ({ ...ok, status: null, signal: 'SIGINT' }) })).toBe(130);
    expect(messages.join('\n')).not.toContain('Library installed');
  });
  it('rejects invalid selections without spawning a command', () => {
    expect(runChoice('6', { log: () => {}, run: () => { throw new Error('must not spawn'); } })).toBe(1);
  });
  it('documents all choices and supports help and explicit prompt mode', async () => {
    expect(HELP).toContain('Autonomous agent (recommended)');
    expect(await main(['--help'])).toBe(0);
    expect(await main(['--choice', '4'])).toBe(0);
    expect(await main(['--choice', '6'])).toBe(1);
    expect(await main(['--unknown'])).toBe(1);
  });
});
