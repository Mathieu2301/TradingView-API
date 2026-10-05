import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

export const LANDING_URL = 'https://molted.studio/dreams/market-watch-alerts';
export const PACKAGE_SPEC = '@mathieuc/tradingview@next';
export const AGENT_PROMPT = `Help me build a project using TradingView-API V4 (${PACKAGE_SPEC}).
First ask what I want to build and inspect the current project and its instructions before making changes.
Read https://github.com/Mathieu2301/TradingView-API/blob/main/llms.txt and the data API guide at https://github.com/Mathieu2301/TradingView-API/blob/main/docs/data-api.md; use the docs shipped with the installed package as the version-specific reference.
Use Node.js 20+ and install ${PACKAGE_SPEC} with the project's package manager. The default latest tag is still V3: do not mix the V3 Client API with V4.
Preserve existing files and project configuration. For a new project, start with a small runnable ESM (.mjs) example using getCandles from '@mathieuc/tradingview/data' and anonymous BINANCE:BTCUSDT data, then adapt it to my goal.
Use timeouts, handle errors, and stop watchers or close clients on shutdown. Run the example and report observed results honestly, with exact commands to run it again.
Only request TradingView credentials if my feature needs them; keep them in local environment variables, out of source control and logs. Explain any account or market-data limitations relevant to my goal.
This is an independent community library, not an official TradingView API. Do not assume it provides broker order execution.`;

export const HELP = `TradingView-API quick-start (Node.js 20+)

Usage: npx @mathieuc/tradingview@next [--choice 1|2|3|4|5]

1. Autonomous agent (recommended)
2. Claude Code CLI
3. Codex CLI
4. Another local coding agent
5. Install the library only

Run inside your project directory. Options 2 and 3 require an installed,
authenticated CLI and keep its normal permission prompts. Option 5 runs
npm install ${PACKAGE_SPEC} in the current directory.
Use --choice for non-interactive selection; --help shows this message.
`;

type Runner = (command: string, args: string[], options: SpawnSyncOptions) => Pick<SpawnSyncReturns<Buffer>, 'status' | 'signal' | 'error'>;
interface Runtime {
  run?: Runner;
  log?: (text: string) => void;
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
}

export function runChoice(choice: string, runtime: Runtime = {}): number {
  const { run = spawnSync, log = console.log, platform = process.platform, env = process.env } = runtime;
  const printPrompt = () => log(`Paste this prompt into your coding agent:\n\n${AGENT_PROMPT}\n`);
  if (choice === '4') {
    printPrompt();
    return 0;
  }
  if (choice === '1') {
    log(`Continue with an autonomous agent:\n${LANDING_URL}`);
    const [command, args]: [string, string[]] = platform === 'darwin' ? ['open', [LANDING_URL]]
      : platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', LANDING_URL]]
        : ['xdg-open', [LANDING_URL]];
    const result = run(command, args, { stdio: 'ignore', timeout: 10_000, env });
    if (result.error || result.status !== 0) log('Could not open a browser automatically. Open the link above.');
    return 0;
  }
  if (!['2', '3', '5'].includes(choice)) {
    log('Invalid choice. Choose a number from 1 to 5.');
    return 1;
  }
  const command = choice === '2' ? 'claude' : choice === '3' ? 'codex' : 'npm';
  const args = choice === '5' ? ['install', PACKAGE_SPEC] : [AGENT_PROMPT];
  log(choice === '5' ? `Installing ${PACKAGE_SPEC} in ${process.cwd()}...` : `Starting ${command} in ${process.cwd()}...`);
  // Windows npm/agent launchers may be .cmd files. Keep the prompt out of shell
  // syntax by passing it via the child environment to a fixed PowerShell script.
  const result = platform === 'win32'
    ? run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      `$ErrorActionPreference = 'Stop'; & ${command} ${choice === '5' ? `install '${PACKAGE_SPEC}'` : '$env:TRADINGVIEW_QUICK_START_PROMPT'}; exit $LASTEXITCODE`],
    { stdio: 'inherit', env: { ...env, TRADINGVIEW_QUICK_START_PROMPT: AGENT_PROMPT } })
    : run(command, args, { stdio: 'inherit', env });
  if (result.error || result.status !== 0) {
    if (choice !== '5') {
      log(`Could not complete ${command}. Ensure its CLI is installed and authenticated, then retry.`);
      printPrompt();
    } else log(`Installation did not complete. Retry: npm install ${PACKAGE_SPEC}`);
    return result.status ?? (result.signal === 'SIGINT' ? 130 : 1);
  }
  if (choice === '5') log('Library installed. Guide: https://github.com/Mathieu2301/TradingView-API/blob/main/docs/data-api.md');
  return 0;
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  if (args.length === 1 && ['--help', '-h'].includes(args[0]!)) {
    console.log(HELP);
    return 0;
  }
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--choice' || !/^[1-5]$/.test(args[1]!)) {
      console.error(HELP);
      return 1;
    }
    return runChoice(args[1]!);
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('Interactive selection requires a terminal. Use --choice 1|2|3|4|5.');
    return 1;
  }
  console.log(HELP);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const abort = new AbortController();
  rl.on('SIGINT', () => { abort.abort(); rl.close(); });
  rl.on('close', () => abort.abort());
  let choice: string;
  try {
    while (true) {
      choice = (await rl.question('Choose an option [1]: ', { signal: abort.signal })).trim() || '1';
      if (/^[1-5]$/.test(choice)) break;
      console.log('Please enter a number from 1 to 5.');
    }
  } catch (error) {
    if (abort.signal.aborted || (error as NodeJS.ErrnoException).code === 'ERR_USE_AFTER_CLOSE') return 130;
    throw error;
  } finally {
    rl.close();
  }
  // Release readline before handing the terminal to an interactive agent.
  return runChoice(choice);
}
