# Verificação do primeiro recorte · 17/10/2026

Estado: **laboratório local funcional**. Não é a declaração de conclusão de todos os RF/CA do documento 5.4. O núcleo foi exercitado com TORRE02 real e dados de produção/suprimentos sintéticos. Nenhuma mensagem externa, pedido ou pagamento foi realizado.

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

Testes de domínio/integração Node: **25** após o fechamento. Typecheck, três selfchecks e build de produção devem acompanhar a revisão registrada no Git. O build avisa sobre bundle grande (engine BIM); esse aviso não é erro de compilação e a otimização de carregamento permanece pendente.

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
