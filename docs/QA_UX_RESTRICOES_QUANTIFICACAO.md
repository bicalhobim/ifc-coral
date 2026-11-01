# QA — checklist, catálogo e memória de cálculo

Data da rodada: 01/11/2026. Checkpoint anterior publicado antes de editar: `79626c14dfd9d3245dcb8f6efbdf6b38b32b618b`, conferido em `origin/main`. Autorização: pedido expresso de Lucas nesta rodada. A revisão de interface abaixo continua local, sem outro commit/push.

## Diagnóstico e solução

- Os cartões antigos repetiam campos e ocupavam toda a altura sem visão de conjunto. Agora há resumo e tela própria de checklist, com status, filtro, acompanhamento e alcance explícito.
- Restrições eram apenas do pacote; agora o alcance pode ser todo o pacote ou um subconjunto de elementos seus, persistido por modelo + GlobalId. Não são usados localId ou nomes como identidade persistente.
- A memória mostrava JSON e identificadores na leitura principal. Agora apresenta nome/pavimento, entradas, unidades, fórmula, resultado e ações; a rastreabilidade técnica fica recolhida.
- O método de fôrma era texto livre. Agora corresponde a opções realmente suportadas pelo processador geométrico, com descrição das faces, exemplos e indicação do efeito ao salvar. A fonte/premissa pode ser registrada junto da regra.

## Verificações

`npm run verify`: **118 testes aprovados**, tipos, três selfchecks e build. Aviso conhecido de bundle grande permanece. Log em `.cache/ux-restrictions-final.log` e cópia em `artifacts/qa-restrictions-quantification/verify.log`.

| Operação pelo navegador interno | Evidência observada |
|---|---|
| Novo pacote por pavimento | 31 elementos; cinco condições pendentes separando mão de obra/equipamentos |
| Marcar condição sem evidência/conferente | Liberação recusada, aviso legível na área de feedback |
| Selecionar uma viga e usar seleção do modelo | Alcance persistido de um elemento pertencente ao pacote |
| Salvar apontamento | Responsável, prazo, ação e textos preservados; condição continua pendente |
| Confirmar e liberar | Progresso 1 de 5; condição liberada com conferente e evidência |
| Filtro de liberadas | Exibe a condição liberada; demais permanecem registradas |
| Salvar/reabrir pasta real de QA | Alcance, evidência, responsável e estado restaurados; conferidos também no JSON salvo |
| Catálogo | Regras da seleção priorizadas; métodos em lista com explicações; fonte/premissa editável |
| Continuar editando na prévia | Taxa digitada 90 preservada sem salvar a alteração |
| Taxa 85 → 90 kg/m³ | Viga de 3,927 m³ passou a 353,43 kg; regra aplicada e salva |
| Método do catálogo diferente do relatório | Fôrma permanece a conferir; orientação para relatório compatível/conferência manual |
| Memória de 31 elementos | Quatro páginas; navegação à segunda página e retorno operados |
| Localizar elemento no 3D | Janela fecha e seleção passa a um elemento, com nome e pavimento legíveis |
| Rastreabilidade | Identificadores e origem técnica recolhidos, sem JSON na leitura principal |

Ensaio persistente feito apenas em `.cache/workspace-qa/QA Pasta 31out - copia`, uma cópia de teste já existente. Demais ensaios em cópias novas do exercício. Projeto `Teste` e arquivos institucionais não foram editados. Capturas `antes-restricoes.png`, `checklist-final.png` e `memoria-final.png` na pasta de evidências.

Limites: não houve novo processamento IfcOpenShell de geometria, validação estrutural de taxa ou compra real. A seleção do método na interface não substitui processamento geométrico/conferência de encontros. Registros antigos são aceitos como condições de todo o pacote; suas evidências não foram reescritas. O vínculo específico novo é recusado se contiver referências externas ao pacote. Mudança de alcance reabre a condição, testada no domínio. Compromissos/PPC mantêm as regras anteriores.
