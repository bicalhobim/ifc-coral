# QA — datas do cronograma visíveis por serviço — 05/11/2026

Ajuste solicitado por Lucas após a associação determinística: mostrar as datas disponíveis já na conferência de Criar pacotes por serviço, sem perguntar novamente informações existentes. Implementação no checkout existente, sem commit/push; checkpoint incremental em `.cache/package-date-checkpoint-20261105`.

## Comportamento

Cada serviço tem seu início/término preenchidos pelas atividades efetivamente vinculadas aos elementos e ao próprio serviço. A identidade inclui modelo + GlobalId. A origem IFC/CSV, atividades/modelos e critério de composição ficam visíveis. Períodos diferentes entre serviços são mantidos. Datas permanecem editáveis; desmarcar/remarcar serviço conserva a edição humana. A origem manual/automática é registrada por campo.

Quando há uma única janela por elemento do serviço, vários elementos podem formar uma janela composta: menor início e maior término, com esse critério declarado. Se o mesmo elemento tiver fases/períodos distintos, os campos aguardam escolha da atividade ou confirmação explícita da janela composta; não se exige redigitar as datas existentes. Cobertura parcial mostra as datas conhecidas e exige confirmação para estendê-las aos elementos sem período. Ausência total mantém campos vazios, sem usar hoje nem datas de outro serviço. Classificação manual a partir de um recorte macro mantém seus IDs de origem explícitos.

A sincronização não sobrescreve campos humanos nem compromissos congelados. Uma atualização que inverteria um intervalo misto vira sugestão pendente. Duas datas automáticas se atualizam como par. Datas herdadas representam previsão: não liberam restrições, não tornam o pacote pronto e não registram compromisso semanal.

## Ensaio efetivo no navegador

Instância isolada 5194, pasta `.cache/qa-package-dates-20261105`, cópia sintética independente do ensaio IFC/CSV anterior. Dois modelos, GUIDs/códigos coincidentes entre modelos, quatro elementos físicos, atividades CSV incorporadas aos IFCs. Nenhum projeto real ou a sessão Beta23 foi operado.

- Antes de criar qualquer pacote, a tela mostrou Concretagem 09–10/11/2026, Armação 07–08/11/2026 e Montagem de fôrmas 05–06/11/2026, em campos próprios. Origem CSV e critério de janela composta visíveis. Na versão final, confirmação de ausência fica oculta quando a cobertura é completa.
- Início da Concretagem alterado para 08/11. Serviço desmarcado/remarcado durante seleção da Armação: a edição permaneceu 08/11.
- Criados dois rascunhos: Concretagem 08–10/11 e Armação 07–08/11. Salvos pela aplicação e pasta reaberta; períodos preservados na lista de pacotes.
- Conferência em disco: início da Concretagem com origem `manual`, término `auto`; Armação `auto` nos dois campos. Nenhuma condição liberada e `week=null`.

[Prévia final](evidencias/datas-pacotes-2026-11-05/datas-servicos-previa-final.png) · [Pacotes reabertos](evidencias/datas-pacotes-2026-11-05/datas-servicos-reabertura.png) · [Recibo de dados/origens](evidencias/datas-pacotes-2026-11-05/pacotes-reabertos.json).

## Testes e revisão

- Sete testes específicos: separação de serviços/modelos, janela composta, fases ambíguas, cobertura parcial/total ausente, edição humana e salvar/reabrir/sincronizar, compromissos congelados, serviço manual sem herança indevida e proteção contra intervalo invertido.
- Suíte completa: **266 testes Node aprovados**, zero falhas/skip. Tipos, build e schedule.selfcheck aprovados. O build conserva o aviso preexistente sobre bundles grandes.
- Contrato/fixture de compras preservado; testes de exportação aprovados sem regenerar o pacote aprovado.
- Revisão independente identificou perda de IDs ao classificar uma linha macro em serviço manual e possibilidade de inversão de datas com origens mistas. Corrigidos; teste de inversão foi reproduzido falhando antes da correção. Não houve segunda revisão independente das correções.
- O teste legado de serviço manual usava datas/vínculos de serviços alheios; a fixture passou a conter atividades reais do próprio serviço e verifica somente esses vínculos ao trocar elementos. Serviços sem datas próprias agora exigem dados ausentes explícitos.

A ambiguidade e a ausência parcial/total foram exercitadas automaticamente no domínio; o ensaio visual ponta a ponta usou datas completas e distintas dos três serviços, edição, alternância e reabertura. Não é prova do caso real dos 106 elementos mostrado na captura de Lucas: esse projeto não foi alterado para QA. Seletor nativo, arquivos originais OneDrive indisponíveis e demais limites da rodada com arquivos reais permanecem em registro local.
