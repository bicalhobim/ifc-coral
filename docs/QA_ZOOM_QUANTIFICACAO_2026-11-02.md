# QA — zoom, cabeçalhos e seleção da quantificação

Data: 02/11/2026. Base: `d1bd906`. Ensaio no navegador integrado, projeto separado `QA Integracao 02nov`, modelo TORRE02. Não houve alteração no projeto Beta.22.

## Entrega

- Arrastar a escala de datas à direita amplia; à esquerda reduz, entre 100% e 1200%. Gantt integrado, hierarquia IFC e linha de balanço. O ponto temporal sob o início do gesto é mantido quando os limites da rolagem permitem. As datas de planejamento não são editadas pelo gesto.
- Teclado na escala: setas esquerda/direita ajustam; Home restaura. Foco conservado após redesenho.
- Cabeçalho geral recolhível; botão para restaurar sempre visível. Preferência local do navegador.
- Botão ⌃/⌄ nos painéis recolhe barras auxiliares disponíveis e compacta o título; arrastar, fechar e maximizar continuam acessíveis. Não apaga filtros ou dados.
- Quantificação usa GlobalIds da seleção física, independentemente da existência de tarefa 4D. Volumes declarados são lidos do arquivo IFC. Cache de metadados distingue modelo e revisão.
- Catálogo lista regras e contagens de elementos; itens sem classificação aparecem explicitamente pendentes. Variantes IFC StandardCase/ElementedCase utilizam a classe construtiva correspondente.
- Rascunhos de taxa, método e fonte permanecem na sessão ao trocar seleção/aba; aplicar exige revisão de impacto. Abrir outro projeto limpa esses rascunhos.

## Evidências observadas

1. Arraste real de 180 pixels: 100% → 200% nas três vistas. Home devolveu a 100%; seta direita levou a 119%, mantendo foco na escala na versão final.
2. Cabeçalhos recolhidos/expandidos sem perder o projeto. Tela estreita de 700 × 800: controles de restauração acessíveis e rolagem horizontal disponível. Tamanho restaurado depois do ensaio.
3. Seleção de SUBSOLO 02: 137 elementos, incluindo 26 blocos e 80 estacas no catálogo. Também uma laje de fundação, 26 pilares e quatro paredes de contenção.
4. Taxa fictícia de teste de 95 kg/m³ em blocos, com fonte explícita: digitar, selecionar Pavimento 01 e retornar preservou o rascunho. Confirmação mostrou 26 elementos afetados da seleção e alcance global da regra.
5. Após salvar a regra, estimativa recalculada; após reabrir a pasta, valor 95 persistido. Ao final a taxa foi devolvida a desconhecida e a fonte inicial restaurada por nova revisão no projeto QA, mantendo o histórico do ensaio.
6. Quantitativos incompletos ficaram pendentes, com subtotais explícitos; não foram transformados em zero.
7. Console da versão final sem erros no recorte consultado.

## Verificações técnicas

- `npm test`: 187/187 aprovados, incluindo seleção sem cronograma, classificação de variantes IFC e escala limitada/ancorada.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; aviso já existente de bundle maior que 500 kB.
- `node --experimental-strip-types src/ifc/schedule.selfcheck.ts`: OK.
- `git diff --check`: sem erro de espaços; avisos de normalização CRLF/LF do Git.

## Limites

Ensaio de mouse e teclado no navegador integrado; não caracteriza validação de todos os navegadores ou dispositivos touch. Rascunhos de campos ainda não confirmados ficam na sessão; apenas regras salvas pertencem ao arquivo de projeto. Taxas continuam sendo premissas de estimativa, sem dimensionamento estrutural. Quantidade ausente no IFC permanece pendente. Nenhum push faz parte desta entrega.

## Capturas

- [Planejamento compacto](evidencias/zoom-quantificacao-2026-11-02/01-cabecalhos-compactos.png)
- [Blocos no catálogo](evidencias/zoom-quantificacao-2026-11-02/02-blocos-no-catalogo.png)
