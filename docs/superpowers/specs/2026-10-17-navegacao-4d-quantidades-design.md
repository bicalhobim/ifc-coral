# Navegação, reprodução 4D e quantitativos IFC

Solicitação do professor: tornar menus compactos, preservar a visão do modelo ao abrir árvore/propriedades/4D, acrescentar reprodução temporal e aproveitar quantitativos IFC para o concreto. É uma evolução da interface e do núcleo existentes, autorizada pelo pedido atual. Manter os arquivos institucionais e o trabalho salvo do professor.

## Entrega

1. Barra de ferramentas compacta no visualizador. Árvore e propriedades abrem em uma faixa lateral reservada; apenas um desses painéis por vez. Cronograma abre em faixa inferior reservada. Fechar devolve espaço ao canvas. Nenhum chip herda dimensões de painel. A oficina pode ser ocultada. Enquadrar e vistas ficam acessíveis.
2. Reprodução explícita: iniciar/pausar, início, passo anterior/próximo e velocidade. Escopo modelo ou seleção. Avançar pelas datas relevantes do cronograma, mantendo elementos iniciados visíveis e destacando atividades em curso. Atividades simultâneas aparecem juntas. Navegar ou selecionar não altera o PPC nem registra execução.
3. Ler IfcQuantityVolume associado por IfcRelDefinesByProperties/IfcElementQuantity. Preferir NetVolume, explicitar GrossVolume quando for a alternativa. Converter a unidade própria da quantidade ou a unidade volumétrica do IfcProject para m³. Unidade ausente, conflito ou elemento sem quantitativo permanece pendência. Não deduzir unidade a partir da escala da geometria.
4. Somar por modelo e GlobalId, uma vez por elemento, mesmo que ele participe de formas, armaduras e concretagem. Mostrar cobertura e origem. Criar pacote de concreto com a quantidade disponível quando a seleção corresponde à concretagem e os dados estão completos. Pacotes já existentes só mudam por ação explícita; compromisso congelado preserva os valores originais. Sem quantitativo completo, não gerar demanda parcial como total.

## Verificação

Testes de conversão, unidade desconhecida, duplicidade, conflito, cobertura parcial e etapas temporais; TORRE02 real no navegador; criação de pacote, aplicação explícita no pacote e exportação/reabertura. Verificar painéis sem sobreposição do canvas e controles acessíveis com teclado. Guia v02 fica preservado como edição anterior; atualizar apenas a documentação operacional desta nova interface nesta rodada.

## Referências pesquisadas

- Prints existentes de Forma em CapitalProjectOS/Ativo Digital/Planos/ACC_Forma, usados somente como referência visual, sem copiar dados de cliente.
- Autodesk, Models in the Viewer: https://help.autodesk.com/cloudhelp/ENU/Coord-Models/files/get-started-with-models/Model_Coord_Models_In_Viewer.html
- Autodesk, Model Viewing toolbars: https://help.autodesk.com/cloudhelp/ENG/Coord-Models/files/Model_Coord_Viewing_Toolbar.html
- buildingSMART, IfcQuantityVolume (IFC4 ADD2): https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2/HTML/schema/ifcquantityresource/lexical/ifcquantityvolume.htm

Constatações: a implementação anterior tinha apenas um scrubber manual iniciado no fim do cronograma; os painéis eram posicionados sobre o canvas. O arquivo TORRE02 contém IfcQuantityVolume e unidade volumétrica em metros cúbicos, além de um Pset BIM4D_Quantidades que não era consumido pelo pacote. O recorte desta rodada usa os quantitativos declarados no IFC, não uma medição nova da geometria nem perdas de compra presumidas.
