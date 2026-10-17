let nextHelp = 0;

/** Ajuda acessível no mouse, teclado e toque. Nada importante depende só de hover. */
export function helpButton(label: string, text: string): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'context-help';
  const button = document.createElement('button');
  button.className = 'help-button';
  button.type = 'button';
  button.textContent = '?';
  button.setAttribute('aria-label', `Ajuda: ${label}`);
  button.setAttribute('aria-expanded', 'false');
  const popover = document.createElement('span');
  popover.id = `help-${++nextHelp}`;
  popover.className = 'help-popover';
  popover.setAttribute('role', 'tooltip');
  popover.textContent = text;
  popover.hidden = true;
  button.setAttribute('aria-describedby', popover.id);
  let pinned = false;
  const hide = () => {
    popover.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  const show = () => {
    popover.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = Math.min(310, window.innerWidth - 32);
    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16))}px`;
    const height = popover.getBoundingClientRect().height;
    popover.style.top = `${Math.max(16, rect.bottom + height + 18 > window.innerHeight ? rect.top - height - 10 : rect.bottom + 10)}px`;
    button.setAttribute('aria-expanded', 'true');
  };
  wrap.onpointerenter = show;
  wrap.onpointerleave = () => { if (!pinned) hide(); };
  button.onfocus = show;
  button.onblur = () => { pinned = false; hide(); };
  button.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    pinned = !pinned;
    if (pinned) show(); else hide();
  };
  button.onkeydown = event => {
    if (event.key === 'Escape') { pinned = false; hide(); event.stopPropagation(); }
  };
  wrap.append(button, popover);
  return wrap;
}

export function infoLine(label: string, explanation: string): HTMLElement {
  const line = document.createElement('div');
  line.className = 'info-line';
  const name = document.createElement('span');
  name.textContent = label;
  line.append(name, helpButton(label, explanation));
  return line;
}

export function simplifyExplanations(root: HTMLElement) {
  for (const paragraph of root.querySelectorAll<HTMLElement>('p.lead,p.fine')) {
    const text = paragraph.textContent ?? '';
    const label = text.startsWith('Planeje') ? 'Local e serviço'
      : text.startsWith('Local inicial') ? 'Conferência da localização'
      : text.startsWith('Cenário:') ? 'Calendário deste exercício'
      : text.startsWith('A necessidade') ? 'Planejamento do fornecimento'
      : 'Como funciona';
    paragraph.replaceWith(infoLine(label, text));
  }
  for (const paragraph of root.querySelectorAll<HTMLElement>('p')) {
    const text = paragraph.textContent ?? '';
    if (text.startsWith('Remover uma restrição exige')) paragraph.replaceWith(infoLine('O que vale como evidência?', text));
    if (text.startsWith('Selecione os pacotes prontos.')) paragraph.replaceWith(infoLine('O que significa congelar a semana?', text));
    if (text.startsWith('Semana congelada por ')) {
      const cut = text.indexOf(' PPC =');
      if (cut > 0) {
        paragraph.textContent = text.slice(0, cut);
        paragraph.className = 'frozen-note';
        paragraph.append(helpButton('Cálculo do PPC', text.slice(cut + 1)));
      }
    }
  }
}
