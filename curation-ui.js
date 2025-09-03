class CurationUI {
  constructor(curationsDB) {
    this.curationsDB = curationsDB;
    this.isCurator = false;
    this.fab = null;
    this.panel = null;
    this.setup();
  }

  async setup() {
    try {
      const user = await window.websim?.getUser?.();
      this.isCurator = user?.username === 'SitcomReality';
    } catch { 
      this.isCurator = false; 
    }

    if (!this.isCurator) return;

    // Ensure curationsDB is available
    if (!this.curationsDB) {
      console.warn('CurationsDB not ready, waiting...');
      // Wait for curationsDB to be available
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (window.curationsDB) {
            this.curationsDB = window.curationsDB;
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.createCuratorFAB();
    this.createCurationPanel();

    // Add CSS for curator-only elements
    const style = document.createElement('style');
    style.textContent = `
      .curator-only { display: none; }
      .curator-active .curator-only { display: block; }
    `;
    document.head.appendChild(style);
    
    // Activate curator mode
    document.documentElement.classList.add('curator-active');
  }

  createCuratorFAB() {
    this.fab = document.createElement('button');
    this.fab.className = 'curations-fab';
    this.fab.id = 'curationsFab';
    this.fab.textContent = 'Curated';
    document.body.appendChild(this.fab);
  }

  createCurationPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'curations-panel';
    this.panel.id = 'curationsPanel';
    this.panel.innerHTML = `
      <header>
        <strong>Curated Projects</strong>
        <button class="cur-remove" id="curationsClose">Close</button>
      </header>
      <div class="curations-list" id="curationsList"></div>
    `;
    document.body.appendChild(this.panel);

    // Event listeners
    this.fab.addEventListener('click', async () => {
      this.panel.classList.toggle('active');
      await this.refreshCurationsPanel();
    });

    this.panel.querySelector('#curationsClose').addEventListener('click', () => {
      this.panel.classList.remove('active');
    });
  }

  createCurationControls(projectId, projectTitle) {
    if (!this.isCurator) return null;

    const container = document.createElement('div');
    container.className = 'curation-controls curator-only';
    container.innerHTML = `
      <select class="curation-select">
        <option value="underappreciated">Underappreciated</option>
        <option value="overlooked">Overlooked</option>
        <option value="rising">Rising</option>
      </select>
      <button class="curation-add-btn">Add</button>
    `;

    const addBtn = container.querySelector('.curation-add-btn');
    const select = container.querySelector('.curation-select');

    addBtn.addEventListener('click', async () => {
      const listKey = select.value;
      await this.curationsDB.add(listKey, { id: projectId, title: projectTitle });
      await this.refreshCurationsPanel();
      
      addBtn.textContent = 'Added ';
      setTimeout(() => addBtn.textContent = 'Add', 1200);
    });

    return container;
  }

  async refreshCurationsPanel() {
    const listEl = this.panel?.querySelector('#curationsList');
    if (!listEl) return;

    try {
      // Ensure database is ready
      if (!this.curationsDB) {
        console.error('CurationsDB not available');
        return;
      }

      const data = await this.curationsDB.load();
      const sections = [
        { key: 'underappreciated', label: 'Underappreciated' },
        { key: 'overlooked', label: 'Overlooked' },
        { key: 'rising', label: 'Rising' }
      ];

      const html = sections.map(sec => {
        const items = (data[sec.key] || []).map(item => `
          <div class="cur-item">
            <a href="https://websim.com/c/${item.id}" target="_blank">${this.escapeHtml(item.title)}</a>
            <button class="cur-remove" data-key="${sec.key}" data-id="${item.id}">Remove</button>
          </div>
        `).join('');

        return `
          <div class="curations-section">
            <h4>${sec.label}</h4>
            ${items || '<div class="cur-item"><em>None yet</em></div>'}
          </div>
        `;
      }).join('');

      listEl.innerHTML = html;

      // Bind events
      listEl.querySelectorAll('.cur-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          await this.curationsDB.remove(btn.dataset.key, btn.dataset.id);
          await this.refreshCurationsPanel();
        });
      });
    } catch (error) {
      console.error('Error refreshing curation panel:', error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.CurationUI = CurationUI;