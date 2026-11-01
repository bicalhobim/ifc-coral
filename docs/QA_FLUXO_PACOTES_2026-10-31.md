# Ensaio de operação — seleção, pacote, suprimentos e PPC

Data de referência: 31/10/2026, America/Sao_Paulo. Ambiente: navegador interno, servidor local em 127.0.0.1:5178. Dados de ensaio identificados com **TESTE QA**; nenhuma compra, entrega ou execução real foi realizada.

## Problema reproduzido e correções

O botão foi acionado com **zero elementos selecionados**. A validação exigia escolher elementos no modelo ou atividades no cronograma, mas a mensagem foi inserida no corpo `.welcome`, cujo alinhamento vertical centralizado produzia conteúdo acima da área visível. Na reprodução, a mensagem estava entre y=39 e y=96 enquanto o corpo começava em y=160.

- Pré-requisito explícito antes de criar: selecionar elementos no 3D ou atividades no 4D. O botão permanece indisponível sem uma seleção compatível e atualiza sem apagar os campos do pacote.
- Avisos num bloco próprio, entre as abas e o corpo rolável, com foco acessível. Conteúdo inicial alinhado ao topo e sem encolhimento dos elementos.
- Criação por seleção preserva um único quantitativo por elemento físico; fases de formas/armação não triplicam o volume. Quantidade desconhecida permanece desconhecida.
- Encontrada e corrigida uma segunda lacuna: pacotes novos de concreto em projetos comuns caíam na comparação antiga sem formulário para cadastrar a primeira proposta. Agora usam composição de recursos e cadastro de propostas. Coberturas históricas continuam acessíveis; os registros informados no projeto comum não são automaticamente marcados como exemplo didático.

## Matriz do ensaio manual desta rodada

| Etapa | Resultado observado |
| --- | --- |
| Entrada e home | Acesso de teste e abertura pela lista de recentes funcionaram. |
| Projeto comum | IFC e pacote de QA isolados dos arquivos do projeto `Teste` do professor. |
| Criação sem seleção | Instrução visível; botão desabilitado. |
| Seleção direta no 3D | Uma laje selecionada; 3,7 m³ declarados no IFC; botão liberado. |
| Criação do pacote | Um pacote, um elemento físico, sem criação de propostas fictícias automáticas. |
| Duplicidade | Segundo pacote para o mesmo elemento recusado; mensagem visível e pacote anterior preservado. |
| Seleção múltipla | Dois objetos selecionados, contador e volume atualizados; limpar voltou a zero. |
| Vistas e propriedades | Vistas superior/isométrica, propriedades e realce do pacote operados. |
| 4D | Abrir, voltar ao início, reproduzir e pausar funcionaram. A simulação avançou de 0 visíveis para 135 visíveis/29 em atividade; fechar o painel funcionou. Datas são planejamento. |
| Definição do pacote | Nome, responsável, prazo, critério e capacidade registrados na interface. |
| Restrições | Remoção sem evidência/conferente recusada; quatro restrições removidas com evidências de ensaio. |
| Reabertura intermediária | Pacote, prazo e restrições recuperados do arquivo salvo. |
| Composição de suprimentos | 3,7 m³ × 1 × 1,05 = 3,885 m³; composição incompleta recusada. |
| Mapa | Um pacote de fornecimento; preparar em 03/11, pedido em 04/11, necessidade em 06/11/2026. Conferência registrada. |
| Propostas | Três registros manuais de teste: pontual, atrasado e sem conferência técnica. Nenhuma consulta externa. |
| Reserva atrasada | Permitida como registro de reserva, mas cobertura elegível continuou zero; semana permaneceu bloqueada. Reserva liberada no ensaio. |
| Reserva sem conferência técnica | Cobertura elegível continuou zero. Reserva liberada no ensaio. |
| Reserva elegível | 3,885 m³ cobertos; saldo zero; pacote pronto para compromisso. |
| Recebimento | 4 m³ contra reserva de 3,885 recusados. Registro de 3,885 recebidos, zero rejeitados, aceito com evidência de ensaio. |
| Semana | Compromisso congelado com responsável e critério; PPC inicial 0%. |
| Realizado e PPC | Conclusão um dia após o prazo manteve 0%; alteração de ensaio para conclusão no prazo resultou em 100%, com um compromisso no denominador. |
| Quantitativo congelado | Campo de quantidade e botão de aplicar novo volume permaneceram desabilitados. |
| IA sem chave | Gemini/OpenAI selecionados; consulta sem chave retorna a orientação correspondente. Nenhuma chamada real autenticada foi testada. |
| Quantificação | Sem seleção mostra instrução. Com seleção mostra concreto 3,7 m³, aço 222 kg como **estimativa**, fôrma pendente e área candidata. Catálogo e conferência abertos; nenhuma taxa ou fôrma foi aprovada tecnicamente no ensaio. |
| Árvore e metadados | Árvore, opções do arquivo e GlobalId consultados. Não foram substituídos ou removidos modelos nesta rodada. |
| Janela 916 × 704 | Aviso entre y=172 e y=224; abas terminavam em y=160. Sem sobreposição. |
| Janela 465 × 704 | Aviso entre y=222,5 e y=274,5; abas terminavam em y=210,5. Sem sobreposição. Override removido após teste. |
| Salvar e exportar | Arquivo principal salvo com um pacote, três propostas, um recurso, uma reserva, um recebimento e um compromisso. Portátil de 8.300.976 bytes gravado em `Exportacoes`. |
| Reabertura final | Pacote e compromisso recuperados da pasta; PPC permaneceu em 100%, com um compromisso. Console da guia de QA sem erros capturados. |

## Evidências e escopo

- [Aviso em 916 px](../artifacts/qa-package-flow-2026-10-31/qa-aviso-916.png).
- [Aviso em 465 px](../artifacts/qa-package-flow-2026-10-31/qa-aviso-465.png).
- [PPC do ensaio](../artifacts/qa-package-flow-2026-10-31/qa-ppc-completo.png).
- [Verificação automatizada](../artifacts/qa-package-flow-2026-10-31/verify.log): **102 testes**, typecheck, selfchecks schedule/gantt/tree e build aprovados. Aviso conhecido de tamanho do bundle permanece.

Pasta de ensaio: `.cache/workspace-qa/QA Pasta 31out`. Cópia de segurança inicial: `.cache/qa-package-baseline.json`. Os dados da sessão original do professor não foram salvos ou alterados pelo ensaio; apenas o erro de seleção vazia foi reproduzido nela. Antes de recarregar essa sessão para receber o JavaScript novo, salvar as alterações pendentes.

Limites: não houve ensaio de credenciais reais de IA, instalações em outra máquina, aprovação de engenharia, e-mail, fornecedores ou pagamentos. A seleção nativa de pasta e o Salvar como foram testados em rodada anterior; nesta rodada, o salvamento usou uma pasta de QA já selecionada. Não há commit ou publicação desta correção.
