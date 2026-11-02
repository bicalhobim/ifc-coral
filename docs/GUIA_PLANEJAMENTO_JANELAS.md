# Planejamento integrado e área de trabalho

Checkpoint anterior às alterações: `468636f` (autorizado por Lucas em 02/11/2026). As alterações desta rodada permanecem locais até nova autorização de commit.

## Operar o planejamento

1. Abra o projeto e clique em **Planejamento 4D** na barra do modelo.
2. Em **Visualização**, escolha Gantt, Linha de balanço ou Tabela. A hierarquia original permanece em **Hierarquia IFC**; o alternador retorna ao planejamento integrado depois da tabela IFC.
3. Agrupe por local, serviço, modelo ou responsável. A busca pesquisa nomes, locais, responsáveis e insumos. **Filtros e horizonte** oferece modelo, local, serviço, responsável, recurso/insumo, situação do pacote, restrições/análise pendente e intervalo de datas. O filtro de seleção 3D usa modelo + GlobalId.
4. Use **Desde** e **Até** para o horizonte desejado. Os atalhos de 6 semanas e 90 dias partem de Desde ou do início original do cronograma, sem deslocar datas históricas para hoje.
5. Clique na barra ou no nome na tabela: os elementos são selecionados e a janela **Informações da atividade** apresenta os pacotes daquele serviço, responsáveis, datas operacionais, quantidades, restrições e recursos. Ali há atalhos para editar o pacote, revisar restrições e acessar suprimentos.
6. Use +/− para escala horizontal, a rolagem para navegar e **Ajustar período** para retornar à escala ajustada. **CSV filtrado** exporta o recorte e as referências modelo + GlobalId. A simulação existente continua disponível e usa a seleção da atividade como escopo.

## Linha de balanço

X representa tempo e Y representa locais. Em Filtros, **Ordenar locais da linha de balanço** permite alterar a sequência. O agrupamento reúne modelo + local + serviço e preserva todos os elementos e tarefas de origem.

A faixa representa do início mais cedo ao término mais tarde das atividades do serviço naquele local; pode conter intervalos sem trabalho. Os traços entre locais são guias visuais de fluxo, não relações de precedência. Para examinar um fluxo específico, filtre, por exemplo, “Concretagem de vigas”. Não se calcula caminho crítico, produtividade, takt ou nivelamento de equipe nesta versão.

As datas do gráfico são as datas IFC. Datas ajustadas dos pacotes aparecem identificadas no inspetor. A geometria e identidade IFC não são alteradas por filtros, agrupamentos ou ordenação. Edição operacional continua no pacote com as validações, revisões e salvamento existentes. Concluir concretagem não conclui automaticamente fôrmas ou armação dos mesmos objetos.

## Organizar as janelas

Modelo, Propriedades, Quantificação, Planejamento 4D, Produção/restrições, Pacotes/Kanban, Planejamento macro, Suprimentos, Catálogos e Informações da atividade usam o mesmo gerenciador.

- Arraste o título para soltar a janela; ao aproximar de uma lateral, parte inferior ou painel encaixado, a prévia roxa mostra o encaixe.
- Use o seletor **Posição** para Esquerda, Direita, Abaixo ou Flutuante sem depender de arrastar.
- Arraste as divisórias para ajustar a área dos painéis. As divisórias também aceitam setas do teclado.
- O botão quadrado maximiza/restaura. O losango fixa ou recolhe automaticamente. Reabra uma janela pelo menu **Janelas**.
- **Encaixar todas as abertas** reorganiza os painéis. **Restaurar disposição** recupera a disposição padrão. Posições e dimensões ficam neste navegador; não modificam o projeto nem viajam no JSON.
- Ao soltar/redimensionar uma janela flutuante, o gerenciador procura espaço livre entre painéis. Quando não cabe, encaixa em uma faixa lateral ou inferior compatível com o tamanho. Prévia de arraste e maximização são sobreposições temporárias intencionais.
- Diálogos de confirmação, importação e revisão de impactos continuam modais para preservar operações atômicas.

## Relações e limites

O projeto JSON continua sendo o registro operacional. As vistas são projeções dos mesmos dados, sem cópias editáveis independentes. Uma atividade só recebe pacote quando há vínculo de tarefa e elemento; no legado sem taskIds, exige o mesmo serviço e elemento. GlobalIds iguais em modelos diferentes permanecem separados. Padrões vazios de restrição são “a analisar”, não restrições identificadas.

O filtro de recursos utiliza composições e requisitos já registrados. Não inventa equipe, equipamento, capacidade ou disponibilidade. Recursos de composição podem ser premissas ainda não conferidas. Datas e quantidades do pacote mantêm sua própria origem.

Referência de interação: [Bentley — SYNCHRO Workspace Layout & Management](https://bentleysystems.service-now.com/community?id=kb_article_view&sysparm_article=KB0017500), consultada em 02/11/2026. A referência orientou encaixe, maximização e navegação; não implica equivalência funcional nem importação/exportação nativa SYNCHRO.

## Atualização de experiência (02/11/2026)

Pacotes agora abrem Resumo, Restrições e Suprimentos na mesma janela. No mapa, use Editar linha para ajustar coeficientes/perdas/prazos, Baixar CSV (Excel) ou Baixar JSON para saídas independentes da pasta, e Salvar CSV na pasta do projeto para arquivar em Exportacoes. Datas significam iniciar compra até, emitir pedido até, receber em obra e necessidade em obra. Nenhuma delas emite um pedido real.

A linha de balanço agora desenha os locais de baixo para cima. A lista de ordenação define a sequência da base ao topo. Serviços compartilham a mesma cota; linhas cheias ligam inícios e tracejadas ligam términos, com faixa sombreada. A sugestão reconhece nomes de pavimentos, não elevações; revise locais não reconhecidos. Os limites sobre envelopes, interrupções e ausência de CPM/nivelamento continuam válidos.
