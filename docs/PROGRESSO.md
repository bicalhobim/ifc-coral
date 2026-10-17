# Execução — IFC Coral, 17/10/2026

Plano: docs/superpowers/plans/2026-10-17-ifc-coral-mvp.md.

Autorização: autor pediu verificar C:/dev e seguir a sequência funcional proposta. As decisões de aula, 16 RF e 14 cenários já foram discutidas/aprovadas; não reabrir perguntas respondidas.

Ruling: usar a pasta vazia ifc4all-2 como repositório independente e branch feat/ifc-coral-mvp, em vez de alterar main do IFC4ALL — atende ao pedido anterior de nova solução sem marca ZapObras e preserva as alterações locais; risco é apenas o nome de pasta provisório, documentado ao autor.

Ruling: especificação e plano técnico detalham o plano já autorizado; execução nativa nesta conversa, sem nova rodada de confirmação. Nome IFC Coral provisório. Não criar/push de GitHub nesta etapa.

Pré-flight: identidade persistente alimenta domínio e UI; domínio alimenta exportação/IA; chaves nunca entram no domínio. A versão-base pública e o main têm as mesmas árvores viewer/modelos. Sem interfaces contraditórias identificadas.

- Base extraída de d97294fc55a24cc9c1681551a58aa5cbcc1099b5, somente viewer e TORRE02.
- Repositório original mantido; não rastreados agente.md e viewer/console-log.txt preservados.
- Task 1: baseline TORRE02 carregada no navegador; selfchecks originais passaram. Datas inexistentes falharam no teste e foram corrigidas; homônimos agrupados por modelo/local/serviço/datas. Fragments usa mapeamento getGuidsByLocalIds; teste reproduziu ausência de GlobalId em atributo e passou com adaptação.
- Task 2: domínio implementado; testes de cobertura, reserva dupla, prazo, evidência, compromisso congelado, PPC e arquivo adulterado passaram.
- Task 3: UI e persistência verificadas com TORRE02 real, pacote de 3 elementos, quatro restrições, fornecimento B, congelamento, entrega e execução tardias, PPC 0%/1. Exportação portátil e duas reaberturas na mesma sessão preservaram dados; importação de revisão com GlobalId alterado bloqueou conferência do vínculo ausente. Layout original sobrescrevia className da nova região; corrigido após inspeção visual.
- Task 4: dois adaptadores com transporte simulado aprovados; consulta sem chave recusada na UI. Revisão independente final concluída e achados materiais corrigidos. README, guia, créditos, matriz CA e roteiro de continuidade salvos. Chamadas pagas reais não executadas; validação com credenciais permanece pendente.
- Verificação final: 25 testes passaram, typecheck e três selfchecks passaram, build aprovado com aviso de bundle grande. Navegador sem erros capturados. Tela 1366x900 e 640x850 sem transbordamento horizontal; capturas em artifacts/.

Ruling: validar a oficina via CUA e registrar roteiro verificável, em vez de automatizar a UI com Playwright de terminal — política do navegador exige CUA; custo é ausência de replay headless nesta rodada.
Ruling: GlobalId + nome identificam a importação inicial; hash idêntico não duplica. Um arquivo renomeado com o mesmo projeto IFC oferece escolha explícita entre revisão e outra disciplina — evita fusão silenciosa; custo é um passo adicional de conferência para revisão renomeada.


Ruling: calendário explícito simplificado de dias corridos (2 para fornecimento + 1 de preparação), separado do D+n abstrato do livro — permite o primeiro recorte local conferível; custo é implementar calendário útil configurável antes de prometer prazos comerciais.

## Revisão final

- Corrigidos os oito achados do revisor: IDs de runtime únicos; escolha de revisão renomeada; cleanup integral de carregamento; datas com timestamp; referência IFC inexistente; reposição após rejeição; fórmula CSV; campos JSON herdados.
- Acrescentados normalização da árvore Fragments e chave de agrupamento com slot de origem. Os wrappers de categoria não podem apagar instâncias reais.
- Originais preservados: C:/dev/ifc4all continua com apenas agente.md e viewer/console-log.txt não rastreados já existentes. Dependências reaproveitadas por junction; nenhum npm install/ci executado.
- Artefato local de validação: artifacts/oficina-validada.json. Capturas: 01-ciclo-concretagem.jpg e 02-tela-estreita.jpg. Esses arquivos são evidências sintéticas ignoradas pelo Git, não kit institucional.
- Limites de aceite: ver docs/ACEITE.md; CA-04/09/11/13/14 parciais e CA-12 fora do recorte. Não afirmar conclusão dos 16 RF ou compra real.

## Próxima sessão

1. Abrir README.md e docs/ACEITE.md nesta pasta, iniciar via iniciar.ps1 se necessário.
2. Professor experimentar a decisão com TORRE02; selecionar a frente final do exercício.
3. Validar Gemini/OpenAI ao vivo com chave individual, sem salvá-la em projeto/captura.
4. Produzir slides do professor e template de cinco slides do grupo usando telas verificadas; atualizar livro/caderno com interfaces finais.
5. Receber template de equalização e demanda/fornecedores da demonstração de agentes antes de executar contatos reais.
6. Preparar distribuição limpa e licença/créditos definitivos, então publicar quando solicitado.
