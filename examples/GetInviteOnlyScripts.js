const TradingView = require("../main");

/**
 * This example retrieves all invite-only scripts
 * @run node ./examples/GetInviteOnlyScripts.js <sessionid> <signature>
 */

if (!process.argv[2]) throw Error("Please specify your 'sessionid' cookie");
if (!process.argv[3]) throw Error("Please specify your 'signature' cookie");

TradingView.getInviteOnlyScripts(process.argv[2]).then((indicList) => {
  console.log(indicList);
});
