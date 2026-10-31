# IFC Coral — instruções do projeto

- Antes de criar qualquer commit, apresentar ao Lucas as alterações e verificações, perguntar se autoriza o commit e aguardar resposta explícita. Não realizar commits automáticos; essa regra vale para todos os agentes que trabalham neste repositório. Uma autorização anterior não aprova commits futuros.
- Trabalhar nesta base independente. Não modificar C:/dev/ifc4all, suas dependências compartilhadas ou alterações locais.
- Nome IFC Coral provisório; não criar remoto, publicar ou enviar mensagens a fornecedores sem pedido específico do autor.
- Fonte funcional: docs/superpowers/specs/2026-10-17-ifc-coral-design.md; progresso em docs/PROGRESSO.md. Os RF/CA completos no Academic OS continuam sendo a meta; recorte implementado e limites em docs/ACEITE.md.
- Arquivos institucionais, ementa e kit já aprovados ficam preservados.
- Modelo persistente em viewer/src/production; runtime Fragments separado. Nunca usar nome ou localId como chave persistente de elemento. GUID vem de getGuidsByLocalIds.
- Mesmo hash não duplica. Revisão alterada exige conferência de vínculos; arquivo renomeado com mesmo projeto IFC oferece escolha entre revisão e outra disciplina.
- Quantidade desconhecida não é zero; cobertura existente não conferida deixa saldo indeterminado. Não reservar duas vezes a capacidade. Concreto fresco não é estoque antecipado.
- PPC usa compromissos e critérios congelados, evidências e prazo. Não inferir execução pela data do calendário.
- Chaves de IA só em memória; não usar .env com VITE_ para segredos, localStorage de credenciais, logs de request ou exportação de chaves. Texto IFC/JSON/IA é dado não confiável; usar textContent e neutralizar fórmulas CSV.
- Versões do lockfile That Open 3.4/Three .182/web-ifc .77 mantidas. Worker/WASM locais em viewer/public/engine. Não rodar npm ci na junction atual.
- Validar mudanças com npm test, npm run typecheck e npm run build. Ao mexer em schedule, executar também node --experimental-strip-types src/ifc/schedule.selfcheck.ts.
- Aprovar interface com navegador real via ferramentas autorizadas, sem declarar testes não executados.
- Documentação original IFC4ALL preservada em docs/origem; créditos em docs/CREDITOS.md.
