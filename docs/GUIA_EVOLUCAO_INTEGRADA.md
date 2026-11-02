# IFC Coral — planejamento integrado

Versão local de 02/11/2026. Projeto em JSON, com pastas escolhidas pelo usuário. Checkpoint anterior: `c6eb4fc`.

## Percurso principal

1. Abra seu projeto ou inicie uma cópia da TORRE02. Escolha a pasta pelo **Salvar como**. Aguarde **Salvo na pasta** antes de fechar.
2. Abra **Planejamento macro** para examinar os recortes do cronograma IFC: local, serviço, início e término. As datas do modelo permanecem como foram importadas; não representam execução.
3. Selecione um recorte macro ou elementos no modelo e use **Criar pacotes da seleção**. Escolha um ou mais serviços. Concreto, armação e fôrmas produzem pacotes separados, com unidades próprias.
4. Em **Pacotes → Editar / revisar**, confira responsável, local, critério, quantidade e datas. Um ajuste manual prevalece sobre o recálculo. **Voltar ao automático** é uma ação explícita; pode exigir liberar reservas ou criar uma revisão.
5. Em **Restrições**, preencha condições por categoria. A IA propõe; você revisa e incorpora. Padrões intactos são preenchidos sem criar restrições duplicadas. Evidência e conferente continuam necessários para liberar. Uma categoria fora do escopo exige justificativa de não aplicabilidade.
6. Em **Suprimentos**, abra **Editar** na linha do pacote. Confira a composição e suas especificações. Fôrmas, por exemplo, podem gerar painéis em m² e desmoldante em L. O catálogo inicial é didático, não uma composição técnica aprovada.
7. Confira a cobertura, registre fornecimento, reserve o insumo para o pacote e registre recebimentos. Ofertas sem reserva não atendem automaticamente ao pacote. Recebimentos permanecem consultáveis.
8. No **Kanban**, use o seletor de etapa ou arraste o cartão. A mudança só ocorre após validar seus requisitos. Pronto exige preparação; Comprometido registra promessa; Em execução exige início; Concluído exige data e evidência. O PPC deriva dos compromissos e apontamentos.
9. No modelo, escolha **Gestão visual → Cobertura, Quantificação ou Execução**, filtrando serviço, local e período. Concretagem concluída não significa armação e fôrmas concluídas. A seleção temporária se sobrepõe às cores; limpá-la restaura o modo anterior.

## Controle e recuperação

- Mudanças válidas disparam salvamento após dois segundos de inatividade, quando existe uma pasta ativa. Campos ainda não aplicados continuam como rascunhos do formulário: use sua ação **Aplicar/Salvar** antes de sair.
- **Arquivos** reúne Salvar como, Desfazer, Refazer, Histórico e Recarregar da pasta. Há até 50 operações reversíveis na sessão. Atalhos em campos de texto continuam editando o próprio texto.
- **Histórico** apresenta versões com data e descrição; mostra diferenças antes de restaurar. A restauração cria nova revisão, sem excluir versões anteriores. Os arquivos completos podem ocupar espaço significativo.
- Falha de gravação não vira sucesso. Conflito com outra gravação exige recarregar ou salvar uma cópia; não sobrescreva o trabalho da outra aba.
- Catálogos e composições são copiados para o projeto. O pacote preserva a composição e a especificação adotadas até você solicitar comparação e atualização.
- Uma revisão proposta fica fora da demanda até sua ativação. Não substitua silenciosamente compromissos ou recebimentos históricos. Reservas podem ser liberadas quando não há recebimento; o trabalho remanescente deve ter escopo próprio.

## Premissas explícitas

Datas de suprimentos usam dias corridos. Margem inicial zero. Concreto fresco recebe na data de uso. Para reutilizáveis, a consolidação usa ocupação simultânea; o retorno inicial é um dia após o término, sujeito à conferência. Quantidades desconhecidas permanecem pendentes. Se o mesmo elemento/serviço aparece em janelas diferentes e seu volume não está dividido, a estimativa permanece desconhecida até esclarecer o recorte.

O mapa oferece CSV/JSON e identifica origem macro ou pacote. Um recorte detalhado consome suas tarefas de origem; nomes alternativos do mesmo serviço não permitem duplicar a demanda sobre os mesmos elementos.

## Alcance desta versão

O fluxo de pacotes se apoia em elementos com tarefas 4D vinculadas. Os filtros de busca das vistas são próprios; a seleção do modelo e o projeto são compartilhados. A IA existente auxilia restrições e análise, mas não libera, calcula datas, confirma execução ou transmite pedidos. As composições iniciais são determinísticas e editáveis. Instalação em outra máquina e chamadas reais a provedores não foram repetidas nesta rodada.

Veja [ensaio e evidências](QA_EVOLUCAO_INTEGRADA.md). Não houve commit nem publicação desta versão.
