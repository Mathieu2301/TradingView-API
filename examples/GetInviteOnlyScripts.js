const TradingView = require("../main");

/**
 * This example retrieves all invite-only scripts
 * @run node ./examples/GetInviteOnlyScripts.js <sessionid> <signature>
 */

if (!process.argv[2]) throw Error("Please specify your 'sessionid' cookie");
if (!process.argv[3]) throw Error("Please specify your 'signature' cookie");

const client = new TradingView.Client({
  token: process.argv[2],
  signature: process.argv[3],
});

TradingView.getInviteOnlyScripts(process.argv[2]).then((indicList) => {
  console.log(indicList);
});
