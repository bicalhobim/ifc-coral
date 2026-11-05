# Recibo técnico — IFC Coral → Compras IA v1

Data: 02/11/2026. Repositório independente `C:/dev/ifc4all-2`, branch `feat/ifc-coral-mvp`. Base `b46d0c8b236439d3ac9023dd58149a301cd086e6`. Implementação local sem commit. Contrato v1 congelado ao fim desta rodada.

## Resultado

Contrato `format=ifc-coral-procurement`, `schema_version=1`, exportador puro e opção na grade de suprimentos. Preparar pacote → Baixar pacote. Saídas simples CSV/JSON preservadas. Não exige confirmar composição ou mapa; rascunhos levam lacunas explícitas. Não altera quantidades, cronograma, reservas, liberações, audit ou PPC. Metadados, memórias de medição e estimativas persistidas seguem apenas quando disponíveis e pertinentes ao recorte.

Quantidades-base e prévias derivadas são separadas. Datas usam dias corridos e origem IFC mantida. Reutilizáveis usam pico simultâneo; recebimento de concreto fresco é no uso. Imagens e bytes IFC não são incorporados. Referências de evidência, identidade modelo + GlobalId, revisão/hash e fingerprints permitem rastreabilidade. Hash não é assinatura, comprovação da verdade da fonte ou autorização de compra.

## Verificações finais

- `npm test`: **201/201**, sem falhas, cancelamentos ou skips.
- Quatorze testes específicos: imutabilidade/reprodução; quantidade desconhecida; cobertura/saldo; residual macro sem dupla contagem; reutilização/fresco; filtros/escopo vazio ou desatualizado; revisão IFC; composição alterada; tampering; números/Unicode entre JS/Python; isolamento de dados; snapshot assíncrono; reservas legadas; serviço não reconhecido; conferência antiga versus estimativa/regra nova (alguns testes cobrem mais de um cenário).
- `npm run typecheck`: passou.
- `npm run build`: passou, com aviso já existente de bundle maior que 500 kB.
- JSON Schema 2020-12 e fingerprints verificados por Python no exemplo sintético e no arquivo baixado pela UI.
- `git diff --check`: sem falha de espaços; avisos de normalização CRLF/LF.
- Schedule não foi modificado; selfcheck de schedule não foi necessário nesta rodada.

A revisão da ponte reproduziu uma falha de aprovação indevida da quantidade macro: regra alterada + estimativa nova de 20 poderia herdar a medição antiga de 12,375. Corrigido: reviewed exige regra vigente, revisão IFC coincidente, cobertura dos elementos e soma compatível com a base exportada. Evidência antiga permanece com current=false. Regressão local passou; ponte informou validação independente dos três recortes relacionados.

## Ensaio no navegador

Origem isolada `http://127.0.0.1:5186/`, projeto novo TORRE02 sem pasta escolhida. Sessão principal/projeto do professor não foi usada para QA. Modelo renderizado pelo fluxo padrão.

1. Mapa original com 231 demandas. Busca Fundação recortou três demandas.
2. Preparação e download explícito pela interface. Arquivo final: `IFC-Coral-Compras-IA-1446e97b-61c2-4e68-842b-02029dc271c1.json`, em Downloads.
3. Cópia para consumo: `docs/evidencias/integracao-compras-2026-11-02/TORRE02-fundacao-browser-v1-congelado.json`.
4. **3 demandas / 106 elementos / 318 tarefas / 212 estimativas persistidas**. Baseado na TORRE02; valores não constituem validação técnica de projeto ou compra.
5. Arquivo baixado aprovado por `verify-coral-procurement.py --schema`; payload fingerprint `be422c359e8d48dc6e55e62269d43c4c44c4bded1306265101f299d9a38dde78`.
6. Busca sem resultados apresentou mensagem clara e não ofereceu link. Após preparar, alterar filtro ocultou o link antigo. Preparar novamente gerou arquivo do recorte atual.
7. Console sem erros no recorte consultado. Captura: `docs/evidencias/integracao-compras-2026-11-02/exportacao-browser-final.png`.

Algumas ações de clique da automação reportaram timeout de transporte, embora o estado visível confirmasse execução. O download final retornou caminho local e teve conteúdo verificado independentemente, não foi inferido apenas pela mensagem da tela. As capturas/arquivos de tentativas anteriores foram preservados como histórico, sem substituir a evidência v1 congelada.

## Handoff ao consumidor

- Schema: `docs/contracts/coral-procurement-1.schema.json`.
- Exemplo final (sete demandas sintéticas): `docs/contracts/coral-procurement-1.example.json`.
- Fixture idêntica gerada pela função real: `viewer/tests/fixtures/coral-procurement-1.generated.json`.
- Projeto sintético para reprodução: `viewer/tests/fixtures/coral-procurement-1.project.json`.
- Gerador: `viewer/scripts/generate-procurement-fixture.mjs`.
- Implementação: `viewer/src/production/procurement-export.ts`.
- Protocolo de hashes e uso: `docs/contracts/README.md`.
- Verificador independente: `docs/contracts/verify-coral-procurement.py`.
- Hashes SHA256 dos bytes exatos: `docs/contracts/manifest-2026-11-02.json`. Esse manifesto tem SHA256 `06a3c86cc01ee9f248d88764e70dff1b82bcca9cd32847e12fac3ef0087573de`.
- Fingerprint do payload sintético final: `827344163d5c0138662599692d576296c252fac692e322e6c69139d415cea59c` (distinto do hash dos bytes).

Os exemplos provisórios e hashes anteriores devem ser substituídos no consumidor pelos arquivos do manifesto final. `context.estimates` é complemento opcional do schema v1, presente nas saídas finais.

## Limites e próxima ação

Nenhum contato real, pedido, envio, banco compartilhado, publicação, merge, push ou deploy. O importador e o ensaio exportação → refinamento → comparativo pertencem ao outro repositório/coordenação; não foram implementados por este produtor. Apenas a geração, o contrato, o download e a integridade do pacote foram aprovados tecnicamente nesta rodada. Commit continua dependente da autorização individual do Lucas, conforme AGENTS.md.


## Fechamento do checkpoint — 04/11/2026

Revalidação: 201 testes, tipos e build aprovados; aviso de bundle grande preservado. Schema/fingerprints do exemplo e da exportação real novamente conferidos. A conferência dos blobs preparados para o commit identificou que a normalização de quebras de linha do Git alteraria três hashes do manifesto. Atributos específicos preservam os bytes dos arquivos congelados, do manifesto e das fixtures correspondentes. Conteúdo e contrato v1 permanecem intactos; os hashes do manifesto são também comparados aos blobs do index antes do commit. O estado local-uncommitted no manifesto registra a situação histórica de seu congelamento em 02/11, não o status atual do Git.

Este fechamento foi solicitado expressamente por Lucas junto à documentação de arquitetura. Não houve nova alteração funcional da interface ou ensaio no projeto de trabalho do professor.
