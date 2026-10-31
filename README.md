# IFC Coral

**Da intenção de concretar a um compromisso confiável.** O IFC Coral é um laboratório didático que conecta modelo IFC, planejamento 4D, Last Planner System e suprimentos para apoiar decisões de obra com conferência humana.

## O que você pode explorar

- Visualizar modelos IFC, selecionar elementos e acompanhar atividades no cronograma 4D.
- Organizar pacotes de produção por local e serviço, registrar restrições, responsáveis e evidências.
- Examinar volumes declarados no IFC e estimativas de aço e fôrmas por regras e métodos explícitos.
- Relacionar necessidades a recursos, fornecimentos, reservas e mapa de suprimentos.
- Congelar compromissos semanais, registrar resultados e analisar o PPC.
- Usar Gemini ou OpenAI como apoio à análise, com chave individual e validação humana. A operação básica dispensa IA.

O aplicativo é um **protótipo didático local**, não um sistema de produção validado para obras. Dados de propostas e ocorrências dos exemplos são fictícios. Estimativas de aço não substituem projeto estrutural; áreas de fôrma podem permanecer pendentes. O mapa de suprimentos não efetua compras nem envia mensagens.

## Comece aqui

Você precisa de Windows, Node.js 24 e uma cópia independente deste repositório. No PowerShell:

```powershell
cd caminho\para\ifc-coral\viewer
npm ci
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Abra [IFC Coral no navegador](http://127.0.0.1:5178/) e clique em **Abrir TORRE02**. Mantenha o terminal aberto. A instalação em outro computador ainda precisa ser ensaiada em ambiente limpo.

> Na cópia de desenvolvimento em `C:\dev\ifc4all-2`, `viewer\node_modules` é compartilhado com outro projeto. Não execute `npm ci` nessa cópia sem antes preparar uma instalação independente.

## Prática sugerida

1. Selecione uma frente de concretagem no modelo e observe sua sequência no 4D.
2. Confira quantidades e crie os pacotes de serviço apropriados.
3. Analise restrições, necessidade de materiais e janela de fornecimento.
4. Decida se a equipe pode assumir o compromisso semanal e registre o resultado.
5. Compare o planejado e o realizado, analise o PPC e registre o aprendizado.

[Guia de quantificação e suprimentos](docs/QUANTIFICACAO.md) · [Navegação e planejamento 4D](docs/NAVEGACAO_4D_QUANTIDADES.md) · [Estado das validações e limites](docs/ACEITE.md) · [Progresso do projeto](docs/PROGRESSO.md)

## Dados e IA

Os dados do projeto ficam no navegador e podem ser exportados para um arquivo portátil. Antes de enviar informações a um provedor de IA, confira o conteúdo e as regras aplicáveis. As chaves são usadas em memória e não integram o arquivo exportado. Os adaptadores foram testados com transporte simulado; chamadas reais e acesso aos modelos de cada conta ainda precisam de verificação.

## Origem e créditos

O IFC Coral parte do [IFC4ALL](https://github.com/bicalhobim/ifc4all) e de sua evolução 4D, com contribuição de Luiz Sales. Projeto e condução didática: Lucas Fernandes Bicalho. O uso do código 4D e do modelo TORRE02 foi autorizado pelo autor. Veja [origem, créditos e bibliotecas](docs/CREDITOS.md).

A licença geral de distribuição do projeto ainda precisa ser definida; a autorização específica de uso não estabelece uma licença aberta para todo o código nem altera as licenças das dependências.

Os arquivos incorporados de terceiros e os textos de licença consultados estão em [third_party](third_party/README.md).

## Desenvolvimento

```powershell
cd viewer
npm run verify
```

Agentes devem apresentar as alterações e solicitar autorização explícita ao responsável antes de **cada commit**; veja [AGENTS.md](AGENTS.md).
