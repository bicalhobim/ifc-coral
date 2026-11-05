# QA — arquitetura mínima e IFC + CSV

> Registro histórico do piloto. As referências a “sem commit/push” e os limites numéricos abaixo descrevem aquela rodada; evolução posterior consta em [PROGRESSO.md](PROGRESSO.md) e no [guia atual](IMPORTACAO_CRONOGRAMA.md).

Data: 05/11/2026. Executor: frente IFC Coral / 2.3. Base Git: `88d18bc674a0cc8f0b7beb352a5a565d8e214d36`; alterações locais, sem novo commit ou push. Autorização de Lucas nesta conversa; coordenação 2.0 concordou após concluir as capturas da interface anterior. O guia didático da coordenação deve ser revisado contra esta versão antes da aula.

## Mudança entregue

- Mantidos navegador/TypeScript, ponte Node local e armazenamento JSON. Sem migração de banco nem alteração de schema do projeto portátil.
- Novo assistente **Associar CSV ao IFC**: diagnóstico restrito, CSV, vínculos editáveis, sugestão Codex opcional, aprovação, transformação determinística e aplicação da cópia validada pelo leitor 4D real.
- Arquivos original/CSV/manifesto/derivado arquivados; identidade física preservada; IDs externos de atividade persistidos no IFC como `TaskNId`, reconhecidos como `CSV:<id>`.
- Pacote sem data do serviço exige datas manuais explícitas; nenhuma substituição silenciosa por hoje. Quantificação ausente continua desconhecida.
- Conferência de elementos físicos independente da existência de tarefas 4D; propriedades/vínculos e localização de pacote usam identidade física.
- Salvamento canônico com revisão esperada conferida dentro da fila do servidor, erro de conflito em vez de sobrescrita concorrente. Não substitui bloqueio entre instâncias/editores externos; piloto de sessão única.

## Testes realizados

| Verificação | Resultado |
|---|---|
| `npm test` | 208 aprovados, 0 falhas, 0 ignorados |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado; permanece aviso de bundle acima de 500 kB |
| `node --experimental-strip-types src/ifc/schedule.selfcheck.ts` | `schedule.selfcheck OK` |
| Python `tools/schedule/test_schedule_ifc.py` | 2 testes, com casos IFC4/IFC2X3; aprovados |
| Integração real Node → Python | Acentos UTF-8, integridade CSV, reprocessamento e rejeição de alteração de datas aprovados |
| Dois escritores com mesmo hash esperado | Um grava; o outro recebe `ConflictError` |
| Quantidades/Compras IA regressão | Suíte existente aprovada; contrato, exportador e modelo TORRE02 sem diff nesta rodada |

Logs em `evidencias/piloto-ifc-csv-2026-11-05/`. O teste integrado Python é ignorado em máquinas sem o ambiente isolado no caminho previsto; **nesta execução não foi ignorado**. As fixtures são sintéticas e não substituem ensaio com os modelos reais dos alunos.

## Ensaio no navegador real

Executado no navegador integrado, servidor QA isolado `127.0.0.1:5189`, mesma aplicação e ponte de arquivos. Fixture própria com viga/laje, geometria e GlobalIds estáveis, sem cronograma/QTO. O seletor nativo não apareceu à automação; para testar a gravação real, somente a escolha de pasta foi injetada pelo construtor de teste do plugin. Destino temporário previamente definido. Isso **não valida a janela nativa do Windows**. A configuração distribuída continua usando o seletor nativo.

1. Criado projeto `QA IFC CSV` e importado `QA_sem_datas.ifc`.
2. Analisados 2 elementos estruturais IFC4. CSV com Fôrmas (06–07/11/2026) e Concretagem (08/11/2026), ambos no Pavimento 1.
3. Aplicação sem conferente/checkbox bloqueada.
4. Removido o vínculo A02 na prévia; chamada real Codex `gpt-6.1-sol` devolveu os dois GlobalIds compatíveis. A01 já preenchido permaneceu intacto. A IA apenas propôs, sem aplicar arquivo.
5. Após aprovação, cópia gerada, validada, arquivada e salva. O primeiro ensaio revelou leitura de pipe no Windows com acentuação incorreta. Corrigido UTF-8, acrescentado teste Node/Python real e comparação das linhas do manifesto com a prévia. Reprocessamento e leitor real confirmaram **Fôrmas** corretamente.
6. Fechado/reaberto pela lista de recentes: 2 atividades agregadas, 4 registros elemento/atividade, mesmas datas e identidades.
7. Clique em Concretagem selecionou os 2 elementos. Criado pacote com 08/11/2026 → 08/11/2026 e quantidade desconhecida. Salvo e reaberto; 1 pacote, `reviewRequired=false`, origem registrada como CSV aprovado.
8. Aberta a TORRE02 pelo cartão inicial; modelo e Gantt presentes, 180 atividades agregadas, datas de origem preservadas. Não reescrito o IFC TORRE02 nem percorrido novamente todo o ciclo PPC/compras nesta rodada.
9. Mensagens do assistente mantidas no cabeçalho fixo, visíveis com a rolagem no final. Ajustado texto para orientar **Analisar modelo** quando essa etapa ainda não foi feita.

Capturas: `04-gantt-reaberto.png`, `05-torre02.png`, `06-aviso-fixo.png`. A última mostra a disposição final do aviso; o texto de orientação recebeu o ajuste descrito no item 9 depois da captura. `03-assistente-aprovado.png` registra aplicação antes do acabamento do cabeçalho.

## Limites e próximos ensaios

- Novo assistente limitado a IFC2X3/IFC4 estrutural, 25 MB, 200 atividades/recorte, 50 atividades/elemento; não promete qualquer IFC.
- Bloqueia aplicação em modelo com pacotes ou cronograma externo já existente. PSet próprio pode ser reprocessado antes de haver pacotes.
- Sem edição IFC geral/de-para de quantidades/XLSX/harnesses adicionais. Codex é a única assistência IA nova; associação manual disponível. Datas/valores não são inventados pela IA.
- Precisa ensaio manual do seletor Windows, instalação em segundo computador e arquivo externo representativo do aluno. Chaves reais OpenAI/Gemini não foram ensaiadas nesta rodada.
- Persistência de tarefas continua derivada do IFC ao reabrir. Este recorte resolve o CSV ao incorporá-lo à cópia IFC; não implementa um segundo cronograma independente do modelo.
- Uma sessão de edição/servidor por projeto. CAS no servidor protege requisições concorrentes da mesma instância, não fornece coordenação distribuída.
- UI da importação é adicional. Slides/guia institucional não foram alterados; coordenação mantém a revisão pedagógica. Testes técnicos não são aceite institucional.

## Retomada e recuperação

Uso: [IMPORTACAO_CRONOGRAMA.md](IMPORTACAO_CRONOGRAMA.md). Arquivos QA reais em `%TEMP%/ifc-coral-pilot-20261105/qa/QA IFC CSV`; não são modelos distribuídos aos alunos. Logs/capturas foram copiados para o repositório, sem credenciais. O projeto do usuário na porta 5178 não foi operado; a página respondeu HTTP 200.

Nenhum rollback destrutivo é necessário: original IFC permanece arquivado e histórico local preserva versões. Antes de novo commit, apresentar este recibo e obter autorização individual de Lucas conforme `AGENTS.md`.
