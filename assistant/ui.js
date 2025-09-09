// UI for floating assistant
window.AssistantUI = {
  init() {
    this.panel = document.createElement('div');
    this.panel.className = 'assistant-panel';
    this.panel.innerHTML = `
      <button class="assistant-btn" data-intent="suggest" title="Suggest a gem">Suggest</button>
      <button class="assistant-btn" data-intent="explain" title="Why these?">Explain</button>
      <button class="assistant-btn" data-intent="tune" title="Tune ranking">Tune</button>
    `;
    document.body.appendChild(this.panel);

    this.output = document.createElement('div');
    this.output.className = 'assistant-overlay';
    this.output.innerHTML = `
      <div class="beam"></div><div class="beam beam-2"></div><div class="beam beam-3"></div>
      <div class="assistant-output buddy-window">
        <div class="header"><span class="flare">GLORIOUS BUDDY TRANSMISSION</span><button class="close" aria-label="Close">✖</button></div>
        <div class="marquee">🚪🚪🚪🚪🚪🚪🚪🚪🚪🚪🚪🚪🚪🚪¿🚪¿🚪🚪🚪🚪🍟🚪🚪🚪</div>
        <div class="content">...</div>
      </div>
    `;
    document.body.appendChild(this.output);

    this.panel.addEventListener('click', async (e) => {
      const btn = e.target.closest('.assistant-btn');
      if (!btn) return;
      const intent = btn.dataset.intent;
      await this.request(intent);
    });

    this.output.querySelector('.close').addEventListener('click', () => {
      this.output.classList.remove('active');
    });
  },

  async request(intent) {
    const payload = window.AssistantPrompt.build({ intent });
    const contentEl = this.output.querySelector('.content');
    contentEl.textContent = 'Summoning sparkle-brain...';
    this.output.classList.add('active');
    const text = await window.AssistantLLM.getSuggestion(payload);
    contentEl.textContent = text;
  }
};