# Revisão de entrega — quantificação v04

Revisão independente do intervalo `7223832..d719cd4`, seguida de um passe de correção com testes de regressão. Não houve publicação ou integração em outra branch.

## Correções verificadas

| Achado | Proteção final | Regressão |
|---|---|---|
| Prorrogação do serviço deixava a ocupação de painéis antiga | Janela efetiva considera necessidade, conclusão e ciclo; cobertura/prontidão bloqueadas até recomposição. Capacidade conflitante rejeita a alteração, preservando o estado anterior | Duas capacidades sequenciais de 20 m² tornam-se demanda simultânea de 40 m² ao prorrogar a primeira |
| Pilar inclinado perdia faces laterais | Inclinação não suportada na regra vertical fica pendente, sem quantidade efetiva completa | Pilar 0,4 × 0,6 × 3 m inclinado não retorna falsos 3,6 m² aprováveis |
| Divergência de volumes só bloqueava fôrmas | Concreto e aço dependente também ficam pendentes; QTO original e conflito entram nas entradas/fingerprint | QTO 100 m³ com divergência conhecida não produz 100 m³/6.000 kg completos |
| Pacote importado podia trocar unidade/serviço | Vínculo confere serviço, unidade, quantidade e identidades dos elementos contra o snapshot | Alterar fôrma m² para armação kg é rejeitado antes de compor recursos |
| Texto automático permitia evidência manual vazia | Evidência do usuário é validada antes de acrescentar comentário de rateio | Vazio e espaços são recusados; conferido também no navegador |
| Autor/motivo da classificação desapareciam | Proveniência explícita integra a medida e sobrevive à reabertura | Autor original permanece distinto do conferente nas 18 medidas recalculadas no navegador |
| Método desconhecido virava área zero completa | Método não suportado produz pendência | `unknown-method` não retorna área 0 nem contatos resolvidos |
| Nova conferência podia apagar o vínculo da anterior | Histórico de snapshots mantém o pacote original; atualização exige ação explícita e respeita congelamento/reservas | Taxa 65 gera 2.255,955 kg atuais; compromisso anterior continua 2.082,42 kg |

Os dois últimos pontos originalmente considerados menores na revisão (proveniência e identificador de método) foram tratados como materiais: atribuição incorreta de autoria e zero indevido contrariavam a rastreabilidade e o tratamento de quantidade desconhecida.

## Decisões e limites mantidos

- Checkout independente em `C:/dev/ifc4all-2`, branch `feat/ifc-coral-mvp`. O original e suas dependências compartilhadas ficam preservados; uma integração Git posterior continua pendente de decisão do autor.
- Interpenetrações/AABB e booleanas entre sólidos continuam pendentes; custo: inspeção/medição manual em vez de uma área supostamente aprovada. Contatos coplanares integrais/parciais são calculados.
- Os 340 m² do ensaio são premissa fictícia rotulada, não levantamento do modelo. Seu uso exige evidência manual; custo de aplicação fora desse contexto seria uma estimativa sem validação.
- Um recurso principal por pacote permanece o recorte implementado; composições completas com vários insumos exigem evolução.
- Fingerprints validam consistência, não autenticidade criptográfica da aprovação. Arquivos portáteis são registros editáveis; não equivalem a assinatura digital.
- Classes/funções/métodos não suportados ficam pendentes; custo: cobertura automática menor, sem consumir elementos não classificados como se fossem conhecidos.
- Não foram executados publicação, contatos com fornecedores, negociação, pedido, envio ao financeiro ou chamadas reais de IA; custo: integrações comerciais ainda precisam de ensaio próprio.
- O revisor não operou o navegador. O executor realizou os ensaios de seleção, conferência, reservas, recebimentos, mapa, PPC, reabertura e tela 640×850; uso em outra máquina continua sem comprovação nesta entrega.
- Exportação de catálogo para a CLI contém regras, não substituições por elemento. Autor/motivo dessas substituições permanecem no projeto e nas medições; para uso geométrico externo, confira a regra e o relatório resultante.

## Evidência final

Suíte: **63 testes Node e 12 Python**, typecheck, selfchecks de schedule/Gantt/tree e build. Aviso de tamanho do bundle BIM permanece. Fontes originais com SHA-256 `885c3b3ace554f9e3091d611645cccac875a583241d5971c57703bb4a36030dc` preservadas.

O ensaio completo em `artifacts/quantification-v1/browser/three-services-completed.json` contém schema 2, três pacotes/unidades, dezoito conferências, três recursos/reservas/recebimentos, uma versão do mapa e PPC **67% (2/3)**. `review-history-and-authorship.json` conserva o ensaio de revisão com doze snapshots históricos e compromisso anterior preservado. O projeto antigo da porta 5178 mantém 12 m³ congelados.

Roteiro atual: [Quantificação e suprimentos](QUANTIFICACAO.md). O PPTX/PDF v02 continua identificado como histórico. Nenhuma observação menor de código foi deixada pendente após o passe; os limites de produto acima permanecem explícitos.
