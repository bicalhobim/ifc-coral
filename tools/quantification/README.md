# Quantificação local — rascunhos conferíveis

No ambiente Python isolado, instale `requirements.txt`. Exporte o catálogo pelo botão do visualizador e execute, na raiz do repositório:

```powershell
.\.cache\ifc-quantification-venv\Scripts\python.exe -m tools.quantification.cli ifc_model/TORRE02_ESTRUTURA_4D.ifc --catalog artifacts/quantification-discovery/catalog-v1.json --output artifacts/quantification-v1
.\.cache\ifc-quantification-venv\Scripts\python.exe -m unittest discover -s tools/quantification/tests
```

O JSON pode ser importado em Quantificação. O IFC derivado mantém as representações/QTOs e acrescenta `Coral_Quantification`, sempre como rascunho. Nunca substitua o original por ele.

Geometria: faces triangulares reais em metros; volume recentrado, closure por arestas. Faces inferiores inclinadas usam área real. Vigas excluem extremidades na direção principal; verificar vigas curvas/atípicas. Paredes usam orientação dominante e método explícito de uma/duas faces. Blocos, estacas, contenções e lajes de fundação continuam sem método automático.

Contatos coplanares opostos: interseção e união de polígonos por face, tolerância **0,00001 m**. Arestas coincidentes são soldadas com sete casas decimais. Interpenetração espacial (inclusive possível falso positivo de AABB) permanece pendente de inspeção, em vez de um desconto suposto. Esta primeira versão não executa booleanas entre sólidos interpenetrantes e não certifica formas complexas. O conferente pode registrar uma medida manual justificada.

Métodos suportados: `suspended`, `bottom-sides`, `sides`, `wall-one-face`, `wall-two-faces`. Outro identificador produz pendência, não zero. Pilares e paredes com faces inclinadas fora da regra vertical também ficam pendentes; sua orientação executiva exige conferência específica. A exportação de catálogo do aplicativo contém regras; overrides por elemento ficam nos snapshots do projeto e não são reaplicados automaticamente pela CLI.

Massa paramétrica de aço não define bitolas nem corte/dobra. Aprovar a medida para planejamento não autoriza compra ou execução estrutural.
