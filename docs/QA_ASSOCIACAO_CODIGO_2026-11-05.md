# QA — associação determinística IFC × CSV — 05/11/2026

> Registro histórico da rodada de implementação. Referências a “sem commit/push” descrevem aquele momento. As fontes foram depois registradas em `8564d9a`; este recibo público conserva os resultados e limites. Recortes do CSV privado permanecem locais.

Implementação local no checkout existente `C:/dev/ifc4all-2`, base histórica `88d18bc`, sem commit/push. Checkpoint anterior às edições em `.cache/deterministic-checkpoint-20261105` (fontes afetadas e diff binário de todos os arquivos já rastreados). Alterações locais anteriores foram preservadas; dependências compartilhadas e README publicado não foram modificados.

## Resultado

A etapa Associações tem como primeira ação **Associar por código / propriedade IFC**. Seleção explícita dos modelos, coluna CSV separada do ID, PSet/propriedade por modelo, revisão de perfil e herança ocorrência/tipo. Igualdade textual exata, somente trim externo, com filtros opcionais AND de classe/local. O motor também aceita segunda igualdade restrita em perfis; não executa expressões. IA permanece em área opcional, sem gerar datas.

A extração mantém todas as propriedades escalares e sua origem ocorrência/tipo, sem o corte de 40 campos. A prévia exibe contagens, amostras, pendências, filtros, seleção em lote e localização física por `modelId + GlobalId`. Códigos repetidos em serviços diferentes não viram IDs. Resumos não recebem execução 3D implícita.

Perfil, hash de origem, linha, código, IDs, regras, revisão e vínculos ficam no plano e em `Project.schedulePreparation`, dentro do JSON v2 existente, além dos manifestos de exportação. Campos opcionais mantêm projetos antigos legíveis. CSV carregado como arquivo conserva seus bytes para arquivo de origem; entrada por texto recebe hash UTF-8 da entrada textual. Predecessoras permanecem dados de origem; não há cálculo de CPM.

Reprocessamento preserva decisões manuais, inclusive remoções, e exige ação explícita para substituir vínculos gerados que mudaram ou desapareceram. Mudança de perfil invalida evidência antiga. Reimportação conserva decisões por ID, sinaliza linhas alteradas e mantém removidas pendentes até decisão humana. IDs gerados devem ser transportados no CSV normalizado; reordenações do CSV bruto exigem revisão das diferenças. Se um modelo perder todas as atividades, a remoção do seu cronograma Coral entra explicitamente no plano e nas cópias, sem deixar tarefas antigas ativas. Pacotes continuam bloqueando migração. Cronogramas externos são detectados na inspeção e bloqueados na aplicação; a prévia continua disponível.

## Arquivos reais

- CSV: `.cache/cronograma-real-20261105/CRONOGRAMA_ORIGINAL.csv`, Windows-1252, 790 registros. SHA-256 `459750ae0176d4d1054aa79ac4e39a0a26c35bbb448a7aa04d4fb2e6221f60f3`.
- IFC: `ifc_model/TORRE02_ESTRUTURA_4D.ifc`, SHA-256 `885c3b3ace554f9e3091d611645cccac875a583241d5971c57703bb4a36030dc`.
- `Navisworks_User1 == BIM4D_Identificacao.CodigoEAP`: **174 atividades, 2.292 pares, 764 elementos**, 58 códigos no modelo. CSV: 186 códigos distintos não vazios, 243 linhas sem código; **616 linhas continuam pendentes**.
- Reproduzido por teste Node/IfcOpenShell e pela interface real com cópia independente da TORRE02. Nenhuma aplicação do CSV foi feita à TORRE02 real; o cronograma incorporado foi preservado. Hashes dos arquivos originais reconferidos.
- [Contagens agregadas](evidencias/associacao-codigo-2026-11-05/contagens-agregadas.json). Amostras com linhas, datas e GlobalIds e a captura da prévia real foram preservadas localmente, fora da publicação.

A contagem demonstra correspondência técnica. Não representa aprovação semântica das atividades, locais, serviços ou cronograma do exercício.

## Navegador e persistência efetiva

Aplicativo real em instância independente `127.0.0.1:5194`, sem recarga automática. Primeira tentativa em 5193 foi interrompida pelas reinicializações do Vite durante edições; não foi usada como prova de conclusão. Nenhuma aba do projeto do usuário em 5178 foi operada/recarregada pelo agente. Como 5178 é uma instância de desenvolvimento do mesmo checkout, alterações de fontes podem ser detectadas pelo próprio Vite; não se afirma congelamento técnico dessa instância.

O servidor de QA usou o `pickFolder` já existente como ponto de teste, com registro isolado em `.cache/deterministic-qa-registry.json`, limitado às pastas descartáveis de QA. Isso não valida o seletor nativo Windows.

1. Cópia independente da TORRE02 aberta pelo aplicativo, inventário real de 764 elementos, CSV real inserido pela área de texto e normalizado em 790 registros. Prévia exata 174/2292/764/616 conferida visualmente. O upload por extensão foi bloqueado por ausência de acesso a URLs de arquivo; a permissão não foi alterada. Portanto o transporte de bytes Windows-1252 foi validado automaticamente; o ensaio visual usou o texto decodificado, com whitespace externo de edição, e não comprova upload nativo do CSV.
2. Dois IFCs sintéticos sem datas em `.cache/deterministic-qa-synthetic`, mesmos GUIDs e mesmo código textual `001.4.1`. Propriedade de nome diferente `Autoria_CWP.Codigo`, adicionada após 45 propriedades de autoria. Escopo dos dois modelos selecionado explicitamente.
3. Três atividades com o mesmo código e datas distintas: Fôrmas/Armar/Concreto; prévia **3 atividades, 12 pares, 4 identidades federadas**, mais resumo pendente. Adoção em lote; resumo explicitamente excluído com justificativa humana, conservado no plano.
4. Conferente fictício identificado como QA, cópias geradas e relidas por IfcOpenShell; validação Fragments/4D antes da ativação. Aplicação real em pasta descartável, com 12 tarefas salvas, perfil e quatro linhas do cronograma preservados.
5. Saída para Projetos e reabertura da pasta: cada uma das três atividades manteve quatro elementos em dois modelos e suas datas; resumo continuou justificado sem vínculos. Nova preparação exige reanálise, sem reaproveitar aprovação.
6. Cancelamento real da reanálise exibiu “Análise cancelada. Nenhuma proposta foi aplicada”, mantendo 4/4 decisões. Repetição concluída; perfil atualizado explicitamente para as revisões reabertas, nova prévia e adoção mantiveram 12 pares, sem duplicação. A nova prévia não foi reaplicada como outra revisão do projeto; substituição repetida é coberta também pelos testes Node/Python.
7. “Localizar no 3D” selecionou quatro elementos físicos, distinguindo os dois modelos com GUIDs iguais; retomada da conferência funcionou.
8. Menu do modelo → Exportar arquivo IFC gravou `Exportacoes/Estrutura-4D.ifc`. Releitura por IfcOpenShell confirmou seis vínculos em dois elementos, e SHA-256 idêntico à revisão desse modelo no projeto reaberto. Os originais sintéticos e as versões anteriores permanecem arquivados.

[Aplicação](evidencias/associacao-codigo-2026-11-05/aplicacao-sintetica.png) · [Reabertura](evidencias/associacao-codigo-2026-11-05/reabertura-sintetica.png) · [Exportação](evidencias/associacao-codigo-2026-11-05/exportacao-sintetica.png) · [Recibo de leitura da pasta e IFC exportado](evidencias/associacao-codigo-2026-11-05/pasta-reaberta-e-exportada.json).

O recibo sintético foi conservado como extraído. Há textos com acentos corrompidos em campos descritivos; essa limitação permanece visível na evidência e não foi corrigida retroativamente.

## Verificações

- `npm test`: **259 aprovados**, zero falhas/skip no último ciclo.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; permanece o aviso preexistente sobre bundles acima de 500 kB.
- `node --experimental-strip-types src/ifc/schedule.selfcheck.ts`: `schedule.selfcheck OK`.
- Python `unittest` de `tools/schedule/test_schedule_ifc.py`: **6 aprovados**.
- Casos adicionais: igualdade exata/zeros/prefixos, três serviços, escopo multi-modelo e GUID duplicado entre modelos, propriedade após a 40ª, nomes de PSet/propriedade diferentes, origem ocorrência/tipo e política de herança, 1.000 linhas normalizadas e associadas, round-trip CSV, persistência, remoção manual, diferenças de perfil, resumos e remoção completa do cronograma Coral de um modelo.

Revisão independente somente leitura encontrou remoção gerada não aplicada, perfil desatualizado aceito, resumo com grafia diferente ou GlobalId associado, cronograma residual em modelo sem atividades e filtro importado malformado. Casos reproduzidos com testes falhando, corrigidos e integrados à suíte verde. A revisão não julgou a semântica do cronograma real nem substitui os ensaios posteriores de navegador/exportação descritos acima. Não houve segunda rodada de revisão independente das correções.

## Limites

- Não foi possível validar os IFCs originais TORRE01/02/03 e CANTEIRO no OneDrive sem cópias locais disponíveis. A falha anterior do provedor de nuvem não é evidência de corrupção. Fixtures complementam os cenários; não representam testes desses modelos.
- Sem certificação semântica/normativa, classificação IFC nativa, associação por prefixo/subárvore, aproximação de nomes ou simulação de CPM. Catálogo atual cobre propriedades escalares de PSets/quantidades expostas por IfcOpenShell; não é extrator universal de todas as estruturas IFC.
- Sem ensaio do seletor Windows, instalação em outro computador, desempenho de vinte modelos ou geometria complexa de 100 MB. Houve atrasos intermitentes de automação no Chrome; ações só foram consideradas concluídas após confirmação visível ou prova em disco.
- Os acréscimos finais de alerta antecipado de cronograma externo e revisão de CSV alterado foram validados pela suíte/tipos/build; o ciclo visual completo acima exercitou o fluxo principal de perfil, associação, aplicação, reabertura, cancelamento e exportação.
- Nenhuma IA foi necessária/chamada para estes vínculos. Os testes sintéticos são evidência do motor determinístico, não de inferência generativa.

## Decisão de execução

Foi mantido o checkout existente, conforme autorização expressa, e usado registro incremental de execução em `.cache/deterministic-progress.md`; o plano é textual A–E, sem tarefas numeradas para os scripts de commit da skill. O custo desse ajuste é não haver checkpoints por commit: a recuperação depende do checkpoint em disco e do estado local preservado. Nenhum commit ou push foi realizado.
