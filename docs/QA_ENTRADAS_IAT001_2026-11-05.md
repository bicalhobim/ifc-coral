# QA local — entradas Explore, Pratique e Crie

> Registro histórico da rodada de teste. As referências a “sem commit/push” descrevem aquele momento; publicação técnica não constitui liberação para distribuição aos alunos.

**Data:** 05/11/2026. **Estado:** implementação local, sem commit/push e sem distribuição aos alunos.

## O que foi feito

- Home com três entradas: **Explore — Projeto Modelo** (cópia TORRE02 com um pacote, condições e três propostas fictícias), **Pratique — Exercício 02** (cópia TORRE02 com IFC/4D e sem pacotes, condições ou propostas herdadas) e **Crie — Meu Novo Projeto** (pasta escolhida pelo usuário, sem IFC, com cliente/obra, responsável e descrição editáveis).
- Cada abertura Explore/Pratique recebe ID de projeto próprio e cópia independente dos bytes IFC. O tour Explore tem seis etapas, pode ser pulado e reiniciado. Salvar como permanece a forma de escolher uma pasta para essas cópias.
- Controle de grade, coordenadas locais e alinhamento por três pontos para elementos selecionados, modelo ativo ou projeto inteiro, com limites em [COORDENADAS_ALINHAMENTO.md](COORDENADAS_ALINHAMENTO.md).

## Evidência executada

- `npm test`: **218 aprovados, 0 falhas**; `npm run typecheck` e `npm run build`: aprovados após o deslocamento por elemento. O build informou tamanho elevado do bundle, aviso já conhecido.
- No navegador, um pilar de 3,35 m³ foi selecionado por árvore, deslocado 100 m em X por prévia de três pontos e confirmado. O elemento apareceu separado da torre, em roxo; foi selecionado por clique na nova posição e a caixa de origem passou a X = 99,68674 m. A ação **Restaurar posição** também foi executada. Não houve edição do IFC original.
- Navegador, cópia isolada da TORRE02: Explore abriu com pacote fictício, premissa explícita de 12 m³, responsáveis e ações pendentes; tour exibido, pulado e reiniciado. Pratique abriu sem pacote; um elemento selecionado gerou pacote de concretagem com **6,304 m³ declarados no IFC** e data 4D. No mapa, filtro **Somente pacotes** reduziu a uma demanda; a exportação baixada tinha `schema_version=1`, `scope.exported_count=1`, `semantics.purchase_authorized=false`, 11.105 bytes. Arquivo de ensaio conservado localmente na pasta de downloads, fora desta publicação.
- Em pasta temporária independente do repositório e das dependências compartilhadas, `npm ci --offline` instalou 102 pacotes sem erro; `npm run build` passou após copiar a ponte `server`; `npm run dev` abriu na porta 5188. No navegador, o E02 carregou a TORRE02 e o Gantt mostrou **180 de 180 atividades**. O servidor foi encerrado e a cópia temporária removida.

## Limites para liberação da aula

- O seletor nativo Windows, o ciclo salvar/fechar/reabrir e a instalação em **outro computador** ainda exigem ensaio. Os testes da camada de arquivos cobrem gravação/reabertura com handles simulados, sem substituir o ensaio da janela nativa.
- O E02 aberto nesta rodada não foi salvo na pasta; a saída JSON foi baixada do navegador. O caso Explore continua fictício: seus 12 m³ não são o quantitativo do pacote criado pelo grupo no E02.
- O README público e as capturas históricas não foram atualizados nesta rodada. A coordenação está avaliando um pacote discente filtrado; não assumir que a árvore atual do GitHub é a versão a distribuir.
- A identificação do aluno e o envio de prova ao professor não fazem parte deste fluxo. A entrada local aceita campos preenchidos, sem autenticar, transmitir ou conservar credenciais.
