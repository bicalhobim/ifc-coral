# Proposta — catálogo de serviços e integração com suprimentos

Data: 01/11/2026. Estado: proposta para discussão, sem implementação do novo fluxo.
Checkpoint publicado antes desta proposta: `c6eb4fc1b774f3615215a29d32603fe1c706d834`, em `origin/main`.

## 1. O mapa como funciona hoje

Na aba Suprimentos, o mapa é uma prévia global das composições de recursos registradas no projeto. Não nasce diretamente dos elementos IFC ou apenas da existência de um pacote.

O caminho atual é: pacote com quantidade → composição e especificação do recurso → mapa. Cada pacote aceita uma composição de recurso; as relações são fixas: concretagem/concreto, armação/aço e fôrmas/painéis. O recurso herda a unidade do serviço. Cadastro de nome livre não amplia essas regras.

Demanda = quantidade de serviço × coeficiente × (1 + perdas/100). Agrupamento por recurso, especificação exata, unidade, local e, para consumíveis, data de necessidade. Consumíveis são somados nesses grupos. Para reutilizáveis, calcula-se a maior necessidade simultânea nas janelas de ocupação, sem somar todos os ciclos como compra nova.

O mapa mostra demanda, saldo a cobrir, datas de preparação/pedido/recebimento/necessidade, ocupação quando aplicável, promessas e bloqueios. Saldo considera reservas elegíveis; uma proposta cadastrada sem reserva não é cobertura. Se a cobertura ainda não foi conferida, o saldo permanece indeterminado.

Datas atuais: recebimento coincide com necessidade; pedido = necessidade menos prazo de fornecimento; iniciar compra = pedido menos preparação. Dias corridos, sem feriados. Exemplo hipotético: necessidade em 20/11, fornecimento 3 dias e preparação 2 dias → pedido 17/11, início 15/11, receber 20/11.

O usuário pode confirmar uma versão com conferente/evidência quando não há bloqueios e exportar JSON. Alterações posteriores tornam a versão anterior desatualizada. Confirmação não emite requisição/pedido nem contata fornecedor. Há caminho legado do caso didático de concreto com cobertura própria; ele não alimenta automaticamente o mapa de recursos sem composição. Isso explica um mapa vazio mesmo quando há um pacote de concreto na tela.

## 2. Racional proposto

Elementos IFC + local → serviços a executar → quantificação por serviço → pacotes de produção → composição de insumos → demandas datadas → mapa de suprimentos → cotações, decisão, reservas e recebimentos.

- **Serviço:** o trabalho medido, como montagem de fôrmas em m².
- **Insumo/recurso:** o que esse trabalho consome ou ocupa, como painéis, desmoldante ou equipamento.
- **Pacote de produção:** um serviço delimitado por local, elementos, quantidade e janela de execução.
- **Pacote de fornecimento:** agrupamento de demandas compatíveis para aquisição/contratação. Preserva a destinação aos pacotes de produção.

Somar serviços só é permitido quando serviço, unidade e critério de medição são compatíveis e não há repetição de elementos. Selecionar vários serviços cria pacotes distintos ligados à mesma frente; não soma kg, m² e m³.

## 3. Catálogos editáveis

### Serviços

Código estável, nome, unidade de execução, descrição, elementos elegíveis, método de medição, parâmetros, critério de conclusão e composições padrão. Começar com os três serviços existentes; permitir duplicar, editar, desativar e cadastrar novos. Serviço novo pode usar quantidade manual conferida; um nome novo não cria um método geométrico novo automaticamente.

### Insumos e composições

Código e especificação do insumo, unidade própria, consumo ou reutilização, coeficiente com unidade explícita, perdas aplicáveis, prazos e ciclo. Um serviço pode ter vários insumos. Conversão entre unidade do serviço e do insumo exige coeficiente explícito e fonte; não inferir unidade pelo nome do serviço.

Exemplo de estrutura, sem coeficientes de engenharia pré-aprovados: montagem de fôrmas em m² → painéis em m², desmoldante em L e equipamento em h. Ocupação/reutilização é configurada por insumo, em vez de uma regra fixa baseada na unidade m².

Catálogo-base acompanha o aplicativo; cada projeto recebe sua cópia editável. Pacotes guardam versão/origem das definições adotadas. Mudança de catálogo exige prévia de impacto e aplicação explícita, preservando projetos antigos, reservas, histórico e compromissos congelados.

## 4. Interface proposta

1. Selecionar elementos e clicar **Criar pacote**.
2. **Escolher serviços:** cartões com opções sugeridas, possibilidade de marcar mais de um, buscar no catálogo ou **Cadastrar serviço**. Sugestão depende dos dados e é confirmada pelo usuário.
3. **Conferir quantificação:** quantidade/unidade por serviço, método, elementos atendidos, origem e pendências. Para fôrmas, configuração de faces e condição executiva; relatório incompatível requer recálculo ou levantamento manual. Permitir rascunho com quantidade desconhecida e bloqueios explícitos.
4. **Preparar insumos:** lista editável de composições, coeficientes e unidades; gerar prévia de demandas, exigir conferência e não duplicar linhas a cada clique.
5. **Mapa de suprimentos:** tabela com insumo/especificação, unidade, demanda, cobertura, saldo, pacote/local, necessidade, início da compra, pedido previsto, ocupação e situação. Filtros e expansão mostram de onde veio cada quantidade. Distinguir pacotes sem composição, demanda incompleta e demandas prontas.

## 5. Ordem de implementação sugerida

1. Catálogos e persistência compatível: IDs/versões, serviços livres, unidades e conversões explícitas; leitura dos arquivos atuais preservada.
2. Unificar a criação de pacotes: seleção de um ou vários serviços, origem da quantificação e rascunhos pendentes. Remover a suposição automática de concretagem do atalho principal.
3. Composições com vários insumos: unidades independentes, prévia, perdas, janelas e reutilização por recurso. Adaptar reservas/recebimentos para unidades do insumo, preservando o quantitativo de execução.
4. Mapa consolidado com tabela e rastreabilidade: cobertura por insumo, revisão de datas, agrupamento compatível e exportação tabular. Unificar o caminho legado por migração explícita, sem perder históricos.

IA pode sugerir serviços/composições com fonte e premissas; usuário revisa. Contato com fornecedores, negociação, e-mail e pagamentos não integram esta atualização proposta.

## 6. Critérios de verificação

- Mesma seleção produz pacotes separados de concreto, aço e fôrmas com unidades corretas e sem duplicidade por serviço.
- Novo serviço com medição manual pode ser criado, salvo e reaberto sem cair em regras fixas de concreto/aço/painéis.
- Serviço em m² gera demanda em L ou h apenas com coeficiente dimensional explícito; alterar um insumo não altera a unidade do serviço.
- Composição com três insumos mantém três demandas rastreáveis, sem sobrescrita ou duplicação.
- Sem quantidade ou especificação suficiente, mapa mostra pendência e não uma compra calculada como zero.
- Reutilização calcula capacidade simultânea; consumíveis são somados em grupos compatíveis; ofertas sem reserva não abatem saldo.
- Reprogramação, catálogo e quantitativos alterados pedem revisão sem reescrever compromissos/recebimentos históricos.
- Testes de migração, persistência, tipos/build e ensaio real no navegador com cópia de QA, incluindo suprimentos com unidades diferentes.
