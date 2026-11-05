# QA — análise de dados em lotes e cronograma de 1.000 atividades

05/11/2026. Atualização local, sem commit ou publicação.

## Correções

A análise de metadados enviava toda a seleção em uma chamada: o limite de 80 elementos não assegurava compatibilidade com o limite de tamanho do corpo. Além disso, o painel se recolhia quando a resposta não trazia sugestões. Não foi capturado o pedido original dos 40 elementos do usuário; esses são problemas constatados no código, não diagnóstico comprovado de sua chamada específica.

A seleção agora é dividida em lotes de até 20 elementos e 110 kB UTF-8, preservando propriedades e identidades. Não há mais limite de 80 elementos por ação da interface. Há progresso por lote, cancelamento e conclusão explícita mesmo com zero sugestões. Falha preserva propostas de lotes concluídos sem adotá-las; resposta recebida após cancelamento é descartada. Ações humanas continuam necessárias para adotar e aplicar. “Marcar todos do filtro” separa seleção total da paginação de 40 itens.

Cronograma ampliado para 1.000 atividades e CSV até 10 MB em importação, plano, checkpoint, validação e geração Python. Mantidos 50 vínculos de atividades por elemento; ampliar o total não remove validações de datas, identidade ou preparação. Entrada continua CSV exportado do Excel, não XLSX. Correções IA continuam limitadas a nome/local de planejamento/serviço, não certificação dos atributos IFC.

## Evidências

- **235 testes Node aprovados**, sem falhas ou ignorados; tipos/build e schedule.selfcheck aprovados. Após ajuste textual final, 11 testes direcionados repetidos e build final aprovado.
- **6 testes Python aprovados**, incluindo geração e releitura de 1.000 atividades em 40 elementos.
- Testes específicos: 40 registros com muitas propriedades e caracteres multibyte divididos sem perda; seleção de 1.000 elementos particionada; resposta vazia contabilizada; falha no segundo lote conserva proposta anterior; resposta tardia cancelada não conta como concluída; de-para/validação/recortes de 1.000 atividades; 1.001 atividades rejeitadas claramente.
- Navegador real em instância isolada `127.0.0.1:5180`, com pasta sintética `.cache/qa-escala-20261105`. Somente o seletor de pasta foi injetado pelo mecanismo de QA existente; gravação, leitura, IfcOpenShell e Fragments foram reais.
- Codex real, modelo gpt-6.1-sol do catálogo local: 40 elementos analisados em dois lotes. Resultado final **40/40, zero sugestões**, visível no cabeçalho e no painel aberto. A ausência de sugestões não foi apresentada como certificação.
- CSV de 1.000 atividades normalizado na interface; 1.000/1.000 vínculos reconhecidos pelos GlobalIds. Conferência, preparação, aplicação e salvamento concluídos. Projeto reaberto da pasta, Gantt exibindo até **Serviço 1000**, datas preservadas; console sem erros.
- Pasta salva: 1 modelo, 40 identidades físicas, 1.000 tarefas e hash IFC conferido. [Recibo](evidencias/escala-preparacao-2026-11-05/pasta-salva.json).

[IA: resultado dos 40 elementos](evidencias/escala-preparacao-2026-11-05/coral-ia-40-elementos.jpg) · [Cronograma aplicado](evidencias/escala-preparacao-2026-11-05/coral-cronograma-1000.jpg) · logs de teste preservados localmente.

## Limites do ensaio

O modelo é sintético; o arquivo completo do usuário não foi importado nem editado neste teste. A chamada real de 40 elementos continha metadados pequenos; volumes maiores foram exercitados no teste de particionamento, sem enviar todos os lotes grandes ao provedor. Cotas, acesso ao modelo, conexão e tempo de cada chamada continuam dependências externas. Cada chamada mantém timeout de três minutos, cancelamento e erro visível. Não foi testado o seletor nativo ou outro computador nesta sessão.
