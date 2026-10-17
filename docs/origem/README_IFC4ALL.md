# ifc4all — Viewer 4D para Modelos IFC

Visualizador web de modelos **IFC** (BIM) com cronograma **4D** integrado. Carrega
um arquivo `.ifc`, extrai as datas de início/fim dos elementos construtivos e exibe
um gráfico de Gantt interativo — similar ao MS Project, mas conectado diretamente ao
modelo 3D.

Construído com [That Open Components](https://github.com/ThatOpen/engine) (engine
open-source de BIM em JavaScript/TypeScript).

> **Você é aluno e nunca programou?** Sem problema. Este projeto foi feito para você
> **não precisar** digitar comandos técnicos. Você vai instalar duas ferramentas,
> baixar o projeto e **colar uma única frase** no chat do OpenCode — ele faz todo o
> resto sozinho. Siga os passos abaixo na ordem.

---

## Visão geral do que você vai fazer

1. Instalar o **OpenCode** (o assistente que roda o projeto para você).
2. Instalar o **Node.js** (o motor que o projeto usa).
3. Baixar este projeto do GitHub.
4. Abrir o projeto no OpenCode e **colar a frase mágica** (a "MISSÃO").
5. Usar o viewer no navegador.

Leva ~10 minutos na primeira vez.

---

## PASSO 1 — Instalar as ferramentas

### 1.1 Instalar o OpenCode Desktop

1. Acesse **https://opencode.ai**
2. Clique em **Download** e escolha a versão para **Windows**.
3. Abra o arquivo baixado e siga a instalação.
4. Abra o OpenCode ao terminar.

### 1.2 Instalar o Node.js

1. Acesse **https://nodejs.org**
2. Clique no botão **LTS** (versão estável recomendada).
3. Abra o arquivo baixado (`node-vXX.x-x64.msi`).
4. Clique em **Next** em todas as telas, mantendo as opções padrão.
5. Finalize a instalação.

> Não sabe se instalou certo? Sem problema — no PASSO 3 o OpenCode verifica isso
> automaticamente para você.

---

## PASSO 2 — Baixar o projeto

Escolha **uma** das duas formas:

**Opção A — Baixar o ZIP (mais simples):**
1. Acesse **https://github.com/bicalhobim/ifc4all**
2. Clique no botão verde **`< > Code`** e depois em **Download ZIP**.
3. Salve e **extraia** o ZIP (botão direito → "Extrair tudo").
4. Você terá uma pasta `ifc4all` com `viewer/`, `ifc_model/`, etc.

**Opção B — Clonar via git (se souber usar):**
```bash
git clone https://github.com/bicalhobim/ifc4all.git
```

---

## PASSO 3 — Abrir no OpenCode e rodar (a parte mágica)

1. Abra o **OpenCode Desktop**.
2. Clique em **Open Folder** (Abrir Pasta) e selecione a pasta **`ifc4all`**
   (a pasta raiz do projeto — a que contém `viewer/`, `ifc_model/` e o arquivo
   `agente.md`).
3. Na barra de chat do OpenCode, **cole exatamente a frase abaixo** e aperte
   **Enter**:

> **Analise o arquivo `agente.md` e crie um plano passo a passo para executar todas
> as requisições apresentadas nesse arquivo, para que o software `ifc4all` rode de
> forma plena em `localhost`. Também analise as bibliotecas e as configurações
> atuais do sistema (a máquina onde o `ifc4all` está instalado) e instale/atualize
> tudo o que for necessário. Ao final, deixe o servidor rodando e um modelo IFC de
> exemplo carregado, com o Gantt 4D preenchido.**

Pronto. O OpenCode vai ler o arquivo **`agente.md`** (o roteiro completo de
instalação), verificar o que falta na sua máquina, instalar o necessário e subir o
servidor. Ele explica cada passo em português e só pede sua confirmação em coisas
importantes (como instalar o Node) — quando pedir, é só responder **sim**.

> **Por que uma frase só?** Todo o passo a passo detalhado mora no arquivo
> `agente.md` dentro do projeto. Você não precisa colar um textão: a frase acima
> manda o OpenCode ler esse arquivo e executar. Se algum dia o roteiro mudar, a
> frase continua a mesma.

### O que esperar

- O OpenCode mostra o resultado dos comandos e, ao final, a mensagem
  `Local: http://localhost:5173/`.
- Abra o navegador em **http://localhost:5173**.

---

## PASSO 4 — Carregar um modelo IFC

1. Na tela do viewer, clique em **"Carregar arquivo"** (ou arraste um `.ifc` para a
   janela).
2. Escolha um modelo da pasta `ifc_model/` do projeto — por exemplo
   **`TORRE02_ESTRUTURA_4D.ifc`**.
3. Aguarde o processamento: o modelo 3D aparece e o Gantt 4D é gerado
   automaticamente.

> **Precisa de internet** neste passo: parte do motor de leitura do IFC é baixada da
> web quando o modelo carrega.

---

## Como usar

| Ação | Como fazer |
|---|---|
| **Rotacionar o modelo** | Clique e arraste com o botão esquerdo |
| **Zoom** | Scroll do mouse |
| **Mover a câmera** | Botão direito + arraste |
| **Selecionar um elemento** | Clique nele no modelo 3D ou na árvore espacial |
| **Navegar no cronograma** | Arraste o *scrubber* (barra de tempo) no Gantt |
| **Ocultar elementos** | Ao mover o scrubber, o que ainda não começou fica oculto |

---

## Modelos de exemplo incluídos

Na pasta `ifc_model/` já vêm modelos prontos, com as datas de cronograma
pré-processadas (por isso o Gantt aparece preenchido):

- `TORRE01_ESTRUTURA_4D.ifc`, `TORRE02_ESTRUTURA_4D.ifc`, `TORRE03_ESTRUTURA_4D.ifc`
- `TERRENO_INFRA_4D.ifc`
- `CANTEIRO_TEMPORARIO_4D.ifc`

---

## Comandos disponíveis (para quem quiser rodar na mão)

Você não precisa disso se usar o OpenCode. Mas, se quiser, todos rodam **de dentro
de `viewer/`**:

| Comando | O que faz |
|---|---|
| `npm ci` | Instala as dependências de forma limpa (a partir do lockfile) |
| `npm run dev` | Inicia o servidor de desenvolvimento (porta 5173) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Visualiza a versão de produção localmente |
| `npm run typecheck` | Verifica erros de tipos TypeScript |

---

## Estrutura do projeto

```
ifc4all/
├── agente.md               # Roteiro que o OpenCode lê e executa (a "MISSÃO")
├── README.md               # Este guia
├── ifc_model/              # Modelos IFC de exemplo (4D)
│   └── TORRE02_ESTRUTURA_4D.ifc  (entre outros)
├── viewer/                 # Aplicação principal (SPA Vite + TypeScript)
│   ├── src/
│   │   ├── ifc/
│   │   │   ├── app.ts      # Setup do viewer 3D
│   │   │   └── schedule.ts # Extração de datas do IFC
│   │   ├── ui/
│   │   │   ├── gantt.ts    # Componente Gantt
│   │   │   ├── shell.ts    # Layout da interface
│   │   │   ├── tree.ts     # Árvore espacial do modelo
│   │   │   └── properties.ts # Painel de propriedades
│   │   └── main.ts         # Ponto de entrada
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── docs/                   # Documentação de apoio
```

---

## Solução de problemas

| Problema | O que fazer |
|---|---|
| **O Gantt aparece vazio** | Use um IFC da pasta `ifc_model/` — eles já vêm com as datas `StartDate`/`FinishDate` necessárias. |
| **"Erro ao carregar o modelo"** | Verifique sua conexão com a internet — parte do motor do IFC é baixada da web. |
| **`npm install` dá erro de conflito** | Peça ao OpenCode: *"Apague `node_modules` e `package-lock.json` dentro de `viewer` e rode `npm install` de novo."* |
| **Porta 5173 já está em uso** | Peça ao OpenCode: *"Mude a porta do dev server para 5174"*, ou feche o programa que a ocupa. |
| **Node muito antigo** | Peça ao OpenCode para verificar e atualizar o Node (ou reinstale a LTS em nodejs.org). |
| **Aviso de "MCP" no OpenCode** | Normal e inofensivo — os MCPs são opcionais e não afetam o viewer. |

---

## Licença

Material didático — uso educacional. Todos os direitos reservados aos autores.
