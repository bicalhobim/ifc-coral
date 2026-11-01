# Projetos locais e acesso ao IFC Coral

## Entrar e escolher um projeto

1. Inicie o servidor local do aplicativo e abra seu endereço. A versão local para Windows abre a janela nativa **IFC Coral - Escolher pasta**, inclusive quando o aplicativo é acessado pelo navegador integrado.
2. Preencha qualquer texto nos campos E-mail e Senha e clique em Entrar. Esses valores são descartados; a tela não autentica uma conta nem protege dados.
3. Na home, clique em **Novo projeto**. Informe o nome e clique em **Escolher pasta…**. Na janela do Windows, navegue pelas pastas e atalhos e confirme **Usar esta pasta**. De volta ao IFC Coral, confira o destino e clique em **Criar projeto**. Não é necessário digitar um caminho. Uma subpasta com o nome informado será criada; pastas existentes não são sobrescritas.
4. Use **Abrir pasta de projeto** ou um cartão de **Projetos recentes** para continuar. Na abertura, escolha a pasta que contém `IFC-Coral.projeto.json`. Uma sessão antiga do navegador pode ser recuperada e gravada por **Salvar como**.
5. Para começar com o modelo da aula, use **Iniciar exercício com TORRE02**. O IFC e seu cronograma são carregados automaticamente; **Salvar como** permite escolher a pasta dessa cópia.

## Projeto comum e exercício didático

**Novo projeto** cria um projeto em branco. O editor oferece **Importar IFC** e trabalha apenas com os arquivos, pacotes e dados desse projeto. Não há botão para abrir TORRE02, gerar caso de exemplo ou acrescentar cotações fictícias. Abrir um projeto existente respeita o que ele contém.

O exercício é iniciado exclusivamente pelo cartão **Primeiro exercício — TORRE02**, na home. A origem didática fica registrada no arquivo do projeto e é preservada por Salvar, Salvar como e exportação. Somente esse contexto oferece **Criar caso de concretagem** e as orientações do cenário simulado. O relatório geométrico incluído na instalação só é carregado automaticamente nesse contexto.

O nome do projeto, o nome do IFC e até um conteúdo IFC idêntico ao modelo da aula não ativam o exercício. Arquivos antigos sem identificação explícita são tratados como projetos comuns, preservando seus dados; para uma nova cópia didática, use o cartão da home.

## Organização

- `IFC-Coral.projeto.json`: documento principal com os dados e os modelos IFC incorporados, com verificação de integridade.
- `Modelos`: cópias dos IFCs identificadas pelo hash do conteúdo.
- `Relatorios`: relatórios geométricos utilizados no projeto, quando presentes.
- `Exportacoes`: arquivos portáteis, tabelas CSV, medições e demais exportações geradas pela interface. Nomes repetidos recebem sufixos.
- Arquivos de marcador identificam tentativas iniciais de salvamento e permitem recuperar uma gravação interrompida do mesmo projeto. Não devem ser utilizados para editar os dados manualmente.

A instalação do programa fica separada. O projeto é salvo na pasta escolhida pelo usuário; a lista de recentes guarda nomes e uma referência à pasta. O serviço local mantém o registro dos destinos selecionados em `%LOCALAPPDATA%/IFC Coral/folders.json`, para reabri-los após reiniciar. Esse registro não contém modelos, projetos ou credenciais.

## Salvar e Salvar como

Salvar ou Ctrl+S grava o projeto atual. O indicador de alterações desaparece apenas após a gravação bem-sucedida. Alterações de edição exigem salvamento explícito.

Salvar como ou Ctrl+Shift+S abre o mesmo diálogo de nome e destino, cria uma cópia com identidade própria e passa a trabalhar nela. A pasta de origem é preservada. Ao voltar para a home com alterações, escolha salvar, continuar sem salvar ou cancelar. Cancelar a escolha do destino não cria um projeto nem representa falha de gravação.

As exportações são encaminhadas à pasta do projeto, salvando primeiro as alterações necessárias. Fechar a página com alterações pendentes gera o aviso nativo do navegador. Permissão negada, cancelamento, corrupção e mudanças detectadas por outra sessão não autorizam sobrescrita silenciosa.

## Árvore IFC

Clique com o botão direito no nome do arquivo ou use o botão de reticências para consultar informações, substituir o arquivo, exportar o IFC ou remover o modelo do projeto. A substituição preserva a identidade lógica e exige revisão dos vínculos alterados. A remoção de modelos vinculados a pacotes é bloqueada para preservar decisões e compromissos; os arquivos originais não são apagados do disco por esse comando.

## Verificação desta implementação

Os testes incluem doubles da API de arquivos e gravação real em diretórios temporários pelo serviço local: leitura, integridade, colisões, recuperação inicial, edição obsoleta, persistência do registro, rejeição de links e recusa de requisições de outra origem. O ensaio pela interface deve comprovar separadamente criação, salvamento e reabertura.

## Serviço local e limites

O serviço acompanha `npm run dev` e `npm run preview` no Windows. O destino vem do diálogo nativo Common Item Dialog, aberto por um auxiliar PowerShell em modo STA. As operações exigem sessão local e origem correspondente ao endereço de loopback; nenhum serviço remoto recebe os arquivos. Requisições web não escolhem um caminho arbitrário: as operações subsequentes usam uma referência ao diretório confirmado na janela do Windows. Links/junctions e caminhos de rede UNC não são aceitos. O limite atual é de 128 MB por requisição; arquivos IFC muito grandes podem exigir uma evolução para transferência em blocos. A primeira abertura pode levar alguns segundos para preparar o auxiliar; concluir ou cancelar libera uma nova escolha. A janela expira após cinco minutos sem conclusão.

Hospedagem apenas estática, sem o servidor local, continua dependendo da API de pastas do Chrome/Edge. O diálogo local não transforma uma hospedagem em nuvem em acesso ao disco do aluno.

Referência da API: [File System Access — Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
