# Da quantificação ao pacote de produção

A seleção identifica os elementos. A quantificação calcula ou registra medidas para esses elementos. O pacote recebe a medida conferida, seus vínculos e a memória de cálculo; não é necessário copiar o número à mão.

## Criar um pacote com a seleção quantificada

1. Selecione os elementos no 3D ou na árvore. Confira o número de elementos.
2. Abra **Quantificação → Catálogo**. Quando necessário, defina a taxa de aço e sua fonte para cada classe e salve a regra do projeto. Taxas estimativas não substituem projeto estrutural.
3. Volte a **Medir** e confira o serviço: concretagem em m³, armação em kg ou fôrmas em m².
4. Clique em **Usar concretagem no pacote**, **Usar armação estimada no pacote** ou **Usar fôrmas no pacote**.
5. Escolha **Criar novo pacote com esta seleção**, dê um nome e indique o local/frente.
6. Registre conferente, método e evidência. Conferências já registradas e vigentes podem ser reutilizadas. Se houver medida manual justificada, informe-a explicitamente; sem pesos disponíveis, confira um elemento por vez.
7. Clique em **Conferir e vincular ao pacote**. O pacote abre com quantidade, unidade, elementos e origem registrados. Use **Salvar** para gravar o projeto na pasta escolhida.

## Completar um pacote já criado

Com os elementos selecionados, abra o pacote e clique em **Trazer quantificação da seleção**. Escolha o serviço e confirme o pacote de destino. Nome, local e demais definições são preservados; o quantitativo e os vínculos passam a vir da conferência.

Um pacote de concreto não recebe kg de aço no campo de volume. Crie um pacote de armação para os mesmos elementos. O mesmo vale para fôrmas em m². Um pacote já vinculado a outra seleção exige recuperar sua seleção ou criar outro pacote, evitando trocar a frente silenciosamente.

## O que conferir depois

- O cartão passa a mostrar **quantificação herdada**, com total, unidade e número de medições vinculadas.
- O campo de quantidade fica protegido contra edição avulsa; revise a quantificação para alterar sua origem.
- Alterações no catálogo ou na revisão do modelo exigem nova conferência. Quantitativo pendente não é tratado como zero nem um subtotal como total completo.
- Alterar quantidade/alcance de um rascunho reabre as condições de preparação, preserva suas evidências e exige rever recursos. A operação não libera restrições automaticamente.
- Pacotes com compromissos congelados/realizados são protegidos. Reservas precisam ser liberadas antes da alteração; o histórico não é reescrito.
- O atalho de criação pela seleção aproveita as conferências completas de concretagem quando disponíveis. Sem esse conjunto completo, mantém o fluxo de volume IFC a conferir; use o comando acima para escolher aço ou fôrmas.
