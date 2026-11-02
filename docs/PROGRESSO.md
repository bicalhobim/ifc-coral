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

## Projetos locais e portal demonstrativo · 31/10/2026 · alterações locais sem commit

- Login demonstrativo aceita quaisquer campos não vazios e descarta os dados. Home com criação por nome/pasta pai, abertura de pasta, recentes por handle nativo e recuperação do cache legado.
- Arquivo portátil autoritativo por pasta, cópias IFC por hash, relatórios geométricos e exportações vinculadas à pasta escolhida. Salvar/Ctrl+S e Salvar como/Ctrl+Shift+S; cópia com identidade própria. Indicador de alterações, confirmação ao voltar à home, bloqueio durante gravação, proteção contra versão obsoleta e retomada de falha inicial com marcador específico.
- Menu da raiz de cada modelo por clique direito ou reticências: metadados, substituição, exportação e remoção. Remoção de modelo vinculado a pacotes bloqueada; arquivos originais preservados.
- Exportações CSV/JSON/IFC encaminhadas à pasta ativa, com destino capturado durante a operação. Relatórios geométricos reabertos junto do projeto. Dados de login/chaves não são incluídos no armazenamento.
- Revisão independente encontrou e corrigiu corrida na inicialização do motor, cancelamento de Salvar como durante escrita, identidade antiga no portátil e troca de destino durante exportação.
- Testes: 87 testes Node, tipos, três selfchecks e build aprovados. Testes de arquivos usam doubles estruturais da API, não comprovam seletores e permissões reais do Windows.
- Navegador: login e home operados com valores fictícios; sessão anterior recuperada, menu de clique direito e metadados abertos, Ctrl+Shift+S abriu Salvar como, retorno à home pediu decisão e permitiu descarte do estado transitório. Não foram editados/salvos os dados da sessão original. Capturas em .cache/workspace-ui.
- Limite de verificação: o seletor de pastas não ficou disponível à automação nativa; criação/salvamento/reabertura em pasta real e persistência real de handles ainda precisam de ensaio pelo usuário. Não declarar essa etapa visualmente aprovada. Guia em docs/PROJETOS_LOCAIS.md.
- Nenhum commit ou push desta implementação: requer autorização específica do autor conforme AGENTS.md.

## Correção da criação de pastas · 31/10/2026 · alterações locais sem commit

- A mensagem de cancelamento apenas expunha a interrupção do seletor do navegador; não resolvia a criação. A versão local Windows agora usa um seletor interno de pastas, servido pelo próprio processo local do IFC Coral, sem depender da janela externa do navegador.
- Home simplificada: **Novo projeto → nome e local → Escolher pasta → Usar esta pasta → Criar projeto**. O caminho final aparece antes da confirmação. Cancelar a seleção é um resultado neutro e não cria arquivos. **Salvar como** usa o mesmo diálogo.
- Serviço de arquivos com origem de loopback e sessão verificadas, referências apenas a diretórios selecionados, rejeição de travessia e links/junctions, gravação atômica e registro de destinos em `%LOCALAPPDATA%/IFC Coral/folders.json`. Sem novas dependências. Hospedagem somente estática mantém o fallback da API do navegador.
- Ensaio real pelo navegador integrado: criado `QA Pasta 31out` em `.cache/workspace-qa`, importada TORRE02, salvo pacote de 8.291.711 bytes e cópia IFC de 5.497.170 bytes, reaberto por Recentes após recarga/reinício do servidor de desenvolvimento, com modelo e 4D. **Salvar como** criou `QA Pasta 31out - copia` com outra identidade e preservou o original. Cancelamento de `QA Cancelado` voltou à home sem erro e sem criar pasta. Dados dos projetos originais do usuário preservados.
- Testes: **94 aprovados**, typecheck, selfchecks schedule/gantt/tree e build aprovados; aviso conhecido de tamanho do bundle. Log `.cache/folder-flow-verify.log`. Captura `.cache/workspace-ui/seletor-pastas-funcional.png`.
- Esta seção substitui a pendência de teste de pastas reais da seção anterior para esta máquina. Instalação em outro computador e arquivos grandes continuam sem ensaio. Nenhum commit ou push autorizado nesta rodada.

## Seleção nativa do Windows · 31/10/2026 · alterações locais sem commit

- Por solicitação do Lucas, removidos o explorador de pastas em HTML e as rotas web de navegação/seleção por caminho. **Escolher pasta** agora abre o Common Item Dialog nativo do Windows, via auxiliar PowerShell STA e `IFileOpenDialog` com seleção de diretórios. Nome/destino do projeto e restante do salvamento preservados.
- Cancelamento nativo retorna resultado próprio; uma única janela fica pendente por vez, com expiração de cinco minutos. Ajustada a visibilidade do processo auxiliar e removido o proprietário Forms invisível da tentativa anterior. Caminhos não são inseridos em comandos shell; o serviço recebe somente o resultado confirmado no diálogo.
- Teste integrado: a janela retornou o destino `Academic OS - 03-Ouro/02_Docente/EBPOS_IA_BIM/M08_Obras_IA/99_Projeto_Teste_IFC_Coral`; o projeto `QA Windows nativo` foi criado pela interface nesse destino, com arquivo principal gravado. A janela não ficou acessível ao controle nativo automatizado; a escolha retornou durante o ensaio com o usuário. Não declarar cliques automatizados dentro da janela do Windows. O cancelamento foi coberto pelo teste de protocolo, sem novo ensaio manual.
- O serviço local caiu antes da confirmação; foi restabelecido em processo de fundo, e a repetição da gravação funcionou com renovação da sessão. Logs `.cache/native-server.stdout.log` e `.cache/native-server.stderr.log`.
- Verificação: **95 testes**, typecheck, três selfchecks e build aprovados; aviso conhecido de tamanho do bundle. Log `.cache/native-folder-verify.log`. Sem commit ou push.

## Separação de projeto comum e template · 31/10/2026 · alterações locais sem commit

- Removido **Abrir TORRE02** do editor; **Importar IFC** é a ação principal. Projeto em branco tem instruções neutras, sem caso de concretagem, notas TORRE02 ou geração de cotações de exemplo.
- O cartão da home cria o exercício com origem didática explícita, validada e persistente. Cópias e arquivos portáteis preservam a identificação. Nome/hash de IFC importado não ativam o template. Projetos anteriores sem marca continuam comuns; seus dados não são removidos nem convertidos.
- Caso sintético e relatório geométrico incluído ficam restritos ao exercício. Linguagem de navegação e orientação da IA para projetos comuns foi neutralizada.
- Verificação: **97 testes**, typecheck, selfchecks e build aprovados. Log `.cache/project-context-verify.log`. Conferidos no navegador: projeto vazio comum, template pelo cartão e retorno a projeto comum com IFC importado, sem botão/nota TORRE02 nem criação de caso didático. Arquivos de dados originais preservados. Capturas `.cache/workspace-ui/projeto-vazio-sem-template.png` e `.cache/workspace-ui/projeto-com-ifc-sem-template.png`.
- Sem commit ou push.

## Pacote por seleção e avisos legíveis · 31/10/2026 · alterações locais sem commit

- Reproduzido na sessão aberta: clique para criar com zero selecionados. A validação era esperada, mas `.welcome` centralizado colocava o erro acima do corpo, oculto pelo restante da interface. Dados do professor preservados.
- Pré-requisito visível, botão liberado apenas com seleção compatível, estado atualizado após clique 3D/4D sem reiniciar os campos. Criação extraída para domínio testável, sem triplicar volume por fases. Avisos em área própria entre navegação e corpo; alinhamento inicial ao topo.
- Ensaio no navegador interno com cópia de QA: criação pelo 3D, seleção múltipla, duplicidade, propriedades, vistas, reprodução 4D, definição, quatro restrições, mapa e três propostas, reservas elegíveis/não elegíveis, recebimento, congelamento, PPC tardio/no prazo, quantificação e catálogo, guardas de IA sem chave, metadados, salvamento, exportação e reabertura com PPC preservado.
- Encontrada e corrigida a ausência de caminho para a primeira proposta em pacotes comuns de concreto: uso de composição de recursos e cadastro, preservando comparação/coberturas históricas. Registros comuns não ganham marca de exemplo automaticamente.
- Aviso conferido em 916×704 e 465×704, abaixo das abas com 12 px de intervalo. Sem aprovação de taxas de aço/fôrma, chamadas autenticadas de IA ou operações externas.
- **102 testes**, tipos, três selfchecks e build aprovados. Relatório: [QA de fluxo de pacotes](QA_FLUXO_PACOTES_2026-10-31.md); evidências em `artifacts/qa-package-flow-2026-10-31`.
- Nenhum commit ou push. A sessão original tem alterações pendentes; salvar antes de recarregar para receber o JavaScript novo.


## Seleção hierárquica, gestão de pacotes e janelas · 31/10/2026 · alterações locais sem commit

- Árvore seleciona descendentes físicos por pavimento/modelo. Shift seleciona intervalo inclusivo de linhas visíveis; Ctrl/⌘ alterna grupos e Ctrl+Shift une intervalos. Contêineres espaciais não são contados como objetos físicos. Seleção total/parcial sincronizada com 3D e quantificação.
- Pacote da seleção usa o pavimento espacial para nome/local, evitando herdar localização divergente da classificação 4D. Datas e identidades de atividades permanecem rastreáveis.
- Pacote manual com unidade, definição editável, confirmação de exclusão e desfazer da última exclusão na sessão. Compromissos/realizados/reservas/mapas confirmados protegidos; IFC, medições e propostas preservados.
- Janelas independentes à esquerda/direita/abaixo ou flutuantes dentro do visualizador; arrastar título, redimensionar canto/divisores, repartir painéis empilhados, fixar/recolher, presets e restauração de disposição. Campos preservados ao mover. Referências visuais e help oficiais Navisworks consultadas.
- **112 testes**, tipos, três selfchecks e build aprovados. QA real: pavimento 31 elementos, três pavimentos 93, Ctrl remove 31, intervalo de cinco vigas; CRUD de rascunho; pacote congelado protegido; janelas simultâneas/movimento/redimensionamento/fixação/restauração. Sem erros no console observado.
- [Guia dos controles](SELECAO_PACOTES_JANELAS.md), [relatório de QA](QA_SELECAO_JANELAS_2026-10-31.md); capturas e log em `artifacts/qa-selection-windows-2026-10-31`.
- Não houve commit/push. Salvar alterações antes de atualizar sessões antigas no navegador. Em janela estreita, usar Ampliar modelo ou recolher painéis para leitura confortável.


## UX de restrições, catálogo e memória · 01/11/2026 · revisão local

- Checkpoint autorizado publicado antes da revisão: `79626c1` em `origin/main`, com os 112 testes da versão anterior aprovados. Novo trabalho permanece sem commit.
- Checklist próprio em Produção: visão de liberadas/total, filtros, responsável/prazo/ação, evidência/conferente e alcance todo o pacote ou elementos específicos. Referências persistentes modelo + GlobalId; guardar apontamento não libera; alterar alcance reabre. Novos pacotes separam mão de obra e equipamentos. Projetos anteriores preservados.
- Memória legível e paginada, com entradas/unidades/fórmula/ações e localização no 3D. Nome e pavimento substituem os identificadores na leitura principal; rastreabilidade recolhida.
- Catálogo prioriza tipos selecionados, apresenta métodos de superfícies suportados, fonte/premissa editável e prévia antes de salvar. A taxa recalcula aço; método exige relatório compatível ou conferência manual, sem gerar geometria automaticamente.
- **118 testes**, tipos, selfchecks e build aprovados. Ensaio visual e persistência real em cópia de QA, incluindo restrição de uma viga, taxa 90 kg/m³, cancelamento de prévia, gravação/reabertura e paginação/localização.
- [Guia de operação](GUIA_RESTRICOES_QUANTIFICACAO.md), [relatório de QA](QA_UX_RESTRICOES_QUANTIFICACAO.md); evidências em `artifacts/qa-restrictions-quantification`.


## Propriedades e prints de evidência · 01/11/2026 · revisão local

- Corrigida regra CSS antiga que mantinha Propriedades com display:none no modo normal, apesar dos dados carregados. Conferido encaixado e flutuante no navegador.
- Evidência aceita anexos PNG/JPEG/WebP com miniatura e visualização ampliada; arquivo, arrastar e colar implementados. Imagens incorporadas ao projeto, preservadas em JSON/portátil/Salvar como. Limites explícitos e validação de formato; sem envio automático de bytes de imagem à IA.
- Conferente continua obrigatório; texto ou imagem podem sustentar a evidência. Alterar prints reabre a condição até nova confirmação.
- **121 testes**, tipos, selfchecks e build aprovados. Upload JPEG, liberação só com print, gravação e reabertura real na cópia de QA confirmados. Dados do professor não foram salvos/recarregados pelo agente.
- [QA e limites](QA_PROPRIEDADES_PRINTS.md), [guia atualizado](GUIA_RESTRICOES_QUANTIFICACAO.md). Capturas/log em `artifacts/qa-properties-prints`. Nenhum novo commit ou push.


## Fechamento da rodada · commit autorizado por Lucas

- Consolidar checklist de restrições por elementos IFC, memória de cálculo legível, catálogo com métodos/fonte/prévia, propriedades visíveis e prints locais de evidência.
- Validação funcional anterior: 121 testes, tipos, selfchecks e build, com ensaio visual e reabertura em pasta de QA. Relatórios e guia acompanham o código; arquivos de QA e imagens locais ficam fora do Git.
- Publicação deste estado expressamente autorizada ao encerrar a sessão. O fechamento desta rodada não significa conclusão do produto; as demais funcionalidades e o ensaio continuado ficam para a próxima retomada.
- Não executar novas funcionalidades nem alterar os projetos de trabalho do professor nesta rodada de commit.

## Restrições propostas por IA · 01/11/2026 · nova rodada autorizada, sem commit

- Assistente no checklist e na aba IA: contexto do pacote selecionado, resumo/fatos/lacunas e propostas editáveis, com seleção e conferente antes da incorporação.
- Codex local pelo servidor e executável oficial autenticado; priorização do Codex Desktop evita o CLI antigo encontrado no PATH desta máquina. Alternativas OpenAI/Gemini com chave individual somente em memória e modelo explícito.
- Saída estruturada validada, alcance por modelo/GlobalId, contexto desatualizado recusado, condições anteriores preservadas e origem registrada. Condições novas entram pendentes; compromisso congelado não é alterado por esse fluxo.
- **134 testes**, tipos, três selfchecks e build aprovados. Chamadas reais ao Codex e ensaio no navegador, incluindo edição, gravação e reabertura da cópia própria de QA. OpenAI/Gemini com transporte controlado e validação de ausência de chave; chamadas reais dessas APIs continuam pendentes.
- [Operação e instalação](IA_RESTRICOES.md) · [QA, provas e limites](QA_IA_RESTRICOES.md) · [Arquitetura escolhida](PLANO_IA_RESTRICOES.md).
- Nenhum novo commit/push. Alterações prontas para revisão do autor; kit institucional e projeto aberto do professor preservados.

## Refinamento das propostas · abrangência e síntese

- Análise orientada às seis áreas de preparação: projeto, frente/predecessoras, mão de obra, equipamentos, materiais e ambiente/segurança (incluindo iluminação e acesso conforme o serviço).
- Categorias pendentes exigem cobertura; condições genéricas não suprimem o detalhamento. Atendimento integral por evidência, inclusive print, é preservado; atendimento parcial não libera o conjunto.
- Cartões curtos com condição, como preparar e evidência; edição/fatos/fontes recolhidos. Limites de texto no schema e na revisão.
- Ensaio real: oito propostas em seis categorias na TORRE02, edição e incorporação de uma condição de iluminação/acesso como pendente. Testes e evidências em `QA_IA_RESTRICOES.md` e `.cache/constraint-coverage-verify.log`.
- Alterações locais sem commit; nenhuma publicação nesta revisão.

## Quantificação herdada nos pacotes · 01/11/2026 · revisão local

- Medir oferece uso direto por serviço; o pacote oferece **Trazer quantificação da seleção**, inclusive para rascunhos manuais sem vínculos. Quantidade conferida, elementos e memória passam juntos, sem redigitação do volume IFC.
- Concreto em m³, armação em kg e fôrmas em m² mantêm pacotes próprios. Conferências vigentes podem ser reutilizadas; medições manuais justificadas são aceitas mesmo sem QTO. Revisões, escopo incompatível, reservas e compromissos congelados têm proteção explícita.
- Ensaio visual com dez elementos reais da TORRE02: concreto 40,585 m³ e aço estimado 3.516,826 kg com taxas sintéticas 100/80 kg/m³. Pacote manual atualizado e pacote de armação criado; fôrmas pendentes preservadas.
- **147 testes**, tipos, três selfchecks e build. Serialização/reabertura testada no domínio; gravação em pasta real não repetida pela UI nesta rodada. Dados do professor preservados.
- [Guia de operação](QUANTIFICACAO_PARA_PACOTES.md) e [QA, capturas e limites](QA_QUANTIFICACAO_PACOTES.md). Alterações locais sem commit/push.

## Checkpoint autorizado antes do catálogo de serviços · 01/11/2026

- Lucas autorizou expressamente o commit do estado atual antes de qualquer alteração no novo fluxo de serviços/suprimentos. Este checkpoint reúne restrições generativas via Codex/OpenAI/Gemini, propostas sintéticas por categoria e herança da quantificação nos pacotes, com os respectivos testes e relatórios.
- Verificação desta rodada: 147 testes, tipos, três selfchecks e build; log local `.cache/checkpoint-2026-11-01-verify.log`. Permanece o aviso de bundle grande. QA visual anterior registrado nos relatórios específicos; não foram feitas novas chamadas de IA ou operações em projetos do professor nesta rodada.
- Catálogo editável de serviços, composições com vários insumos e unificação da criação de pacotes ainda são proposta para a próxima atualização. O mapa atual mantém os três serviços e suas regras existentes; não emite compras.
- Registros anteriores de “sem commit” descrevem o estado de cada rodada na data em que foram escritos; este fechamento consolida essas alterações.
