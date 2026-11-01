# QA — seleção, pacotes e janelas

Estado: implementação local, sem commit/publicação. Base independente `C:/dev/ifc4all-2`. Ensaio em abas próprias do navegador interno, com cópia nova TORRE02 e projeto `QA Pasta 31out`; arquivos do projeto do professor preservados.

## Verificação automática

`npm run verify`: **112 testes aprovados**, typecheck, selfchecks de schedule/Gantt/tree e build. Permanece o aviso conhecido de bundle grande. Log: `.cache/verify-selection-windows.log` e cópia em `artifacts/qa-selection-windows-2026-10-31/verify.log`.

Novos casos cobrem descendentes físicos, exclusão de contêineres espaciais, intervalo reverso/inclusivo e âncora oculta, seleção de grupo por modelo, localização espacial, criação/exclusão/desfazer de pacotes, bloqueios de compromisso/realizado/reservas/mapas e restauração de recursos. Geometria de janelas é limitada à área disponível e divisões preservam área de modelo.

## Operação no navegador

| Ensaio | Resultado observado |
|---|---|
| Pavimento 01 | 31 elementos e 70,578 m³ declarados no IFC |
| Shift do pavimento 01 até 03 | 93 elementos |
| Ctrl no pavimento 02 após intervalo | 62 elementos restantes |
| Primeira até quinta viga visível com Shift | 5 elementos |
| Pacote da seleção espacial | Nome e local `Concretagem — PAVIMENTO 01` / `PAVIMENTO 01`; datas de origem preservadas |
| Editar/excluir/desfazer rascunho | Nome editado, confirmação, exclusão, restauração com mesmo pacote |
| Novo pacote manual | Fôrmas, frente B, m², quantidade desconhecida e quatro restrições pendentes |
| Pacote congelado da cobertura | Excluir desabilitado e motivo exposto; histórico preservado |
| Janelas simultâneas | Árvore esquerda; Propriedades e Quantificação empilhadas à direita; 4D inferior também operado |
| Mover e redimensionar | Título desencaixa janela; posição encaixa novamente; canto redimensiona flutuante; divisores laterais e entre janelas respondem |
| Preservação de campos | Texto não salvo permaneceu ao mover/redimensionar e abrir o 4D |
| Fixação | Recolhe em aba, reabre e fixa; restauração de disposição disponível |
| Tela menor | Conferidas larguras 916 e 465; canvas preservado e controles acessíveis. Em tela estreita, painéis ficam compactos: usar Ampliar modelo/recolhimento para leitura |
| Console da aba de QA | Sem erros ou avisos durante o fluxo observado |

Capturas em `artifacts/qa-selection-windows-2026-10-31`. Nenhum commit/push, envio a fornecedores, nova validação estrutural ou chamada autenticada de IA nesta rodada. O ensaio não constitui validação de todo IFC existente nem reprodução integral do gerenciador de janelas desktop do Navisworks.
