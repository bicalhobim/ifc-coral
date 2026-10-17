# IFC Coral · laboratório de produção e suprimentos

**Podemos assumir esta concretagem?** O cronograma e o modelo mostram o que foi planejado. O exercício transforma essa intenção em um pacote por local e serviço, confere restrições e suprimentos, registra compromissos e compara o realizado pelo PPC.

Primeiro recorte local, derivado do IFC4ALL. Nome provisório; sem publicação no GitHub. [Créditos e origem](docs/CREDITOS.md).

## Começar

Na máquina do professor, execute `iniciar.ps1` nesta pasta. Abra **http://127.0.0.1:5178/**. Se o servidor já estiver funcionando, basta abrir o endereço.

Em uma cópia independente para outro computador, com Node.js 24 instalado:

```powershell
cd viewer
npm ci
npm run dev
```

Esta cópia do professor utiliza uma junction de `viewer/node_modules` para as dependências já instaladas de `C:/dev/ifc4all`. **Não executar npm ci sobre essa junction**; para distribuir, usar um checkout sem node_modules e instalar pelo lockfile. O código e os dados são independentes; só a instalação de bibliotecas é compartilhada nesta máquina. Nenhuma instalação ou alteração de sistema é necessária para a validação atual.

## Oficina

1. **Abrir TORRE02.** Inspecionar estrutura espacial, tarefa e elementos. Ampliar o modelo para consultar propriedades. O 4D representa datas do IFC; não comprova execução.
2. **Criar caso de concretagem.** A geometria e os GlobalIds são reais. Os 12 m³, datas de cenário e fornecedores A/B/C são premissas sintéticas, não extração do IFC nem compra real.
3. **Produção.** Conferir local, serviço, quantidade/origem, responsável, capacidade e critério. Remover restrições com evidência e conferente.
4. **Suprimentos.** Conferir cobertura existente, comparar proposta técnica/prazo/preço, confirmar a janela e reservar quantidade. Recebimento parcial, rejeição e atraso são registrados à parte.
5. **Semana/PPC.** Selecionar pacotes prontos e congelar os compromissos. Registrar realizado e motivo de desvio. O denominador original é preservado.
6. **Exportar projeto.** O JSON portátil inclui o IFC, decisões e IDs. Reabrir também em outra sessão. O navegador mantém cópia local, mas ela não substitui seu arquivo exportado.

O núcleo funciona sem IA. Na aba **IA**, Gemini e OpenAI aceitam chave individual em memória. Os dados a enviar podem ser vistos antes da solicitação; não há aplicação automática das sugestões. Os adaptadores foram testados com respostas simuladas; **chamadas reais, CORS, permissões e modelos das contas ainda precisam de validação com as chaves do usuário**.

[Guia do aluno](docs/GUIA_DO_ALUNO.md) · [Resultados e limites](docs/ACEITE.md) · [Continuidade](docs/PROGRESSO.md)

## Roteiro de operação com telas

O guia tem 23 passos, com prints reais, marcações de clique, exemplos de preenchimento e resultado esperado. Percorre o caso de concretagem da abertura do IFC à exportação do projeto. A interface v02 usa fundo claro, roxo, menu **Arquivos** e ajudas **?** que abrem com mouse, teclado ou clique.

- [PowerPoint editável](materials/guia-operacao-v02/5.6%20IFC%20Coral%20-%20Guia%20de%20operacao%20passo%20a%20passo.pptx)
- [PDF para acompanhar o teste](materials/guia-operacao-v02/5.6%20IFC%20Coral%20-%20Guia%20de%20operacao%20passo%20a%20passo.pdf)
- [Roteiro em Markdown](materials/guia-operacao-v02/5.6%20IFC%20Coral%20-%20Roteiro%20do%20guia.md)
- [Exemplo concluído, para reabrir pelo menu Arquivos](materials/guia-operacao-v02/Exemplo-concluido.IFC-Coral.json)

Para ensaiar do zero, exporte seu projeto atual e use **Arquivos > Novo projeto**. O arquivo de exemplo é opcional e contém um resultado didático de PPC 100%, com 1 compromisso cumprido no prazo. As fontes e os dados reais não são alterados pelo roteiro.

## Desenvolvimento

```powershell
cd viewer
npm test
npm run typecheck
npm run build
```

Sem backend, login, multiusuário, pagamentos, mensagens ou pedidos reais. Unidade do primeiro recorte: concreto em m³. Estoques genéricos, calendários úteis, histórico estruturado de propostas de IA e o fluxo completo de compras são expansões posteriores.
