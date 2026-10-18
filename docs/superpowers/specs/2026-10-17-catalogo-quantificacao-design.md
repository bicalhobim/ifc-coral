# Catálogo de quantificação IFC · aço, fôrmas e concreto

**Estado:** implementado na interface v04, com migração multiunidade e mapa de suprimentos. O diagnóstico e as decisões originais abaixo permanecem como contexto. Evidência, revisão e limites vigentes em [REVISAO_QUANTIFICACAO.md](../../REVISAO_QUANTIFICACAO.md); interpenetrações e métodos não confirmados continuam pendentes.

**Objetivo:** transformar elementos IFC em quantidades conferíveis por serviço e, depois, em necessidades de suprimento por local e data. O estudante deve distinguir dado declarado, cálculo geométrico, estimativa paramétrica e quantidade aprovada.

## 1. O que foi encontrado e executado

- IfcOpenShell **0.9.0.post1** instalado em `.cache/ifc-quantification-venv`, isolado das dependências do visualizador e do repositório original.
- IFC4 TORRE02: **764 elementos físicos**, com geometrias processadas sem ausência/erro: 233 vigas, 276 pilares, 106 IfcFooting, 141 lajes e oito paredes.
- Os IfcFooting contêm **26 blocos e 80 estacas**. Os nomes de tipo distinguem `Bloco de fundação...` de `Estaca de concreto...`. Procurar apenas a palavra “estaca” também encontraria os blocos de duas/quatro estacas e produziria classificação incorreta.
- As lajes incluem 140 pisos/lajes suspensas e uma `BASESLAB` de fundação. As oito paredes têm nome/planejamento de contenção. Isso fornece candidatos de função, não confirma método executivo.
- Não existem IfcReinforcingBar ou IfcReinforcingMesh no arquivo. A massa de aço não pode ser apresentada como levantamento de barras modeladas.
- Corrigida a consulta de categorias do Gantt: padrões amplos também selecionavam **620 Ifc*Type**, resultando nos antigos 1.384 “elementos” e 4.152 registros. O alvo correto é **764 ocorrências / 2.292 registros**, sem contar tipos. Regressão escrita, falhou antes da correção e passou depois. Pacotes ligados a referências eliminadas precisam de revisão; compromissos congelados não são reescritos.
- Geometria medida: área total, faces inferiores horizontais, faces superiores e faces laterais verticais. Essas medidas não são chamadas de área de fôrma aprovada.
- IFC derivado de ensaio com `Coral_Quantificacao_Ensaio`, propriedades/unidades e classificação candidata nos 764 elementos. Aço estimado em 649; 115 com taxa pendente. Nenhuma área de fôrma aprovada; nenhum elemento aprovado para compra/execução. GUIDs, QTOs e arquivo original preservados.

Evidências locais: `artifacts/quantification-discovery/`. O IFC derivado não substitui o modelo de exemplo publicado pelo aplicativo.

## 2. Normas, medições e estimativas

O [catálogo ABNT](https://www.abntcatalogo.com.br/) apresenta **NBR 6118:2026 — Projeto de estruturas de concreto**. Para fundações, a referência identificada é NBR 6122:2022; para execução, NBR 14931:2023; para fôrmas/escoramentos, NBR 15696:2025. A [CBIC registra a publicação da NBR 15696 em 05/12/2025](https://cbic.org.br/wp-content/uploads/2026/01/boletim-de-normas-tecnicas-setor-da-construcao-civil-nov-dez25-e-jan26.pdf).

A pesquisa consultou metadados e publicações públicas primárias. A íntegra licenciada dessas normas não foi consultada; não atribuir percentuais, tabelas ou cláusulas específicas a elas neste levantamento. Uma taxa de consumo em kg de aço/m³ de concreto não é a taxa geométrica longitudinal As/Ac e não substitui dimensionamento, detalhamento, ancoragens ou emendas.

Para medição de fôrmas, o [caderno técnico SINAPI de pilares circulares](https://www.caixa.gov.br/Downloads/sinapi-cadernos-tecnicos/SINAPI-CT-FORMAS-PARA-PILARES-CIRCULARES.pdf) adota a superfície da fôrma em contato com o concreto. O caderno é referência de critério de medição; suas citações normativas históricas não determinam automaticamente a edição vigente.

### Proposta inicial de taxas para o ensaio

O [estudo de Jablonski, UNIPAMPA, 2013, tabela 2, p.36](https://repositorio.unipampa.edu.br/bitstream/riu/1660/1/%C3%8Dndices%20e%20taxas%20de%20consumo%20de%20materiais%20em%20fun%C3%A7%C3%A3o%20da%20tipologia%20estrutural.pdf#page=36) contém massas e volumes por elemento para edifícios de 12 e 17 pavimentos. Recalculando massa/volume, obtêm-se aproximadamente 50,8–58,5 kg/m³ nas lajes, 81,7–82,7 nas vigas e 110,3–120,3 nos pilares. Propomos arredondamentos **60 / 85 / 120 kg/m³** somente como cenário didático editável. A amostra é antiga e não valida a adequação dessas taxas à TORRE02. Não copiar os indicadores agregados das tabelas seguintes como se fossem taxas por volume individual do elemento.

| Regra candidata | Ocorrências | Taxa no ensaio | Situação |
|---|---:|---:|---|
| Laje suspensa maciça · IfcSlab/FLOOR | 140 | 60 kg/m³ | Estimativa didática proposta |
| Viga de concreto · IfcBeam | 233 | 85 kg/m³ | Estimativa didática proposta |
| Pilar de concreto · IfcColumn | 276 | 120 kg/m³ | Estimativa didática proposta |
| Bloco de fundação · IfcFooting + tipo Bloco | 26 | Pendente | Calibrar por projeto/comparável adequado |
| Estaca · IfcFooting + tipo Estaca de concreto | 80 | Pendente | Confirmar método, comprimento armado e referência |
| Laje de fundação · IfcSlab/BASESLAB | 1 | Pendente | Confirmar função e projeto |
| Parede de contenção · IfcWall + propriedades | 8 | Pendente | Confirmar sistema, faces e projeto |

Fórmula do cenário: `massa estimada de aço [kg] = volume líquido adotado [m³] × taxa proposta [kg/m³]`. Volume ou taxa ausentes resultam em pendência, não em zero. As seis lajes do exercício têm 34,707 m³; a 60 kg/m³, o cenário resulta em **2.082,42 kg estimados**, sem perdas e sem distribuição por bitola. Isso ainda não constitui uma lista de corte/dobra ou requisição pronta para fornecedor.

Não adotar referências por mera presença de um número: a [instrução histórica da Infraero](https://licitacao.infraero.gov.br/arquivos_licitacao/2015/SEDE/164_LABR_SBJR_2015_PG/ANEXO_VI.IV_Inst_servicos_Anexo-4_estrutura.pdf) menciona 50 kg/m³ para fundações no item 2.15 e 100 no item 3.7.3. A divergência, o escopo e a antiguidade tornam esse documento insuficiente para fixar automaticamente a taxa desta fundação.

## 3. Como quantificar fôrmas

| Função / processo | Regra de serviço proposta | O que precisa ser excluído ou confirmado |
|---|---|---|
| Laje suspensa | Faces inferiores reais e bordas que recebam fôrma | Topo, contato com vigas/pilares, bordas compartilhadas; aberturas e inclinações |
| Viga suspensa | Fundo e laterais que recebam fôrma | Topo aberto, extremidades apoiadas e contatos com laje/pilar; não usar área total do sólido |
| Pilar | Superfícies laterais que recebam fôrma | Base/topo e interseções com lajes/vigas |
| Bloco | Laterais e demais faces efetivamente formadas | Fundo no lastro, topo e faces concretadas contra terreno |
| Laje de fundação | Faces definidas pelo método executivo | Fundo apoiado no lastro/solo não herda fôrma de laje suspensa |
| Contenção convencional | Uma ou duas faces conforme sequência executiva | Face contra solo/estrutura existente; juntas, extremidades e interferências |
| Estaca escavada moldada no local | Fôrma de madeira geralmente não é o serviço aplicável | Não inferir pelo nome; camisa metálica, tubo/camisa recuperável, fluido ou pré-moldado são processos diferentes |

O motor deve distinguir **área geométrica**, **área candidata pela regra**, **descontos de contato** e **área de serviço aprovada**. É proibido renomear `get_area()` ou `OuterSurfaceArea` como “área de fôrma” sem uma regra de processo.

No ensaio das seis lajes, a área inferior geométrica é aproximadamente **347,07 m²**, antes da conferência de contatos. Não é a quantidade de chapas a comprar nem área final aprovada do serviço. A [documentação IfcOpenShell](https://docs.ifcopenshell.org/autoapi/ifcopenshell/util/shape/index.html) também diferencia área real e projeção; uma laje inclinada não deve ser medida pela projeção horizontal quando a regra exige a superfície real.

Chamadas de área devem respeitar orientação global e transformação do elemento. Para volumes com coordenadas georreferenciadas, recentrar a malha antes da soma de tetraedros: o ensaio demonstrou cancelamento numérico ao usar volume diretamente em coordenadas globais. O valor recentrado da primeira laje coincide com seu QTO (5,54925 m³). Malha não fechada, erro ou divergência acima da tolerância ficam sinalizados; não escolher silenciosamente a medida mais conveniente.

O iterator geométrico paralelo não retornou neste ambiente e foi interrompido apenas no processo do ensaio. A alternativa sequencial `create_shape` processou os 764 elementos em aproximadamente 2,6 s. Escolha de empacotamento/desempenho deve partir desse resultado medido, sem prometer desempenho em outra máquina.

## 4. Catálogo e precedência de regras

Cada regra registra: ID/versão, classe IFC, PredefinedType, tipo e propriedades discriminantes, função construtiva, serviço, unidade, entradas, fórmula, exclusões, fonte, escopo, parâmetros, método executivo e validações. Uma substituição manual exige motivo e autor.

Precedência: override explícito do projeto → regra específica de tipo/função/método → regra de classe → pendência. Empate ou conflito não escolhe uma taxa silenciosamente. `BASESLAB` prevalece sobre a regra genérica de laje; “Bloco ... Estacas” prevalece sobre uma busca textual genérica de estaca. Tipos nunca são ocorrências consumíveis.

Decisão de implementação proposta: valores estimados ficam como **rascunho**, com visual distinto das medições. A aprovação técnica é humana e ocorre por revisão. Alterar regra, taxa, geometria ou método invalida a aprovação do resultado afetado, sem alterar o snapshot de um compromisso congelado.

## 5. Dados e integração com planejamento e compras

O visualizador atual usa schema 1 e unidade literal `m³` em pacotes, fornecimentos, reservas e compromissos. Não inserir aço ou fôrmas nesses campos mudando apenas o rótulo.

O novo domínio deve separar:

1. **Elemento físico:** modelo + revisão/hash + GlobalId.
2. **Medição:** serviço + regra/versão + entradas + quantidade/unidade + origem (`declared`, `geometric`, `estimated`, `approved`) + pendências/evidência.
3. **Pacote de produção:** local, serviço, elementos, quantidade do serviço (m³ de concretagem, kg de armação ou m² de montagem de fôrma), responsável, capacidade e compromisso.
4. **Necessidade de recurso:** material/especificação, quantidade, unidade, data e pacote consumidor. Relação serviço→recurso usa uma composição explícita, nunca uma conversão por mera troca de unidade.
5. **Pacote de fornecimento:** consolidação compatível por material, especificação, unidade, local/logística e janela. Reserva por recurso; um kg de aço não cobre um m² de fôrma ou m³ de concreto.

Montagem de fôrma é serviço em m². Compra/locação de painéis e escoramento é capacidade reutilizável, com ciclo e simultaneidade: a área executada acumulada não é a área de painéis a comprar. Aço estimado em massa também não define bitolas, comprimentos, dobras ou otimização de corte; essas entradas ficam pendentes até BBS/projeto ou composição didática explícita.

Snapshot de compromisso/PPC continua por critério integral do serviço. Não somar kg, m² e m³ num total. Percentual de pacotes cumpridos não depende da unidade física. Uma quantidade nova não reescreve o denominador/quantitativo já congelados.

## 6. Interface proposta

Adicionar **Quantificação** como ferramenta do modelo, com três visões: **Medir**, **Catálogo** e **Conferir**. A ferramenta mostra seleção/local/classe, quantidades separadas por serviço, origem, taxa/fórmula, cobertura e pendências. Evidenciar o que está medido, estimado ou aprovado. Fontes/detalhes podem ficar em ajuda contextual, mantendo o resultado legível.

O professor escolhe a regra/método, ajusta parâmetros e vê o impacto antes de aplicar. A geração de pacotes é ação explícita e pré-visualizada; detectar sobreposição de elementos no mesmo serviço e evitar duplicação de demanda entre fases. A integração ao mapa de suprimentos mostra a data retrocedida a partir da produção, sem confundir requisição, pedido, entrega e consumo.

## 7. Execução em entregas

1. **Base confiável:** inventário, exclusão dos tipos, classes/funções e auditoria de medidas. Correção do Gantt já executada; ensaio IFC disponível.
2. **Catálogo + motor:** regras versionadas para concreto/aço/fôrmas, cálculos e conferência; contatos geométricos e exceções com casos analíticos. Primeiro validar as seis lajes e seus apoios, depois ampliar para o restante.
3. **Pacotes e recursos com unidades:** migração schema 1→2, compatibilidade de arquivos e snapshots; concretagem, armação e fôrmas separados, sem comprometer o fluxo vigente.
4. **Mapa de suprimentos:** consolidação por especificação/janela, aço por dados de compra disponíveis e fôrmas como recurso reutilizável. Agentes comerciais continuam outra frente.

Não desenvolver em paralelo com agentes de compras ou alterar o kit institucional. Continuar em `C:/dev/ifc4all-2`; não é necessário abrir outro chat nesta etapa. Se houver handoff posterior, enviar esta especificação, o plano técnico, os relatórios e o estado do Git, em vez de repetir toda a conversa.

## 8. Critérios de aceite

- 764 ocorrências / 2.292 registros na TORRE02; nenhuma definição de tipo contabilizada; 80 estacas não herdam a regra de bloco.
- Originais, GUIDs, QTOs e compromisso antigo preservados. Revisão de IFC exige conferência de vínculos.
- Quantidades parciais/ausentes não viram zero ou demanda completa. Taxa de aço sempre mostra fonte, data e condição de estimativa.
- Fôrma testada com laje, viga, pilar, bloco, contenção de uma/duas faces e método de estaca; contatos não são contados como fôrma. Sem método confirmado, resultado pendente.
- Unidades, recursos e snapshots passam por migração/reabertura e proteção contra reserva dupla; não perder arquivos schema 1.
- Navegador: medir → conferir regra → revisar estimativa → gerar pacotes → exportar/reabrir. Ensaiar controles/legibilidade sem sobreposição do modelo.

### Pendências de decisão

Pergunta enviada ao autor: método das estacas e das contenções no caso didático. Até resposta, continuam pendentes. As taxas 60/85/120 são uma proposta de calibração para revisão; não aprovação de dimensionamento ou de compra. As demais decisões de arquitetura acima são recomendações do implementador, não escolhas já aprovadas pelo autor.
