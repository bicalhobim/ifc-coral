# QA — cancelamento e revisão das sugestões IFC — 05/11/2026

## Problema e correção
O serviço usava um booleano compartilhado; sua liberação vinha depois da remoção de arquivos temporários. Falha nessa remoção podia deixar o serviço ocupado. O cliente interrompia fetch sem um comando identificado de cancelamento. Não foi recuperado um log da falha original do usuário; o caminho de falha foi reproduzido em teste.

Agora cada pedido tem identificador próprio e uma operação cancelável no servidor. Cancelamento explícito e desconexão liberam o espaço de execução. Identificadores cancelados ficam retidos por cinco minutos para cobrir cancelamento que chega antes do pedido. O término tardio não libera outra operação e não entrega resultado cancelado. A limpeza temporária tem tentativas limitadas e não mantém o bloqueio se falhar. O cliente aguarda a resposta do cancelamento explícito antes de liberar seus controles. Ferramentas do agente continuam desativadas.

## Revisão das propostas
Tabela com modelo/elemento, campo, original e proposta; busca, páginas de 40, seleção de página/filtro, desmarcação e contagem inclusive fora do filtro. Nada selecionado automaticamente. Editar proposta de metadados antes da adoção; adotar ou descartar apenas selecionadas. Adoção de correções valida o conjunto antes de trocar o estado e recusa substituir ajustes adotados. As correções podem ser desfeitas na etapa Revisão. Vínculos têm a mesma seleção em lote; escopo da análise agora distingue marcados de todos do filtro. Durante a geração pode-se selecionar propostas concluídas; adoção/descarte aguarda conclusão ou cancelamento.

## Validação
- 244 testes aprovados; tipos, build e schedule.selfcheck aprovados (aviso preexistente de bundle grande).
- Novos testes: cancelar/iniciar novamente, resposta tardia, cancelamento anterior à chegada do pedido, desconexão e falha EPERM na limpeza. Adoção parcial, integridade atômica, proteção de edição humana e filtragem.
- Navegador integrado em servidor QA 5182, componente real openScheduleImport e backend real ScheduleLinkAnalyzer, IFC sintético real processado por IfcOpenShell. Executor de IA controlado para tornar geração/cancelamento reproduzíveis; não é avaliação da qualidade das respostas de um LLM real.
- Cancelamento seguido de nova análise: 40 elementos, dois lotes e 40 sugestões retornadas.
- Marcar 40, limpar seleção, editar uma proposta e adotar apenas duas: duas correções adotadas e 38 pendentes. Descartar uma: 37 pendentes, correções adotadas preservadas.
- Busca e marcação/desmarcação por filtro operadas.
- Vínculos: cinco sugestões controladas; adoção de duas mantém dois vínculos e três sugestões pendentes, com seleção individual disponível.
- Capturas na pasta evidencias/sugestoes-ifc-2026-11-05.

## Limites
Projeto e IFCs do usuário preservados. Este ensaio não aplicou cópias aos modelos do usuário nem avaliou uma nova inferência remota real. Checkpoint continua guardando decisões adotadas; propostas pendentes são da sessão. Alterações locais, sem commit nem publicação.
