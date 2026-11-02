# Preparar o checklist com IA

O usuário não precisa editar código ou escrever todas as condições. Na aba **Produção**, abra **Checklist de restrições → Sugerir restrições com IA**. O mesmo botão está disponível na aba **IA**, sempre para o pacote selecionado.

## Operação

1. Confira e salve a definição do pacote no aplicativo: local, serviço, elementos, quantidade/unidade/origem, datas e critério de conclusão. Salvar a definição é diferente de gravar o projeto na pasta.
2. Abra **Sugerir restrições com IA**. A tela mostra o recorte e permite conferir os dados enviados.
3. Escolha **Codex deste computador**, **OpenAI — minha chave** ou **Gemini — minha chave**.
4. Confira o nome do modelo. **Verificar Codex local** preenche o catálogo local de modelos da conta quando disponível; a lista é cache, não garantia de acesso. Em API, **Consultar modelos da API** consulta a conta; selecione um modelo de texto com saída estruturada. É possível digitar o ID exato.
5. Clique em **Gerar propostas de restrições**. A IA devolve resumo, fatos registrados, lacunas e condições específicas a conferir. Se necessário, use **Cancelar análise**.
6. Leia as propostas. Marque apenas as pertinentes, ajuste categoria, condição, ação e evidência a buscar e informe **Revisado por**.
7. Use **Adicionar selecionadas ao checklist**. As condições entram **pendentes**, com origem de IA e conferente da redação. Evidência de liberação e conferente da liberação continuam vazios.
8. Faça as verificações reais e registre responsável, prazo e evidências pelo fluxo habitual. Só depois confirme a liberação.
9. Use **Salvar** ou Ctrl+S para gravar na pasta do projeto. A origem das condições aprovadas acompanha o projeto.

## Propostas orientadas à produção

A análise cobre seis áreas: **projeto e informação; frente e predecessoras; mão de obra; equipamentos; materiais e suprimentos; ambiente e segurança**. A última inclui, conforme o serviço, iluminação, circulação, acesso, proteções e condições climáticas a conferir. São orientações de preparação, não constatações automáticas de falha.

Uma condição genérica pendente no checklist não suprime propostas específicas da área. Uma categoria comprovadamente atendida em todo o pacote é identificada no resumo e não precisa receber novo impedimento. Atendimento por evidência de imagem também é respeitado; liberações de apenas alguns elementos não são generalizadas ao conjunto.

O resultado mostra a condição, **como preparar** e **qual evidência buscar**, agrupados por categoria. Fatos e lacunas, justificativas/fontes e campos de edição ficam recolhidos. Use **Ajustar proposta** para editar. A descrição tem até 150 caracteres; ações e evidências também têm limites curtos. Uma resposta que ignora alguma área pendente é recusada antes de chegar ao checklist.

## Codex local

O navegador não disponibiliza automaticamente a conversa do Codex como uma API. O servidor do IFC Coral chama o executável oficial instalado e reutiliza sua autenticação. No Windows, procura primeiro o executável instalado pelo Codex Desktop e depois a instalação oficial do CLI no PATH.

Quando não houver executável disponível, instale o CLI oficial conforme [a documentação](https://learn.chatgpt.com/docs/non-interactive-mode), autentique com `codex login` e reinicie o servidor do aplicativo. Execute o app pelo servidor local (`npm run dev`); abrir apenas arquivos HTML ou uma hospedagem estática não executa essa integração.

A requisição usa modelo explícito, JSON Schema, sandbox de leitura, ferramentas de shell desativadas, configuração pessoal ignorada e sessão efêmera. Trabalha em diretório temporário próprio; não recebe caminho do projeto nem abre arquivos do aluno. A consulta usa a cota e as regras da conta autenticada; não significa uso ilimitado/offline. Tempo máximo: três minutos. A pasta temporária é removida ao encerrar. A aplicação não copia nem exporta a credencial de autenticação.

## Chaves de API

Chaves OpenAI/Gemini vivem apenas em memória nesta sessão, são enviadas ao endpoint oficial correspondente e não entram no projeto, nas exportações ou em logs. Não há chave embutida no código. As duas opções dependem de saldo, rede, permissões e suporte do modelo ao formato estruturado. Ausência de chave ou retorno inválido é erro explícito; não há substituição silenciosa por uma resposta fixa.

## Recorte e garantias do fluxo

- Usa o pacote selecionado, tarefas/modelos relacionados, medições e recursos, reservas e entregas vinculados. Ofertas potencialmente compatíveis ficam separadas de reservas; não representam disponibilidade garantida.
- `coverageKnown` significa conferência de estoque/pedidos para saldo de material, não completude da geometria. Quantidade desconhecida continua desconhecida.
- Prints e seus bytes, demais pacotes e credenciais não são enviados. A IA vê a contagem de prints e a descrição textual da evidência; isso não é uma inspeção visual das imagens.
- Referências a elementos são modelo + GlobalId e precisam pertencer ao pacote. Texto IFC/IA é exibido como texto, sem execução de HTML.
- Alterações no contexto entre geração e incorporação exigem nova análise. Condições existentes não são sobrescritas e duplicatas textuais de mesmo alcance são recusadas/ignoradas na incorporação. Similaridade de significado exige revisão humana.
- Pacote com compromisso congelado permite análise, mas a incorporação por este fluxo fica bloqueada. O compromisso e o PPC anteriores não são recalculados.
- A validação de schema/referências não prova que uma afirmação de IA seja verdadeira. Toda proposta exige julgamento técnico. O assistente é orientado por instruções de domínio e dados do pacote; não é um modelo submetido a treinamento específico/fine-tuning.
- A geração não compra, contata fornecedores, modifica quantitativos, confirma capacidade ou remove restrições.

Fontes técnicas: [Codex não interativo](https://learn.chatgpt.com/docs/non-interactive-mode), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output).
