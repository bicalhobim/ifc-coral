# QA — herança da quantificação em pacotes

Data: 01/11/2026. Estado: alterações locais, sem novo commit/push.

## Problema e correção

A criação rápida consumia apenas o volume QTO do IFC; pacotes manuais começavam sem elementos. A quantificação por catálogo/conferência não tinha caminho direto para alimentar esses pacotes. Agora há transferência explícita a partir de Medir ou do próprio pacote, com validação de serviço, unidade, seleção e origem.

## Ensaio real no navegador interno

Uma nova aba com cópia independente da TORRE02 foi usada. Nenhum projeto aberto do professor foi salvo, recarregado ou substituído.

- Seleção por árvore + Shift: 10 elementos de fundação, dois blocos e oito estacas; volume 40,585 m³.
- Taxas sintéticas de QA, sem valor de dimensionamento: blocos 100 kg/m³ e estacas 80 kg/m³, com fonte declarada no catálogo.
- Pacote manual `QA Estacas 1 e 2` inicialmente sem elementos. **Trazer quantificação da seleção** adotou 40,585 m³, dez referências e dez medições conferidas, preservando nome/local.
- Conferência vazia foi recusada com erro visível. Após informar conferente/método/evidência, aplicação concluída.
- **Usar armação estimada no pacote** criou `QA Armação dos blocos e estacas`, com 3.516,826 kg e dez referências. Pacote de concreto permaneceu separado; kg não foram colocados em campo de m³.
- Campo de quantidade herdada protegido; origem e ações apresentadas no pacote.
- Fôrmas desse conjunto permaneceram pendentes; não foi fabricada área.

Capturas locais: `artifacts/qa-package-quantities/concreto-herdado.jpg` e `artifacts/qa-package-quantities/aco-herdado.jpg` (fora do Git).

## Verificação automatizada

`node scripts/verify.mjs` em `viewer`: 147 testes, tipos, selfchecks de cronograma/Gantt/árvore e build. Log local: `.cache/package-quantities-verify.log`.

Testes específicos cobrem transferência para pacote manual, taxa de aço e unidade kg, área de fôrmas em m², quantidade manual sem QTO IFC, serialização/reabertura do domínio, preservação de evidências com reabertura de condições, rejeição atômica de revisões/regras desatualizadas, duplicatas, serviços/unidades incompatíveis, reservas e compromissos protegidos. Criação rápida também prioriza volume manual conferido em vez do volume bruto IFC.

## Limites da evidência

Salvar/reabrir pasta real não foi repetido pela UI nesta rodada; persistência foi exercitada pela serialização de projeto nos testes. Área de fôrmas foi testada no domínio com geometria controlada, não validada como levantamento real da TORRE02. As taxas do ensaio são dados sintéticos. Não houve chamadas de IA, compra externa, alteração do kit institucional nem publicação.
