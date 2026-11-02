# IA para preparar restrições do pacote · 01/11/2026

Pedido autorizado: implementar e testar análise generativa de pacote, por Codex local autenticado ou Gemini/OpenAI com chave individual. Sem commit/publicação automática.

## Arquitetura escolhida

- Reutilizar os conectores de API. Acrescentar saída JSON estruturada, validada em domínio, com resumo, fatos, lacunas e sugestões editáveis.
- Capturar apenas o pacote selecionado, suas tarefas, modelos, medições e fornecimentos vinculados. Quantidade desconhecida permanece nula. Prints e demais pacotes não são enviados.
- Codex é chamado pelo servidor local com CLI oficial, credencial já autenticada, execução efêmera, sem configuração pessoal/plugins e sem ferramentas de shell. A página não é um LLM por si só. Sem chave ou token de Codex no navegador.
- Mostrar dados enviados, provedor/modelo, progresso, cancelamento e erros. Nenhuma resposta modifica o projeto automaticamente.
- Usuário escolhe/edita sugestões e informa conferente. Aplicação atômica acrescenta condições pendentes, preserva anteriores/evidências e registra origem. Não libera, compra ou assume compromisso.
- Guardar contexto de origem; se pacote/modelo/medição/cobertura mudar, exigir nova análise. Pacotes com compromisso congelado permitem consulta, mas não aplicação de novas condições por este fluxo.

## Verificação

1. Testes de isolamento, validação de resposta, referências, duplicatas, alteração de contexto, congelamento, credenciais e persistência.
2. Testes de protocolos OpenAI/Gemini com transportes controlados; cancelamento/timeout/erro do Codex com processo controlado.
3. Uma chamada real do Codex no caso didático e operação no navegador; sem assumir chamadas reais de API quando não há chaves fornecidas.
4. Verificação completa do repositório; guia e limites atualizados.

Referências consultadas: [Codex não interativo](https://learn.chatgpt.com/docs/non-interactive-mode), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output).
