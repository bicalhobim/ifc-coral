# AGENTS.md

Orientação para agentes de IA (OpenCode, Claude Code, etc.) que trabalham neste
repositório.

## Antes de tudo: o público é leigo

Este repositório é usado por **alunos leigos** numa aula. O fluxo pretendido é: o
aluno abre a pasta no OpenCode e cola a "MISSÃO" descrita em **[`agente.md`](agente.md)**,
que instala e sobe o `ifc4all` em `localhost`.

- **Para instalar/rodar o projeto, siga [`agente.md`](agente.md)** — ele é a
  especificação executável (fases de diagnóstico → instalação → subir → validar) e
  traz as *"Regras de conduta com público leigo"* (falar simples, ser autônomo no
  que é seguro, só pedir confirmação em ações de sistema/destrutivas).
- Este `AGENTS.md` é a referência **técnica** do projeto — leia antes de mexer em
  código, versões ou WASM.

## O que é

Web app de visualização de modelos **IFC** com cronograma **4D** (Gantt tipo MS
Project ligado a datas do próprio modelo). Construído sobre as bibliotecas
open-source **That Open Components** (engine de BIM em JS/TS), adaptadas ao caso de
uso.

Tudo vive em `viewer/` (SPA Vite + TypeScript). A raiz carrega documentação,
configuração (`opencode.json`), os modelos de exemplo (`ifc_model/`) e o roteiro
`agente.md`. É um app **client-side**: sem backend e **sem Python** para rodar.

## Comandos

Rodar sempre de dentro de `viewer/`:

```bash
cd viewer
npm ci             # instalação limpa a partir do lockfile (preferida)
npm install        # alternativa quando não há lockfile
npm run dev        # Vite dev server em http://localhost:5173
npm run build      # tsc --noEmit + vite build (falha se tipos quebram)
npm run typecheck  # só o tsc
```

Self-check da lógica de datas (Node 24 remove tipos nativamente, sem tsx; exige
Node ≥ 22.6):

```bash
node --experimental-strip-types src/ifc/schedule.selfcheck.ts
```

Não há suíte de testes formal — a lógica não-trivial (parse de datas) tem um
self-check com `assert`. Ao mexer em `schedule.ts`, rode-o.

## Arquitetura

Fluxo de dados (um arquivo `.ifc` entra, cronograma 4D sai):

```
<input file> → Viewer.loadIfc → buildSchedule → Gantt.render → scrubber → Viewer.setElementsVisible
   main.ts        ifc/app.ts     ifc/schedule.ts   ui/gantt.ts             (volta pro viewer)
```

- **`src/ifc/app.ts` — `Viewer`**: encapsula o setup do That Open. Cria mundo 3D
  (`SimpleScene`/`SimpleCamera`/`SimpleRenderer`), inicializa `FragmentsManager` com
  um worker e o `IfcLoader` com o WASM do web-ifc. O modelo carregado é capturado no
  callback `fragments.list.onItemSet` e guardado em `this.model`. Expõe
  `setElementsVisible(localIds, bool)` — a alavanca do 4D.
- **`src/ifc/schedule.ts`**: lê os PSets dos elementos construtivos via
  `model.getItemsData(...)` e monta `ElementTask[]`. Procura por
  `StartDate`/`FinishDate`/`EAP`/`Prédio`/`Pavimento` por **aliases PT+EN**
  (`FIELD_ALIASES`), varrendo os PSets recursivamente (`collectProps`). Elemento sem
  start/finish válidos é descartado.
- **`src/ui/gantt.ts` — `Gantt`**: agrupa tarefas em `Prédio ▸ Pavimento ▸ EAP` e
  **ordena pela sequência construtiva usando a menor data de início** (as datas do
  modelo codificam a ordem; não há ranking por palavra-chave). Renderiza barras num
  domínio temporal e um scrubber que dispara `onScrub(date, visibleIds, hiddenIds)`.
- **`src/main.ts`**: fio condutor. No scrub, oculta o que ainda não começou e mostra
  o resto.

## Armadilhas específicas (leia antes de mexer em versões ou WASM)

- **Lockstep de versões**: `@thatopen/components@^3.4` ⇄ `@thatopen/fragments@~3.4`
  ⇄ `three@>=0.182` ⇄ `web-ifc@0.0.77`. A API "core" (`fragments.core`,
  `model.getItemsData`, `getItemsOfCategories`) só existe na linha **3.x** do
  components — a 2.x tem uma API de fragments legada e incompatível. Bumps parciais
  quebram `npm install` (conflito de peer deps) ou a compilação. **Não bumpar avulso.**
- **`WASM_PATH` em `app.ts`** aponta pro CDN `unpkg.com/web-ifc@0.0.77/` e **precisa
  bater com a versão do web-ifc instalada**. Trocou o web-ifc, troque o path.
- **Rede obrigatória em runtime**: o worker de fragments
  (`thatopen.github.io/.../worker.mjs`) e o WASM do web-ifc são baixados por `fetch`
  na inicialização. Sem internet, o viewer não sobe.
- **Top-level await** em `main.ts` exige `build.target: "esnext"` no
  `vite.config.ts` — já configurado; não rebaixe.
- **IFC precisa dos atributos de cronograma** (`StartDate`, `FinishDate`, e
  idealmente `EAP`/`Prédio`/`Pavimento`) nos PSets, senão o Gantt fica vazio ("0
  elementos com cronograma"). Os IFCs de `ifc_model/` já vêm pré-processados.

## opencode.json / MCPs

O `opencode.json` registra o MCP opcional `playwright` (automação de navegador, útil
para o agente validar a tela). Não é necessário para rodar o viewer; se não iniciar,
ignore. **Não instale Python** para a missão.
