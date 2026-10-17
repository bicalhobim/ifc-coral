# Da intenção ao compromisso

Uma concretagem aparece no cronograma. A frente está pronta para recebê-la? É essa decisão que o grupo vai justificar com as telas do IFC Coral.

Para a interface atual, consulte o [roteiro de navegação e 4D](NAVEGACAO_4D_QUANTIDADES.md). O guia ilustrado v02 é histórico: usa a navegação anterior e um exemplo de 12 m³. Na interface, o botão **?** mostra a explicação ao passar o mouse, receber foco ou clicar. Escape fecha a ajuda. As ações de importar, exportar e reabrir ficam no menu **Arquivos**.

## 1 · Entender o local e o serviço

Abra a TORRE02. Os ícones **Modelo IFC**, **Propriedades** e **Planejamento 4D** ficam sobre o modelo. Abra apenas o que precisar; a árvore e as propriedades dividem o painel lateral e o 4D ocupa a faixa inferior. “Ampliar modelo” recolhe a oficina da direita. Um pavimento IFC é referência espacial; a equipe define os limites de sua frente de trabalho.

No 4D, busque uma atividade e selecione sua linha. **▶** reproduz o planejamento do modelo inteiro ou da seleção; a geometria aparece conforme as datas de início, fica roxa durante a atividade e permanece visível depois. Etapas simultâneas aparecem juntas. Os botões de início, anterior, próximo, velocidade e o controle de data permitem examinar cada momento. Isso é sequência planejada, não avanço medido.

Crie o caso de concretagem ou um pacote da seleção 4D. Na TORRE02, as seis lajes do PAV 01 possuem **34,707 m³** declarados em `Qto_SlabBaseQuantities.NetVolume`. O sistema soma elementos únicos e reconhece a unidade do IFC. O volume preenche a demanda de uma nova seleção de concretagem; datas do cenário e propostas continuam fictícias. A origem aparece em **?**. Se faltar volume ou unidade, a demanda fica a conferir. O sistema não calcula volume pela geometria, não inclui perdas nem certifica o material especificado. Confira o serviço e o modelo antes de usar o número para compra.

Um pacote existente mantém o volume que foi registrado. Antes de congelar, **Usar volume IFC neste pacote** permite uma atualização explícita; compromissos congelados conservam a quantidade assumida. O exemplo antigo de 12 m³ permanece válido apenas como premissa daquele exercício.

## 2 · Preparar o trabalho

Na aba Produção, registre responsável, quantidade e sua origem, necessidade, prazo e critério verificável. Confirme capacidade. A retirada de uma restrição exige evidência e conferente. “Vamos resolver amanhã” é uma ação futura, não condição atendida.

## 3 · Ligar produção a suprimentos

Confira estoque/pedidos existentes antes de calcular saldo. Sem essa conferência, o saldo é indeterminado. Para concreto fresco, não conte com estoque recebido dias antes.

Compare A, B e C com a quantidade do seu pacote. O custo total considera quantidade, preço unitário e frete; as propostas são sintéticas. A tem entrega fora da janela. C ainda exige comprovação técnica. B precisa de confirmação da janela. O preço sozinho não resolve a decisão. A demanda do pacote vem do volume conferido; a disponibilidade e a confirmação do fornecedor são outras informações e não se atualizam automaticamente quando você muda um pacote existente.

Registre a evidência de confirmação e reserve a quantidade para seu pacote. Uma reserva não é pedido emitido. Receba e confira as quantidades separadamente: se chegarem 8 m³ e 2 forem rejeitados, apenas 6 m³ são liberados. Um recebimento fora da janela fica registrado, sem apagar a promessa.

O mapa retrocede da necessidade: nesta versão, **2 dias corridos para fornecer e 1 para preparar a compra**. É um calendário simplificado visível, independente do D+n abstrato do livro; não inclui feriados nem prova prazos de mercado.

## 4 · Assumir e conferir

Na aba Semana/PPC, selecione pacotes prontos e congele o plano. O sistema conserva nome, local, quantidade, critério, responsável e prazo originais. Concluir exige confirmação humana e evidência; data passada não significa tarefa concluída.

PPC = compromissos integralmente cumpridos no prazo ÷ compromissos assumidos × 100. Um atraso continua no denominador. Sem compromissos, o resultado é “não aplicável”. As causas de desvio orientam a conversa sobre a próxima semana.

## 5 · Pedir apoio da IA e guardar o projeto

Gemini e OpenAI são opcionais. Informe sua chave, consulte modelos disponíveis e veja os dados que serão enviados. A análise pode consumir créditos da sua conta. Ela aparece como proposta, sem alterar restrições ou autorizar compras. A chave fica apenas na sessão; use “Esquecer chave” ao terminar. O aplicativo não guarda histórico estruturado dessas análises nesta versão: copie para o registro do grupo somente o conteúdo revisado, sem credenciais.

Exporte o projeto portátil e teste sua reabertura. O arquivo inclui o IFC e as decisões; o navegador mantém uma cópia automática local. Não há colaboração simultânea entre máquinas: o grupo consolida suas evidências.

## Evidências para a apresentação do grupo

1. Local e elementos IFC escolhidos; decisão a tomar.
2. Restrições e evidências que tornam o pacote executável.
3. Necessidade e janela de fornecimento; comparação justificada.
4. Compromisso e resultado; PPC e causa de desvio.
5. Conclusão: assumir, condicionar ou replanejar; o que foi conferido pela equipe.

Esta prática em grupo é formativa e não avaliativa. O professor demonstra; cada participante opera. ChatGPT para Windows e Codex fazem parte da preparação da oficina conforme o kit da disciplina; o visualizador local em si funciona no navegador.
