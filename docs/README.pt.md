# TradingView-API

**Experimente com um agente hospedado:** [Crie um monitor de mercado no Molted Studio](https://molted.studio/dreams/market-watch-alerts) — sem instalação local.

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Idioma:** [English](../README.md) · [Français](README.fr.md) · [Español](README.es.md) · Português

**Dados de mercado e indicadores para criar suas ferramentas.** Comece com um gráfico e avance para atualizações em tempo real e fluxos assistidos por agentes de IA. Projeto comunitário independente e não oficial.

> **Encontrou um problema, tem uma dúvida ou uma ideia? [Abra uma issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** Não é preciso ter uma reprodução perfeita para perguntar.

## Escolha por onde começar

- **Biblioteca estável:** `npm install @mathieuc/tradingview` e veja os [exemplos](../examples).
- **Com Claude Code, Codex, OpenClaw ou outro agente:** compartilhe o [guia para agentes](agent-api.md) e este repositório.
- **Sem instalação local:** [Molted](https://molted.cloud/) oferece um espaço de trabalho com agente hospedado que pode trabalhar a partir deste repositório. É opcional.

A nova API para agentes está em **prévia de desenvolvimento**: ainda não foi publicada no npm.

## API atual

```js
const TradingView = require('@mathieuc/tradingview');
const client = new TradingView.Client();
const chart = new client.Session.Chart();
chart.onError((...error) => console.error(error));
chart.onUpdate(() => console.log(chart.periods[0]?.close));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });
// Ao terminar: chart.delete(); await client.end();
```

A API histórica, os indicadores e os exemplos continuam disponíveis durante a migração.

## API para agentes — prévia

```ts
import { fetchCandles, watchCandles } from '@mathieuc/tradingview/agent';

const candles = await fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', limit: 100 });
const worker = await watchCandles(
  { symbol: 'BINANCE:BTCUSDT', timeframe: '1' },
  { onData: (snapshot) => console.log(snapshot[snapshot.length - 1]), onError: console.error },
);
await worker.stop();
```

Para testar **a partir do código-fonte** (Node 18+ ou Bun): `git clone https://github.com/Mathieu2301/TradingView-API.git`, depois `npm ci && npm run build:agent`, e importe `./agent.js` . O caminho npm acima só estará disponível após a próxima publicação. Mais detalhes no [guia para agentes](agent-api.md).

A modernização TypeScript/Bun é gradual. Pesquisa de estratégias, backtests, CLI/MCP e fluxos hospedados estão **planejados, ainda não disponíveis**. [Conte o que você precisa](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).

[Repositório GitHub](https://github.com/Mathieu2301/TradingView-API) · [Pacote npm](https://www.npmjs.com/package/@mathieuc/tradingview) · [Issues](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView é uma marca de seu proprietário. Este projeto não é afiliado nem endossado pela TradingView. Verifique os termos e direitos sobre os dados do seu provedor.
