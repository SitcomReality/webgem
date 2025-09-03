class UIManager {
  constructor() {
    this.elements = {
      loading: document.getElementById('loading'),
      results: document.getElementById('results'),
      analyzingCount: document.getElementById('analyzingCount'),
      gemsFound: document.getElementById('gemsFound'),
      avgQuality: document.getElementById('avgQuality'),
      minVersions: document.getElementById('minVersions'),
      minVersionsDisplay: document.getElementById('minVersionsDisplay'),
      discoveryMode: document.getElementById('discoveryMode'),
      sortBy: document.getElementById('sortBy'),
      sortOrder: document.getElementById('sortOrder'),
      refreshBtn: document.getElementById('refreshBtn'),
      timeRange: document.getElementById('timeRange')
    };

    this.isCurator = false;
    this.filterPanel = null;
    this.curationUI = null;
    this.initializeControls();
  }

  initializeControls() {
    // Range slider
    this.elements.minVersions.addEventListener('input', (e) => {
      this.elements.minVersionsDisplay.textContent = e.target.value;
    });

    // Form controls
    this.elements.sortBy.addEventListener('change', () => this.refresh());
    this.elements.sortOrder.addEventListener('change', () => this.refresh());
    this.elements.refreshBtn.addEventListener('click', () => this.refresh());

    // Time range buttons
    this.bindSegmentButtons('.seg-btn[data-range]', 'timeRange');
    this.bindSegmentButtons('.seg-btn[data-sort]', 'sortBy');

    // Order toggle
    this.setupOrderToggle();

    // Filter panel
    this.filterPanel = new window.FilterPanelManager(window.gemFilter, window.app);
    this.filterPanel.createFilterPanel();

    const filterToggle = document.getElementById('filterToggle');
    filterToggle.addEventListener('click', () => {
      this.filterPanel.show();
    });

    // Curation UI - use the new CurationUIManager
    this.curationUI = new window.CurationUIManager(window.curationsDB);
  }

  bindSegmentButtons(selector, formId) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(selector).forEach(b => 
          b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        this.elements[formId].value = btn.dataset[formId === 'timeRange' ? 'range' : 'sort'];
        this.refresh();
      });
    });
  }

  setupOrderToggle() {
    const orderToggle = document.getElementById('orderToggle');
    if (orderToggle) {
      orderToggle.addEventListener('click', () => {
        const next = orderToggle.dataset.order === 'asc' ? 'desc' : 'asc';
        orderToggle.dataset.order = next;
        orderToggle.textContent = next === 'asc' ? '↑' : '↓';
        this.elements.sortOrder.value = next;
        this.refresh();
      });
    }
  }

  refresh() {
    if (window.app) window.app.discoverGems();
  }

  // UI state management
  showLoading() {
    this.elements.loading.classList.remove('hidden');
    this.elements.results.innerHTML = '';
  }

  hideLoading() {
    this.elements.loading.classList.add('hidden');
  }

  updateStats(analyzing, found, avgQuality) {
    this.elements.analyzingCount.textContent = analyzing;
    this.elements.gemsFound.textContent = found;
    this.elements.avgQuality.textContent = avgQuality.toFixed(2);
  }

  renderProjects(projects) {
    window.GridRenderer.renderProjects(projects, this.elements.results);
  }

  showError(message) {
    this.elements.results.innerHTML = `
      <div class="error-message">
        <h3>⚠️ Error</h3>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Curation helpers
  createCurationControls(projectId, projectTitle) {
    return this.curationUI?.createCurationControls(projectId, projectTitle) || null;
  }
}

window.uiManager = new UIManager();