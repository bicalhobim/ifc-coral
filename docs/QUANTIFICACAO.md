# Do elemento ao plano de fornecimento

**Versão de trabalho v04.** Quantificação e planejamento didáticos; cálculos paramétricos não substituem projeto estrutural, detalhamento ou autorização de compra.

## 1. Selecionar o trabalho

Abra a TORRE02. No ícone **Planejamento 4D**, busque `Concretagem de laje - PAV 01` e selecione a atividade. São seis elementos, não dezoito: fôrma, armação e concretagem são serviços sobre as mesmas ocorrências.

Abra o ícone **Quantificação**. Ele ocupa um painel reservado, sem cobrir o modelo. Feche o 4D ou use **Ampliar modelo** quando precisar de espaço.

## 2. Distinguir o que está sendo contado

Em **Medir**, confira separadamente:

| Resultado das seis lajes | Origem | Condição |
|---|---|---|
| 34,707 m³ de concreto | QTO `NetVolume` do IFC | Quantidade declarada, ainda exige conferência do serviço |
| 2.082,42 kg de aço, a 60 kg/m³ | Cenário paramétrico | Estimativa sem bitolas ou corte/dobra |
| 347,07 m² de faces inferiores; 365,59 m² candidatos com bordas | Geometria IfcOpenShell | Antes dos descontos; área efetiva permanece pendente |

O relatório geométrico acompanha a TORRE02 original. Para outro IFC, exporte o catálogo, execute a [ferramenta local](../tools/quantification/README.md) e importe o JSON. O hash deve corresponder à revisão selecionada. Preserve esse relatório junto do projeto; para outro modelo, pode ser necessário reimportá-lo para recalcular após reabertura. O arquivo portátil conserva as conferências e suas entradas.

O motor desconta contatos coplanares integrais/parciais. Interpenetrações e possíveis sobreposições espaciais exigem inspeção; não há solução booleana automática para elas nesta edição. Na TORRE02, as áreas finais de fôrma continuam pendentes por esse motivo.

## 3. Escolher uma regra e conferir

Em **Catálogo**, veja fonte, versão, taxa e método. Lajes suspensas, vigas e pilares usam 60/85/120 kg/m³ como proposta didática editável, baseada em comparáveis históricos. Não são taxas prescritas pela NBR. Blocos, estacas, BASESLAB e contenções ficam sem taxa/método automático.

Não classifique uma estaca apenas procurando a palavra “estaca”: o nome de um bloco sobre estacas também contém essa palavra. Uma classificação manual exige autor e motivo. Alterar parâmetros invalida a conferência afetada; o compromisso congelado continua com seu snapshot original.

Autor e motivo da classificação ficam separados do conferente da medição no arquivo portátil. O catálogo exportado para a CLI contém apenas regras; substituições por elemento permanecem no projeto/medições e precisam de conferência própria no processamento externo. Métodos desconhecidos e pilares/paredes inclinados sem regra de orientação suportada ficam pendentes, sem área zero suposta.

Em **Conferir**, registre conferente, evidência e método antes de conferir cada serviço. Para uma área manual, informe o total explicitamente; em seleção múltipla, o aplicativo avisa que faz rateio proporcional à área candidata por elemento. Se não houver pesos geométricos, selecione um elemento por vez. O rateio é rastreabilidade de uma premissa manual, não cálculo dos contatos faltantes.

**Exemplo exclusivamente para testar o software:** adotar 340 m² manualmente permite percorrer o fluxo. Esse número não é resultado geométrico validado da obra. Registre essa condição na evidência; não o utilize como levantamento de fôrmas para execução.

## 4. Gerar pacotes de produção

Clique em **Pré-visualizar pacotes de produção**, confira local, serviço, elementos, unidade e datas, e confirme. Concretagem usa m³; armação usa kg; montagem de fôrmas usa m². Não existe um total físico que some as três unidades.

O sistema impede gerar novamente os mesmos elementos no mesmo serviço. O mesmo elemento pode participar de serviços diferentes. As tarefas são associadas pela fase correspondente do cronograma. Defina responsável, capacidade, critério de conclusão e restrições em **Produção**.

Uma divergência conhecida entre volume declarado e geométrico bloqueia o resultado completo de concreto e aço. Resolva-a explicitamente com método e evidência; não escolha silenciosamente o valor conveniente. Ao revisar uma conferência, o histórico original permanece disponível.

Quantidades vindas de conferências ficam protegidas na edição do pacote. Após recalibrar uma medida, **Atualizar com conferências vigentes** é uma ação explícita; exige revisão atual e libera a composição antiga para refazer. Reservas e compromissos congelados impedem essa substituição. Nenhuma revisão atualiza uma promessa silenciosamente.

## 5. Compor o recurso

Em **Suprimentos**, confira estoque e pedidos existentes. Preencha coeficiente recurso/serviço, perdas, especificação, evidência e prazos. Valores são premissas explícitas do caso; o aplicativo não fornece produtividade ou especificação estrutural por inferência.

- **Concreto:** confirmar especificação e janela de entrega. Concreto fresco não conta como estoque dias antes.
- **Aço:** massa estimada não produz bitolas, comprimentos ou dobras. Sem projeto/BBS confirmado, a reserva de compra e a confirmação do mapa permanecem bloqueadas.
- **Painéis:** informar sistema, ciclo e disponibilidade até a liberação. São capacidade reutilizável; duas frentes sequenciais de 20 m² podem usar a mesma capacidade de 20 m². Frentes simultâneas precisam de capacidade adicional.

Alterar início ou conclusão exige revalidar toda a janela de ocupação do recurso. Se a mudança causar reserva simultânea acima da capacidade, a alteração é recusada; libere/replaneje reservas explicitamente antes de recompor o recurso. Nenhuma reserva ou promessa anterior é apagada.

O primeiro recorte aceita um recurso principal por pacote. Composições com múltiplos insumos, escoramento detalhado e otimização de corte não estão implementadas.

## 6. Examinar o mapa

Abra **Mapa de suprimentos**. Quantidades compatíveis se agrupam por recurso, especificação, unidade, local e janela. Painéis usam pico de ocupação, não área acumulada de serviço.

As datas retrocedem da necessidade em dias corridos: preparar compra → pedido previsto → receber até → necessidade. Não há calendário de feriados. Promessa do fornecedor e compromisso congelado aparecem separadamente do plano atual. Falta de cobertura conferida deixa saldo indeterminado.

Confirme uma versão com conferente e evidência. Ela permanece histórica quando prazos, recursos ou cobertura mudam; uma nova prévia exige nova conferência. **Confirmar mapa não emite pedido.** Você pode exportar a prévia em JSON.

## 7. Reservar, receber e aprender

Registre propostas/capacidades por recurso; nenhuma proposta genérica de concreto é criada para aço ou painéis. Confira especificação, quantidade, evidência e janela antes de reservar. Capacidade não pode ser reservada duas vezes em períodos simultâneos.

Registre recebimento e rejeição na unidade do recurso. Em **Semana / PPC**, congele apenas pacotes prontos. Apontamento integral, evidência e prazo determinam o PPC, independentemente da unidade. No ensaio com três serviços, dois concluídos no prazo e um atrasado resultaram em **67% (2/3)**; o atraso não alterou o denominador.

## 8. Guardar o trabalho

**Arquivos → Exportar projeto** inclui IFC, decisões, conferências, catálogo alterado, recursos, reservas, recebimentos e versões do mapa. **Reabrir projeto** valida uma cópia antes de substituir o estado. Arquivos antigos schema 1 migram para schema 2 mantendo compromissos, PPC e bytes do IFC. Exporte o original antes de experimentar.

As análises Gemini/OpenAI continuam opcionais e propositivas. Chaves ficam em memória e não entram no arquivo. Não há contato com fornecedores, pedidos, negociação automática, envio ao financeiro ou pagamentos nesta funcionalidade.
