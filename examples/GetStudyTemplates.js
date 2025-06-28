const TradingView = require('../main');

(async () => {
  const templates = await TradingView.getStudyTemplates();
  console.log(templates);
})();
