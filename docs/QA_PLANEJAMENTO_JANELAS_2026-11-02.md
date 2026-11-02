# QA — planejamento integrado e janelas — 02/11/2026

Checkpoint autorizado antes desta implementação: `468636f`. Alterações posteriores locais, sem novo commit ou push. Projeto do professor Beta.22 preservado; ensaio em QA Integracao 02nov com TORRE02, pelo navegador integrado.

## Verificações

- 180 testes aprovados, zero falhas. Typecheck e build aprovados; schedule.selfcheck OK. Persiste aviso de tamanho do bundle (~6,24 MB antes de gzip).
- Testes novos cobrem identidade modelo + GlobalId, associação por serviço/tarefa, alcance das restrições, filtros por sobreposição de datas, ordenação dos locais, ambiguidade das guias, deduplicação das faixas e posicionamento sem sobreposição.
- Clique em concretagem de vigas do Pavimento 1 selecionou 11 elementos e abriu o pacote correto, concluído, responsável Equipe QA. Volume IFC 19,434 m³ e quantidade operacional manual 20 m³ continuaram distintos.
- Filtros responsável + concreto retornaram uma atividade. Busca por concretagem de vigas retornou 18 de 180; horizonte 01/10/2026–29/12/2026 retornou quatro, com datas originais preservadas.
- Alternância Gantt/linha de balanço operada; linhas por local e guias de fluxo visíveis. Acesso Ver suprimentos abriu a composição do pacote correto, sem salvar alterações.
- Pacotes/Kanban flutuou, encaixou à esquerda por arraste e ficou lado a lado com Planejamento 4D na faixa inferior. Abrir outra janela reposicionou a flutuante para espaço disponível/encaixe. Divisória respondeu a setas do teclado. Maximização/restauração operada.
- Janela de 700 × 800: controles acessíveis por rolagem, filtros recolhíveis e gráfico navegável horizontalmente. Viewport restaurado após ensaio. Console sem erros/avisos na consulta final do ensaio.

## Evidências e limites

- [Gantt](evidencias/planejamento-2026-11-02/gantt.jpg) e [linha de balanço](evidencias/planejamento-2026-11-02/linha-balanco.jpg): capturas autênticas do navegador, projeto QA.
- [Guia de operação](GUIA_PLANEJAMENTO_JANELAS.md).
- Não houve gravação de dados operacionais nesta rodada: ensaio de persistência/histórico está na rodada integrada anterior. A exportação CSV foi implementada, mas o download não foi repetido neste ensaio visual.
- Linha de balanço representa envelopes por local/serviço, podendo conter intervalos; ligações são guias, não precedências. Sem cálculo CPM, takt ou nivelamento de recursos.
- Posições/dimensões são preferências locais do navegador, não layout portátil no projeto. Diálogos de edição/revisão permanecem separados das principais janelas encaixáveis.
- Não houve instalação em outra máquina nem nova chamada real de IA. Aprovação do usuário e publicação desta atualização permanecem pendentes.
