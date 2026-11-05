# QA — painel central de restrições — 05/11/2026

## Resultado

Implementação local: menu Restrições, dashboard, filtros, cadastro, edição no checklist integrado, exclusão com motivo/proteções e exportação CSV. Nenhum commit/push nesta rodada. Alterações anteriores do piloto IFC + CSV preservadas.

## Verificação automatizada

- `npm run typecheck`: aprovado.
- `npm test`: 213/213 aprovados, sem falhas ou skips; cinco testes específicos do dashboard/CRUD.
- `npm run build`: aprovado; persiste o aviso de bundle maior que 500 kB.
- `git diff --check`: aprovado, apenas avisos de normalização CRLF.
- Cobertos: padrões vazios, atraso versus vencimento hoje, categorias não aplicáveis, exclusão de versões/propostas, filtro com acentos, contagem, CSV com neutralização de fórmula, edição de categoria, serialização, bloqueio de exclusão e auditoria.

## Ensaio no navegador interno

Projeto sintético QA IFC CSV em servidor local de teste 5189, separado da sessão do professor em 5178. Dois elementos IFC e um pacote de concretagem.

- Cadastrar condição de equipamento com responsável, data e ação: aprovado.
- Editar responsável de Ana QA para Bruno QA e voltar ao dashboard: aprovado, indicadores e linha atualizados.
- Filtrar responsável e exportar CSV: aprovado; arquivo de 728 bytes com cabeçalho e uma linha confirmado na pasta Exportacoes.
- Limpar filtros: aprovado, conjunto restaurado.
- Reabrir projeto após recarregamento: aprovado, condição e edição preservadas.
- Excluir padrão vazio: motivo vazio rejeitado; motivo preenchido aceito; total atualizado.
- Registrar evidência textual e conferente, liberar condição: aprovado, contagem mudou para liberada.
- Tentar excluir condição liberada/com evidência: confirmação desabilitada, motivo explicado.
- Cadastrar segunda condição de materiais e filtrar Identificadas: aprovado, duas linhas (pendente e liberada), sem padrões vazios.
- Painel ampliado, cabeçalho recolhido e gráficos: conferidos visualmente em 1280 x 720. Nenhum erro de console capturado no ensaio.

## Evidências e limites

[Dashboard sintético](evidencias/restricoes-2026-11-05/dashboard.jpg). Logs de testes e build preservados localmente.

Esta rodada não reensaiou IA remota, seletor nativo de pastas, instalação em segunda máquina ou grandes projetos. O upload de prints existente foi preservado, sem novo ensaio de upload. Dashboard não substitui conferência técnica nem liberação humana. Não houve alteração no kit institucional ou contrato Compras IA.
