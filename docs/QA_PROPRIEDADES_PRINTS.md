# QA — propriedades visíveis e prints de evidência

Data: 01/11/2026. Alterações locais, sem novo commit/push. A sessão Chrome do professor, `Meu projeto`, foi apenas inspecionada. A recarga automática solicitada pelo desenvolvimento foi cancelada para preservar suas alterações não salvas. Testes de mutação ocorreram somente na cópia `.cache/workspace-qa/QA Pasta 31out - copia`.

## Propriedades

Causa observada na sessão do professor: painel com `hidden=false` e texto/propriedades preenchidos, mas `display:none` e dimensões 0×0. A regra antiga `.model-host .panel-right` ocultava o painel no modo normal e só o exibia ao ampliar o modelo. Essa ocultação foi removida; o atributo `hidden` do gerenciador de janelas continua controlando abrir/fechar.

No navegador de QA, modo normal: painel visível com largura 299 px, altura 530,5 px, volume 70,578 m³ e propriedades de 31 objetos com navegação. Como flutuante: 340×360 px e `display:flex`. Captura: `artifacts/qa-properties-prints/propriedades.png`.

## Prints de evidência

- Escolha de arquivo pelo botão, miniatura e abertura ampliada implementadas; colar/arrastar também disponíveis. Colar/arrastar não tiveram ensaio manual nesta rodada.
- PNG, JPEG e WebP até 2 MB por imagem; cinco anexos por condição; 12 MB de imagens por projeto. Conteúdo e tipo são validados; SVG/URLs externas e payloads inválidos não são aceitos.
- O print é incorporado ao projeto. Alterações de alcance/anexos exigem nova conferência. Texto passa a ser opcional quando há print válido, e o conferente continua obrigatório.
- Testado pelo seletor real: arquivo JPEG de 108.115 bytes, miniatura, abertura com resolução 1280×720, liberação sem texto e com conferente. O progresso passou de 1/5 para 2/5.
- Gravação na pasta e reabertura pelo portal confirmaram o print registrado e a imagem decodificada com a mesma resolução. Os bytes também foram encontrados no arquivo salvo. Um arquivo de fixture com extensão PNG e conteúdo JPEG foi corretamente recusado; usou-se a extensão JPEG para o ensaio válido.
- `adviceSnapshot` mantém apenas metadados dos prints. O conteúdo de imagem não é enviado automaticamente aos provedores de IA.

`npm run verify`: **121 testes aprovados**, tipos, três selfchecks e build; permanece o aviso conhecido de bundle grande. Os novos testes cobrem evidência só por imagem, formatos/tamanhos/dados inválidos, duplicidade de IDs, reabertura JSON/portátil, reabertura da condição após mudança de anexo e exclusão dos bytes no contexto enviado à IA. Sem erros/avisos no console observado da aba de QA.

Log e captura do print reaberto: `artifacts/qa-properties-prints/verify.log` e `print-salvo.png`. Evidências de execução não equivalem a aprovação técnica da liberação representada na foto: todo o conteúdo do ensaio é QA.
