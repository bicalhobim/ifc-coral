# IFC Coral — associação IFC × cronograma por código e propriedades

Estado: implementado e validado localmente; evidências e limites em ../QA_ASSOCIACAO_CODIGO_2026-11-05.md. O diagnóstico abaixo registra o estado anterior à execução. Autor da decisão: Lucas Bicalho. Data: 05/11/2026.

## Decisão de arquitetura
Tornar a associação determinística por código o caminho principal. Preservar o pipeline, diagnósticos, tabelas de revisão, associação manual, cancelamento, persistência e aplicação em cópias. IA permanece opcional para explicar pendências e sugerir um de-para, nunca necessária para produzir vínculos por código nem autorizada a inventar chaves ou datas. Não trocar banco, framework ou leitor 3D.

## Evidência atual
- HEAD local consultado: 88d18bc. As preparações IFC/CSV posteriores estão em alterações locais; consultar o histórico não revelou versão commitada anterior desses módulos que já resolva associação genérica por código. Não executar rollback amplo.
- ScheduleRow tem id/name/start/finish/location/service/globalIds, sem campo próprio de código de associação. initialActivities só tenta GlobalId único entre modelos. O fluxo atual não implementa igualdade configurável CSV × propriedade IFC.
- O normalizador conserva Navisworks_User1 em colunas de origem e gera IDs de atividade, mas essa chave ainda não entra no motor de associação. Não desfazer a separação de IDs: o código pode repetir por serviço.
- O inventário Python limita metadados expostos a 40 propriedades escalares por elemento. Não usar essa lista truncada para decidir ausência da chave.
- Diagnóstico somente leitura com IfcOpenShell em ifc_model/TORRE02_ESTRUTURA_4D.ifc e cópia byte a byte do CRONOGRAMA.csv (SHA-256 459750ae0176d4d1054aa79ac4e39a0a26c35bbb448a7aa04d4fb2e6221f60f3): BIM4D_Identificacao.CodigoEAP corresponde exatamente a Navisworks_User1. 58 códigos presentes no modelo, 764 elementos, 174 linhas de atividade correspondentes e 2.292 pares atividade–elemento. Total CSV: 790 linhas, 186 códigos distintos não vazios, 243 linhas sem código. Restam 616 linhas não associadas por esse recorte; não classificá-las automaticamente como erro ou sem 3D.
- Os arquivos de origem em OneDrive / Arquivos Fim do Módulo foram localizados, mas sua leitura foi bloqueada porque o provedor de nuvem não estava em execução. A propriedade foi confirmada na TORRE02 enriquecida local; ainda deve ser verificada nos IFCs originais e outros modelos carregados pelo usuário.
- Contagens de igualdade comprovam cobertura técnica, não aprovação semântica de todos os vínculos.

## Contrato de entrada
Separar quatro conceitos: identidade da atividade, hierarquia/EAP, código de associação e identidade do elemento.

CSV recomendado: id_atividade;atividade;inicio;fim;codigo_vinculo;servico;modelo;tipo_linha;id_pai.
Obrigatórios para atividade 3D por código: ID estável (ou geração assistida persistida), nome, datas válidas e codigo_vinculo. Modelo pode ser informado na linha ou definido no perfil/escopo confirmado. tipo_linha distingue atividade, resumo, marco e sem representação 3D; id_pai é opcional. Não derivar tipo de linha apenas de um código vazio ou datas iguais.

Exemplo ilustrativo compatível com o padrão atual:
- A-101;Fôrmas;2026-11-06;2026-11-07;1.4.3.3;Fôrmas;Torre 02;atividade;
- A-102;Armação;2026-11-08;2026-11-09;1.4.3.3;Armação;Torre 02;atividade;
- A-103;Concretagem;2026-11-10;2026-11-10;1.4.3.3;Concretagem;Torre 02;atividade;
Datas e código do exemplo são apenas ilustração, não substituem o cronograma real.

Aceitar o CSV original mediante perfil: código = Navisworks_User1; serviço = Navisworks_Task_Type; nome = Nome; datas = Início/Término; ID gerado persistido quando não houver ID próprio. Preservar o arquivo bruto, sua codificação, linha de origem e hash. O CSV normalizado atual também deve oferecer origem_Navisworks_User1 e origem_Navisworks_Task_Type no de-para.

Uma regra pertence ao perfil do modelo: coluna codigo_vinculo = propriedade IFC escolhida. Exemplo verificado: BIM4D_Identificacao.CodigoEAP. Outro IFC pode usar outra propriedade, inclusive código CWP, escolhida pelo usuário; não exigir que todos os arquivos sejam editados para adotar o mesmo PSet. Registrar componente PSet/propriedade separadamente, fonte de ocorrência/tipo e política explícita de herança. Uma classificação IFC nativa exige extrator próprio, não se confunde com PSet: fica como extensão se o piloto não a tiver.

Tratar códigos como texto, preservando zeros, pontos e separadores. Padrão: igualdade exata após remoção de espaços nas extremidades, com valor bruto guardado. Outras normalizações devem ser explícitas e pré-visualizadas; não converter numericamente, aproximar nomes ou aplicar prefixos implicitamente.

## Experiência guiada
1. Modelos: analisar conjunto e exibir cobertura de propriedades por modelo. Catálogo completo de caminhos e amostras; extração integral das propriedades selecionadas, independente do limite de exibição e sem enviar todo o IFC ao LLM.
2. Cronograma: normalizar todas as linhas; mapear ID, código, serviço, datas, modelo e tipo de linha separadamente. Mostrar códigos vazios/repetidos sem tratar repetição legítima como erro de ID.
3. Regra de associação: escolher modelo(s), coluna CSV e PSet/propriedade IFC. Mostrar amostras dos dois lados, comparar e salvar o perfil no projeto. Permitir opcionalmente uma segunda igualdade ou filtro de classe/local com combinação AND explícita. Motor restrito de comparações, sem executar expressões ou scripts recebidos de arquivo.
4. Prévia: calcular todo o conjunto deterministicamente e apresentar linhas vinculáveis, sem chave, sem correspondência, com escopo ambíguo, resumos e decisões sem 3D. Cada resultado mostra regra, valor bruto/normalizado, modelo, GlobalIds e quantidade de elementos. Buscar, filtrar, selecionar em lote e localizar no 3D. Nenhuma decisão automática de sem 3D para esconder lacunas.
5. Conferência: adotar somente linhas selecionadas. Manter associações manuais; conflitos e remoções vão para comparação, não sobrescrita silenciosa. Mesma regra no mesmo conjunto deve gerar os mesmos vínculos, sem duplicação.
6. Aplicação: reutilizar transação, cópias, releitura e histórico existentes. Guardar perfil e vínculos no projeto. Não sobrescrever cronograma incorporado em BIM4D_Cronograma nem apagar pacote/compromisso existente. Detectar e apresentar conflito de cronograma; no piloto, preservar bloqueios atuais e permitir prévia sem aplicação nos casos bloqueados. Após salvar/reabrir, manter relações e datas.

## Regras de integridade
- Elemento continua identificado por modelId + GlobalId; código é atributo de agrupamento, não substitui identidade.
- Uma atividade pode abranger vários elementos; um elemento pode participar de vários serviços. Código repetido em fôrmas/armação/concretagem é esperado.
- Código repetido em modelos distintos só abrange ambos se o escopo multi-modelo estiver declarado. Colisões sem escopo resolvido ficam pendentes. Repetição entre elementos do mesmo grupo não é ambiguidade por si só.
- Hierarquia não significa inclusão automática de descendentes. Igualdade é o mínimo; regras por subárvore/prefixo exigem recurso separado, segmentação correta e revisão para não incluir 1.4.10 ao buscar 1.4.1.
- Resumos não geram execução 3D duplicada das atividades-filhas. Linha sem código exige tratamento explícito, sem descarte silencioso.
- Datas são do CSV; datas ausentes não viram hoje. Predecessoras permanecem na origem; não reinterpretar números de linha como novos IDs nem recalcular CPM sem especificação própria.
- Gravar sourceHash, profileVersion, activityId, linha/código de origem e elemento/revisão em cada vínculo; alterações de arquivo/regra exigem revisão de impacto. Edições humanas prevalecem.
- Gantt, linha de balanço, quantificação, pacotes e suprimentos consomem as mesmas relações; não manter cópias paralelas de datas/identidades.

## Execução incremental proposta
A. Preservar estado atual: inventário e backup das alterações não commitadas, sem sobrescrever projetos; commit somente mediante autorização individual. Usar 88d18bc como referência histórica, sem reset.
B. Domínio/persistência: incluir associationCode, sourceRow, modelScope, rowKind e perfil versionado como campos opcionais; ler projetos antigos sem perder vínculos e backups. Gerar template e exemplos de CSV.
C. Extração/motor: catálogo de propriedades, leitura das chaves escolhidas e índice por modelo/propriedade/código. Associação por igualdade com filtros determinísticos. Testar primeiro com TORRE02 e CSV reais.
D. Interface: substituir a ação principal de IA por Associar por código/propriedade; incorporar perfil, prévia, contagens e revisão em lote. Manter IA em seção opcional de apoio ao diagnóstico.
E. Aplicação/reabertura: usar infraestrutura existente e verificar um IFC sem datas e um cronograma com código. Completar teste com dois modelos e coincidência de códigos para validar escopo.

Mínimo da aula: perfil por modelo, igualdade exata por código, CSV original e padronizado, prévia/revisão, salvamento e reabertura. Não incluir agora banco novo, parser novo, motor de classificação generativa, regras arbitrárias ou mais harnesses de IA.

## Aceite obrigatório antes de declarar pronto
- No diagnóstico da TORRE02 de referência: reproduzir 174 linhas e 2.292 pares nos 764 elementos, conferir amostras por serviço/local e não associar automaticamente as 616 linhas restantes.
- Perfil funcionar com outro nome de PSet/propriedade; chave fora das primeiras 40 propriedades ser encontrada; fonte de tipo/ocorrência explícita.
- Multi-modelo com códigos iguais: respeitar escopo e manter identidades; ausência de modelo não resulta em falsa associação.
- Três serviços no mesmo código mantêm três atividades e respectivas datas; nenhuma quantidade/execução duplicada por resumo.
- Códigos com zeros à esquerda e hierarquias semelhantes não colidem. Chaves vazias, ambíguas ou ausentes aparecem como pendência.
- CSV de 1.000 linhas normaliza e associa sem IA; nenhuma limitação de página trunca o processamento.
- Repetir regra é idempotente; editar/adotar parcial, cancelar e restaurar preservam decisões humanas.
- Salvar, reabrir, exportar cópia e reler; preservar geometria, GlobalIds e arquivos originais; comparar tarefas 4D resultantes às atividades aprovadas.
- Executar regressão, tipos, build, selfcheck e ensaio no navegador com os arquivos reais disponíveis. Testes sintéticos não substituem a validação do exercício real.

## Execução local concluída — 05/11/2026

Implementação e ensaios registrados em `../QA_ASSOCIACAO_CODIGO_2026-11-05.md`. Resultado real 174/2292/764, 616 linhas pendentes. Prévia no navegador com TORRE02; aplicação/reabertura/exportação em dois IFCs sintéticos independentes. 259 testes Node, seis Python, tipos/build/selfcheck aprovados. Restrições de seletor nativo e IFCs originais OneDrive permanecem explicitadas no QA. Sem commit/push.
