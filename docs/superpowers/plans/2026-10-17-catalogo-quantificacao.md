# Catálogo de quantificação IFC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Medir concreto, estimar armadura e quantificar serviços de fôrmas por regras auditáveis, ligando-os ao planejamento e aos suprimentos sem corromper os projetos existentes.

**Architecture:** Catálogo versionado e medições separadas de pacotes/recursos. Geometria inicialmente processada pelo IfcOpenShell em ferramenta local do professor; o aplicativo lê os resultados e registra conferência e origem. Migração explícita do domínio antes de permitir aço/fôrmas no fluxo de fornecimento.

**Tech Stack:** TypeScript/Vite/That Open existentes; Python 3.12, IfcOpenShell 0.9.0.post1 em ambiente isolado; testes Node e unittest Python, arquivos IFC/JSON portáteis.

**Spec:** `docs/superpowers/specs/2026-10-17-catalogo-quantificacao-design.md`

**Estado:** executado em cinco entregas e um passe de correção após revisão independente. Ver docs/REVISAO_QUANTIFICACAO.md para evidências, decisões e limites.

## Global Constraints

- Não modificar `C:/dev/ifc4all`, sua junction ou o kit institucional aprovado. Não instalar bibliotecas na junction.
- GlobalId + modelo + hash identificam a ocorrência/revisão; tipos não são consumo.
- Quantidade desconhecida não é zero; estimativa não é aprovação técnica. Não atribuir 60/85/120 kg/m³ à NBR.
- Métodos/taxas de fundação/contenção não confirmados permanecem pendentes. Não inventar barras/bitolas.
- Arquivos schema 1 e compromissos congelados permanecem legíveis, com valores/snapshots preservados.
- Não publicar, enviar cotação, pedido ou pagamento nesta frente.

## Review Focus

- Modelos exportados com IfcFooting representando estaca, blocos com “Estacas” no nome, BASESLAB e tipologias ambíguas devem resolver por regra específica ou pendência.
- Coordenadas georreferenciadas, rotação, faces inclinadas, malha aberta e contato parcial devem produzir medida estável ou pendência explícita.
- Volume/taxa parcial, QTO conflitante e ausência de método não podem produzir quantidade total aprovada.
- Alteração de catálogo ou revisão IFC não pode atualizar silenciosamente compromisso, reserva ou aprovação.
- Serviços com unidades distintas e painéis reutilizáveis não podem gerar saldo/compra por soma indiscriminada.

## Task 1 — Catálogo, classificação e resultados

**Files:**
- Create: `viewer/src/quantification/types.ts`, `catalog.ts`, `classify.ts`, `calculate.ts`
- Test: `viewer/tests/quantification.test.mjs`
- Existing fix: `viewer/src/ifc/schedule.ts`, regression in `viewer/tests/identity.test.mjs`

**Interfaces:**
- Consumes: metadata `{modelId, modelHash, globalId, ifcClass, predefinedType, typeName, properties}` and declared quantities with units.
- Produces: `classifyElement(metadata, rules, overrides): ClassificationResult` and `calculateMeasures(input, ruleSnapshot): MeasureResult[]`.
- `MeasureResult` carries `{id, elementRef, serviceCode, ruleId, ruleVersion, inputs, amount:number|null, unit:'m³'|'kg'|'m²', origin, status, pendingReasons, evidence}`. Unit depends on service, not UI text.

- [x] Write failures for: “Bloco ... 4 Estacas” → bloco; “Estaca de concreto” → estaca; BASESLAB does not use suspended-slab rule; ambiguous tie → pending.
- [x] Write failures for `34.707 × 60 = 2082.42 kg`, absent rate → null, incomplete volumes → partial result without approved total, same GUID repeated by phase counted once.
- [x] Implement rule precedence and versioned snapshots; proposed rates remain draft and editable. Validate no negative/NaN/infinite rates, unknown units or hidden fallback.
- [x] Run `node --experimental-strip-types --test tests/quantification.test.mjs` and the existing suite. Expect no failures and unchanged existing concrete snapshots.
- [x] Review and commit this independently testable delivery.

## Task 2 — Geometry, contact deductions and IFC derivation

**Files:**
- Create: `tools/quantification/requirements.txt`, `model_audit.py`, `geometry.py`, `contacts.py`, `export_ifc.py`, `cli.py`
- Create tests: `tools/quantification/tests/test_geometry.py`, `test_contacts.py`, `test_export.py`
- Reference evidence only: `.cache/audit_quantification.py`, `.cache/audit_geometry_quantification.py`, `.cache/enrich_quantification_pilot.py`, `artifacts/quantification-discovery`

**Interfaces:**
- Consumes: IFC path, catalog snapshot, confirmed method overrides.
- Produces: `audit_model(path)->ModelAudit`, `measure_surfaces(element)->SurfaceMeasure`, `deduct_contacts(surface, neighbours, method)->ContactResult`, `write_derivative(source, results, target)->ExportReport`.
- `SurfaceMeasure` distinguishes total, lower, side and slope surfaces, units, transform and failures. `ContactResult` keeps gross area, deductible area, effective candidate area, method, tolerance and face evidence; unresolved faces block approval.

- [x] Write analytical fixtures: 4×5×0.10 m slab has 20 m² underside and 1.8 m² borders, not 41.8 m² fôrma. A free 0.30×0.60×4 m beam has 6 m² bottom+sides before support/contact deductions, not its total envelope.
- [x] Write pillar 0.40×0.60×3 m → 6 m² lateral; two contacting solids exclude their shared face from fôrma; wall one-face and two-face methods remain distinct. Unconfirmed pile method → pending rather than zero.
- [x] Write large-translation invariance test (georeferenced mesh vs local origin), rotated/inclined face test, openings, partial coplanar contact, and open-mesh pending/error tests. Select and document the contact tolerance from fixtures and scale.
- [x] Implement geometry and contact processing. Use sequential create_shape fallback validated on this machine; benchmark before replacing it with a parallel iterator.
- [x] Write derivative export/reopen test: same 764 occurrence GUIDs and original QTO/representation unchanged, explicit IFC units on mass/area/rate, no fictional reinforcing bars, custom property namespace, separate approval state.
- [x] Run `python -m unittest discover -s tools/quantification/tests`; audit TORRE02 and the six slabs. Original SHA-256 must remain `885c3b3ace554f9e3091d611645cccac875a583241d5971c57703bb4a36030dc`.
- [x] Commit tool/runtime requirements and source, not the scratch environment. Keep reproducible output manifest and label drafts.

## Task 3 — Quantification interface and review

**Files:**
- Create: `viewer/src/quantification/ui.ts`, `review.ts`
- Modify: `viewer/src/ui/shell.ts`, `main.ts`, `ui/coral.css`
- Test: `viewer/tests/quantification-review.test.mjs`; browser evidence.

**Interfaces:**
- Consumes: classification/measure results and original selection identities from Tasks 1–2.
- Produces: reviewed `MeasureSnapshot` with reviewer, date, method, evidence and rule snapshot. Changing an input invalidates that approval. No direct mutation of production or supply by AI.

- [x] Write failure: draft/partial results cannot be approved without required inputs/evidence; rate or model-hash change invalidates prior approval.
- [x] Add Medir/Catálogo/Conferir in a compact tool panel. Show separate measures and units, rate/formula/source, pending coverage and classification override. Do not cover the viewport.
- [x] Browser test: select six slabs, inspect 34.707 m³ / 2082.42 kg proposed scenario / geometric-vs-effective formwork area, edit rate, review and export results; unknown foundation method remains pending.
- [x] Run Node suite/typecheck/build and inspect normal/narrow viewport; commit after evidence.

## Task 4 — Multi-unit packages, resources and portable schema

**Files:**
- Modify: `viewer/src/production/types.ts`, `project.ts`, `planning.ts`, `storage.ts`, `runtime.ts`, `ui.ts`, AI payload adapter files
- Create: `viewer/src/production/migrations.ts`, `resources.ts`
- Test: `viewer/tests/migration-v2.test.mjs`, `resources.test.mjs`; extend domain/AI tests.

**Interfaces:**
- Consumes: reviewed measure snapshots and service→resource compositions.
- Produces: schema 2 production packages with unit by service, resource requirements and allocations keyed by resource/specification/unit/date, portable snapshots. Preserve `unpackProject` compatibility for schema 1; migrate a validated clone, never overwrite the only original on failure.

- [x] Write schema-1 migration roundtrip: old 12 m³ commitment, PPC criterion/denominator, allocations/deliveries and IFC bytes remain unchanged. Invalid migration leaves original recoverable.
- [x] Write tests: kg cannot cover m³/m²; compatible resource capacity cannot be reserved twice; duplicate elements in same production service are detected before creating packages; different services legitimately reference the same element without duplicating resource demand.
- [x] Implement explicit preview→create packages for concretagem/armação/fôrmas; separate resource requirements. No automatic generic concrete proposal for steel or formwork.
- [x] Write reusable-panel fixture: sequential services of 20 m² each do not imply 40 m² of panels; simultaneous uses need separate available capacity. Do not infer procurement without reuse cycle/loss/specification inputs.
- [x] Extend AI payload summaries with units/origins/review status and keep key handling memory-only. Verify no mixed-unit aggregate total or automatic approval.
- [x] Run full verify, schema-1 export/reopen and schema-2 three-service browser scenario. Commit this migration separately.

## Task 5 — Supply map and teaching case

**Files:**
- Create: `viewer/src/production/supply-map.ts`
- Modify: `viewer/src/production/ui.ts`, `docs/GUIA_DO_ALUNO.md`, `docs/ACEITE.md`, `docs/PROGRESSO.md`
- Create: `viewer/tests/supply-map.test.mjs`; update slides only after approved UI.

**Interfaces:**
- Consumes: approved resource requirements, procurement lead times, specification and availability; reusable resource constraints.
- Produces: compatible supply packages with need/order/start/receipt dates, traceable consumers and remaining quantities. Undefined bitola/BBS or executive method remains a procurement blocker, not a generated purchase specification.

- [x] Write consolidation tests for same/different steel specification, delivery windows, missing bitolas, reusable forms, partial supply and lead-time change. Preserve frozen promise vs current plan separately.
- [x] Implement map preview and human confirmation; do not contact suppliers or send financial instructions in this feature.
- [x] Validate the six-slab teaching case from geometry through production and supply, export/reopen and PPC. Update guide screenshots only for the final UI.
- [x] Register what was measured/estimated/approved and current limitations; commit after full verification.

## Handoff

Work stays in `C:/dev/ifc4all-2`, branch `feat/ifc-coral-mvp` until isolation is chosen at execution. Read AGENTS.md, this plan, the spec and docs/ACEITE.md. The `materials/guia-operacao-v02/~$...pptx` lockfile belongs to the open presentation and is not part of this delivery. Do not stage it or close the user's applications.
