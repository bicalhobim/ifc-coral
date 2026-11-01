# Restrição e quantitativo: operação do fluxo revisado

## Checklist do pacote

Em **Produção → Abrir checklist de restrições**, confira projeto/informação, frente/predecessoras, mão de obra, equipamentos e materiais/suprimentos. Novos pacotes começam com essas cinco condições pendentes; os registros anteriores mantêm suas descrições, evidências e estados.

1. Abra a linha ou marque sua caixa para iniciar a conferência.
2. Escolha **Todo o pacote** ou selecione objetos no 3D/árvore e clique **Usar seleção do modelo**. Só elementos pertencentes ao pacote são aceitos.
3. Confira a contagem e **Ver elementos vinculados**. **Realçar alcance no 3D** permite conferir visualmente o vínculo.
4. Registre responsável, prazo e ação. **Salvar apontamento** guarda o acompanhamento e os textos sem liberar a condição.
5. Registre evidência em texto ou print e informe o conferente; use **Confirmar e liberar**. O progresso só avança depois dessa confirmação. Uma condição liberada pode ser reaberta pela caixa; mudar seu alcance ou os prints também exige nova conferência.

Em **Prints da evidência → Anexar print**, selecione PNG, JPEG ou WebP (até 2 MB por imagem e cinco prints por restrição). Também é possível arrastar uma imagem ou colá-la com Ctrl+V na área dos prints ou no campo de evidência. A miniatura indica quando está pronta para salvar. Clique **Ver print** para abrir a imagem; **Tamanho original** permite examiná-la sem reduzir à janela.

O anexo só entra no registro ao usar **Salvar apontamento**, **Confirmar e liberar** ou, em condição já liberada, **Salvar evidências e confirmar liberação**. Depois use **Salvar** para gravar o projeto na pasta. Os prints ficam incorporados ao arquivo de projeto e acompanham Salvar como e a versão portátil. Imagens não são incluídas automaticamente nas solicitações à IA. Há um limite total de 12 MB de imagens por projeto; anexos ainda não salvos podem ser descartados no próprio cartão.

Os filtros mostram todas, pendentes ou liberadas. **Adicionar condição ao checklist** registra uma necessidade específica, sempre pendente inicialmente. **Salvar** grava o projeto na pasta escolhida. O compromisso semanal e o PPC continuam dependendo das demais condições do planejamento; uma caixa marcada não aprova a obra inteira.

## Entender a quantidade

Em **Quantificação → Medir → Ver memória de cálculo**, a janela apresenta o resultado, as entradas com unidades, a fórmula e o próximo passo. O nome do elemento e o pavimento orientam a leitura. GlobalId, classe IFC, regra e revisão ficam em **Rastreabilidade técnica**.

Exemplo do ensaio: **3,927 m³ × 90 kg/m³ = 353,43 kg** de aço estimado. A seleção de 31 elementos é dividida em quatro páginas. **Localizar este elemento no 3D** fecha a memória e destaca o objeto correspondente.

Quando faltam dados, o resultado permanece **A conferir**. Área geométrica antes dos descontos e subtotal de elementos completos não são o total liberado do serviço. Na fôrma, a memória distingue o método da regra atual das faces efetivamente consideradas no relatório; se divergirem, precisa de outro relatório ou de conferência manual justificada.

## Ajustar o catálogo

O catálogo prioriza os tipos da seleção; **Mostrar todas as regras** dá acesso aos demais. Cada regra contém taxa em kg/m³, exemplo de cálculo, superfícies de fôrma e campo de fonte/premissa. As opções de superfície são:

- **Fundo e bordas da laje:** faces inferiores e laterais verticais, sem o topo.
- **Fundo e laterais da viga:** faces inferiores/laterais, excluindo extremidades pela direção principal da peça.
- **Somente faces laterais:** faces verticais; fundo/topo ficam fora.
- **Uma ou duas faces principais da parede:** direções principais de faces, sujeitas à conferência de orientação, bordas e encontros.

Essas opções selecionam superfícies geométricas candidatas; a execução real determina se há fôrma nessas faces. Fundação, estaca e contenção começam sem taxa/método quando ainda não definidos.

**Revisar e salvar regra** apresenta a mudança antes da confirmação. A regra vale para todos os elementos compatíveis do projeto, inclusive fora da seleção. A taxa recalcula aço; mudar o método não gera automaticamente um novo relatório geométrico. Exporte o catálogo para o processamento IfcOpenShell e importe o relatório em Medir, ou faça a conferência manual justificada em **Conferir**. Os dados assumidos em compromissos congelados permanecem preservados.

O checkpoint anterior à revisão de interface está publicado: [79626c1](https://github.com/bicalhobim/ifc-coral/commit/79626c14dfd9d3245dcb8f6efbdf6b38b32b618b). A revisão de checklist, quantificação, propriedades e prints foi autorizada para consolidação no GitHub. Consulte o histórico Git para identificar o commit posterior a esse checkpoint.
