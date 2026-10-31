# Componentes de terceiros incorporados ao visualizador

Este registro identifica arquivos distribuídos no repositório e preserva textos de licença encontrados nas fontes indicadas. Não define a licença do código próprio do IFC Coral.

| Componente | Arquivos | Origem e licença declarada |
| --- | --- | --- |
| web-ifc 0.0.77 | `viewer/public/engine/web-ifc.wasm`, `web-ifc-mt.wasm` | [Código-fonte do projeto](https://github.com/ThatOpen/engine_web-ifc); o pacote instalado declara MPL-2.0. [Texto da licença copiado do pacote instalado](web-ifc/LICENSE.md). |
| @thatopen/fragments 3.4.6 | `viewer/public/engine/worker.mjs` | [Código-fonte do projeto](https://github.com/ThatOpen/engine_fragment); o pacote instalado declara MIT. [Texto MIT da licença no repositório oficial, consultado em 31/10/2026](thatopen-fragments/LICENSE.md). Confirmar sua correspondência com a revisão específica antes da distribuição. |
| Three.js | Código incorporado no worker e dependência do viewer | O worker preserva avisos Three.js Authors 2010–2026 e identifica MIT. [Licença do pacote Three.js 0.182.0 instalado](three/LICENSE); o worker identifica uma revisão incorporada distinta. [Projeto Three.js](https://github.com/mrdoob/three.js). |
| pako 2.1.0 | Código incorporado no worker | O próprio worker identifica MIT e zlib. [Licença do pacote pako 2.1.0 instalado](pako/LICENSE); [projeto pako](https://github.com/nodeca/pako). |

Outras dependências são instaladas pelo lockfile e mantêm suas próprias licenças. Consulte seus respectivos pacotes. Esta lista é uma conferência dos avisos identificados, não uma auditoria jurídica completa de todos os componentes transitivos.
