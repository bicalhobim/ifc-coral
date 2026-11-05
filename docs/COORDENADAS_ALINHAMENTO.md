# Grade, coordenadas e alinhamento visual — piloto

## Uso

1. Abra um projeto com IFC. A faixa inferior do visualizador mostra **X, Y, Z em metros** do ponto sob o cursor. Se não houver geometria sob o cursor, mostra a interseção com a grade. São coordenadas **locais do visualizador** (Y é a vertical); não representam automaticamente coordenadas geográficas ou de levantamento.
2. Em **Grade · cota**, informe a elevação da grade ou use **Usar base do modelo** para sugerir a menor cota da caixa do modelo ativo. A grade é referência visual; ela não altera o IFC.
3. Selecione elementos na árvore ou no 3D. Em **Mover / alinhar**, escolha **Elementos selecionados**, **Modelo ativo** ou **Projeto inteiro**. Três pares Origem → Destino definem um movimento rígido no espaço. A tela começa com três pontos da caixa da seleção ou do modelo; edite as coordenadas para usar marcos conhecidos. Para transladar sem girar, informe ΔX, ΔY e ΔZ e use **Aplicar deslocamento aos três pontos**.
4. Use **Prévia**, confira o modelo, e então **Confirmar alinhamento**. **Cancelar** devolve a posição anterior. **Restaurar posição** remove o alinhamento do escopo escolhido. Salve o projeto na pasta para conservar a decisão.

## Regras e limites

- O movimento do modelo é registrado no JSON do projeto por ID; o dos elementos, por ID do modelo + GlobalId. O arquivo IFC original, os GlobalIds, quantitativos e tarefas 4D permanecem intactos. Ao abrir o projeto, os movimentos são reaplicados no visualizador.
- Os três pares devem conservar as distâncias entre pontos; o programa rejeita deformação e pontos colineares. Esta etapa não georreferencia nem exporta um IFC modificado.
- O deslocamento de elementos usa a camada de edição visual do motor 3D e não exporta um IFC modificado. A seleção do elemento movido foi ensaiada no navegador; a simulação 4D com elementos movidos e o ciclo de salvar/fechar/reabrir na pasta Windows ainda precisam de ensaio completo.
- A grade acompanha a cota escolhida pelo usuário. Ao mover o modelo, confira a grade novamente se quiser que ela coincida com uma nova base.
