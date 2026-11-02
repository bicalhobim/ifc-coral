# Experiência dos pacotes, suprimentos e linha de balanço

## Diagnóstico e alterações

O Kanban enviava restrições ao painel de produção e abria composição ao clicar em suprimentos. A mesma ação mudava de contexto e a exportação ficava no fim de uma tabela extensa. O gráfico por local repetia alturas para cada serviço e ordenava de cima para baixo.

- Pacotes agora possuem Resumo, Restrições e Suprimentos na mesma área. Retorno ao Kanban explícito. Acesso pelo inspetor da atividade e pelo checklist de produção utiliza esse contexto.
- Aberturas de áreas de gestão usam área ampliada; controles de modelo ficam ocultos enquanto a janela está ampliada. Maximizar/restaurar e encaixes continuam disponíveis.
- Mapa global e mapa do pacote usam a mesma grade, filtros, totais por unidade e ações por linha. Datas: iniciar compra até, emitir pedido até, receber em obra, necessidade em obra. São datas planejadas, não pedidos emitidos.
- Editar linha permite ajustar coeficiente, perdas e prazos com justificativa. Operação centralizada recalcula demandas e invalida a conferência de composição, preservando IFC, catálogo e necessidade em obra. Quantidade e datas do serviço continuam editáveis no pacote. Reservas ou compromissos exigem revisão/liberação conforme regras existentes.
- CSV e JSON baixam diretamente pelo navegador, inclusive sem permissão da pasta. Salvar CSV na pasta continua usando Exportacoes e as verificações de salvamento. Exportações respeitam filtros. CSV usa vírgula decimal, seis casas máximas e proteção contra fórmulas; JSON conserva precisão numérica.
- Previsões macro oferecem Detalhar em pacote; não se altera uma previsão derivada como se já fosse demanda aprovada.
- Linha de balanço: pavimento inferior na base, superior no topo, uma cota por local; tempo horizontal, cor por serviço, início cheio e término tracejado, intervalo sombreado entre linhas. Redimensionamento atualiza escala e espaçamento das datas.

## Referências visuais consultadas

- [Vargas e Moreira — Modelling Line of Balance Schedules with Start-Finish Relationships](https://ricardo-vargas.com/articles/modelling-and-optimizing-schedules-with-line-of-balance-and-start-finish-relationship/), Exhibit 3: imagem examinada no navegador, pavimentos ascendentes e serviços sobre o mesmo eixo de locais.
- [Gráficas lineales: un proceso de significación a partir de su uso en ingeniería](https://www.redalyc.org/journal/5216/521653370003/html/): figura 3 examinada, unidades ascendentes e fluxo diagonal por serviço.

São referências de visualização, não evidência de que o aplicativo calcule produtividade, takt, precedências ou caminho crítico. O gráfico preserva datas IFC e representa envelopes agregados que podem conter interrupções. Ordem física é uma sugestão por nomes reconhecidos (fundação, subsolo, térreo, pavimento, cobertura), não por elevação geométrica; locais não reconhecidos exigem revisão em Ordenar locais, da base ao topo.

## Validação executada

- 184 testes aprovados; typecheck e build aprovados. Aviso existente de bundle grande (~6,25 MB) permanece.
- Novos testes: recálculo de compra/quantidades sem alterar IFC ou catálogo; serialização e reabertura; proteção de reservas e entradas inválidas; CSV sem fórmulas e sem transformar desconhecido em zero; ordem semântica de pavimentos e sobreposição manual.
- Ensaio pelo navegador integrado com QA Integracao 02nov, sem editar Beta.22. Armação: 1.651,89 kg, perdas 0% → 5%, transporte 2 → 3 dias. Demanda resultante 1.734,485 kg, início de compra 28/10 → 27/10; necessidade permaneceu 07/11. Autosave confirmado pela interface. Desfazer restaurou quantidade, datas e composição conferida; autosave novamente confirmado. Reabertura posterior apresentou o estado restaurado.
- Restrições abertas no próprio pacote; evidência/liberação existente preservada. Não foram feitas novas chamadas reais de IA ou novas liberações.
- CSV e JSON baixados e lidos: filtro Somente pacotes produziu quatro demandas, duas conhecidas e duas desconhecidas. CSV PT-BR e JSON numérico conferidos. A opção Salvar CSV na pasta usa o mecanismo existente e não foi repetida nesta rodada.
- Linha de balanço TORRE02 conferida com fundação/subsolos na base e cobertura no topo, cores de serviços e datas legíveis. Janela ampliada e mapa em 700 × 800 conferidos. Viewport restaurado; console sem erros/avisos na consulta final.

## Evidências

- [Mapa de suprimentos](evidencias/ux-suprimentos-2026-11-02/mapa-suprimentos.jpg)
- [Linha de balanço](evidencias/ux-suprimentos-2026-11-02/linha-balanco.jpg)

Alterações locais, ainda sem novo commit/push. O checkpoint 468636f continua sendo a referência anterior. Capturas autênticas do projeto QA; não representam aprovação de planejamento real.
