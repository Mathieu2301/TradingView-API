# TradingView-API

**Experimente com um agente hospedado:** [Crie um monitor de mercado no Molted Studio](https://molted.studio/dreams/market-watch-alerts) — sem instalação local.

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Idioma:** [English](../README.md) · [Français](README.fr.md) · [Español](README.es.md) · Português

**Dados de mercado e indicadores para construir suas ferramentas.** Candles, cotações, indicadores e estratégias, em uma única requisição ou em tempo real. Projeto comunitário independente e não oficial.

> **Tem um problema, uma dúvida ou uma ideia? [Abra uma issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** Não é preciso ter uma reprodução perfeita para perguntar.

> **A versão 4 é uma reescrita completa em TypeScript**, com uma nova API e sem camada de compatibilidade. Vindo da v3? Leia o [guia de migração](migration-v4.md) (em inglês). Todos os recursos da v3 continuam disponíveis: veja a [matriz de cobertura](v4-coverage.md). As versões npm 3.x mantêm a API `Client` anterior.

## Escolha como começar

- **Instalação da V4 beta:** clone este repositório e execute `npm ci && npm run build && node examples/candles.js` (Node.js 20+ ou Bun). **O npm ainda entrega a V3**, não os imports V4 abaixo. Consulte os [exemplos](../examples).
- **Com Claude Code, Codex, OpenClaw ou outro assistente:** compartilhe este repositório e o [guia da API de dados](data-api.md).
- **Sem instalação local:** o [Molted](https://molted.cloud/) oferece um espaço de agente hospedado que pode trabalhar a partir deste repositório. É opcional.

## API de dados

```ts
import { getCandles, watchCandles, getQuote } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 100 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }, do mais antigo ao mais recente

const quote = await getQuote('BINANCE:BTCUSDT');

const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1' }, {
  onData: (snapshot) => console.log(snapshot.at(-1)?.close),
  onError: console.error,
});
await watcher.stop();
```

Cada função cuida da conexão, do tempo máximo (`timeoutMs`), do cancelamento (`signal`) e da limpeza. Outras funções: `getQuotes`, `watchQuotes`, `getSymbolInfo`, `getIndicatorData`, `watchIndicator`, `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis`, `getScreener`, `getHotlist`, `getWatchlists`. Detalhes: [guia da API de dados](data-api.md).

## API de baixo nível

```ts
import { TradingViewClient } from '@mathieuc/tradingview';

const client = new TradingViewClient();
const chart = client.createChart();
chart.on('update', () => console.log(chart.lastCandle?.close));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });
// Ao terminar: await client.close();
```

Gráficos, modo replay, estudos Pine e integrados, cotações, contas, desenhos e permissões Pine: veja a [referência de baixo nível](low-level-api.md) e os [exemplos](../examples).

Sem conta, o TradingView limita os dados (menos histórico intraday, sem indicadores Pine). Com seus cookies `sessionid` e `sessionid_sign` (`credentials`), você acessa o que sua conta permite. Guarde-os em variáveis de ambiente, nunca no código, em issues ou prompts.

[Repositório GitHub](https://github.com/Mathieu2301/TradingView-API) · [Pacote npm](https://www.npmjs.com/package/@mathieuc/tradingview) · [Issues](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView é uma marca do seu proprietário. Este projeto não é afiliado nem endossado pelo TradingView. Verifique os termos e permissões de dados do seu provedor.
