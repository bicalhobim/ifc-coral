# Execução — IFC Coral, 17/10/2026

Plano: docs/superpowers/plans/2026-10-17-ifc-coral-mvp.md.

Autorização: autor pediu verificar C:/dev e seguir a sequência funcional proposta. As decisões de aula, 16 RF e 14 cenários já foram discutidas/aprovadas; não reabrir perguntas respondidas.

Ruling: usar a pasta vazia ifc4all-2 como repositório independente e branch feat/ifc-coral-mvp, em vez de alterar main do IFC4ALL — atende ao pedido anterior de nova solução sem marca ZapObras e preserva as alterações locais; risco é apenas o nome de pasta provisório, documentado ao autor.

Ruling: especificação e plano técnico detalham o plano já autorizado; execução nativa nesta conversa, sem nova rodada de confirmação. Nome IFC Coral provisório. Não criar/push de GitHub nesta etapa.

Pré-flight: identidade persistente alimenta domínio e UI; domínio alimenta exportação/IA; chaves nunca entram no domínio. A versão-base pública e o main têm as mesmas árvores viewer/modelos. Sem interfaces contraditórias identificadas.

- Base extraída de d97294fc55a24cc9c1681551a58aa5cbcc1099b5, somente viewer e TORRE02.
- Repositório original mantido; não rastreados agente.md e viewer/console-log.txt preservados.
- Task 1: baseline TORRE02 carregada no navegador; selfchecks originais passaram. Datas inexistentes falharam no teste e foram corrigidas; homônimos agrupados por modelo/local/serviço/datas. Fragments usa mapeamento getGuidsByLocalIds; teste reproduziu ausência de GlobalId em atributo e passou com adaptação.
- Task 2: domínio implementado; testes de cobertura, reserva dupla, prazo, evidência, compromisso congelado, PPC e arquivo adulterado passaram.
- Task 3: UI e persistência verificadas com TORRE02 real, pacote de 3 elementos, quatro restrições, fornecimento B, congelamento, entrega e execução tardias, PPC 0%/1. Exportação portátil e duas reaberturas na mesma sessão preservaram dados; importação de revisão com GlobalId alterado bloqueou conferência do vínculo ausente. Layout original sobrescrevia className da nova região; corrigido após inspeção visual.
- Task 4: dois adaptadores com transporte simulado aprovados; consulta sem chave recusada na UI. Revisão independente final concluída e achados materiais corrigidos. README, guia, créditos, matriz CA e roteiro de continuidade salvos. Chamadas pagas reais não executadas; validação com credenciais permanece pendente.
- Verificação final: 25 testes passaram, typecheck e três selfchecks passaram, build aprovado com aviso de bundle grande. Navegador sem erros capturados. Tela 1366x900 e 640x850 sem transbordamento horizontal; capturas em artifacts/.

Ruling: validar a oficina via CUA e registrar roteiro verificável, em vez de automatizar a UI com Playwright de terminal — política do navegador exige CUA; custo é ausência de replay headless nesta rodada.
Ruling: GlobalId + nome identificam a importação inicial; hash idêntico não duplica. Um arquivo renomeado com o mesmo projeto IFC oferece escolha explícita entre revisão e outra disciplina — evita fusão silenciosa; custo é um passo adicional de conferência para revisão renomeada.


Ruling: calendário explícito simplificado de dias corridos (2 para fornecimento + 1 de preparação), separado do D+n abstrato do livro — permite o primeiro recorte local conferível; custo é implementar calendário útil configurável antes de prometer prazos comerciais.

## Revisão final

- Corrigidos os oito achados do revisor: IDs de runtime únicos; escolha de revisão renomeada; cleanup integral de carregamento; datas com timestamp; referência IFC inexistente; reposição após rejeição; fórmula CSV; campos JSON herdados.
- Acrescentados normalização da árvore Fragments e chave de agrupamento com slot de origem. Os wrappers de categoria não podem apagar instâncias reais.
- Originais preservados: C:/dev/ifc4all continua com apenas agente.md e viewer/console-log.txt não rastreados já existentes. Dependências reaproveitadas por junction; nenhum npm install/ci executado.
- Artefato local de validação: artifacts/oficina-validada.json. Capturas: 01-ciclo-concretagem.jpg e 02-tela-estreita.jpg. Esses arquivos são evidências sintéticas ignoradas pelo Git, não kit institucional.
- Limites de aceite: ver docs/ACEITE.md; CA-04/09/11/13/14 parciais e CA-12 fora do recorte. Não afirmar conclusão dos 16 RF ou compra real.

## Próxima sessão

1. Abrir README.md e docs/ACEITE.md nesta pasta, iniciar via iniciar.ps1 se necessário.
2. Professor experimentar a decisão com TORRE02; selecionar a frente final do exercício.
3. Validar Gemini/OpenAI ao vivo com chave individual, sem salvá-la em projeto/captura.
4. Testar a navegação v03 com docs/NAVEGACAO_4D_QUANTIDADES.md. Depois atualizar o guia ilustrado de 23 slides (a v02 permanece histórica), produzir slides conceituais e o template de cinco slides do grupo; atualizar livro/caderno com interfaces finais.
5. Receber template de equalização e demanda/fornecedores da demonstração de agentes antes de executar contatos reais.
6. Preparar distribuição limpa e licença/créditos definitivos, então publicar quando solicitado.

## Interface v02 e guia operacional

- Interface clara, minimalista, com navegação segmentada, menu Arquivos, propostas expansíveis e ajuda contextual por mouse/foco/clique/Escape. Evidências usam campos multilinha; erro de validação conserva o texto digitado. Novo projeto retorna à etapa Produção.
- Autor confirmou a referência cromática Accenture. Tokens conferidos no gerador local: #A100FF e #7500C0. Nenhum nome, logo, copyright ou chevron corporativo transferido para aplicativo ou slides. Variante educacional salva em C:/Users/lucas/.codex/skills/slides-educacionais-lucas-bicalho, com assinatura Professor Lucas Bicalho.
- 23 capturas reais obtidas em origem de ensaio separada, http://127.0.0.1:5180/, preservando o projeto da porta 5178. Fluxo repetido após a correção de paleta: 6 elementos IFC, 12 m³ didáticos, quatro restrições conferidas, B confirmado, reserva, compromisso, recebimento e conclusão no prazo. PPC 100% (1/1). Exportação e reabertura conferidas.
- Entrega: PPTX editável com marcações, PDF de consulta, roteiro Markdown, prints originais e JSON portátil do exemplo concluído. Pasta materials/guia-operacao-v02. Guia de operação não substitui os slides conceituais da disciplina nem o template de apresentação do grupo.
- Verificação: 25 testes, typecheck, três selfchecks e build aprovados. Build mantém aviso de tamanho do bundle. Interface 640x850 sem transbordamento horizontal; teste de mensagem de validação preservou a evidência. Navegador de ensaio sem erros capturados.
- Limites preservados: nenhuma chamada real de Gemini/OpenAI com chave, nenhum contato, compra ou pagamento real. Documentos institucionais aprovados e repositório original preservados.

## Interface v03 · navegação, reprodução e volume declarado

- Barra compacta com ícones sobre o modelo. Árvore e propriedades alternam no painel lateral reservado; 4D ocupa a faixa inferior redimensionável por mouse/teclado. Fechar os painéis devolve espaço ao canvas. Oficina recolhível, enquadramento de seleção/modelo e vistas 3D/Topo/Frente/Lado disponíveis.
- Referência visual: prints existentes de Forma examinados somente para navegação e documentação oficial Autodesk. Não se copiaram dados de cliente. Paleta roxa preservada, sem marca corporativa na interface.
- O Gantt anterior só tinha controle manual de data. Agora possui play/pausa, início, anterior/próximo, velocidade e escopo modelo/seleção. As datas de início e término são os marcos; atividades simultâneas aparecem juntas. A geometria iniciada permanece visível e a atividade em curso fica roxa. Fechar o 4D pausa; o botão de olho restaura e enquadra o modelo. Não altera realizado/PPC.
- Corrigidos no ensaio: barra de reprodução abaixo da área visível; pausa que restaurava o valor anterior do seletor de escopo/slider; propriedades antigas após reabertura; enquadramento de lajes de perfil. A causa deste último era `camera-controls.fitToBox`, que gira para o eixo mais próximo; o enquadramento agora usa a esfera envolvente para conservar a orientação.
- Leitura de QTO STEP: IfcQuantityVolume via IfcElementQuantity. Preferência por NetVolume, unidade explícita ou do IfcProject, conversão volumétrica SI/declarada para m³, valores inválidos/conflitantes pendentes. Nenhuma unidade é presumida pela escala da geometria. Catálogo TORRE02: 764 elementos com volume reconhecido.
- Seleção real de concretagem PAV 01: seis GlobalIds únicos, **34,707 m³**. O teste repete as três fases do mesmo elemento sem triplicar seu volume. Caso novo e seleção de concretagem recebem o quantitativo completo. Projeto antigo não é recalculado silenciosamente; atualização explícita indisponível para compromisso congelado. Conferido na porta 5178: valor anterior de 12 m³ e bloqueio de atualização preservados.
- Ensaio isolado na porta 5180: caso novo + pacote da seleção com 6 referências/6 tarefas cada, demanda 34,707 m³; propostas fictícias A/B/C com capacidade correspondente e totais R$ 20.082,99 / R$ 21.865,41 / R$ 19.088,85. Redução manual a 1 m³ e aplicação explícita do IFC voltaram a 34,707 m³. Arquivo exportado/reaberto preservou os dois pacotes e reconstruiu o volume; tabela/CSV conferidos.
- Reprodução seleção: 23/10/2026 = 0 visíveis; 24/10 = 6 visíveis e ativos; 25/10 = 6 visíveis, 0 ativos. Reprodução geral: 03/04/2025 = 212 elementos ativos; execução avançou até 12/11/2026 com 587 visíveis e 6 ativos e foi pausada. Slider, escopo e pausa ao fechar também ensaiados no navegador.
- Espaço conferido por retângulos DOM: em 1280×720, painel lateral termina em x=231 e o canvas começa em x=231; 4D fica abaixo do canvas. Reduzir a faixa inferior de 255 para 235 px devolveu 20 px à altura do modelo. Em 640×850, documento/corpo com 625 px, sem transbordamento horizontal; os dois painéis abertos continuam fora do canvas.
- Verificação final: **37 testes**, typecheck, três selfchecks e build aprovados. Bundle BIM continua com aviso de tamanho. Navegador de ensaio sem erros capturados. Evidências locais em artifacts/v03; roteiro atual em docs/NAVEGACAO_4D_QUANTIDADES.md. Guia PPTX/PDF v02 preservado e identificado como edição anterior; não foi regenerado nesta rodada, conforme o foco nas primeiras modificações do aplicativo.
- Limites: volume declarado não é medição geométrica nova, especificação validada de concreto, cálculo de aço/formas, perdas, produtividade ou duração. Fonte incompleta não preenche demanda como se fosse total. Volumes da tabela são por atividade, sem representar consumo somável entre fases. Domínio/arquivo portátil permanecem no schema 1; catálogo é reconstruído do IFC. Nenhuma instalação na junction compartilhada, publicação ou compra real.

## Quantificação · diagnóstico e proposta

- Pedido do autor: estimar aço/formas, enriquecer IFC com IfcOpenShell e planejar catálogo por elemento/serviço para evolução do aplicativo. Continua neste chat/repositório; não foi criado outro chat.
- IfcOpenShell 0.9.0.post1 instalado somente em `.cache/ifc-quantification-venv`. Scripts exploratórios na `.cache`; relatórios/CSV/IFC derivado em artifacts/quantification-discovery. Dependências JavaScript compartilhadas intactas.
- **Correção de contagem:** o IFC possui 764 ocorrências; o Gantt incluía 620 definições de tipos porque `/COLUMN/`, `/BEAM/` etc. também casavam IfcColumnType/IfcBeamType. Categorias ancoradas, inclusão de IfcPile e deduplicação de localIds corrigidas. Regressão falhou antes e passou depois; navegador de ensaio passou a mostrar **764 / 2.292**. Os números anteriores ficam como histórico e não devem ser repetidos como inventário atual.
- Reabertura de guia de fundo deixou de depender de animação de enquadramento. A câmera é posicionada sem transição no carregamento; navegação manual mantém animação.
- Classificação auditada: 233 vigas, 276 pilares, 140 lajes suspensas, 1 BASESLAB, 26 blocos, 80 estacas exportadas como IfcFooting e 8 paredes de contenção. Sem barras/malhas de armadura modeladas. Não usar só classe ou substring “estaca” para separar blocos sobre estacas de estacas.
- Geometrias: 764/764 processadas, sem erros, com áreas por orientação. Iterator paralelo não retornou e foi interrompido apenas no processo do ensaio; create_shape sequencial terminou em aproximadamente 2,6 s. Volume calculado em coordenadas globais sofreu cancelamento numérico; recentrar vértices recupera o volume esperado. Nas seis lajes: QTO 34,707 m³, volume geométrico estável 34,707 m³, face inferior 347,07 m² antes de descontar contatos.
- Cópia `TORRE02_QUANTIFICACAO_ENSAIO_R01.ifc`: custom set Coral_Quantificacao_Ensaio, unidades explícitas, origem/hash/status; 649 massas estimadas com taxas propostas 60/85/120 kg/m³, baseadas em comparáveis históricos 12/17 pavimentos. 115 elementos de fundação/contenção ficam sem taxa numérica; nenhuma área de fôrma aprovada, nenhum valor aprovado para compra/execução. Reabertura verificou todos os GUIDs e QTOs preservados e original inalterado. Não foi criado aço fictício como barras 3D nem substituído o modelo público do app.
- Especificação: docs/superpowers/specs/2026-10-17-catalogo-quantificacao-design.md. Plano por entregas: docs/superpowers/plans/2026-10-17-catalogo-quantificacao.md. Leitura independente de construtibilidade concluída: nada importante faltando; não é validação estrutural das taxas.
- Cópia IFC enriquecida reimportada como revisão apenas na origem de ensaio 5180. As propriedades de taxa/massa/status apareceram no visualizador; o QTO das seis lajes permanece 34,707 m³. Na guia atual do professor (5178), contagem 764/2.292 e quantidade original de 12 m³ conferidas. Scripts do ensaio e requirements congelado preservados em tools/quantification-pilot; não confundir com módulo de catálogo genérico.
- Pergunta ao autor pendente: método executivo das estacas e das contenções. Até resposta, não assumir fôrma dos dois lados nem zerar fôrma/armadura da fundação.
- Verificação do aplicativo após correção: 38 testes, typecheck, três selfchecks e build passaram. O catálogo completo, o motor de descontos de contato, a migração multiunidade e o novo mapa de suprimentos ainda são trabalho proposto, não funcionalidades entregues.
# Quantificação v04 · execução do plano de 17/10/2026

**Fechamento após revisão independente:** 63 testes Node + 12 Python, typecheck, três selfchecks e build aprovados. Corrigidos janela de reuso após prorrogação, pilares inclinados, conflito de volumes, vínculo de unidade/serviço, evidência manual vazia, autoria da classificação, método desconhecido e histórico das revisões. Registro em [REVISAO_QUANTIFICACAO.md](REVISAO_QUANTIFICACAO.md). Os números de testes anteriores abaixo descrevem os marcos intermediários.

O diagnóstico anterior foi evoluído para o catálogo do aplicativo. Plano executado em cinco entregas, preservando `C:/dev/ifc4all`, a junction e o material institucional aprovado.

- Catálogo versionado, classificação específica e resultados com origem/unidade/entradas. Taxas 60/85/120 continuam estimativas didáticas propostas. Fundação/contenção sem taxa/método confirmado permanecem pendentes.
- Ferramenta local em `tools/quantification`: volume recentrado, faces reais, fechamento da malha, métodos de serviço e contatos coplanares integrais/parciais. TORRE02 processada com 764 elementos e zero erro de geração geométrica em cerca de 10,3 s incluindo contatos/exportação. Hash original preservado. Interpenetrações/AABB sobrepostos são pendências conservadoras; não se aprovou automaticamente área efetiva de fôrma da torre.
- Painel compacto **Quantificação → Medir/Catálogo/Conferir**, alteração de parâmetros, substituição de classificação justificada, conferência humana e medição manual com evidência. Alteração de taxa/modelo/método invalida conferência. Relatório de outro método não pode ser tratado como área completa.
- Schema 2 mantém importação/migração de schema 1. Serviço, recurso, unidade e especificação separados; prévia explícita antes de gerar pacotes; sobreposição no mesmo serviço bloqueada. Recursos têm composição, perdas, ciclo/prazos e especificação. Capacidade de painéis considera simultaneidade. Um recurso principal por pacote nesta edição.
- Mapa de suprimentos agrupa demandas compatíveis e calcula datas retrocedidas; distingue saldo, promessa e compromisso congelado. Confirmação humana cria versão histórica, não pedido. BBS/especificação e cobertura desconhecida bloqueiam sua confirmação.
- Ensaio real no navegador, origem isolada 5180: seis lajes → **34,707 m³**, **2.082,42 kg a 60 kg/m³**, **347,07 m² inferiores / 365,59 m² candidatos**. Para testar o fluxo foi introduzida manualmente uma **premissa fictícia de 340 m²**, não uma área de fôrma validada do projeto. Gerados três pacotes por serviço e três recursos com especificações explicitamente fictícias. Bloqueio de mapa sem BBS observado; reservas e recebimentos nas três unidades ensaiados.
- Três compromissos congelados, duas conclusões no prazo e uma atrasada: **PPC 67% (2/3)**. Exportação/reabertura preservou IFC, dezoito conferências, três recursos, reservas/recebimentos, mapa e PPC. Projeto antigo do professor na porta 5178 continua com **12 m³** congelados e atualização desabilitada.
- Evidência: `artifacts/quantification-v1/browser`, incluindo backup antes do ensaio, screenshots e `three-services-completed.json`. Roteiro atual: `docs/QUANTIFICACAO.md`; PPTX/PDF v02 permanece histórico.
- Verificação antes da revisão independente: **57 testes Node + 10 testes Python**, typecheck, três selfchecks e build passaram. Aviso de tamanho do bundle BIM permanece. Nenhuma chamada real de IA, contato, cotação externa, compra, envio ao financeiro, publicação ou pagamento.

## Seleção múltipla · 19/10/2026

- Causa confirmada no código: viewport e árvore substituíam a seleção a cada clique e ignoravam Ctrl/Shift/Command. A árvore também limpava suas marcações antes de comunicar a seleção.
- Corrigido o conjunto transitório por instância de modelo + localId. Ctrl/Shift/Command + clique adiciona/remove; botão Seleção múltipla permite o mesmo sem teclado. Clique simples substitui; fundo vazio limpa apenas no modo simples. Esc e botão Limpar seleção disponíveis.
- Contador, realces, árvore, propriedades, quantificação e tarefas para pacotes usam o mesmo conjunto. Fases de um elemento não multiplicam seu volume. Árvore continua aberta durante a escolha; enquadramento explícito mantém a câmera estável entre cliques. Arrasto de câmera não seleciona. Cliques assíncronos são processados em ordem e invalidados ao trocar de projeto/seleção por outra ferramenta.
- Seleção externa sincroniza o escopo disponível do 4D. Selecionar uma atividade continua substituindo o conjunto pelos seus elementos, com suas tarefas específicas. Abrir um pacote também sincroniza o conjunto, em vez de apenas realçar uma seleção diferente.
- Verificação: 71 testes Node (8 novos), typecheck, três selfchecks e build aprovados. Log local em .cache/selection-verify-2026-10-19.log. Aviso já existente de tamanho do bundle permanece. Servidor 5178 respondeu HTTP 200.
- Conferência visual desta alteração PENDENTE: as guias acessíveis estavam numa página de erro e a política do navegador bloqueou sua aquisição. Solicitada atualização manual da guia; não houve contorno da restrição nem declaração de teste visual. Roteiro em docs/NAVEGACAO_4D_QUANTIDADES.md.
