# IFC Coral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Validar a TORRE02 e entregar uma fase funcional de produção, suprimentos e LPS, com projeto reabrível.
**Architecture:** Adaptador IFC mantém runtime 3D separado de identidade persistente; domínio TypeScript calcula cobertura/prontidão/PPC; interface guia o aluno do modelo à decisão. Provedores de IA são adaptadores opcionais, sem controle sobre estado.
**Tech Stack:** Vite 6, TypeScript 5, That Open 3.4, Three 0.182, web-ifc 0.0.77, node:test e Playwright disponível no runtime.
**Spec:** ../specs/2026-10-17-ifc-coral-design.md e 5.4/5.5 aprovados de 17/10 no Academic OS.

## Global Constraints

- Repositório original intocado; alterações somente em ifc4all-2. Não publicar.
- Manter lockfile/dependências resolvidas; aproveitar instalação existente, não rodar prompts antigos de instalação.
- Quantidades e cotações do caso são sintéticas; desconhecido não equivale a zero.
- Chaves fora de persistência/exportações; toda autorização de obra/compra humana.
- Não marcar cenários não executados como aprovados.

## Review Focus

1. Revisões/importações de mesmo nome não podem colapsar GlobalIds, tarefas ou pacotes.
2. JSON adulterado, campos inválidos e strings HTML devem falhar com mensagem útil e não executar conteúdo.
3. Datas inválidas/fusos não deslocam compromissos ou aprovam conclusão só pelo calendário.
4. Estoque, pedido e alocação não podem ser usados duas vezes nem produzir saldo negativo.
5. Falha de IA, rede ou armazenamento deve preservar o projeto e permitir o ciclo determinístico.

## Task 1 — validar base e adaptar identidade IFC

**Files:** viewer/src/ifc/schedule.ts; viewer/src/ifc/app.ts; viewer/src/ui/gantt.ts; viewer/tests/identity.test.mjs; viewer/tests/dates.test.mjs.
**Interfaces:** ElementTask recebe globalId/sourceTaskKey/modelKey; identidade persistente não contém localId. Adaptador de modelo produz ModelRevision com hash e projectGlobalId.
- [x] Rodar typecheck/selfchecks originais e abrir TORRE02; registrar falhas observadas antes de corrigir.
- [x] Escrever teste de datas inexistentes, homônimos e reimportação e observá-lo falhar.
- [x] Corrigir agrupamento/identidade/CSV preservando registros; prover worker e WASM locais.
- [x] Rodar testes, build e verificar seleção/árvore/Gantt no navegador.

## Task 2 — domínio de produção, suprimentos e compromissos

**Files:** viewer/src/production/types.ts; viewer/src/production/project.ts; viewer/src/production/planning.ts; viewer/src/production/case.ts; viewer/tests/planning.test.mjs; viewer/tests/project.test.mjs.
**Interfaces:** createProject(), registerModel(), upsertTasks(), supplyBalance(), supplyWindow(), assessReadiness(), freezeWeek(), calculatePPC(), serializeProject()/parseProject().
- [x] Testes RED para desconhecido/zero, 4+6 sobre demanda 12, excesso, mesma reserva dupla, unidades, quatro datas e cotações 7140/7560/6600.
- [x] Implementar funções determinísticas com auditoria de mudanças e revisão de dependências.
- [x] Testes RED para evidência obrigatória, compromisso bloqueado, denominador congelado, atraso, nenhum compromisso e importação malformada.
- [x] Implementar e verificar o ciclo e salvar/reabrir com IDs preservados e sem credenciais.

## Task 3 — oficina na interface e persistência

**Files:** viewer/src/production/ui.ts; viewer/src/production/storage.ts; viewer/src/ui/coral.css; viewer/src/main.ts; viewer/tests/workshop.browser.mjs.
**Interfaces:** ProductionPanel({getProject,onChange,onSelectElements}); armazenamento carrega projeto/bytes e não recebe segredos.
- [x] Escrever fluxo de navegador para modelo didático, pacote, restrições, fornecimento, compromisso/PPC e exportar/reabrir; confirmar falha inicial.
- [x] Implementar navegação Modelo/Produção/Suprimentos/Semana/IA, estados e formulários claros, tratamento de erros e layout adaptável.
- [x] Verificar recorte com TORRE02 real, persistência, seleção e capturas em tela larga/estreita.

## Task 4 — IA opcional, documentação e aceite

**Files:** viewer/src/production/ai.ts; viewer/tests/ai.test.mjs; README.md; docs/ACEITE.md; docs/GUIA_DO_ALUNO.md; docs/CREDITOS.md.
**Interfaces:** listModels(provider,key), requestAdvice(provider,key,model,context,snapshot), validateAdvice(); saídas só exibidas como propostas.
- [x] Testes RED para dois provedores, erro de API, resposta inválida, prompt com dados não confiáveis e segredo ausente no projeto exportado.
- [x] Implementar com chave apenas em memória, modelo acessível e revisão humana, sem automação de compra.
- [x] Executar suíte completa, typecheck, build, cenários no navegador e matriz de resultados com limites reais.
- [x] Revisão independente final; corrigir achados materiais com testes; entregar URL local, guia, evidências e pendências sem publicar.

Verificação de UI executada via CUA, conforme ruling do ledger; os testes de navegador headless previstos foram substituídos por roteiro e evidências reais em docs/ACEITE.md. Integrações reais de IA aguardam credenciais; testes nesta rodada usam transporte simulado. CA completos permanecem com resultados parciais explícitos.
