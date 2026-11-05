# QA — preparação federada IFC + cronograma

Data: 05/11/2026. Base local: `88d18bc` mais alterações anteriores e desta sessão. **Sem novo commit ou publicação.** Este recibo é técnico, não aprovação institucional ou garantia de compatibilidade universal.

## Resultado observado

Central real integrada ao botão **Preparar IFC + cronograma**, com seis etapas, extração por modelo, tabela de dados, correções controladas, de-para CSV, associações federadas, revisão e aplicação transacional. O protótipo HTML anterior permanece apenas referência histórica. [Guia de uso](IMPORTACAO_CRONOGRAMA.md).

A pasta passa a guardar JSON v2 sem IFC base64 e modelos imutáveis identificados por hash. Projetos v1 têm leitura e backup na migração. Mantém-se o exportador portátil anterior, com seu limite próprio.

## Verificações automatizadas executadas

- `npm test`: **229 passaram**, zero falhas, zero ignorados. log preservado localmente.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; permanece aviso de bundle maior que 500 kB. log preservado localmente.
- `node --experimental-strip-types src/ifc/schedule.selfcheck.ts`: aprovado.
- Python/IfcOpenShell: **5 testes passaram** em `tools/schedule/test_schedule_ifc.py`, incluindo IFC2X3/IFC4, preservação de entidades/geometria/GlobalIds, correções com releitura, proxy com geometria, GUID duplicado e bloqueio de correções que apagariam cronograma anterior.
- Contratos: GUID igual em modelos distintos, fatia por modelo versus CSV completo, rejeição de datas divergentes, justificativa sem 3D, origem de correções e respostas IA fora do escopo.
- Transação: falha no segundo modelo não confirma nenhum; falha antes de gravar reverte o staging; falha posterior à gravação retorna aviso e adota o que efetivamente foi salvo.
- Persistência: v1 para v2 com histórico, modelo ausente/corrompido rejeitado, arquivo de 40 MB salvo fora do JSON e histórico capaz de recuperar hash anterior. O ensaio de 26 MB do transporte usa comentário STEP para ampliar o arquivo; não mede geometria complexa.

## Ensaio real no navegador

Instância isolada em `127.0.0.1:5179`, código do aplicativo real. Apenas a escolha da pasta foi injetada pelo recurso de teste já existente do servidor (`pickFolder`), apontando para `.cache/qa-etl-federado-20261105`. Todas as leituras, gravações, hashes, processamento Python e carregamento Fragments foram reais. **O seletor nativo do Windows não foi validado por esse ensaio.** A sessão do usuário em 5178 foi preservada.

1. Login local e abertura da pasta com `Estrutura.ifc` e `Instalacoes.ifc`, dois elementos por modelo; GUIDs propositalmente iguais entre os arquivos.
2. Extração de quatro elementos, edição de `Name` para “Viga conferida QA”, filtros e agrupamento por classe. Um problema de captura do campo foi corrigido para registrar a edição durante digitação.
3. Upload do CSV com cabeçalhos Código/Nome/Início/Término, normalização sem mudar datas; checkpoint recuperado e reanálise exigida.
4. A01 associada aos quatro elementos dos dois modelos; A02 administrativa justificada sem 3D.
5. Conferência explícita, preparação e releitura de duas cópias, aplicação, salvamento, saída para Projetos e reabertura da pasta.
6. Gantt reaberto com tarefas de 06/11/2026 a 07/11/2026. Nova inspeção confirmou “Viga conferida QA”. Estado persistido com dois modelos e quatro registros de atividade; todos os hashes conferidos. [Recibo](evidencias/pipeline-federado-2026-11-05/pasta-reaberta.json).
7. Codex real (`gpt-6.1-sol`, modelo indicado pelo catálogo local): análise de um elemento sem correções justificáveis retornou zero propostas; análise de dois candidatos IfcBeam no mesmo pavimento propôs dois vínculos, um em cada modelo. Propostas foram mostradas e adotadas explicitamente; esse segundo ensaio não substituiu a revisão salva.
8. Aviso de substituição do cronograma anterior visível na revisão. Pendência em A02 manteve confirmação desabilitada.
9. Layout em 1280 × 720 e 480 × 800. Navegação e indicadores permanecem visíveis. No estreito, diálogo de 465,59 px dentro de viewport de 480 px, sem transbordamento da página. Console sem erros no final da verificação.

[Captura da tabela atual](evidencias/pipeline-federado-2026-11-05/ifc-coral-etl-tabela.jpg). A captura `ifc-coral-etl-aplicado.jpg` documenta o sucesso da primeira aplicação, anterior ao refinamento final do cabeçalho.

## Limites abertos

- Não houve ensaio com o CANTEIRO_TEMPORARIO do usuário, nem benchmark de geometria de 100 MB, consumo máximo de memória ou conjunto de 20 modelos. O leitor carrega cada IFC integralmente, sequencialmente; os lotes são de metadados para IA.
- Não houve instalação em outro computador nem validação do seletor nativo neste ciclo.
- Modelos já associados a pacotes permanecem bloqueados para preparação. Cronogramas externos ao PSet Coral também não são sobrescritos.
- Correções limitadas a nome/local de planejamento/serviço; não há edição geral de classe, geometria, quantitativos, MVD ou IDS.
- CSV obrigatório; XLSX, Parquet, outros harnesses/provedores e servidor de jobs persistentes ficam fora. O checkpoint guarda decisões e exige reanálise; não retoma um processo Python interrompido.
- O ensaio federado usou modelos sintéticos pequenos. A regressão automatizada do 4D passou; não houve novo ensaio completo de pacotes/restrições/suprimentos da TORRE02 nesta sessão.
- Transferência de projetos grandes deve levar a pasta completa. Formato v2 não é compatível com versões antigas do aplicativo; há backup v1 anterior à migração.

O README publicado não foi alterado. A branch local e o remoto precisam ser reconciliados antes de eventual commit/publicação, mediante autorização individual de Lucas.
