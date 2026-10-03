# TradingView-API

**Essayez avec un agent hébergé :** [Créez votre veille de marché sur Molted Studio](https://molted.studio/fr/dreams/market-watch-alerts) — sans installation locale.

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Langue :** [English](../README.md) · Français · [Español](README.es.md) · [Português](README.pt.md)

**Des données de marché et des indicateurs pour construire vos outils.** Bougies, cotations, indicateurs et stratégies, en une requête ou en temps réel. Projet communautaire indépendant, non officiel.

> **Un problème, une question ou une idée ? [Ouvrez une issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** Pas besoin d'avoir déjà une reproduction parfaite.

> **La version 4 est une réécriture complète en TypeScript**, avec une nouvelle API et sans couche de compatibilité. Vous venez de la v3 ? Lisez le [guide de migration](migration-v4.md) (en anglais). Toutes les fonctionnalités de la v3 restent disponibles : voir la [matrice de couverture](v4-coverage.md). Les versions npm 3.x gardent l'ancienne API `Client`.

## Choisissez votre parcours

- **Installation de la V4 bêta :** clonez ce dépôt, puis lancez `npm ci && npm run build && node examples/candles.js` (Node.js 20+ ou Bun). **npm fournit encore la V3**, pas les imports V4 ci-dessous. Consultez les [exemples](../examples).
- **Avec Claude Code, Codex, OpenClaw ou un autre assistant :** donnez-lui ce dépôt et le [guide de l'API de données](data-api.md).
- **Sans installation locale :** [Molted](https://molted.cloud/) propose un espace d'agent hébergé pouvant travailler à partir de ce dépôt. Ce choix est facultatif.

## API de données

```ts
import { getCandles, watchCandles, getQuote } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 100 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }, du plus ancien au plus récent

const quote = await getQuote('BINANCE:BTCUSDT');

const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1' }, {
  onData: (snapshot) => console.log(snapshot.at(-1)?.close),
  onError: console.error,
});
await watcher.stop();
```

Chaque fonction gère la connexion, le délai maximal (`timeoutMs`), l'annulation (`signal`) et le nettoyage. Autres fonctions : `getQuotes`, `watchQuotes`, `getSymbolInfo`, `getIndicatorData`, `watchIndicator`, `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis`, `getScreener`, `getHotlist`, `getWatchlists`. Détails : [guide de l'API de données](data-api.md).

## API bas niveau

```ts
import { TradingViewClient } from '@mathieuc/tradingview';

const client = new TradingViewClient();
const chart = client.createChart();
chart.on('update', () => console.log(chart.lastCandle?.close));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });
// À la fin : await client.close();
```

Graphiques, mode replay, études Pine et intégrées, cotations, comptes, dessins et permissions Pine : voir la [référence bas niveau](low-level-api.md) et les [exemples](../examples).

Sans compte, TradingView limite les données (historique intraday réduit, pas d'indicateurs Pine). Avec vos cookies `sessionid` et `sessionid_sign` (`credentials`), vous accédez à ce que permet votre compte. Gardez-les dans des variables d'environnement, jamais dans le code, les issues ou les prompts.

[Dépôt GitHub](https://github.com/Mathieu2301/TradingView-API) · [Package npm](https://www.npmjs.com/package/@mathieuc/tradingview) · [Issues](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView est une marque de son propriétaire. Ce projet n'est ni affilié ni approuvé par TradingView. Vérifiez les conditions d'utilisation et droits sur les données de votre fournisseur.
