# Exportar do IFC Coral para Compras IA

1. Abra o projeto e acesse **Suprimentos** pelo menu superior, ou abra um pacote e sua aba Suprimentos.
2. Identifique as necessidades e ajuste o recorte com busca, origem e situação. É possível exportar rascunhos e quantidades pendentes; não é necessário conferir a composição nem confirmar o mapa para iniciar o intercâmbio.
3. Clique em **Preparar pacote para Compras IA**. A mensagem informa quantas demandas foram preparadas.
4. Use **Baixar pacote para Compras IA**. O navegador grava um JSON com nome único. A saída simples Baixar JSON continua disponível, porém não contém o contrato de integração.
5. Importe o arquivo no demonstrador Compras IA. Revise entradas, especificações, quantidades, prazos e pendências antes de prosseguir para cotações e decisão. A exportação do Coral não constitui autorização de compra.

Se alterar os filtros, o link preparado é ocultado e o pacote precisa ser preparado novamente. Um recorte vazio apresenta erro legível. O arquivo contém a fotografia do projeto/recorte capturado no início da operação; mudanças posteriores exigem outra exportação.

O pacote traz as entradas de composição e a prévia calculada separadas. Não aplique novamente perdas ou prazos sobre a prévia. Quantidade desconhecida permanece null. Totais de reutilizáveis representam pico simultâneo; concreto fresco conserva recebimento no uso. Datas do cronograma são planejamento, não evidência de execução.

Arquivos IFC completos e imagens de evidência não acompanham esse JSON. Modelo, revisão/hash, GlobalIds, tarefas e dados pertinentes permitem rastrear o contexto no Coral. Metadados indisponíveis permanecem explícitos. O consumidor deve conferir uma nova origem; uma estimativa nova não herda a conferência de uma medição antiga.

Contrato e verificador: [docs/contracts/README.md](contracts/README.md). O schema v1 é congelado nesta rodada. O manifesto registra hashes dos arquivos entregues; o payload tem um fingerprint distinto do hash dos bytes do arquivo.
