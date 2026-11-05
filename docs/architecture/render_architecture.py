from pathlib import Path
from html import escape
import pymupdf as fitz
import re
import math

ROOT = Path(__file__).resolve().parent
P = '#7500C0'
ACCENT = '#A100FF'
INK = '#261B36'
MUTED = '#655C72'
TEAL = '#087F8C'
svg = []

def add(x):
    svg.append(x)

def rect(x, y, w, h, fill='#FFFFFF', stroke='#DDD2EB', radius=24, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"{d}/>')

def text(x, y, value, size=28, fill=INK, weight=400):
    add(f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}">{escape(value)}</text>')

def lines(x, y, values, size=28, leading=39, fill=INK, weight=400):
    for i, value in enumerate(values):
        text(x, y+i*leading, value, size, fill, weight)

def path(d, color=P, width=4, both=False, dash=None):
    a = ''
    if dash:
        a += f' stroke-dasharray="{dash}"'
    add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"{a}/>')
    tokens = re.findall(r'[MLHV]|-?\d+(?:\.\d+)?', d)
    points = []
    i = 0
    while i < len(tokens):
        command = tokens[i]
        i += 1
        if command in ('M', 'L'):
            point = (float(tokens[i]), float(tokens[i+1]))
            i += 2
        elif command == 'H':
            point = (float(tokens[i]), points[-1][1])
            i += 1
        elif command == 'V':
            point = (points[-1][0], float(tokens[i]))
            i += 1
        points.append(point)
    def head(previous, tip):
        dx, dy = tip[0]-previous[0], tip[1]-previous[1]
        length = math.hypot(dx, dy)
        ux, uy = dx/length, dy/length
        bx, by = tip[0]-17*ux, tip[1]-17*uy
        coordinates = [tip, (bx-8*uy, by+8*ux), (bx+8*uy, by-8*ux)]
        coords = ' '.join(f'{x:.2f},{y:.2f}' for x, y in coordinates)
        add(f'<polygon points="{coords}" fill="{color}"/>')
    head(points[-2], points[-1])
    if both:
        head(points[1], points[0])

def label(x, y, value, width, size=22):
    rect(x-10, y-24, width, 34, fill='#F7F4FB', stroke='#F7F4FB', radius=8)
    text(x, y, value, size, MUTED, 600)

add('<svg xmlns="http://www.w3.org/2000/svg" width="2880" height="1800" viewBox="0 0 2880 1800">')
add(f'<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse"><path d="M0 0 L9 5 L0 10 Z" fill="{P}"/></marker><marker id="back" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse"><path d="M0 0 L9 5 L0 10 Z" fill="{P}"/></marker></defs>')
rect(0, 0, 2880, 1800, fill='#F7F4FB', stroke='#F7F4FB', radius=0)
rect(56, 56, 12, 130, fill=ACCENT, stroke=ACCENT, radius=6)
text(94, 106, 'IFC CORAL', 44, P, 700)
text(94, 165, 'Como o sistema funciona — arquitetura atual', 51, INK, 700)
text(94, 209, 'Aplicação web local · regras de planejamento no navegador · persistência em arquivos · IA opcional', 29, MUTED)

text(82, 267, 'NO COMPUTADOR DO USUÁRIO', 24, P, 700)
text(1834, 267, 'EXTENSÕES E SERVIÇOS OPCIONAIS', 24, TEAL, 700)

rect(70, 290, 1620, 725, '#FFFFFF', '#BA87DF')
rect(70, 290, 1620, 80, '#460073', '#460073')
text(105, 341, 'FRONT-END  |  Navegador', 31, '#FFFFFF', 700)
text(779, 341, 'TypeScript + HTML/CSS · Vite', 27, '#FFFFFF')

rect(110, 405, 520, 235, '#F7F0FF', '#E0CBF4')
text(138, 448, 'Modelo e planejamento visual', 29, P, 700)
lines(138, 492, ['IFC, seleção, propriedades e 4D', 'Gantt e linha de balanço', 'That Open / Fragments + Three.js', 'web-ifc WASM + Web Worker'], 26, 37)

rect(665, 405, 965, 235, '#F7F0FF', '#E0CBF4')
text(694, 448, 'Regras de negócio executadas no navegador', 29, P, 700)
lines(694, 492, ['Catálogos → quantificação → pacotes → restrições', 'Composições → mapa de suprimentos → recursos', 'Kanban → compromisso semanal → execução / PPC', 'Cálculos e estados determinísticos; decisões humanas'], 27, 37)

path('M370 645 V679')
path('M1150 645 V679')
rect(110, 687, 1520, 164, '#EFE5FA', '#B98BDF')
text(142, 731, 'ESTADO DO PROJETO — operações validadas + histórico', 31, P, 700)
text(142, 774, 'Modelos · elementos · medições · pacotes · restrições · demandas · compromissos · registros', 27)
text(142, 818, 'Vínculo estável: modelId + GlobalId   |   Hash identifica a revisão do arquivo IFC', 28, P, 700)

rect(110, 887, 1520, 86, '#F7F7FA', '#E8E3EE', radius=15)
text(138, 921, 'CACHE DO NAVEGADOR  |  IndexedDB + localStorage', 25, MUTED, 700)
text(138, 953, 'Modelos, recuperação de sessão e preferências. Não substitui o projeto salvo na pasta.', 25, MUTED)

rect(70, 1115, 760, 410, '#FFFFFF', '#97C9CE')
text(104, 1164, 'BACK-END LOCAL', 25, TEAL, 700)
text(104, 1208, 'Node.js + plugin do Vite', 32, INK, 700)
lines(104, 1262, ['Janela de pastas do Windows', 'Leitura / gravação e histórico de arquivos', 'Proteção de requisições locais', 'Executa o Codex CLI instalado', 'HTTP em 127.0.0.1:5178'], 27, 40)
text(104, 1491, 'Não é um servidor de contas ou banco central.', 24, MUTED)

rect(920, 1115, 770, 410, '#FFFFFF', '#BA87DF')
text(953, 1164, 'PASTA ESCOLHIDA PARA O PROJETO', 25, P, 700)
text(953, 1212, 'IFC-Coral.projeto.json', 32, INK, 700)
lines(953, 1259, ['Dados + modelos IFC incorporados (base64)', 'Modelos/ — cópias dos arquivos IFC', 'Historico/ — versões locais', 'Exportacoes/ — CSV, JSON e relatórios'], 26, 39)
text(953, 1444, 'Autosave após escolher a pasta + Salvar / Salvar como', 24, P, 700)
text(953, 1491, 'Armazenamento atual: JSON, sem banco SQL.', 24, MUTED)

path('M430 1020 V1104', both=True)
label(450, 1067, 'HTTP local /__coral_local/*', 340)
path('M837 1342 H908', both=True)
label(839, 1316, 'I/O', 54)

rect(1825, 290, 975, 255, '#FFFFFF', '#A1CFD2')
text(1860, 335, 'IA POR CHAVE INDIVIDUAL', 25, TEAL, 700)
text(1860, 380, 'OpenAI / Gemini', 32, INK, 700)
lines(1860, 424, ['Chamada direta do navegador ao provedor.', 'Chave e modelo informados pelo usuário; chave só em memória.', 'Integrações implementadas; chave real ainda não ensaiada.'], 26, 39)
path('M1697 460 H1812')
label(1701, 439, 'HTTPS', 100)

rect(1825, 602, 975, 245, '#FFFFFF', '#A1CFD2')
text(1860, 647, 'IA VIA CODEX', 25, TEAL, 700)
text(1860, 692, 'CLI local → inferência remota', 32, INK, 700)
lines(1860, 737, ['Conta autenticada e modelo disponível no Codex.', 'Contexto estruturado do pacote; proposta revisada pelo usuário.', 'Chamada real registrada no QA; não usa esta conversa aberta.'], 26, 39)
path('M785 1110 V1053 H1745 V724 H1812')
label(1230, 1078, 'CLI + contexto do pacote', 316)

rect(1825, 904, 975, 218, '#FFFFFF', '#D2C2E3', dash='10 7')
text(1860, 949, 'FERRAMENTA OFFLINE OPCIONAL', 25, P, 700)
text(1860, 994, 'Python + IfcOpenShell', 32, INK, 700)
text(1860, 1040, 'Processa geometria e gera relatório JSON para a quantificação.', 26)
text(1860, 1081, 'Não é o back-end principal nem requisito para todo cálculo.', 25, MUTED)
path('M1811 992 H1698')
label(1701, 970, 'JSON', 77)

rect(1825, 1180, 975, 345, '#FFFFFF', '#B98BDF')
text(1860, 1225, 'INTEGRAÇÃO ENTRE APLICATIVOS', 25, P, 700)
text(1860, 1270, 'IFC Coral → Compras IA', 32, INK, 700)
lines(1860, 1318, ['Snapshot JSON v1: demandas + vínculos + premissas.', 'Contrato, schema e fingerprints conferidos no exportador.', 'Troca por arquivo; sem banco compartilhado ou API contínua.', 'Contato, cotação e pedido pertencem ao outro aplicativo.'], 26, 39)
text(1860, 1491, 'Ensaio completo com o consumidor: próxima validação.', 25, P, 700)
path('M1610 1020 V1090 H1765 V1375 H1812')
label(1697, 1156, 'JSON v1', 115)

rect(70, 1581, 2730, 148, '#460073', '#460073')
text(105, 1629, 'O IFC ancora a identidade; o projeto local registra as decisões e o que foi conferido.', 33, '#FFFFFF', 700)
text(105, 1672, 'IA propõe. Pessoas revisam e liberam. Datas de planejamento não comprovam execução ou disponibilidade.', 27, '#FFFFFF')
text(105, 1708, 'A entrada atual não autentica contas. Não há nuvem de projetos, compras autônomas ou colaboração multiusuário nesta versão.', 25, '#E7C9FF')
text(76, 1770, 'Professor Lucas Bicalho · High-level design baseado no código local · 04/11/2026', 24, MUTED)
text(1970, 1770, 'IFC Coral · arquitetura implementada', 24, P, 700)
add('</svg>')

target = ROOT / '02-arquitetura-tecnica.svg'
target.write_text('\n'.join(svg), encoding='utf-8')
with fitz.open(target) as doc:
    doc[0].get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False).save(ROOT / '02-arquitetura-tecnica.png')

print('Technical diagram rendered as SVG and PNG.')
