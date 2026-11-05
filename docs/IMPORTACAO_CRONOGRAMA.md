# Preparação 4D — vários IFCs e um cronograma

Implementação local de 05/11/2026. O botão **Preparar IFC + cronograma** abre a central por etapas. [Resultados e limites do ensaio](QA_PIPELINE_FEDERADO_2026-11-05.md).

## Antes de começar

Crie e salve o projeto em sua própria pasta e importe os modelos. Use uma instância do servidor e uma sessão de edição por projeto. O assistente não precisa de IA para extrair, corrigir manualmente, associar e preparar as cópias.

Recorte desta entrega: 1–20 modelos IFC STEP IFC2X3/IFC4, até 100 MB por arquivo original; até 1.000 atividades por preparação, 50 atividades por elemento e CSV de até 10 MB. O parser carrega um IFC inteiro por vez: não é streaming nem suporte comprovado a 20 modelos de 100 MB. Instalações e proxies com representação entram no inventário; a compatibilidade efetiva depende de o visualizador conseguir reler sua geometria. Modelos com pacotes existentes ou cronograma externo ao assistente ficam bloqueados para evitar alterações sem análise de impacto.

Python/IfcOpenShell é necessário no servidor local. Reutiliza-se o ambiente da quantificação. Preparação de outro checkout, a partir da raiz:

```powershell
python -m venv .cache/ifc-quantification-venv
.\.cache\ifc-quantification-venv\Scripts\python.exe -m pip install --only-binary=:all: ifcopenshell==0.9.0.post1
cd viewer
npm run dev
```

Não execute `npm ci` na junction de dependências desta instalação. Instalação e seletor nativo em outro computador ainda exigem ensaio.

## Percurso do usuário

1. **Modelos.** Marque os arquivos e use **Analisar pendentes**. Confira esquema, tamanho, unidade, quantidade de elementos, ausências e situação por modelo. Reanalise quando necessário. O acompanhamento registra etapa e horário; operações demoradas podem ser canceladas antes da aplicação.
2. **Dados e correções.** Filtre por modelo, classe e local; agrupe o resumo e consulte a origem dos campos. Edite nome, local de planejamento e serviço. O nome altera `Name` na cópia; local/serviço são gravados em `Coral_Preparacao`, sem mover a contenção espacial. O original, a proposta e a identidade são preservados no plano. Para desfazer, volte ao valor original ou use a revisão. O inventário mostra até 40 propriedades escalares por elemento; não é um explorador completo do esquema IFC.
3. **Cronograma.** Carregue o CSV exportado do Excel: a codificação UTF-8 ou Windows-1252 é detectada automaticamente e pode ser ajustada. Confira o de-para das colunas. Atividade, início e término são obrigatórios; ID é opcional. Sem identificador único, o sistema gera IDs por registro, preservando os códigos originais. Navisworks_User1 é tratado como código de associação, não como ID único da atividade. Datas aceitas: DD/MM/AAAA, AAAA-MM-DD e DD/MM/AA, inclusive com dia da semana abreviado (ex.: `Ter 01/10/24`, `Sáb 26/10/24`). Anos abreviados representam 2000–2099; o rótulo do dia da semana é ignorado e a data numérica é validada; números seriais do Excel e datas inexistentes são rejeitados. Não há leitura XLSX. Confira as linhas normalizadas; datas não são inventadas. IDs vazios, inválidos ou repetidos são substituídos com relatório visível. Baixar CSV normalizado e Baixar relatório de conversão preservam todas as colunas de origem, incluindo predecessoras e tipos Navisworks. Nenhuma linha-resumo é descartada. IDs gerados dependem da ordem dos registros; mantenha o CSV normalizado para reuso e revise associações se reordenar ou substituir a origem.
4. **Associações.** Escolha uma atividade, filtre os elementos e adicione os marcados de um ou vários modelos. A seleção feita no visualizador também pode ser usada. Cada vínculo conserva **modelId + GlobalId**: um GUID repetido em dois modelos não é associado automaticamente. Remova vínculos individualmente ou limpe a atividade. Atividades administrativas podem ficar **Sem representação 3D**; itens fora do escopo podem ficar **Fora deste recorte**. Ambos exigem justificativa e ficam no manifesto, sem gerar elementos fictícios.
5. **Revisão.** Confira datas, modelos, vínculos e correções, informe o conferente e marque a confirmação. Reprocessar um modelo anteriormente preparado substitui seu `Coral_CronogramaCSV` pelo recorte aprovado; inclua todas as atividades a manter. A tela avisa a quantidade de vínculos anteriores. Correções isoladas não podem apagar um cronograma existente.
6. **Preparar e aplicar.** Gere as cópias. Cada resultado é relido pelo IfcOpenShell. Só depois use **Aplicar revisão conferida**: o visualizador valida o conjunto antes da gravação e ativação. Se o segundo modelo falhar, nenhum modelo é ativado parcialmente. Falhas antes de gravar preservam a revisão ativa. Se a revisão tiver sido gravada mas uma etapa posterior falhar, aparece aviso para reabrir a pasta, sem fingir rollback do que já foi salvo.

Depois, feche a central, abra **Planejamento 4D**, confira as tarefas e reabra o projeto pela pasta para verificar a continuidade.

## IA opcional e controle humano

Abra **Propor correções com IA** ou **Propor vínculos com IA no recorte filtrado**. Use **Verificar Codex** e o modelo disponível na sua conta. O Codex CLI local faz inferência remota; não usa esta conversa aberta. Envia apenas o recorte de metadados, consome a cota da conta e não recebe ferramentas de edição.

Correções: selecione os elementos marcados ou use Marcar todos do filtro. A seleção é dividida automaticamente em lotes de até 20 elementos e 110 kB de metadados UTF-8, somente nome/local/serviço com evidência. Os 40 itens por página não limitam a análise. Progresso e resultado permanecem visíveis, inclusive quando não há sugestões; falha ou cancelamento preserva propostas dos lotes já concluídos sem aplicá-las. Elementos com correções já adotadas são excluídos de novas propostas. Vínculos: escolha explicitamente Somente elementos marcados ou Todos os elementos do filtro. Lotes de 80 candidatos, até 800 candidatos por ação. Identidades e respostas são validadas; datas não são geradas pela IA. Aceitar a proposta é uma ação explícita; a aplicação continua exigindo conferência do conjunto.

As sugestões aparecem em tabela, inicialmente desmarcadas, com busca e seleção por página ou filtro. Confira os valores original/proposto, edite a proposta de correção se necessário e use Adotar selecionadas ou Descartar selecionadas. A contagem inclui marcações fora do filtro. Durante a geração você pode selecionar propostas; adoção/descarte fica disponível ao concluir ou cancelar. Cancelar operação pede confirmação de cancelamento ao servidor e conserva os lotes recebidos. Uma nova análise substitui propostas pendentes, preservando ajustes adotados. As correções adotadas podem ser desfeitas na etapa Revisão. Propostas pendentes não integram o checkpoint; decisões adotadas integram.

O provedor desta central é Codex. APIs de outros provedores existentes nas restrições não estão automaticamente integradas aqui. OpenCode, Hermes e Claude Code seguem no roadmap.

## Retomada e persistência

O checkpoint do navegador conserva decisões, CSV, correções e eventos. **Exportar sessão JSON** permite transportá-los; não inclui modelos nem credenciais. **Retomar checkpoint local** ou importar a sessão exige os mesmos modelos/revisões e nova análise antes da aplicação. A conferência não é reaproveitada silenciosamente.

A pasta salva usa formato `ifc-coral-folder`, versão 2:

- `IFC-Coral.projeto.json`: estado do projeto e referências aos IFCs, sem duplicar base64.
- `Modelos/<sha256>.ifc`: modelos imutáveis identificados por conteúdo; os hashes são conferidos ao salvar e reabrir.
- `Historico/`: versões do projeto que continuam referenciando os respectivos modelos.
- `Exportacoes/`: CSV original e normalizado, manifesto da operação e cópias dos originais.

Projetos v1 continuam legíveis; o primeiro salvamento v2 preserva backup da revisão anterior. Transfira **a pasta completa**, não somente o JSON. O exportador portátil antigo continua com limite de 50 milhões de caracteres; não substitui a pasta em projetos grandes. Os CSVs arquivados são evidências da entrada e do de-para, sem alterar seu conteúdo textual.

O manifesto guarda fonte, revisão, modelo, GlobalId, valor original/proposto, decisões sem 3D, conferente e eventos. As tarefas usam `CSV:<id externo>`. Nenhuma transformação desta central altera classe, geometria ou GlobalId. Quantidades desconhecidas permanecem pendentes. Cronograma representa planejamento, não execução.

## Limites e próximos incrementos

Parquet, IDS/MVD, comparação geométrica geral, edição arbitrária de propriedades, de-para de quantitativos/fórmulas e migração de modelos com pacotes comprometidos não integram esta entrega. Não há certificação IFC/IDS nem interoperabilidade universal. A aplicação mantém JSON como estrutura intermediária e utiliza a API já instalada do IfcOpenShell para editar PSets.

## Associação por código — fluxo principal (05/11/2026)

Na etapa 3, mapeie separadamente ID da atividade, código de vínculo, serviço, modelo, tipo de linha, ID pai, EAP e predecessoras. O modelo CSV recomendado é `id_atividade;atividade;inicio;fim;codigo_vinculo;servico;modelo;tipo_linha;id_pai`. Navisworks original e a conversão com colunas `origem_*` são aceitos pelo de-para. IDs gerados devem ser guardados pelo CSV normalizado; códigos repetidos por serviço são esperados.

Na etapa 4, selecione explicitamente cada modelo no perfil, confira seu PSet/propriedade e escolha a política de herança. Compare amostras e calcule a prévia. Códigos são texto: apenas espaços externos são removidos; zeros e pontos permanecem. Filtros opcionais de classe/local usam AND explícito. A coluna Modelo resolve IDs de modelos do escopo declarado (mostrados na tela); um valor não resolvido fica pendente. Sem essa coluna, o escopo é o conjunto de modelos marcado no perfil.

Use busca/filtros, marque correspondências, confira modelos/quantidades e adote somente as linhas desejadas. Resumos, códigos vazios e ausência de correspondência continuam visíveis. Decisões sem 3D ou fora do recorte exigem justificativa humana; podem ser feitas em lote. “Localizar no 3D” destaca os elementos e oferece “Retomar conferência 4D”. A IA é ajuda opcional e não fornece datas.

Mudança de regra exige nova prévia. A adoção normal conserva vínculos existentes; diferenças em vínculos gerados exigem “Confirmar substituição”. Edições/remoções manuais prevalecem. Na reimportação, linhas alteradas exigem confirmação de dados e linhas removidas continuam pendentes até exclusão explícita. Reanalise revisões reabertas e atualize explicitamente as revisões do perfil antes de reprocessar.

Etapas 5–6 mantêm conferente, aprovação, cópias, releitura e ativação transacional. Um modelo sem novas atividades pode ter seu cronograma Coral removido somente no plano conferido, com original no histórico; cronogramas externos permanecem bloqueados. Perfil e proveniência ficam no projeto e nos manifestos. As evidências do ensaio com arquivos reais permanecem locais.

## Pacotes com datas do cronograma

Ao criar pacotes por serviço, confira os períodos já preenchidos em cada serviço e suas atividades de origem. Alterar uma data registra decisão humana; alternar serviços não apaga essa edição. Para múltiplas fases do mesmo elemento, escolha a atividade ou confirme uma janela composta existente. Só informe datas que não estiverem disponíveis. Previsão herdada não equivale a compromisso semanal nem libera condições. [QA de datas e limites](QA_DATAS_PACOTES_2026-11-05.md).
