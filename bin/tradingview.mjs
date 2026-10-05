#!/usr/bin/env node
import { main } from '../dist/quick-start.js';

main().then((code) => { process.exitCode = code; }).catch((error) => {
  console.error(`Quick-start failed: ${error.message}`);
  process.exitCode = 1;
});
