# QA — cronograma real — 05/11/2026

> Registro histórico: “sem commit/publicação” descreve a rodada de teste. Este resumo é publicável; o CSV, o relatório com linhas de origem e a captura com seu conteúdo permanecem locais.

## Origem e causa
Arquivo CRONOGRAMA.csv de Modelos Módulo Integrando Cronograma com Navisworks, no acervo 8.bim_4d_navisworks_2025 / ENTREGAS - BIM 4D - SPBIM / Modelos BIM4D - Alunos.
SHA-256: 459750ae0176d4d1054aa79ac4e39a0a26c35bbb448a7aa04d4fb2e6221f60f3.
66.317 bytes; Windows-1252; 790 registros e sete colunas. Navisworks_User1 tem 243 vazios e códigos repetidos entre serviços. Não constitui chave única de atividade.

## Correção
Normalizador compartilhado entre interface e CLI: identificação opcional, IDs únicos determinísticos por registro, preservação dos campos originais, datas validadas e diagnóstico agregado. Codificação detectada na carga. Nenhuma atividade ou linha-resumo descartada. Arquivo original preservado byte a byte. Exportação normalizada e relatório disponíveis na tela.

## Evidências
- Conversão do arquivo real: 790 registros e 790 IDs únicos.
- Comparação independente: nomes, datas e todas as colunas origem_* correspondem ao original; hash da cópia original igual.
- Navegador integrado, servidor QA 5180: upload do original com detecção Windows-1252 e normalização de 790 registros.
- Repetição com ID explicitamente mapeado para Navisworks_User1, como no erro do usuário: 790 registros normalizados, sem erro.
- Reimportação do CSV convertido no navegador: 790 registros preservados e zero IDs novos.
- 238 testes aprovados; typecheck, build e schedule.selfcheck aprovados. Aviso de tamanho de bundle permanece.
- Captura da normalização preservada localmente, fora do Git, pois mostra linhas do CSV privado.

## Limite do aceite
Validada a importação/normalização do cronograma real. As 790 atividades não foram automaticamente associadas nem aplicadas aos modelos do usuário. Predecessoras preservadas como origem, sem novo cálculo de caminho crítico. Projeto e correções adotadas do usuário não foram alterados. CSV privado e relatório completo ficam fora do Git. Alterações locais, sem commit/publicação.
