# Ensaio da evolução integrada — 02/11/2026

Implementação local sobre `c6eb4fc`, sem novo commit/push. Este registro distingue teste de software de liberação técnica de uma obra.

## Verificações automatizadas

- `node viewer/scripts/verify.mjs`: **174 testes aprovados, zero falhas**, tipos, selfchecks de cronograma/Gantt/árvore e build Vite concluídos. Log: `.cache/integrated-final.log`.
- Casos novos: proteção de ajustes manuais, snapshots de catálogo, composições multiunidade, pico de reutilização, revisão fora da demanda, restrições sem duplicação, datas do concreto fresco, limites de undo/redo e auditoria.
- Regressões de sobreposição reproduzidas antes de corrigir: dois aliases na mesma criação; edição de seleção sobre serviço já ocupado; segunda janela do mesmo elemento após detalhamento parcial. Os três casos agora têm testes.
- Persistência: testes de escrita/fechamento com falha, conflito entre handles, recuperação, integridade de histórico e arquivo parcial de versão. Esses cenários foram injetados em testes; não se desligou a pasta real do usuário.
- Permanece o aviso de tamanho do bundle do visualizador. Não impede o build.

## Ensaio real no navegador integrado

Projeto independente: `C:\Users\lucas\Downloads\Meu projeto\QA Integracao 02nov`. Modelo TORRE02. Nenhuma aba ou pasta de trabalho do professor foi modificada neste ensaio.

1. Criação de três pacotes para onze elementos do Pavimento 1: concreto, armação e fôrmas. A forma sem medida permaneceu desconhecida.
2. Ajuste do concreto de 19,434 para 20 m³; salvamento automático e reabertura preservaram o valor manual e os três pacotes.
3. Composição conferida, fornecimento fictício de 20 m³, reserva e recebimento fictício com evidência. Persistência confirmou um recurso, uma reserva e um recebimento.
4. Categorias justificadas como fora do escopo do ensaio de software. Não equivalem a uma aprovação de campo.
5. Kanban operado pelos botões: Pronto → Comprometido → Em execução em 10/11 → Concluído em 11/11, com evidência fictícia. PPC observado: 1/1, 100%.
6. Desfazer a conclusão: PPC 0%; refazer: 100%. Cores de execução acompanharam os estados.
7. Texto ainda não aplicado no campo de desvio permaneceu após abrir Catálogos, criar insumo em horas e retornar. O texto de teste foi limpo sem registrar novo apontamento.
8. Histórico aberto, comparação examinada e versão restaurada como nova revisão. Projeto reaberto com execução, recebimento e catálogo preservados.
9. Janela 760×800: navegação, lista alternativa e rolagens operáveis. Dimensão padrão restaurada. Filtro da lista corrigido para respeitar itens ocultos.

Evidências:

- [Execução/PPC após reabrir](../artifacts/qa-integrated-2026-11-02/execucao-ppc-reaberto.png)
- [Pacotes em janela estreita](../artifacts/qa-integrated-2026-11-02/pacotes-janela-estreita.png)

## Revisão independente e limites

Revisão de leitura delimitada apontou duplicações de demanda e falhas de integridade/rotulagem do histórico; as reproduções foram corrigidas e cobertas por regressão. O teste visual cobre o fluxo descrito, não todas as combinações de modelos, arraste, sistema operacional e hardware.

Não foram chamadas APIs reais de IA nesta rodada, emitidos pedidos, enviados e-mails ou contatados fornecedores. Os filtros das vistas não constituem um filtro global único. Escopos sem vínculo 4D exigem preparação dos dados antes do compromisso. O catálogo didático e as estimativas de aço/fôrmas permanecem sujeitos à conferência técnica.
