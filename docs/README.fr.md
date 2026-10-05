# TradingView-API

**Construisez avec les données de marché, de votre premier graphique à une veille automatisée.** Récupérez des bougies et des cotations, exécutez des indicateurs et des stratégies, et transformez vos idées en outils. Projet communautaire indépendant, pas une API officielle de TradingView.

[Démarrer](#démarrer) · [Explorer les exemples](../examples) · [Lire le guide de l’API de données](data-api.md)

**Langue :** [English](../README.md) · Français · [Español](README.es.md) · [Português](README.pt.md)

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml) [![npm](https://badgen.net/npm/v/@mathieuc/tradingview)](https://www.npmjs.com/package/@mathieuc/tradingview) [![Stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API?style=social)](https://github.com/Mathieu2301/TradingView-API)

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

![Démonstration enregistrée : une requête renvoie 40 bougies quotidiennes BTC/USDT, représentées en courbe](../assets/readme-demo.gif)

*Une vraie requête de bougies, enregistrée le 2 octobre 2026 avec la préversion de développement (`fetchCandles`, appelée `getCandles` en version 4), puis représentée pour cette démonstration. Les prix ne sont pas en direct.*

### Une requête, de vraies données

> **La release candidate V4 est disponible sur npm sous le tag `next`.** Installez-la avec `npm install @mathieuc/tradingview@next`. Le tag par défaut `latest` reste sur la V3 et n’exporte pas `getCandles`.

```js
import { getCandles } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 40 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }
```

Vous préférez commencer sans coder ? Les parcours ci-dessous le permettent aussi.

> **La version 4 est une réécriture incompatible en TypeScript**, avec une nouvelle API et sans couche de compatibilité. Vous venez de la V3 ? Lisez le [guide de migration](migration-v4.md). Toutes les fonctionnalités V3 restent disponibles : voir la [matrice de couverture](v4-coverage.md) et les [preuves de fiabilité](v4-reliability.md). Le [rapport de préparation de la RC](v4-stabilization.md) suit les vérifications et les conditions restantes avant publication stable. Les versions npm 3.x conservent l’ancienne API `Client` ; vérifiez la version installée sur la [page npm](https://www.npmjs.com/package/@mathieuc/tradingview). Ces guides techniques sont en anglais.

## Démarrer

### Quick-start interactif

<!-- The launcher is introduced after 4.0.0-rc.0; keep this explicit until published. -->
La prochaine version du paquet ajoutera ce lanceur interactif (absent de RC.0) :

```bash
npx @mathieuc/tradingview@next
```

Lancez-le depuis le dossier de votre projet avec Node.js 20+. Choisissez un parcours :

1. **Agent autonome (recommandé)** — ouvre la [veille de marché TradingView-API sur Molted Studio](https://molted.studio/fr/dreams/market-watch-alerts). Aucune configuration de projet local.
2. **Claude Code CLI** — démarre votre CLI `claude` installé dans ce dossier, avec un prompt de projet prêt à l’emploi.
3. **Codex CLI** — démarre votre CLI `codex` installé dans ce dossier, avec le même prompt.
4. **Un autre coding-agent local** — affiche le prompt à coller dans votre agent.
5. **Installer seulement la librairie** — exécute `npm install @mathieuc/tradingview@next` dans ce dossier, sans générer de fichiers ni démarrer d’agent.

Claude Code et Codex doivent déjà être installés et authentifiés. Leurs demandes d’autorisation habituelles restent actives. Si le lancement échoue, le prompt est affiché pour une utilisation manuelle. Si aucun navigateur n’est disponible, le lien hébergé reste visible.

Utilisez `--choice 4` pour afficher directement le prompt, ou `--help` pour l’aide. En mode non interactif, `--choice` est obligatoire. Pour essayer le lanceur depuis ce dépôt avant publication :

```bash
npm ci && npm run build
node bin/tradingview.mjs
```

### Installation manuelle

```bash
npm install @mathieuc/tradingview@next
# Ou : bun add @mathieuc/tradingview@next
```

`next` installe la release candidate V4 ; le tag par défaut `latest` installe encore la V3. Ne mélangez pas les imports V4 avec une installation V3.

Le paquet V4 est ESM avec des déclarations TypeScript. Les projets CommonJS peuvent utiliser `require()` avec Node 20.19+ ou 22.12+, ou `await import()`.

### Envie de contribuer ?

[Ouvrez une issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) pour discuter d’une fonctionnalité ou signaler un bug, ou proposez une pull request. Questions et idées sont bienvenues ; une reproduction parfaite n’est pas nécessaire pour engager la discussion. `npm run check` lance la vérification des types, le lint, les tests, la compilation et le test du paquet.

## API de données

L’API de données gère les connexions, les sessions, les délais et le nettoyage à votre place. Elle convient aux scripts, serveurs, tableaux de bord, bots et agents.

```ts
import {
  getCandles, watchCandles, getQuote, getIndicatorData, searchMarkets,
} from '@mathieuc/tradingview/data';

// One-shot: resolves with complete data, then releases everything.
const hourly = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '60', count: 500 });
const lastWeek = await getCandles({ symbol: 'NASDAQ:AAPL', timeframe: '15', from: new Date(Date.now() - 7 * 86_400_000) });
const quote = await getQuote('BINANCE:BTCUSDT');
const [market] = await searchMarkets('ethereum', { type: 'crypto' });

// Watcher: keeps streaming until stopped.
const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1' }, {
  onData: (candles) => console.log(candles.at(-1)?.close),
  onError: (error) => console.error(error.code, error.message),
});
await watcher.stop();

// Indicators and strategies (Pine scripts need an account).
const { values } = await getIndicatorData({
  symbol: 'BINANCE:BTCUSDT', indicator: 'STD;RSI', credentials: { session, signature },
});
```

| Besoin | Fonction |
| --- | --- |
| Bougies : dernières barres, historique profond, plages de dates, Heikin Ashi/Renko/... | `getCandles`, `watchCandles` |
| Cotations : dernier prix, variation, bid/ask, volume... | `getQuote`, `getQuotes`, `watchQuotes` |
| Valeurs d’indicateurs, dessins et rapports de stratégie | `getIndicatorData`, `watchIndicator` |
| Métadonnées des symboles | `getSymbolInfo` |
| Screener actions/crypto et classements | `getScreener`, `getHotlist` |
| Listes de suivi du compte (lecture seule) | `getWatchlists` |
| Recherche et évaluations | `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis` |

Les fonctions de données WebSocket acceptent `timeoutMs`, un `AbortSignal`, les identifiants du compte (`credentials`) et un `client` partagé facultatif. Les requêtes HTTP acceptent un `AbortSignal` via leurs options. Les erreurs sont des `TradingViewError` avec un `code` comme `SYMBOL_ERROR`, `TIMEOUT` ou `STUDY_ERROR`. Le [guide de l’API de données](data-api.md) détaille toutes les options.

## API bas niveau

Pour un contrôle complet (plusieurs graphiques et études sur une connexion, mode replay, paquets bruts), utilisez directement le client et les sessions :

```ts
import { TradingViewClient, getIndicator } from '@mathieuc/tradingview';

const client = new TradingViewClient({ credentials: { session, signature } }); // Credentials are optional
const chart = client.createChart();

chart.on('update', () => console.log(chart.lastCandle?.close));
chart.on('error', (error) => console.error(error.message));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: '60', count: 300 });

const supertrend = chart.createStudy(await getIndicator('STD;Supertrend'));
supertrend.on('update', () => console.log(supertrend.values.at(-1)));

// When your application is finished:
await client.close();
```

La [référence de l’API bas niveau](low-level-api.md) couvre les graphiques, le replay, les études, les cotations, les comptes et les mises en page, les permissions Pine, les transports personnalisés et les outils du protocole. Les [exemples](../examples) illustrent chaque fonctionnalité.

## Comptes et limites

Sans compte, TradingView fournit des données limitées : historique intraday réduit, pas d’études Pine et flux éventuellement différés ou de substitution. Avec vos cookies `sessionid` et `sessionid_sign` (`credentials`), vous accédez à ce que permet votre compte. Gardez-les dans des variables d’environnement ou un gestionnaire de secrets ; jamais dans les fichiers source, les issues ou les prompts.

## Liens du projet

- [Dépôt GitHub](https://github.com/Mathieu2301/TradingView-API)
- [Mise en avant communautaire sur Trendshift](https://trendshift.io/repositories/26416)
- [Paquet npm](https://www.npmjs.com/package/@mathieuc/tradingview)
- [Exemples](../examples)
- [Signaler un bug ou proposer une fonctionnalité](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView est une marque de son propriétaire. Ce projet n’est ni affilié à TradingView ni approuvé par TradingView. Vérifiez les conditions de votre fournisseur de données et les autorisations applicables à votre usage.
