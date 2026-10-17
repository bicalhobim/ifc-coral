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

## Desenvolvimento

```powershell
cd viewer
npm test
npm run typecheck
npm run build
```

Sem backend, login, multiusuário, pagamentos, mensagens ou pedidos reais. Unidade do primeiro recorte: concreto em m³. Estoques genéricos, calendários úteis, histórico estruturado de propostas de IA e o fluxo completo de compras são expansões posteriores.
