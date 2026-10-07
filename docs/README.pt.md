# TradingView-API

**Crie com dados de mercado, do primeiro gráfico a um monitor em funcionamento.** Obtenha candles e cotações, execute indicadores e estratégias e transforme ideias em ferramentas. Um projeto comunitário independente, não uma API oficial do TradingView.

[Primeiros passos](#primeiros-passos) · [Explorar exemplos](../examples) · [Ler o guia da API de dados](data-api.md)

**Idioma:** [English](../README.md) · [Français](README.fr.md) · [Español](README.es.md) · Português

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml) [![npm](https://badgen.net/npm/v/@mathieuc/tradingview)](https://www.npmjs.com/package/@mathieuc/tradingview) [![Stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API?style=social)](https://github.com/Mathieu2301/TradingView-API)

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

![Demonstração gravada: uma consulta retorna 40 candles diários de BTC/USDT, exibidos em um gráfico de linhas](../assets/readme-demo.gif)

*Uma consulta real de candles, gravada em 2 de outubro de 2026 com a prévia de desenvolvimento (`fetchCandles`, chamada `getCandles` na versão 4) e representada para esta demonstração. Os preços não estão em tempo real.*

### Uma consulta, dados reais

> **A V4 é a versão padrão no npm.** Instale com `npm install @mathieuc/tradingview` para usar `getCandles` e a nova API de dados.

```js
import { getCandles } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 40 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }
```

Prefere começar sem código? Os caminhos abaixo também funcionam.

> **A versão 4 é uma reescrita incompatível em TypeScript**, com uma nova API e sem camada de compatibilidade. Vem da V3? Leia o [guia de migração](migration-v4.md). Todas as funcionalidades da V3 continuam disponíveis: veja a [matriz de cobertura](v4-coverage.md) e as [evidências de confiabilidade](v4-reliability.md). O [relatório de preparação da RC](v4-stabilization.md) acompanha as verificações e os requisitos pendentes para a versão estável. As versões npm 3.x mantêm a API `Client` anterior; confira a versão instalada na [página do npm](https://www.npmjs.com/package/@mathieuc/tradingview). Esses guias técnicos estão em inglês.

## Primeiros passos

### Início rápido interativo

O assistente interativo está incluído na V4:

```bash
npx @mathieuc/tradingview
```

Execute no diretório do seu projeto com Node.js 20+. Escolha um caminho:

1. **Agente autônomo (recomendado)** — abre o [monitor de mercado TradingView-API no Molted Studio](https://molted.studio/dreams/market-watch-alerts). Sem configurar um projeto local.
2. **Claude Code CLI** — inicia seu CLI `claude` instalado neste diretório com um prompt de projeto pronto para usar.
3. **Codex CLI** — inicia seu CLI `codex` instalado neste diretório com o mesmo prompt.
4. **Outro agente de programação local** — exibe o prompt para colar no seu agente.
5. **Instalar apenas a biblioteca** — executa `npm install @mathieuc/tradingview` aqui, sem gerar arquivos nem iniciar um agente.

Claude Code e Codex devem estar instalados e autenticados. As solicitações normais de permissão continuam ativas. Se a inicialização falhar, o prompt será exibido para uso manual. Se não houver navegador disponível, o link hospedado continuará visível.

Use `--choice 4` para exibir o prompt diretamente ou `--help` para consultar a ajuda. Chamadas não interativas devem passar `--choice`. Para testar o assistente a partir deste repositório localmente:

```bash
npm ci && npm run build
node bin/tradingview.mjs
```

### Instalação manual

```bash
npm install @mathieuc/tradingview
# Ou: bun add @mathieuc/tradingview
```

A V4 é instalada por padrão. A V3 continua disponível com `@mathieuc/tradingview@3`; consulte o guia de migração antes de atualizar um projeto V3.

O pacote V4 é ESM com declarações TypeScript. Projetos CommonJS podem usar `require()` no Node 20.19+ ou 22.12+, ou `await import()`.

### Quer contribuir?

[Abra uma issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) para discutir uma funcionalidade ou relatar um bug, ou envie uma pull request. Perguntas e ideias são bem-vindas; não é preciso ter uma reprodução perfeita para iniciar uma conversa. `npm run check` executa a verificação de tipos, o lint, os testes, a compilação e o teste do pacote.

## API de dados

A API de dados gerencia conexões, sessões, tempos limite e limpeza para você. É adequada para scripts, servidores, painéis, bots e agentes.

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

| Necessidade | Função |
| --- | --- |
| Candles: barras recentes, histórico profundo, intervalos de datas, Heikin Ashi/Renko/... | `getCandles`, `watchCandles` |
| Cotações: último preço, variação, bid/ask, volume... | `getQuote`, `getQuotes`, `watchQuotes` |
| Valores de indicadores, desenhos e relatórios de estratégias | `getIndicatorData`, `watchIndicator` |
| Metadados de símbolos | `getSymbolInfo` |
| Screener de ações/cripto e rankings | `getScreener`, `getHotlist` |
| Listas de acompanhamento da conta (somente leitura) | `getWatchlists` |
| Pesquisa e avaliações | `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis` |

As funções de dados WebSocket aceitam `timeoutMs`, um `AbortSignal`, credenciais da conta (`credentials`) e um `client` compartilhado opcional. Consultas HTTP aceitam um `AbortSignal` nas opções. Os erros são `TradingViewError` com um `code` como `SYMBOL_ERROR`, `TIMEOUT` ou `STUDY_ERROR`. Veja todas as opções no [guia da API de dados](data-api.md).

## API de baixo nível

Para controle completo (vários gráficos e estudos em uma conexão, modo replay, pacotes brutos), use o cliente e as sessões diretamente:

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

A [referência da API de baixo nível](low-level-api.md) cobre gráficos, replay, estudos, cotações, funções de conta e layouts, permissões Pine, transportes personalizados e utilitários do protocolo. Os [exemplos](../examples) mostram cada funcionalidade.

## Contas e limites

Sem uma conta, o TradingView fornece dados limitados: histórico intradiário reduzido, sem estudos Pine e possíveis fontes atrasadas ou alternativas. Com seus cookies `sessionid` e `sessionid_sign` (`credentials`), você obtém o que sua conta permite. Guarde-os em variáveis de ambiente ou em um gerenciador de segredos; nunca em arquivos-fonte, issues ou prompts.

## Links do projeto

- [Repositório GitHub](https://github.com/Mathieu2301/TradingView-API)
- [Destaque da comunidade no Trendshift](https://trendshift.io/repositories/26416)
- [Pacote npm](https://www.npmjs.com/package/@mathieuc/tradingview)
- [Exemplos](../examples)
- [Relatar um bug ou solicitar uma funcionalidade](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView é uma marca de seu respectivo proprietário. Este projeto não é afiliado ao TradingView nem endossado por ele. Confira os termos do seu provedor de dados e as permissões de dados de mercado aplicáveis ao seu caso de uso.
