# Seleção, pacotes e janelas

## Selecionar pela árvore

- O ícone **Modelo IFC** abre a árvore. Clique no nome de um pavimento para selecionar seus elementos; o nome do arquivo seleciona os elementos do modelo inteiro.
- A seta apenas expande/recolhe, sem alterar a seleção.
- Clique em uma linha e use **Shift + clique** em outra para selecionar o intervalo inclusivo de linhas visíveis daquele modelo. Contêineres incluídos no intervalo selecionam seus descendentes.
- **Ctrl/⌘ + clique** adiciona o grupo; se ele já estiver inteiramente selecionado, remove o grupo. **Ctrl/⌘ + Shift** acrescenta o intervalo à seleção existente. No 3D, Shift mantém o comportamento anterior de seleção múltipla.
- Grupos totalmente selecionados ficam realçados; grupos parcialmente selecionados têm indicação lateral. Esc ou o ícone de limpar desfazem a seleção.

## Criar e gerenciar pacotes

- **Pacote da seleção** traz os elementos e suas atividades de concretagem, sem multiplicar volumes pelas fases. O pavimento espacial orienta o nome e o local inicial. Datas continuam sendo as do cronograma: confira-as.
- Para fôrmas e armação com vínculo aos quantitativos, use **Quantificação → Conferir → Pré-visualizar pacotes**. Cada serviço conserva sua unidade.
- **+ Novo pacote → Criar rascunho** permite informar nome, local, serviço e unidade, sem vincular automaticamente elementos IFC. Quantidade começa desconhecida; restrições começam pendentes. Confira as datas sugeridas antes de planejar.
- Escolha o pacote na lista. **Editar pacote** abre Produção e posiciona o foco na definição. Grave as mudanças com **Salvar definição do pacote**; depois salve o projeto para persistir na pasta.
- **Excluir pacote** pede confirmação. **Desfazer exclusão** recupera a última exclusão durante a sessão daquele projeto, sem desfazer outras edições. Exclusões anteriores não ficam em uma lixeira persistente.
- Pacotes com compromisso congelado, realizado, reserva ou mapa de suprimentos confirmado ficam protegidos. O comando não apaga IFC, medições ou propostas. Recursos sem reservas acompanham a exclusão e o desfazer.

## Organizar as janelas

- Os quatro ícones abrem **Modelo IFC, Propriedades, Planejamento 4D e Quantificação** independentemente. Abrir um não fecha os outros.
- Em **Janelas**, escolha **Árvore + Quantificação** ou **Árvore + Propriedades**. **Restaurar disposição** recupera as posições padrão, mantendo abertas as janelas em uso.
- No cabeçalho de cada janela, escolha **Esquerda / Direita / Abaixo / Flutuante**. Arrastar o título solta uma janela; para encaixá-la novamente, use esse seletor. O encaixe não ocorre automaticamente ao arrastar para uma borda.
- Arraste os divisores laterais para ajustar larguras, o divisor inferior para ajustar a altura e o divisor entre janelas empilhadas para repartir espaço. Divisores também aceitam setas pelo teclado.
- Nas flutuantes, arraste o canto inferior direito para redimensionar. Elas permanecem dentro da área do visualizador.
- O botão de fixação preenchido mantém a janela aberta. Desative-o para recolher a janela em uma aba; clique/passe sobre a aba para consultar, e fixe para mantê-la aberta. Ao sair da janela ou clicar no modelo, a consulta recolhe. X fecha.
- **Ampliar modelo** disponibiliza mais espaço para o trabalho com várias janelas. Em telas estreitas, prefira recolher painéis ou usar uma janela flutuante.
- Posição, fixação e dimensões das flutuantes são preferências deste navegador; não contêm dados do projeto ou chaves de IA. Os campos não são reconstruídos ao mover as janelas.

Adaptação inspirada na [documentação oficial das janelas do Navisworks](https://help.autodesk.com/cloudhelp/2025/ENU/Navisworks-Quick-Start/files/GUID-C5E2D39D-8197-4C6A-9607-998DA46D9BB5.htm) e na [imagem oficial da interface](https://help.autodesk.com/cloudhelp/2025/ENU/Navisworks-Freedom-Quick-Start/images/roamer_interface_freedom.png).
