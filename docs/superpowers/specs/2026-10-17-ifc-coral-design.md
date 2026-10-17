# IFC Coral — recorte funcional de produção e suprimentos

Fonte: decisões do autor nesta conversa, itens 5.2–5.5 de 17/10 no Academic OS e análise estática M03. Autor autorizou em 17/10 verificar o projeto em C:/dev e seguir o plano funcional. Esta especificação traduz o recorte aprovado em entregas técnicas; não reabre a ementa ou o kit institucional.

## Finalidade e escopo

Responder “Podemos assumir esta concretagem como compromisso?” ligando IFC/4D, pacotes por local/serviço, restrições, necessidade e janela de suprimentos, decisão humana e PPC. Professor demonstra; cada estudante opera. O grupo reúne cinco slides. Este é laboratório formativo, não ERP, ferramenta de dimensionamento estrutural ou autorização de compra.

Base independente em C:/dev/ifc4all-2, derivada de bicalhobim/ifc4all d97294f. C:/dev/ifc4all e seus dois arquivos não rastreados ficam preservados. Nome IFC Coral é provisório, conforme a conversa. Sem publicação, novos contatos externos ou mudanças de permissões nesta execução.

## Comportamento

- Carregar TORRE02 e arquivos IFC do usuário; manter 3D, árvore, propriedades e Gantt. Oferecer o modelo didático incluído para começar sem diálogo de arquivo.
- Identificar modelos/revisões por GlobalId de projeto e hash de arquivo; elementos por modelo e GlobalId; tarefas por elemento e slot de origem, nunca só por nome/localId. Mesma revisão não duplica; revisão alterada sinaliza dependências.
- Dados do caso são explicitamente sintéticos. 12 m³ não são quantitativo extraído do IFC. Datas do cronograma de origem não são evidências de execução.
- Pacotes ligam local, serviço e referências IFC. Necessidades carregam origem, unidade, quantidade, quatro datas/janelas e cobertura elegível. Desconhecido não é zero; saldo mínimo zero; excesso de cobertura destacado, sem dupla alocação. Concreto fresco não é estoque antecipado.
- Suprimentos exibem necessidade, prazo para comprar, promessa e realizado. A/B/C do caso: 570×12+300=7140; 630×12=7560; 550×12=6600. B precisa de confirmação da janela D+3; C carece de comprovação técnica. Nenhuma proposta é compra autorizada.
- Restrições só são removidas com evidência e conferência humana. Prontidão também depende de capacidade e responsável; IA não assume compromisso. Congelar o plano semanal antes de calcular PPC; reprogramar/cancelar não altera denominador original. Sem compromissos, PPC não aplicável.
- Salvar localmente e exportar/reabrir projeto com metadados e modelo opcional, preservando IDs. Validar arquivos importados. Não exportar nem guardar chaves em dados de projeto.
- IA integrada: Gemini e OpenAI, chave individual em memória, modelo escolhido entre modelos acessíveis à conta. Três contextos: restrições, compras e auditoria. Saída é proposta revisável, sem mutação automática e sem contatos externos. Núcleo funciona sem IA.

## Decisões técnicas do implementador

Manter TypeScript/Vite/That Open/Three e versões do lockfile; testes com node:test sem novas dependências de produção. Domínio determinístico separado de renderização e provedores. Assets WASM/worker servidos localmente a partir das dependências existentes para reduzir falha de CDN. Persistência IndexedDB para bytes do IFC e armazenamento local versionado para dados; exportação portátil JSON com verificação de hash.

## Limites de comprovação

Executar os cenários possíveis localmente e registrar evidências. Testes com respostas simuladas validam adaptadores, não comprovam chamadas pagas reais. Sem chaves individuais, validação ao vivo dos dois provedores fica explicitamente pendente. Compra real e gravação dependem da demanda e template do autor; não integram a execução automática deste app.

## Critérios de saída do primeiro recorte

TORRE02 visível, árvore/seleção/Gantt verificáveis, nomes homônimos independentes, reimportação sem duplicação, projeto reaberto com dados preservados, caso de concretagem percorrendo restrições/suprimentos/compromisso/resultado/PPC e capturas reais. Matriz CA-01–14 distingue aprovado, falha e não executado. Crédito a Luiz Sales e origem preservados; licença de distribuição final ainda a formalizar antes de publicar.
