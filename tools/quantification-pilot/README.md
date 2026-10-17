# Ensaio local de quantificação com IfcOpenShell

Ferramenta exploratória do professor para a TORRE02 desta base. Não é o módulo de catálogo do aplicativo nem um dimensionamento de armaduras. As regras de serviços/fôrmas e a migração multiunidade estão na especificação/plano em `docs/superpowers`.

## Ambiente

Nesta máquina, o ambiente isolado `.cache/ifc-quantification-venv` já foi criado e os pacotes instalados. Para reprodução em outro checkout, com Python 3.12:

```powershell
python -m venv .cache/ifc-quantification-venv
.cache/ifc-quantification-venv/Scripts/python.exe -m pip install --only-binary=:all: -r tools/quantification-pilot/requirements.txt
```

Não instalar no Python compartilhado nem nas dependências JavaScript da junction.

## Executar a partir da raiz do repositório

```powershell
.cache/ifc-quantification-venv/Scripts/python.exe tools/quantification-pilot/audit_quantification.py
.cache/ifc-quantification-venv/Scripts/python.exe tools/quantification-pilot/audit_geometry_quantification.py
.cache/ifc-quantification-venv/Scripts/python.exe tools/quantification-pilot/enrich_quantification_pilot.py
```

Saída em `artifacts/quantification-discovery`. Reexecutar substitui somente os artefatos de ensaio dessa pasta; o IFC original permanece inalterado. O aplicativo não troca automaticamente seu modelo pelo derivado.

## O que o ensaio verifica

- 764 ocorrências, separadas de definições Ifc*Type; classificação candidata por classe/tipo/função.
- Área geométrica por orientação, separada da área de serviço de fôrma ainda pendente. Não há desconto de contatos implementado nesta ferramenta.
- Volume geométrico calculado com origem recentrada para reduzir cancelamento numérico de coordenadas georreferenciadas. Não usar get_volume diretamente no mesh mundial deste arquivo como referência.
- Taxas propostas 60/85/120 kg/m³ para lajes suspensas/vigas/pilares. Fonte e premissa no próprio IFC; fundações/contenções pendentes. Sem perdas ou bitolas inferidas.
- IFC derivado com `Coral_Quantificacao_Ensaio` e unidades IFC explícitas. Todos os elementos continuam não aprovados para compra/execução.
- Reabertura do derivado verifica GUIDs e QTOs originais, propriedades, ausência de barras fictícias e hash de origem inalterado.

O código é intencionalmente específico ao arquivo de exemplo. Para outros IFCs, faltam entradas configuráveis, classificação/materiais adicionais, validação de malha/contatos e tratamento de unidades/quantidades conflitantes conforme o plano técnico.
