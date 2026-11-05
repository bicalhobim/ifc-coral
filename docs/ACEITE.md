# Evolução integrada — estado local em 02/11/2026

Referência atual: [guia](GUIA_EVOLUCAO_INTEGRADA.md) e [QA](QA_EVOLUCAO_INTEGRADA.md). Schema3, múltiplos insumos por pacote, mapa macro/detalhado, Kanban, cores e histórico substituem as limitações de recurso único do registro histórico abaixo. 174 testes e ensaio de navegador concluídos; avaliação do professor e autorização de commit continuam distintas de QA técnico.

---

# Verificação do primeiro recorte · 17/10/2026

Estado: **laboratório local funcional**. Não é a declaração de conclusão de todos os RF/CA do documento 5.4. O núcleo foi exercitado com TORRE02 real e dados de produção/suprimentos sintéticos. Nenhuma mensagem externa, pedido ou pagamento foi realizado.

**Correção do inventário após auditoria IfcOpenShell:** a referência vigente é **764 elementos físicos / 2.292 registros 4D**. As contagens antigas de 1.384/4.152, preservadas abaixo como histórico do ensaio, incluíam 620 definições Ifc*Type. A consulta de categorias foi corrigida e ganhou regressão; a seleção das seis lajes e seus 34,707 m³ permanece válida. Última verificação: **38 testes**, typecheck, três selfchecks e build aprovados.

## Evidência executada

- Base IFC4ALL antes da adaptação: TORRE02 carregada; visualizador, árvore e Gantt presentes. Selfchecks originais de schedule, gantt e tree aprovados.
- Versão adaptada: **1.384 elementos com cronograma e 4.152 registros 4D**. GUIDs obtidos pelo mapeamento público de Fragments. A árvore materializa as instâncias reais que a base antiga eliminava como wrappers.
- Navegador: criação de caso com 3 elementos de uma laje, definição de responsável/capacidade, quatro restrições com evidência e conferente, cobertura existente conferida, proposta B confirmada e 12 m³ reservados.
- Compromisso congelado antes do resultado; entrega e conclusão simuladas em 07/11 contra prazo de 06/11: **PPC 0%, denominador 1**. Não se inferiu execução pela data atual.
- Exportação `artifacts/oficina-validada.json`: 1 IFC embutido, 4.152 tarefas, 1 pacote, 4 restrições removidas, 1 reserva, 1 recebimento, 1 compromisso, 1 resultado e 13 eventos. Dados fictícios de validação.
- Reabertura portátil executada duas vezes na mesma sessão e restauração automática após recarga, com decisões preservadas. IDs de runtime únicos evitam colisão com o arquivo anterior.
- Mesmo IFC reimportado: sem duplicação. Revisão de teste renomeada alterou um GlobalId do pacote: escolha explícita de substituir revisão, 1 modelo mantido, pacote sinalizado e confirmação bloqueada por vínculo ausente. Projeto original restaurado pelo arquivo portátil.
- Interface examinada em 1366 × 900 e 640 × 850; nesta última, largura de documento e conteúdo **625 px**, sem transbordamento horizontal. Capturas em artifacts/.
- Gemini/OpenAI: testes com transporte simulado para listagem, conteúdo, falha, resposta vazia, isolamento de dados e ausência de segredo na exportação. Interface bloqueou consulta sem chave. **Nenhuma chamada paga real foi executada.**

Testes de domínio/integração Node: **25** no fechamento inicial; **37** após a interface v03 e leitura de QTO. Typecheck, três selfchecks e build aprovados na última verificação. O build avisa sobre bundle grande (engine BIM); esse aviso não é erro de compilação e a otimização de carregamento permanece pendente.

## Matriz em relação aos cenários do documento 5.4

“Parcial” significa que apenas o recorte descrito foi testado; não implica aceite integral do cenário original.

| Cenário | Resultado desta rodada | Evidência / limite |
|---|---|---|
| CA-01 · Homônimos / reabrir | Aprovado no domínio | Chaves independentes de modelo/local/serviço/slot/datas; dois homônimos persistem no roundtrip. UI validada com modelo real; não se introduziram homônimos artificiais no IFC. |
| CA-02 · Reimportação / revisão | Aprovado no recorte | Mesma revisão não duplica; revisão renomeada oferece escolha; alteração de GlobalId exige conferência e mantém histórico. |
| CA-03 · Cobertura desconhecida | Aprovado | Saldo indeterminado até conferir cobertura; quantidade desconhecida não equivale a zero. |
| CA-04 · Estoque de agregado e dois consumidores | Parcial | Cálculo 12−4−6=2 e capacidade global sem dupla reserva testados. Estoque genérico/transferência pedido→estoque ainda não implementados; não usar concreto fresco como exemplo estocável. |
| CA-05 · Totais de propostas | Aprovado | R$ 7.140 / 7.560 / 6.600; UI explicita lacunas de prazo e técnica. |
| CA-06 · Janela de B | Aprovado no recorte | B não cobre o pacote sem confirmação, evidência e reserva. Datas do protótipo são calendário simplificado, não simulação de dias úteis. |
| CA-07 · Entrega tardia | Aprovado | Promessa, necessidade e ocorrência distintas; atraso registrado em navegador; prontidão atual deixa de ser atendida e compromisso original permanece. |
| CA-08 · Parcial / rejeição | Aprovado no domínio | 8 recebidos−2 rejeitados=6 liberados; saldo 6; reposição da parcela rejeitada não apaga histórico. |
| CA-09 · Revisões de quantidade | Parcial | Saldo/excesso sem negativos e sem cancelamento silencioso; mudança de modelo sinaliza revisão. Não há equalização versionada nem análise completa de impacto comercial. |
| CA-10 · PPC congelado | Aprovado | Dois compromissos, um no prazo/outro tardio = 50%; adicionar tarefa não muda denominador. Sem compromissos = não aplicável. |
| CA-11 · Unidades / ausência de proposta | Parcial | Unidades incompatíveis recusadas no cálculo. UI limitada a concreto em m³; não coleta respostas reais nem converte viagem sem capacidade. |
| CA-12 · Reconciliação de envio | Não executado / fora deste recorte | Não existem ações externas de e-mail/fornecedores. Pertence à demonstração de compras posterior. |
| CA-13 · IA inconsistente | Parcial | Dados isolados, saída somente proposta, sem mutação automática. Julgamento de conteúdo real e registro estruturado de aceitação/correção ainda pendentes. |
| CA-14 · Portabilidade / reversão | Parcial | Exportar/reabrir com hash e sem credenciais aprovados; histórico Git preparado. Exercício de desfazer adaptação guiada com aluno ainda não ensaiado. |

## Revisão independente e passe de correção

Um revisor separado examinou o código e reproduziu falhas. Foram corrigidos: colisão de identificador de runtime na reabertura; revisão renomeada sem escolha; limpeza de carregamento provisório; datas ISO impossíveis/deslocamento de dia; prontidão com referência inexistente; reposição de material rejeitado; fórmulas em CSV; campo JSON herdado aceito pelo esquema. Cada regra ganhou teste que falhou antes de passar. A normalização da árvore espacial e a separação de slots homônimos também receberam regressões.

## Antes de usar com uma turma

1. Testar Gemini e OpenAI com chaves individuais, rede, saldo e modelos disponíveis; confirmar CORS na máquina do participante. Ver referências oficiais em CREDITOS.md.
2. Ensaiar instalação em cópia limpa, sem a junction de dependências usada nesta máquina. Formalizar licença e créditos antes de publicar o novo repositório.
3. Selecionar a frente final no IFC e conferir hierarquia de planejamento versus estrutura espacial. O caso sintético não certifica o modelo.
4. Capturar as telas finais e produzir slides do professor e template de cinco slides do grupo. A gravação de agentes depende da demanda real e do template de equalização do autor.

Outros limites: sem colaboração simultânea, ERP, permissões de projeto, múltiplos ciclos semanais ou calendário de feriados. O mapa desta versão é a visão do pacote de concreto selecionado; exportação integral é JSON, não uma equalização comercial completa. Chaves e respostas de IA não têm persistência; o grupo registra apenas a análise revisada em sua apresentação. Rótulos e tamanho do bundle ainda podem ser refinados sem mudar o núcleo didático.

## Incremento v03 · verificação adicional

O recorte acima continua como histórico. A interface atual acrescenta painéis encaixados sem cobrir o modelo, orientação/enquadramento e reprodução 4D real por datas de atividade. Play, pausa, passos, slider, troca de escopo e fechamento do painel foram operados no navegador. Geometria visível é estado **planejado**, sem inferência de execução.

As seis lajes da concretagem PAV 01 têm **34,707 m³ declarados no QTO**; o aplicativo não calcula esse valor pela geometria. Soma por modelo/GlobalId elimina repetição entre fases. Unidades explícitas/do projeto e conversões volumétricas declaradas são tratadas; ausência, conflito ou cobertura parcial deixam a demanda pendente. Os testes incluem o IFC real, unidade desconhecida, prefixo SI cúbico, conversão de pé cúbico, conflito, comentário STEP e elementos em modelos diferentes.

Caso novo e pacote da seleção receberam 34,707 m³; a demanda alimentou as propostas fictícias. O arquivo exportado/reaberto e o CSV conservaram o quantitativo. Aplicação explícita em pacote editável foi testada; no projeto antigo do professor, a quantidade de 12 m³ e o bloqueio do compromisso congelado permaneceram. Preços da matriz CA-05 acima se referem ao caso sintético anterior de 12 m³.

Inspeção em 1280×720 e 640×850 confirmou que o painel lateral e o inferior ficam fora do canvas; na tela estreita, documento/corpo com 625 px. A divisória do 4D respondeu ao teclado e a oficina recolhida liberou largura para o modelo. Referência operacional vigente: [Navegação, 4D e quantitativos](NAVEGACAO_4D_QUANTIDADES.md). Guia ilustrado v02 é histórico e será atualizado após o teste desta interface pelo professor.

## Ensaio de catálogo de aço/fôrmas

IfcOpenShell 0.9.0.post1 executou auditoria e geometria dos 764 elementos. Cópia derivada em artifacts/quantification-discovery contém propriedades com unidades, fonte e status: 649 estimativas paramétricas de aço propostas; 115 elementos de fundação/contenção com taxa pendente; nenhuma área de fôrma aprovada e nenhuma compra/execução aprovada. GUIDs, QTOs e original foram verificados na reabertura. As taxas 60/85/120 kg/m³ são cenário didático baseado em comparáveis, não valores normativos ou dimensionamento estrutural. O módulo de catálogo, os descontos de contato e o domínio de fornecimento em kg/m² continuam planejados conforme a especificação; esses ensaios não constituem seu aceite.
# Quantificação v04 — escopo atual

Catálogo e revisão humana, geometria local IfcOpenShell, schema 2 multiunidade, composição de recurso principal, capacidade reutilizável e mapa de suprimentos implementados. Consulte [o roteiro atual](QUANTIFICACAO.md). Os registros das versões anteriores abaixo são históricos.

- TORRE02: 764 ocorrências físicas, 2.292 registros de fases; nenhum tipo como consumo. Base e kit institucional preservados.
- Concreto: QTO declarado em m³. Aço: cenário estimado, não barras modeladas. Fôrmas: área geométrica/candidata separada da medida conferida.
- Contatos coplanares tratados; interpenetrações, métodos de fundação/contenção e taxas não confirmadas permanecem pendentes. Não há área final automática aprovada na TORRE02.
- Schema 1 continua legível por migração de cópia validada; quantidades e critérios congelados não são recalculados. Reservas com unidades/especificações distintas não se cobrem.
- Serviço de fôrmas difere de capacidade de painéis. Reuso usa períodos de ocupação; a composição exige ciclo e especificação. Um recurso principal por pacote neste recorte.
- Compra exige especificação/BBS conferido. Mapa confirmado é planejamento; não dispara contato, pedido ou pagamento. Agentes comerciais e chamadas reais Gemini/OpenAI não foram validados nesta entrega.
- Guia PPTX/PDF v02 continua histórico, não retrata a ferramenta v04. Capturas e arquivo portátil do ensaio ficam em `artifacts/quantification-v1/browser`; guia atual em Markdown.


## Recorte adicional — planejamento e janelas (02/11/2026)

Planejamento integrado por atividade/local/tempo e inspetor de relações implementados, preservando identidade IFC e premissas operacionais. Principais janelas encaixáveis e flutuantes. Validação técnica e visual registrada em [QA](QA_PLANEJAMENTO_JANELAS_2026-11-02.md); aceite de Lucas ainda pendente. Não se declara equivalência ao SYNCHRO, cálculo CPM ou nivelamento de recursos. Checkpoint anterior 468636f; atualização ainda local.

## Revisão UX de suprimentos e linha de balanço

Em 02/11/2026, mapa em grade com edição e exportações filtradas, detalhes do pacote com abas e linha de balanço ascendente foram verificados localmente. [Escopo, testes, evidências e limites](QA_UX_SUPRIMENTOS_LOB_2026-11-02.md). Aceite de Lucas e novo commit ainda pendentes.


## Complemento local — intercâmbio Compras IA (02/11/2026)

Exportador v1 implementado e testado com rascunhos, lacunas, revisões, reservas, reutilização e filtros. Não confirma composição, não reserva nem libera compra. Conferência de quantidade exige regra vigente, cobertura dos elementos e compatibilidade com a base exportada; evidências antigas são preservadas sem aprovação reaproveitada. Contrato congelado em `docs/contracts`; verificação e limites em `QA_INTEGRACAO_COMPRAS_2026-11-02.md`. Aceite técnico do exportador não prova o processo completo de compras no consumidor. Nenhum commit/push/deploy integra esta autorização.


## Referência de arquitetura — 04/11/2026

- [High-level design e imagens](architecture/HIGH_LEVEL_DESIGN.md): divisão efetiva entre front-end, regras no navegador, ponte Node.js local, arquivos e serviços opcionais.
- Revalidação nesta data: 201 testes aprovados, typecheck e build aprovados, com aviso de bundle grande. Os testes não substituem ensaio em outra máquina nem conferência técnica dos quantitativos.
- Contrato/exportador Compras IA documentados; o ciclo completo com o consumidor continua pendente de ensaio conjunto. IA OpenAI/Gemini com chave real, autenticação de contas, colaboração e sincronização contínua não foram validados/implementados por esta rodada, conforme os limites específicos do HLD.
- A documentação e as imagens não alteram critérios de liberação ou o kit institucional aprovado.


## 05/11/2026 — piloto IFC sem datas + CSV

> Os registros desta data são históricos: “sem commit/push” descreve o encerramento de cada rodada. Fontes consolidadas em `8564d9a`, guias/evidências sintéticas em `abab910`; a publicação posterior dos recibos não amplia seus critérios de aceite.

Implementação local autorizada por Lucas e alinhada com a coordenação 2.0 após as capturas. Assistente CSV/IFC, sugestão Codex revisável, cópia IFC rastreável, datas manuais explícitas, vínculo físico independente de 4D e conferência de revisão no salvamento. 208 testes aprovados, tipos/build/selfcheck e ensaio no navegador com chamada Codex real, reabertura e TORRE02. Limites e pendências em [QA do piloto](QA_PILOTO_IFC_CSV_2026-11-05.md); operação em [guia de importação](IMPORTACAO_CRONOGRAMA.md). Sem novo commit/push. Seletor Windows e instalação em segunda máquina ainda precisam de ensaio manual. Sem mudança no kit institucional ou no contrato Compras IA v1.


## 05/11/2026 — gestão central de restrições

Menu Restrições integrado aos pacotes e checklist: cadastro, edição, exclusão com motivo e proteções, filtros, indicadores e gráficos por área/responsável, CSV filtrado. Mesma fonte de dados e histórico do projeto. 213 testes aprovados, tipos e build aprovados, ensaio real no navegador em projeto sintético, incluindo reabertura. [Guia](GESTAO_RESTRICOES.md) e [QA/limites](QA_RESTRICOES_2026-11-05.md). Alterações locais, sem novo commit/push; piloto IFC + CSV anterior preservado.

## 05/11/2026 — coordenadas e movimento visual

Grade com cota editável, leitura local X/Y/Z e alinhamento rígido de modelo ou projeto por três pares foram implementados e ensaiados na TORRE02 em navegador. 215 testes, typecheck e build aprovados. O arquivo IFC não é editado; transformação persistida no JSON do projeto, com prévia/cancelamento e suporte a desfazer/refazer. A gravação/reabertura por seletor Windows em outra máquina e o deslocamento de elementos isolados ainda não têm aceite. Ver [guia](COORDENADAS_ALINHAMENTO.md). Sem novo commit/push.

## 05/11/2026 — percurso inicial da IAT001

Explore, Pratique E02 e Crie aparecem na home e geram projetos independentes. O tour pode ser pulado e reiniciado; E02 não herda a premissa fictícia de 12 m³ do exemplo. No ensaio isolado, o E02 chegou a pacote concreto de 6,304 m³ e baixou JSON v1 de uma demanda, sem autorização de compra. Instalação independente por `npm ci --offline`, build e abertura de 180 atividades 4D aprovados. Grade e alinhamento visual por três pontos foram testados; um pilar movido foi selecionado na nova posição. **218 testes, tipos e build** aprovados. Aceite para distribuição depende de pasta nativa, reabertura real no computador do aluno, versão/empacotamento discente e revisão editorial do guia. [Recibo técnico](QA_ENTRADAS_IAT001_2026-11-05.md). Sem commit/push.


## 05/11/2026 — pipeline federado integrado e ensaiado

Central Preparação 4D em seis etapas implementada no aplicativo: vários modelos, inventário filtrável/editável, CSV com de-para, vínculos por modelo + GlobalId, Codex por recorte, revisão e aplicação de cópias validadas. Persistência em pasta v2 com IFCs por hash, leitura/backup de v1 e histórico. 229 testes Node, 5 testes Python, tipos/build e autoteste 4D aprovados. Ensaio real com dois IFCs sintéticos: salvar/reabrir quatro vínculos e correção de nome; duas chamadas reais ao Codex. [Guia](IMPORTACAO_CRONOGRAMA.md) · [QA e limites](QA_PIPELINE_FEDERADO_2026-11-05.md). Seletor nativo, outro computador, modelos grandes reais e migração com pacotes ainda pendentes. Sem commit/push; README público preservado.
