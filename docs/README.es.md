# TradingView-API

**Pruébalo con un agente alojado:** [Crea un vigilante de mercado en Molted Studio](https://molted.studio/dreams/market-watch-alerts) — sin instalación local.

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Idioma:** [English](../README.md) · [Français](README.fr.md) · Español · [Português](README.pt.md)

**Datos de mercado e indicadores para construir tus herramientas.** Velas, cotizaciones, indicadores y estrategias, en una sola petición o en tiempo real. Proyecto comunitario independiente y no oficial.

> **¿Tienes un problema, una pregunta o una idea? [Abre un issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** No necesitas una reproducción perfecta para preguntar.

> **La versión 4 es una reescritura completa en TypeScript**, con una nueva API y sin capa de compatibilidad. ¿Vienes de la v3? Lee la [guía de migración](migration-v4.md) (en inglés). Todas las funciones de la v3 siguen disponibles: consulta la [matriz de cobertura](v4-coverage.md). Las versiones npm 3.x mantienen la API `Client` anterior.

## Elige cómo empezar

- **Instalación de V4 beta:** clona este repositorio y ejecuta `npm ci && npm run build && node examples/candles.js` (Node.js 20+ o Bun). **npm todavía entrega V3**, no las importaciones V4 de abajo. Consulta los [ejemplos](../examples).
- **Con Claude Code, Codex, OpenClaw u otro asistente:** comparte este repositorio y la [guía de la API de datos](data-api.md).
- **Sin instalación local:** [Molted](https://molted.cloud/) ofrece un espacio de trabajo con agente alojado que puede trabajar desde este repositorio. Es opcional.

## API de datos

```ts
import { getCandles, watchCandles, getQuote } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 100 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }, de la más antigua a la más reciente

const quote = await getQuote('BINANCE:BTCUSDT');

const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1' }, {
  onData: (snapshot) => console.log(snapshot.at(-1)?.close),
  onError: console.error,
});
await watcher.stop();
```

Cada función gestiona la conexión, el tiempo máximo (`timeoutMs`), la cancelación (`signal`) y la limpieza. Otras funciones: `getQuotes`, `watchQuotes`, `getSymbolInfo`, `getIndicatorData`, `watchIndicator`, `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis`. Detalles: [guía de la API de datos](data-api.md).

## API de bajo nivel

```ts
import { TradingViewClient } from '@mathieuc/tradingview';

const client = new TradingViewClient();
const chart = client.createChart();
chart.on('update', () => console.log(chart.lastCandle?.close));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });
// Al terminar: await client.close();
```

Gráficos, modo replay, estudios Pine e integrados, cotizaciones, cuentas, dibujos y permisos Pine: consulta la [referencia de bajo nivel](low-level-api.md) y los [ejemplos](../examples).

Sin cuenta, TradingView limita los datos (menos historial intradía, sin indicadores Pine). Con tus cookies `sessionid` y `sessionid_sign` (`credentials`), accedes a lo que permite tu cuenta. Guárdalas en variables de entorno, nunca en el código, issues o prompts.

[Repositorio GitHub](https://github.com/Mathieu2301/TradingView-API) · [Paquete npm](https://www.npmjs.com/package/@mathieuc/tradingview) · [Issues](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView es una marca de su propietario. Este proyecto no está afiliado ni respaldado por TradingView. Revisa los términos y permisos de datos de tu proveedor.
