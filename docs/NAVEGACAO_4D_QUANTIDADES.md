# Operar o modelo, reproduzir o 4D e conferir o concreto

Interface v03 · laboratório local · Professor Lucas Bicalho

## 1. Encontrar as ferramentas

1. Abra `http://127.0.0.1:5178/` e clique em **Abrir TORRE02** se ainda não houver modelo.
2. Na barra sobre o visualizador, o primeiro ícone abre **Modelo IFC**. O segundo abre **Propriedades**. O terceiro abre **Planejamento 4D**.
3. Clique novamente no ícone ou no **×** do painel para fechar. Fechar o 4D pausa sua reprodução. Árvore e propriedades alternam no mesmo espaço lateral. O modelo se redimensiona; os painéis não ficam sobre ele.
4. **Ampliar modelo**, no topo, recolhe a oficina. **Voltar à oficina** a restaura.
5. Use **3D**, **Topo**, **Frente** ou **Lado** para orientar a câmera. O botão de enquadramento da barra ajusta a seleção; sem seleção, ajusta o modelo ativo.
6. A divisória acima do 4D pode ser arrastada. Com foco nela, as setas para cima/baixo também alteram a altura.

## Selecionar vários objetos

- **Ctrl + clique** ou **Shift + clique** adiciona um objeto à seleção. No macOS, **⌘ + clique** também funciona. Repetir o clique com o modificador remove aquele objeto.
- Para selecionar sem segurar uma tecla, ative **Seleção múltipla** na barra do visualizador (ícone de dois quadrados). Cada clique adiciona ou remove um objeto, tanto no modelo quanto na árvore **Modelo IFC**. Clique no botão novamente para voltar à seleção simples.
- A barra informa quantos objetos estão selecionados. **Esc** ou **Limpar seleção** (× na barra) limpa o conjunto. Na seleção simples, clicar no fundo vazio também limpa; com seleção múltipla ativa ou modificador pressionado, o fundo preserva o conjunto.
- A árvore permanece aberta enquanto você seleciona. Abra **Propriedades** para navegar pelos itens e consultar o volume do conjunto. Abra **Quantificação** para calcular os serviços desse mesmo conjunto; as fases 4D não multiplicam o volume físico.
- A seleção feita no modelo ou na árvore também fica disponível no escopo **Seleção** do 4D. Selecionar uma atividade no cronograma substitui o conjunto pelos elementos daquela atividade. Arrastar para movimentar a câmera não altera a seleção.
- A seleção é temporária. Os vínculos salvos nos pacotes continuam identificados pelo modelo e pelo GlobalId; não pelos números internos do visualizador.

## 2. Reproduzir a concretagem

1. Abra **Planejamento 4D**. No campo de busca, digite `Concretagem de laje - PAV 01`.
2. Selecione **1.3.2.5.1.3 Concretagem de laje - PAV 01**. Os seis elementos são realçados e enquadrados. A barra informa **6 elementos · 34,707 m³**.
3. O escopo muda para **Seleção**. O Gantt aproxima seu intervalo de datas. **Voltar ao início** mostra o dia anterior à atividade, sem os elementos futuros.
4. Clique em **▶**. Em 24/10/2026, os seis elementos aparecem roxos. Ao chegar a 25/10, permanecem visíveis, sem o destaque de atividade em andamento.
5. Pause, avance, retroceda ou arraste o controle de data. A reprodução visita inícios e términos; elementos com o mesmo início aparecem juntos, não um a um em ordem arbitrária.
6. Para acompanhar a sequência geral, selecione **Modelo inteiro** no escopo. Para sair da simulação, use **Mostrar modelo completo**, o ícone de olho na barra.

As datas são planejamento importado do IFC. O play não conclui pacotes, não registra recebimentos e não altera o PPC.

## 3. Aproveitar o quantitativo

1. Com a atividade selecionada, use **Criar pacote da seleção 4D** ou **+ Pacote da seleção** na oficina.
2. Para concretagem identificada, a quantidade é preenchida com o volume completo e válido dos elementos únicos. O caso de concretagem inicial também usa o QTO quando disponível.
3. Consulte **?** junto ao volume para ver origem, cobertura e a ausência de perdas. Confira também o local, serviço e a especificação de concreto. Um volume de elemento não é, sozinho, uma especificação de compra.
4. Revise a quantidade e a origem antes de salvar. Se o pacote já existia, ele conserva seu valor; **Usar volume IFC neste pacote** é uma atualização explícita. O botão fica indisponível depois de congelado o compromisso.
5. Em **Suprimentos**, confira a demanda e a cobertura. Um caso recém-criado ajusta as três propostas fictícias ao volume do cenário. Alterar a demanda depois não muda uma confirmação, reserva ou fornecimento já registrado.
6. Em **Arquivos > Exportar projeto**, guarde o IFC e as decisões. **Reabrir projeto** verifica o arquivo e reconstrói o catálogo de volumes a partir do IFC embutido.

### Como o número é obtido

São lidos os `IfcQuantityVolume` associados por `IfcElementQuantity`. `NetVolume` tem preferência sobre `GrossVolume`; a unidade explícita da quantidade prevalece sobre a unidade volumétrica do projeto. Unidades SI cúbicas e conversões volumétricas declaradas são normalizadas para m³. Unidades ausentes/desconhecidas, valores inválidos ou conflitantes deixam a medição pendente. Cobertura parcial apresenta contagem, sem preencher uma demanda total incompleta.

O mesmo `GlobalId` no mesmo modelo conta uma vez, mesmo quando participa de formas, armadura e concretagem. Outro modelo constitui uma identidade distinta. A tabela/CSV mostra volumes **por atividade**: não some fases diferentes como se fossem consumo adicional do mesmo material.

O recorte atual não calcula volume pela geometria, aço por taxa, formas por área, perdas, produtividade ou duração. Não transforma todo elemento volumétrico em concreto; o preenchimento de demanda é limitado à seleção identificada como concretagem e depende de conferência humana.

## Referências de navegação e dados

- Autodesk, [Models in the Viewer](https://help.autodesk.com/cloudhelp/ENU/Coord-Models/files/get-started-with-models/Model_Coord_Models_In_Viewer.html) e [Model Viewing Toolbars](https://help.autodesk.com/cloudhelp/ENG/Coord-Models/files/Model_Coord_Viewing_Toolbar.html): ferramentas compactas, painéis e orientação do modelo. Referência de organização, sem uso de marca na interface.
- buildingSMART, [IfcQuantityVolume, IFC4 ADD2](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2/HTML/schema/ifcquantityresource/lexical/ifcquantityvolume.htm): unidade da quantidade e unidade do projeto.

O PowerPoint/PDF em `materials/guia-operacao-v02` permanece como edição histórica. As capturas atuais de validação ficam em `artifacts/v03`; os slides serão atualizados após o teste do professor.
