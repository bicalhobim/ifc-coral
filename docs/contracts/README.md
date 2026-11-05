# IFC Coral → Compras IA — contrato v1

Identificador: `format = "ifc-coral-procurement"`, `schema_version = 1`. Schema: `coral-procurement-1.schema.json` (JSON Schema 2020-12).

## Artefatos para o consumidor

- `coral-procurement-1.example.json`: sete demandas **sintéticas**, produzidas pela função real `exportProcurement`. Não é arquivo de uma obra real nem autorização de compra.
- `../../viewer/tests/fixtures/coral-procurement-1.generated.json`: mesma saída para regressão.
- `../../viewer/tests/fixtures/coral-procurement-1.project.json`: projeto sintético de origem, apenas para ensaio reproduzível.
- `verify-coral-procurement.py`: valida fingerprints com biblioteca padrão; `--schema` usa o pacote Python `jsonschema`.
- Regeneração: `node --experimental-strip-types viewer/scripts/generate-procurement-fixture.mjs`, a partir da raiz do repositório.

## Semântica e consumo

`base_quantity` é a quantidade do **serviço** (m³ de concreto, kg de armação, m² de fôrmas). `derived_preview.quantity` é a necessidade do **insumo**, já calculada com fator e perda uma vez. `composition` preserva as entradas. O consumidor escolhe usar a prévia ou recalcular a partir das entradas; não deve multiplicar a prévia novamente. `null` é desconhecido. Zero só aparece quando a origem contém zero ou como subtotal conhecido explicitamente identificado.

As cinco datas derivadas já incluem os prazos em dias corridos. Datas de tarefas IFC são preservadas; uma data no passado não prova execução. Concreto fresco recebe na data de uso e não se torna estoque antecipado. Reutilizáveis consolidam pelo pico de ocupação simultânea, com intervalos inclusivos; `totals.known_quantity` não substitui `totals.quantity` quando há origens desconhecidas. Não somar demandas reutilizáveis como consumo total.

`origin` relaciona cada linha ao pacote **ou** à previsão 4D residual, modelo + GlobalId e tarefas. Recortes detalhados em pacotes deixam a previsão correspondente pelo mecanismo `macroPlan` existente. Não somar novamente contexto, recursos ou reservas como novas demandas. `scope` informa IDs, filtros e contagens. A situação `reviewed` do filtro significa a composição conferida na grade original; não significa liberação global, quantidade inteiramente conferida ou cobertura conhecida. Pendências adicionais acompanham o pacote.

`context.estimates`, quando disponível, preserva as entradas persistidas por elemento, quantidade, unidade, serviço, fonte e coincidência de revisão; não constitui conferência. `context` contém apenas registros relacionados ao recorte: tarefas, elementos/metadados disponíveis, pacotes/restrições, recursos, reservas e recebimentos. Não inclui bytes do IFC, chaves de API ou pixels de anexos. Anexos de evidência levam identificação/nome/MIME; abrir a imagem exige o projeto de origem. Metadados ausentes ou de revisão divergente aparecem indisponíveis. `base_quantity.reviews[].measurement` preserva a memória que existir: inputs, regra/versão/snapshot, origem, motivos pendentes e evidências. Não existe memória inventada para medidas ausentes.

Cobertura/saldo só são numéricos quando o pacote declarou cobertura conhecida, o recurso coincide com a prévia e as referências continuam vigentes. Reservas legadas são expostas separadamente e exigem conferência por insumo. `human_review.release_purchase` e `semantics.purchase_authorized` são sempre falsos. Uma conferência registrada no Coral não autoriza o comprador nem aprova uma origem nova. O status reviewed da quantidade exige regra vigente, cobertura de todos os elementos e soma compatível com a base exportada; uma estimativa nova não herda a conferência antiga.

## Fingerprints interoperáveis — `coral-c14n-1`

Não se trata de hash do texto formatado do arquivo nem de JCS. Cada valor JSON vira uma árvore tipada:

- null → `["null"]`; boolean → `["boolean", valor]`; string → `["string", valor]`.
- número → `["number", hex]`, em que hex tem os oito bytes IEEE-754 binary64 big-endian, minúsculos; -0 é normalizado para +0. NaN/Infinity são rejeitados. Isso elimina diferenças JS/Python de expoentes e casas decimais. O consumidor deve interpretar números como binary64; inteiros maiores que 2^53 não são parte das quantidades/IDs numéricos deste contrato.
- array → `["array", [valores transformados em ordem]]`.
- objeto → `["object", [[chave, valor transformado], ...]]`, com chaves ordenadas pelas unidades UTF-16 (ordem lexical ECMAScript), sem ordenar arrays. Campos undefined não são exportados.

Serializar essa árvore em JSON compacto, sem espaços, com escapes ASCII (todos os caracteres de U+007F em diante como `\uXXXX` minúsculos; caracteres fora do BMP como par substituto UTF-16). Codificar em UTF-8 — idêntico a ASCII nesta representação — e aplicar SHA-256. O script Python é a referência executável independente; não converter unidades, ordenar arrays ou arredondar valores antes de verificar.

Bases exatas:

1. `export.source_fingerprint`: Project completo clonado no instante da exportação, incluindo audit e sem dados de runtime. Fingerprint opaco para o consumidor; só é verificável com o projeto de origem completo. Uma alteração gera nova origem e exige revisão. O projeto integral não é incorporado no intercâmbio por padrão.
2. `demands[i].fingerprint`: objeto da linha inteira, excluindo apenas a propriedade `fingerprint`.
3. `export.payload_fingerprint`: pacote inteiro, excluindo apenas `export.payload_fingerprint`. Inclui ID/data de exportação, fingerprint de origem, filtros e todas as linhas.

Exemplo de verificação: `python docs/contracts/verify-coral-procurement.py caminho/do/pacote.json --schema`.

## Limites

Prévia não é BBS, projeto estrutural, CPM, cotação, reserva adicional ou pedido. Preparação/fabricação/transporte/inspeção, perdas e retorno são premissas editáveis já existentes; exigem avaliação humana. Ausências continuam null/pendentes. Escopo filtrado não comprova completude do projeto. Schema v1 é contrato de laboratório local, sem endpoint remoto ou processo de fornecedores.
