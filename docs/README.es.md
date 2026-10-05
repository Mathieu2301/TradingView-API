# TradingView-API

**Construye con datos de mercado, desde tu primer gráfico hasta un monitor en funcionamiento.** Obtén velas y cotizaciones, ejecuta indicadores y estrategias, y convierte tus ideas en herramientas. Un proyecto comunitario independiente, no una API oficial de TradingView.

[Primeros pasos](#primeros-pasos) · [Explorar ejemplos](../examples) · [Leer la guía de la API de datos](data-api.md)

**Idioma:** [English](../README.md) · [Français](README.fr.md) · Español · [Português](README.pt.md)

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml) [![npm](https://badgen.net/npm/v/@mathieuc/tradingview)](https://www.npmjs.com/package/@mathieuc/tradingview) [![Stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API?style=social)](https://github.com/Mathieu2301/TradingView-API)

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

![Demostración grabada: una consulta devuelve 40 velas diarias de BTC/USDT, representadas como un gráfico de líneas](../assets/readme-demo.gif)

*Una consulta real de velas, grabada el 2 de octubre de 2026 con la versión preliminar de desarrollo (`fetchCandles`, llamada `getCandles` en la versión 4) y representada para esta demostración. Los precios no son en directo.*

### Una consulta, datos reales

> **La versión candidata V4 está disponible en npm bajo la etiqueta `next`.** Instálala con `npm install @mathieuc/tradingview@next`. La etiqueta predeterminada `latest` sigue en V3 y no exporta `getCandles`.

```js
import { getCandles } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 40 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }
```

¿Prefieres empezar sin código? También puedes usar las opciones de abajo.

> **La versión 4 es una reescritura incompatible en TypeScript**, con una API nueva y sin capa de compatibilidad. ¿Vienes de V3? Lee la [guía de migración](migration-v4.md). Todas las funciones de V3 siguen disponibles: consulta la [matriz de cobertura](v4-coverage.md) y las [pruebas de fiabilidad](v4-reliability.md). El [informe de preparación de la RC](v4-stabilization.md) documenta las comprobaciones y los requisitos pendientes para la versión estable. Las versiones npm 3.x conservan la API `Client` anterior; comprueba la versión que instalas en la [página de npm](https://www.npmjs.com/package/@mathieuc/tradingview). Estas guías técnicas están en inglés.

## Primeros pasos

### Inicio rápido interactivo

El asistente interactivo está incluido a partir de **4.0.0-rc.1**:

```bash
npx @mathieuc/tradingview@next
```

Ejecútalo desde el directorio de tu proyecto con Node.js 20+. Elige una opción:

1. **Agente autónomo (recomendado)** — abre el [monitor de mercado TradingView-API en Molted Studio](https://molted.studio/dreams/market-watch-alerts). Sin configurar un proyecto local.
2. **Claude Code CLI** — inicia tu CLI `claude` instalado en este directorio con un prompt de proyecto listo para usar.
3. **Codex CLI** — inicia tu CLI `codex` instalado en este directorio con el mismo prompt.
4. **Otro agente de programación local** — muestra el prompt para pegarlo en tu agente.
5. **Instalar solo la biblioteca** — ejecuta `npm install @mathieuc/tradingview@next` aquí, sin generar archivos ni iniciar un agente.

Claude Code y Codex deben estar instalados y autenticados. Sus solicitudes de permiso habituales siguen activadas. Si el inicio falla, se muestra el prompt para usarlo manualmente. Si no hay navegador disponible, el enlace alojado sigue visible.

Usa `--choice 4` para mostrar el prompt directamente, o `--help` para consultar la ayuda. Las llamadas no interactivas deben pasar `--choice`. Para probar el asistente desde este repositorio:

```bash
npm ci && npm run build
node bin/tradingview.mjs
```

### Instalación manual

```bash
npm install @mathieuc/tradingview@next
# O: bun add @mathieuc/tradingview@next
```

`next` instala la versión candidata V4; la etiqueta predeterminada `latest` todavía instala V3. No mezcles imports de V4 con una instalación de V3.

El paquete V4 es ESM con declaraciones TypeScript. Los proyectos CommonJS pueden usar `require()` en Node 20.19+ o 22.12+, o `await import()`.

### ¿Quieres contribuir?

[Abre una issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) para comentar una función o informar de un error, o envía una pull request. Las preguntas y las ideas son bienvenidas; no necesitas una reproducción perfecta para iniciar la conversación. `npm run check` ejecuta la comprobación de tipos, el lint, las pruebas, la compilación y la prueba del paquete.

## API de datos

La API de datos gestiona las conexiones, las sesiones, los tiempos de espera y la limpieza. Sirve para scripts, servidores, paneles, bots y agentes.

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

| Necesidad | Función |
| --- | --- |
| Velas: barras recientes, historial profundo, rangos de fechas, Heikin Ashi/Renko/... | `getCandles`, `watchCandles` |
| Cotizaciones: último precio, variación, bid/ask, volumen... | `getQuote`, `getQuotes`, `watchQuotes` |
| Valores de indicadores, dibujos e informes de estrategias | `getIndicatorData`, `watchIndicator` |
| Metadatos de símbolos | `getSymbolInfo` |
| Screener de acciones/cripto y clasificaciones | `getScreener`, `getHotlist` |
| Listas de seguimiento de la cuenta (solo lectura) | `getWatchlists` |
| Búsqueda y evaluaciones | `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis` |

Las funciones de datos WebSocket aceptan `timeoutMs`, un `AbortSignal`, credenciales de cuenta (`credentials`) y un `client` compartido opcional. Las consultas HTTP aceptan un `AbortSignal` en sus opciones. Los errores son `TradingViewError` con un `code` como `SYMBOL_ERROR`, `TIMEOUT` o `STUDY_ERROR`. Consulta todas las opciones en la [guía de la API de datos](data-api.md).

## API de bajo nivel

Para un control completo (varios gráficos y estudios en una conexión, modo replay, paquetes sin procesar), usa directamente el cliente y las sesiones:

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

La [referencia de la API de bajo nivel](low-level-api.md) cubre gráficos, replay, estudios, cotizaciones, funciones de cuenta y diseños, permisos Pine, transportes personalizados y utilidades del protocolo. Los [ejemplos](../examples) muestran cada función.

## Cuentas y límites

Sin una cuenta, TradingView ofrece datos limitados: menos historial intradía, sin estudios Pine y posibles fuentes retrasadas o alternativas. Con tus cookies `sessionid` y `sessionid_sign` (`credentials`), obtienes lo que tu cuenta permite. Guárdalas en variables de entorno o en un almacén de secretos; nunca en archivos fuente, issues o prompts.

## Enlaces del proyecto

- [Repositorio GitHub](https://github.com/Mathieu2301/TradingView-API)
- [Reconocimiento de la comunidad en Trendshift](https://trendshift.io/repositories/26416)
- [Paquete npm](https://www.npmjs.com/package/@mathieuc/tradingview)
- [Ejemplos](../examples)
- [Informar de un error o solicitar una función](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView es una marca de su respectivo propietario. Este proyecto no está afiliado a TradingView ni cuenta con su respaldo. Consulta las condiciones de tu proveedor y los permisos de datos de mercado aplicables a tu caso de uso.
