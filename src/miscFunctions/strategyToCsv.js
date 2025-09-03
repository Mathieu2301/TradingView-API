const { fieldType, canHideStrategyFields, canRemoveStrategyFields } = require('../constants');
const TradingView = require('../miscRequests');

function jsonToCsv(data, description) {
  const csvArray = [
    ['Name', 'Value'],
    ['"__indicatorName"', description],
  ];

  for (const key in data) {
    const {
      internalID, name, value, type,
    } = data[key];
    if (type === fieldType.COLOR) continue;
    if (type === fieldType.TEXT_AREA) continue;
    if ([...canHideStrategyFields, ...canRemoveStrategyFields].includes(internalID)) continue;

    if (name) csvArray.push([`"${name.trim()}"`, value]);
  }

  return csvArray.map((row) => row.join(',')).join('\n');
}

async function populateJsonWithValues(json, data) {
  const externalSources = {};

  // eslint-disable-next-line no-underscore-dangle
  delete data.__user_pro_plan;

  const newJson = { ...json };

  for (const key in data) {
    const value = data[key];

    if (typeof value === 'object') {
      try {
        const scriptId = value.pineId ?? `${value.study}__${value.plotId}`;

        if (!externalSources[scriptId]) {
          let indicator;
          if (value.pineId) {
            indicator = await TradingView.getIndicator(scriptId);
            indicator.id = value.plotId;
            for (const k in value.inputs) {
              indicator.inputs[k].value = value.inputs[k];
            }
          } else {
            indicator = await new TradingView.BuiltInIndicator(scriptId);
            indicator.BuiltInIndicator = true;
            indicator.shortDescription = value.plotId;
            indicator.plots = { [value.plotId]: '::FIX_MANUAL::' };

            for (const k in value.inputs) {
              indicator.setOption(k, value.inputs[k]);
            }
          }

          externalSources[scriptId] = indicator;
        }

        const shortDesc = externalSources[scriptId].shortDescription;
        const newValue = externalSources[scriptId].plots[value.plotId]?.replaceAll('_', ' ');
        const separator = externalSources[scriptId].BuiltInIndicator ? '· ' : ': ';

        newJson[key].value = shortDesc + separator + newValue;
      } catch (error) {
        console.error(`Error fetching indicator for key: ${key}`, error);
      }
    } else {
      newJson[key].value = value;
    }
  }

  return [newJson, externalSources];
}

async function strategyToCsv(studyId, values) {
  const indicator = await TradingView.getIndicator(studyId);
  const [inputsWithNewValues, externalSources] = await populateJsonWithValues(
    indicator.inputs,
    values,
  );

  const csvData = jsonToCsv(inputsWithNewValues, indicator.description);

  return { csvData, externalSources };
}

module.exports = {
  strategyToCsv,
};
