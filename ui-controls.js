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
    this.bindSegmentButtons('.seg-btn[data-range]', 'timeRange', false);
    this.bindSegmentButtons('.seg-btn[data-sort]', 'sortBy', false);

    // Order toggle
    this.setupOrderToggle();
    // View toggle
    this.setupViewToggle();

    // Filter panel
    this.filterPanel = new window.FilterPanelManager(window.gemFilter, window.app);
    this.filterPanel.createFilterPanel();

    const filterToggle = document.getElementById('filterToggle');
    filterToggle.addEventListener('click', () => {
        this.filterPanel.show();
    });

    // Curation UI
    this.curationUI = new window.CurationUI(window.curationsDB);
  }

  bindSegmentButtons(selector, formId, shouldRefresh) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(selector).forEach(b => 
          b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        
        if (formId && this.elements[formId]) {
            this.elements[formId].value = btn.dataset[formId === 'timeRange' ? 'range' : 'sort'];
        }

        if (shouldRefresh) {
            this.refresh();
        }
      });
    });
  }

  setupViewToggle() {
    const viewToggleButtons = document.querySelectorAll('.view-btn');
    const resultsContainer = this.elements.results;

    // Load saved view
    const savedView = localStorage.getItem('websim_view_mode') || 'grid';
    resultsContainer.classList.remove('grid-view', 'list-view');
    resultsContainer.classList.add(`${savedView}-view`);
    
    viewToggleButtons.forEach(btn => {
        btn.setAttribute('aria-selected', btn.dataset.view === savedView);
    });

    viewToggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        // Update button states
        viewToggleButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        
        // Update container class
        resultsContainer.classList.remove('grid-view', 'list-view');
        resultsContainer.classList.add(`${view}-view`);
        
        // Save preference
        localStorage.setItem('websim_view_mode', view);
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