# QA — geração de restrições por LLM · 01/11/2026

**Estado:** implementação local, sem commit/publicação nesta rodada. Base anterior `f344e47` preservada no Git. Nenhuma dependência instalada/alterada e nenhum arquivo institucional modificado.

## Evidências executadas

- `npm run verify` / `node scripts/verify.mjs`: **134 testes, tipos, schedule/gantt/tree selfchecks e build aprovados**. Log `.cache/constraint-ai-verify.log`. Permanece aviso conhecido de bundle grande.
- Novos testes cobrem contexto isolado/sem bytes de imagens, quantidade desconhecida, regras de coverageKnown, ofertas candidatas versus reservas, referências e schema, duplicatas, aplicação atômica, conferente, persistência, contexto alterado inclusive após o elemento 500 e compromisso congelado.
- Protocolos OpenAI Responses com JSON Schema e Gemini generateContent com responseJsonSchema testados por transportes controlados, incluindo ausência de chave, resposta incompleta/inválida e HTTP sem ecoar segredos.
- Codex: execução sem shell de sistema, argumentos de sandbox/configuração/JSON Schema, cancelamento, timeout e mensagens de modelo/login testados com processo controlado. Esses testes não são chamados de LLM real.
- **Chamadas reais Codex** com `gpt-6.1-sol`: caso sintético de 12 m³ via serviço; pacote de seis lajes/34,707 m³ pela interface; pacote de 31 elementos/70,578 m³ da cópia QA pela interface. Respostas estruturadas passaram pela validação; geração não modificou o projeto.
- A instalação npm antiga (0.130.0) não compreendia o catálogo atual e recusava modelos. Corrigida a descoberta para priorizar o executável atual do Codex Desktop (0.166.0-alpha.5.1 nesta máquina), sem alterar o CLI global/configuração pessoal. Nome do modelo pode ser digitado; catálogo local preenche as opções quando existente.
- Operação real no navegador interno: aba IA e checklist, configuração de motor/modelo, OpenAI/Gemini sem chave com erro legível, geração Codex, conferente obrigatório, seleção de uma proposta, edição e incorporação. A nova condição permaneceu pendente, sem evidência/conferente de liberação preenchidos.
- Salvar em pasta real já cadastrada e reabrir pela interface: cópia **`.cache/workspace-qa/QA Pasta 31out - copia`**. Cinco condições anteriores preservadas integralmente (incluindo evidências e dois atendimentos); uma condição acrescentada, total seis. `aiOrigin` conserva provedor, modelo, datas e conferente da proposta. Semana e realizados preservados. Checagem independente em `.cache/constraint-ai/persistence-check.json`.
- Corrigida CSS de campos `hidden`: chave de API não aparece no modo Codex; conferente de propostas só aparece após resultado. Modal mantém feedback próprio, acima do conteúdo, sem ficar atrás das abas de produção.
- Na revisão das respostas reais, explicitada a diferença entre conferência de estoque/pedidos, completude do escopo, quantitativos IFC conferidos e execução registrada; instruções também proíbem estoque antecipado de concreto fresco e taxas normativas inventadas.

Capturas: `artifacts/qa-constraint-ai/checklist-reaberto.jpg`, `propostas-codex-corrigido.jpg` e `assistente-pronto.jpg`. Na inspeção final, corrigido também o max-width herdado de dialog e a quebra das listas; cabeçalho e feedback agora compartilham um contêiner fixo. Conferência em 465×704: largura interna 420 px = scrollWidth 420 px, sobreposição cabeçalho/feedback 0 px. Tamanho normal restaurado. Dados, prints e logs de QA ficam fora do Git.

## Revisão orientativa por categoria

- Corrigida a interpretação de evitar duplicatas: linhas genéricas pendentes não impedem sugestões específicas de mão de obra, materiais, equipamentos ou frente. Acrescentada categoria Ambiente e segurança, preservando as cinco condições-padrão e os projetos existentes.
- Validação de cobertura exige propostas em todas as áreas ainda não atendidas integralmente. Categorias atendidas por texto ou print são respeitadas; liberação parcial por elementos não é ampliada para todo o pacote.
- Texto limitado e apresentação compacta: condição, ação e evidência visíveis; edição, justificativa e fatos/lacunas recolhidos.
- Chamada real do Codex via navegador, em nova cópia TORRE02/34,707 m³: oito propostas, cobrindo seis áreas. Incluiu equipe de lançamento/adensamento/acabamento, equipamentos, janela do concreto e iluminação/circulação/proteções. Edição e incorporação de uma proposta de ambiente verificadas; condição permaneceu pendente, sem alterar projetos do professor.
- Interface: oito cartões, seis cabeçalhos de categoria, contexto recolhido; largura interna e scrollWidth iguais a 883 px. Capturas `artifacts/qa-constraint-ai/orientacoes-categorias.jpg` e `orientacoes-ambiente.jpg`.
- Novos testes cobrem categorias omitidas, condição genérica pendente, atendimento total/parcial, evidência só por imagem e limites de síntese. Fechamento: **139 testes, tipos, três selfchecks e build aprovados**, log `.cache/constraint-coverage-verify.log`. Sem novo commit/push.

## Limites

- OpenAI/Gemini não tiveram chamada paga autenticada: nenhuma chave real foi fornecida para esta rodada. Foram verificados protocolos e estados de interface; validar cada conta/modelo ao usar.
- Instalação em outro computador não ensaiada. A consulta Codex exige servidor Node local e executável oficial autenticado, com acesso ao modelo. Catálogo local pode estar desatualizado.
- Escolha de uma nova pasta pelo seletor nativo não integra o aceite desta funcionalidade: no navegador de QA a janela do Windows não ficou acessível à automação. Persistência foi validada na pasta própria de QA já cadastrada, não num projeto do professor.
- Não foi feita chamada de visão para os prints; somente sua contagem/contexto textual entra na análise. Schema e referências válidas não certificam conteúdo semântico ou prontidão.
- Não há fine-tuning. O comportamento usa instruções especializadas e contexto do pacote. Não substitui responsabilidade técnica, aceite de campo, suprimentos ou programação da equipe.
- Compra externa, pagamento, liberação automática e aprovação de compromissos permanecem fora da função. Nenhum contato externo foi feito além das inferências LLM de QA.
