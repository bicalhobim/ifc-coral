import './portal.css';

export type RecentItem = { id: string; name: string; folderName: string };

export type PortalHooks = {
  onLogin: () => Promise<void>;
  onNew: () => Promise<void>;
  onOpen: () => Promise<void>;
  onRecent: (id: string) => Promise<void>;
  onRecover: () => Promise<void>;
  onExplore: () => Promise<void>;
  onPractice: () => Promise<void>;
};

let portalCount = 0;

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Presentation only: folder access and project persistence belong to the host. */
export class ProjectPortal {
  readonly element: HTMLElement;
  private readonly hooks: PortalHooks;
  private readonly id = `project-portal-${++portalCount}`;
  private error: HTMLElement | undefined;
  private status: HTMLElement | undefined;
  private busy = false;
  private revision = 0;
  private previousFocus: HTMLElement | null = null;

  constructor(hooks: PortalHooks) {
    this.hooks = hooks;
    this.element = node('section', 'project-portal');
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-labelledby', `${this.id}-title`);
    this.element.dataset.state = 'hidden';
    this.element.hidden = true;
    this.element.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const targets = Array.from(this.element.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]'));
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !this.element.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !this.element.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
  }

  showLogin(): void {
    const content = this.start('login');
    const layout = node('div', 'portal-login-layout');
    const intro = node('div', 'portal-intro');
    intro.append(node('span', 'portal-eyebrow', 'DO MODELO À DECISÃO'));
    const title = node('h1', 'portal-intro-title', 'Seu projeto.\nUma visão integrada.');
    title.id = `${this.id}-title`;
    intro.append(title, node('p', 'portal-intro-copy', 'Conecte modelos IFC, planejamento e produção em um só lugar.'));
    const motif = node('div', 'portal-motif');
    motif.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) motif.append(node('span', 'portal-motif-layer'));
    intro.append(motif, node('span', 'portal-intro-caption', 'MODELO · PLANEJAMENTO · PRODUÇÃO'));

    const card = node('div', 'portal-login-card');
    const form = node('form', 'portal-form');
    form.autocomplete = 'off';
    const heading = node('h2', '', 'Bem-vindo ao IFC Coral');
    const hint = node('p', 'portal-copy', 'Entre para organizar seus projetos.');
    const notice = node('p', 'portal-demo-notice', 'Acesso local sem autenticação: qualquer e-mail e senha preenchidos permitem continuar. Os dados de acesso não são enviados nem salvos pelo aplicativo.');
    notice.id = `${this.id}-demo`;
    form.setAttribute('aria-describedby', notice.id);
    const email = this.input('E-mail', 'Seu e-mail', 'text', 'email');
    email.input.inputMode = 'email';
    email.input.autocapitalize = 'none';
    email.input.spellcheck = false;
    const password = this.input('Senha', 'Preencha para continuar', 'password', 'password');
    password.input.autocomplete = 'new-password';
    const submit = this.button('Entrar', 'portal-primary');
    submit.type = 'submit';
    this.error = this.errorArea();
    form.append(heading, hint, notice, email.label, password.label, this.error, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!email.input.value.trim() || !password.input.value.length) {
        this.showError('Preencha o e-mail e a senha para entrar.');
        (!email.input.value.trim() ? email.input : password.input).focus();
        return;
      }
      // Values stay in these DOM inputs only; callbacks receive no credentials.
      email.input.value = '';
      password.input.value = '';
      void this.run(() => this.hooks.onLogin());
    });
    card.append(form);
    layout.append(intro, card);
    content.append(layout);
    this.focusSoon(email.input);
  }

  showHome(recents: RecentItem[], legacyAvailable: boolean): void {
    const content = this.start('home');
    const top = node('div', 'portal-home-heading');
    const text = node('div', '');
    text.append(node('span', 'portal-eyebrow', 'SEU ESPAÇO DE TRABALHO'));
    const title = node('h1', '', 'Meus projetos');
    title.id = `${this.id}-title`;
    title.tabIndex = -1;
    text.append(title, node('p', 'portal-copy', 'Comece um projeto ou continue de onde parou.'));
    const logout = this.button('Sair', 'portal-text-button');
    logout.addEventListener('click', () => this.showLogin());
    top.append(text, logout);
    this.error = this.errorArea();
    const starters = node('div', 'portal-starters');
    const starter=(eyebrow:string,title:string,description:string,action:string,run:()=>Promise<void>)=>{
      const card=node('section','portal-action-card portal-starter');
      card.append(node('span','portal-eyebrow',eyebrow),node('h2','',title),node('p','portal-copy',description));
      const button=this.button(action,'portal-primary');button.addEventListener('click',()=>{void this.run(run);});card.append(button);starters.append(card);
    };
    starter('EXEMPLO GUIADO','Explore — Projeto Modelo','Modelo IFC e 4D com pacote, restrições e propostas fictícias já preenchidos. Tour explicativo que você pode pular e reiniciar.','Explorar exemplo',this.hooks.onExplore);
    starter('ATIVIDADE EM GRUPO','Pratique — Exercício 02','IFC e cronograma 4D preparados. Seu grupo escolhe elementos, confere quantidades e constrói o próprio percurso até a exportação.','Iniciar exercício 02',this.hooks.onPractice);
    starter('PROJETO PRÓPRIO','Crie — Meu Novo Projeto','Comece sem dados herdados. Defina as informações gerais, escolha uma pasta no computador e importe seu IFC quando quiser.','Criar projeto',this.hooks.onNew);
    const actions = node('div', 'portal-actions');
    const open = node('section', 'portal-action-card portal-open-card');
    const folderIcon = node('span', 'portal-card-icon portal-folder-icon', '↗');
    folderIcon.setAttribute('aria-hidden', 'true');
    open.append(folderIcon, node('h2', '', 'Continuar um projeto'));
    open.append(node('p', 'portal-copy', 'Selecione uma pasta de projeto existente para carregar seus modelos e dados.'));
    const openButton = this.button('Abrir pasta de projeto', 'portal-secondary');
    openButton.addEventListener('click', () => { void this.run(() => this.hooks.onOpen()); });
    open.append(openButton);
    actions.append(open);

    const recent = node('section', 'portal-recents');
    const recentTitle = node('h2', '', 'Projetos recentes');
    recentTitle.id = `${this.id}-recents`;
    recent.setAttribute('aria-labelledby', recentTitle.id);
    recent.append(recentTitle);
    if (!recents.length) {
      recent.append(node('p', 'portal-empty', 'Seus projetos aparecerão aqui depois que você criar ou abrir uma pasta.'));
    } else {
      const grid = node('div', 'portal-recent-grid');
      for (const item of recents) {
        const card = node('article', 'portal-recent-card');
        card.append(node('span', 'portal-recent-mark', '◇'), node('h3', '', item.name), node('p', 'portal-folder-name', item.folderName));
        const button = this.button('Abrir projeto', 'portal-text-button');
        button.setAttribute('aria-label', `Abrir projeto ${item.name}`);
        button.addEventListener('click', () => { void this.run(() => this.hooks.onRecent(item.id)); });
        card.append(button);
        grid.append(card);
      }
      recent.append(grid);
    }
    this.status = node('p', 'portal-progress');
    this.status.setAttribute('role', 'status');this.status.hidden = true;
    content.append(top, this.error, this.status, starters, actions, recent);
    if (legacyAvailable) {
      const recovery = node('aside', 'portal-recovery');
      recovery.append(node('p', '', 'Há uma sessão anterior salva neste navegador.'));
      const recover = this.button('Recuperar sessão anterior', 'portal-text-button');
      recover.addEventListener('click', () => { void this.run(() => this.hooks.onRecover()); });
      recovery.append(recover);
      content.append(recovery);
    }
    this.focusSoon(title);
  }

  hide(): void {
    this.revision++;
    this.busy = false;
    this.element.hidden = true;
    this.element.dataset.state = 'hidden';
    this.element.removeAttribute('aria-busy');
    this.element.replaceChildren();
    this.error = undefined;
    this.status = undefined;
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
    this.previousFocus = null;
  }

  showError(text: string): void {
    if (!this.error) return;
    this.error.textContent = text;
    this.error.hidden = !text;
    if(text){this.error.tabIndex=-1;this.error.focus();this.error.scrollIntoView({block:'nearest'});}
  }

  showStatus(text: string): void {
    if(!this.status)return;
    this.status.textContent=text;this.status.hidden=!text;
  }

  private start(state: 'login' | 'home'): HTMLElement {
    if (this.element.hidden && document.activeElement instanceof HTMLElement) this.previousFocus = document.activeElement;
    this.revision++;
    this.busy = false;
    this.element.hidden = false;
    this.element.dataset.state = state;
    this.element.removeAttribute('aria-busy');
    this.element.replaceChildren();
    this.status = undefined;
    const header = node('header', 'portal-header');
    const brand = node('div', 'portal-brand');
    brand.append(node('span', 'portal-brand-mark', '◇'), node('strong', '', 'IFC Coral'));
    header.append(brand);
    const main = node('div', 'portal-content');
    const footer = node('footer', 'portal-footer', 'IFC Coral · Modelos e dados organizados em pastas de projeto.');
    this.element.append(header, main, footer);
    return main;
  }

  private input(text: string, placeholder: string, type: string, key: string): { label: HTMLLabelElement; input: HTMLInputElement } {
    const label = node('label', 'portal-field');
    const input = node('input', '');
    input.id = `${this.id}-${key}`;
    input.type = type;
    input.placeholder = placeholder;
    input.required = true;
    label.htmlFor = input.id;
    label.append(node('span', '', text), input);
    return { label, input };
  }

  private button(text: string, style: string): HTMLButtonElement {
    const button = node('button', `portal-button ${style}`, text);
    button.type = 'button';
    return button;
  }

  private errorArea(): HTMLElement {
    const error = node('p', 'portal-error');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    return error;
  }

  private focusSoon(target: HTMLElement): void {
    const revision = this.revision;
    queueMicrotask(() => { if (revision === this.revision && target.isConnected) target.focus({preventScroll:true});this.element.scrollTop=0; });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.busy) return;
    const revision = this.revision;
    this.busy = true;
    this.showError('');
    this.showStatus('Aguarde…');
    this.element.setAttribute('aria-busy', 'true');
    const controls = Array.from(this.element.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input'));
    for (const control of controls) control.disabled = true;
    try {
      // Start directly in the click/submit handler to retain folder-picker activation.
      await action();
    } catch (error: unknown) {
      if (revision === this.revision) {
        this.showError(error instanceof Error ? error.message : 'Não foi possível concluir a ação. Tente novamente.');
      }
    } finally {
      if (revision === this.revision) {
        this.busy = false;
        this.showStatus('');
        this.element.removeAttribute('aria-busy');
        for (const control of controls) control.disabled = false;
      }
    }
  }
}
