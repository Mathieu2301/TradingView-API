# TradingView-API

**Essayez avec un agent hébergé :** [Créez votre veille de marché sur Molted Studio](https://molted.studio/fr/dreams/market-watch-alerts) — sans installation locale.

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Langue :** [English](../README.md) · Français · [Español](README.es.md) · [Português](README.pt.md)

**Des données de marché et des indicateurs pour construire vos outils.** Commencez avec un graphique, puis passez aux mises à jour temps réel et aux workflows assistés par agent IA. Projet communautaire indépendant, non officiel.

> **Un problème, une question ou une idée ? [Ouvrez une issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** Pas besoin d'avoir déjà une reproduction parfaite.

## Choisissez votre parcours

- **Librairie stable aujourd'hui :** `npm install @mathieuc/tradingview` puis consultez les [exemples](../examples).
- **Avec Claude Code, Codex, OpenClaw ou un autre agent :** donnez-lui le [guide agentique](agent-api.md) et ce dépôt.
- **Sans installation locale :** [Molted](https://molted.cloud/) propose un espace d'agent hébergé pouvant travailler à partir de ce dépôt. Ce choix est facultatif.

La nouvelle API agentique est **en préversion de développement** : elle n'est pas encore publiée sur npm.

## API actuelle

```js
const TradingView = require('@mathieuc/tradingview');
const client = new TradingView.Client();
const chart = new client.Session.Chart();
chart.onError((...error) => console.error(error));
chart.onUpdate(() => console.log(chart.periods[0]?.close));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });
// À la fin : chart.delete(); await client.end();
```

L'API historique, les indicateurs et les exemples restent disponibles pendant la migration.

## API pour agents — préversion

```ts
import { fetchCandles, watchCandles } from '@mathieuc/tradingview/agent';

const candles = await fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', limit: 100 });
const worker = await watchCandles(
  { symbol: 'BINANCE:BTCUSDT', timeframe: '1' },
  { onData: (snapshot) => console.log(snapshot[snapshot.length - 1]), onError: console.error },
);
await worker.stop();
```

Pour l'essayer **depuis le code source** (Node 18+ ou Bun) : `git clone https://github.com/Mathieu2301/TradingView-API.git`, puis `npm ci && npm run build:agent`, et importez `./agent.js` . Le sous-chemin npm ci-dessus ne sera disponible qu'après publication de la prochaine version. Détails : [guide agentique](agent-api.md).

La modernisation TypeScript/Bun est progressive. Recherche de stratégies, backtests, CLI/MCP et workflows hébergés sont **prévus, pas encore livrés**. [Dites-nous ce dont vous avez besoin](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).

[Dépôt GitHub](https://github.com/Mathieu2301/TradingView-API) · [Package npm](https://www.npmjs.com/package/@mathieuc/tradingview) · [Issues](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView est une marque de son propriétaire. Ce projet n'est ni affilié ni approuvé par TradingView. Vérifiez les conditions d'utilisation et droits sur les données de votre fournisseur.
