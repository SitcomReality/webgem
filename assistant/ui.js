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
    this.output.className = 'assistant-output';
    this.output.innerHTML = `
      <div class="assistant-character">
        <img src="assistant_buddy.png" alt="A friendly digital assistant" />
      </div>
      <div class="assistant-speech-bubble">
        <div class="assistant-response-content"></div>
        <button class="close" aria-label="Close">×</button>
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
    const contentEl = this.output.querySelector('.assistant-response-content');
    contentEl.textContent = 'Summoning sparkle-brain...';
    this.output.classList.add('active');
    const text = await window.AssistantLLM.getSuggestion(payload);
    contentEl.textContent = text;
  }
};