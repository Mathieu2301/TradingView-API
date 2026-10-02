# TradingView-API

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Idioma:** [English](../README.md) · [Français](README.fr.md) · Español · [Português](README.pt.md)

**Datos de mercado e indicadores para construir tus herramientas.** Empieza con un gráfico y evoluciona hacia actualizaciones en tiempo real y flujos asistidos por agentes de IA. Proyecto comunitario independiente y no oficial.

> **¿Tienes un problema, una pregunta o una idea? [Abre un issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** No necesitas una reproducción perfecta para preguntar.

## Elige cómo empezar

- **Biblioteca estable:** `npm install @mathieuc/tradingview` y consulta los [ejemplos](../examples).
- **Con Claude Code, Codex, OpenClaw u otro agente:** comparte la [guía para agentes](agent-api.md) y este repositorio.
- **Sin instalación local:** [Molted](https://molted.cloud/) ofrece un espacio de trabajo con agente alojado que puede trabajar desde este repositorio. Es opcional.

La nueva API para agentes es una **versión preliminar de desarrollo**: todavía no está publicada en npm.

## API actual

```js
const TradingView = require('@mathieuc/tradingview');
const client = new TradingView.Client();
const chart = new client.Session.Chart();
chart.onError((...error) => console.error(error));
chart.onUpdate(() => console.log(chart.periods[0]?.close));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });
// Al terminar: chart.delete(); await client.end();
```

La API histórica, los indicadores y los ejemplos siguen disponibles durante la migración.

## API para agentes — versión preliminar

```ts
import { fetchCandles, watchCandles } from '@mathieuc/tradingview/agent';

const candles = await fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', limit: 100 });
const worker = await watchCandles(
  { symbol: 'BINANCE:BTCUSDT', timeframe: '1' },
  { onData: (snapshot) => console.log(snapshot[snapshot.length - 1]), onError: console.error },
);
await worker.stop();
```

Para probarla **desde el código fuente** (Node 18+ o Bun): `git clone https://github.com/Mathieu2301/TradingView-API.git`, luego `npm ci && npm run build:agent`, e importa `./agent.js` o `./agent.ts`. La ruta de importación de npm anterior solo funcionará tras publicar la próxima versión. Más detalles en la [guía para agentes](agent-api.md).

La modernización TypeScript/Bun es gradual. Investigación de estrategias, backtesting, CLI/MCP y flujos alojados están **previstos, no disponibles aún**. [Cuéntanos qué necesitas](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).

[Repositorio GitHub](https://github.com/Mathieu2301/TradingView-API) · [Paquete npm](https://www.npmjs.com/package/@mathieuc/tradingview) · [Issues](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView es una marca de su propietario. Este proyecto no está afiliado ni respaldado por TradingView. Comprueba los términos y permisos de datos de tu proveedor.
