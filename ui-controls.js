class UIManager {
  constructor() {
    this.elements = {
      loading: document.getElementById('loading'),
      results: document.getElementById('results'),
      analyzingCount: document.getElementById('analyzingCount'),
      gemsFound: document.getElementById('gemsFound'),
      refreshBtn: document.getElementById('refreshBtn'),
      loadMoreContainer: document.getElementById('loadMoreContainer'),
      loadMoreBtn: document.getElementById('loadMoreBtn')
    };

    this.isCurator = false;
    this.filterPanel = null;
    this.curationUI = null;
    this.initializeControls();
  }

  initializeControls() {
    // Range slider - only if element exists
    if (this.elements.minVersions && this.elements.minVersionsDisplay) {
      this.elements.minVersions.addEventListener('input', (e) => {
        this.elements.minVersionsDisplay.textContent = e.target.value;
      });
    }

    // Max views slider - only if element exists
    if (this.elements.maxViews) {
      this.elements.maxViews.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const display = value >= 1000 ? `${value/1000}K` : value;
        const displayElement = document.getElementById('maxViewsDisplay');
        if (displayElement) displayElement.textContent = display;
      });
    }

    // Form controls - only if elements exist
    if (this.elements.sortBy) {
      this.elements.sortBy.addEventListener('change', () => this.refresh());
    }
    if (this.elements.sortOrder) {
      this.elements.sortOrder.addEventListener('change', () => this.refresh());
    }
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', () => this.refresh());
    }
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.addEventListener('click', () => this.loadMore());
    }

    // Time range buttons - only bind if elements exist
    this.bindSegmentButtons('.seg-btn[data-range]', 'timeRange', false);
    this.bindSegmentButtons('.seg-btn[data-sort]', 'sortBy', false);
    this.bindSegmentButtons('.seg-btn[data-feed]', 'feedSource', false);

    // Order toggle - only if element exists
    this.setupOrderToggle();
    
    // View toggle - only if element exists
    this.setupViewToggle();

    // Filter panel - only if elements exist
    if (window.gemFilter) {
      this.filterPanel = new window.FilterPanelManager(window.gemFilter, window.app);
      this.filterPanel.createFilterPanel();

      const filterToggle = document.getElementById('filterToggle');
      if (filterToggle) {
        filterToggle.addEventListener('click', () => {
          this.filterPanel.show();
        });
      }
    }

    // Curation UI - only if elements exist
    if (window.curationsDB) {
      this.curationUI = new window.CurationUI(window.curationsDB);
    }
  }

  bindSegmentButtons(selector, formId, shouldRefresh) {
    const buttons = document.querySelectorAll(selector);
    if (buttons.length === 0) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        
        if (formId && this.elements[formId]) {
          const datasetKey = Object.keys(btn.dataset).find(k => k !== 'view');
          this.elements[formId].value = btn.dataset[datasetKey];
        }

        if (shouldRefresh) {
          this.refresh();
        }
      });
    });
  }

  setupViewToggle() {
    const viewToggleButtons = document.querySelectorAll('.view-btn');
    if (viewToggleButtons.length === 0) return;

    const resultsContainer = this.elements.results;
    if (!resultsContainer) return;

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
    if (!orderToggle || !this.elements.sortOrder) return;

    // Set initial state from default sort order
    const initialOrder = this.elements.sortOrder.value;
    orderToggle.dataset.order = initialOrder;
    orderToggle.textContent = initialOrder === 'asc' ? '↑' : '↓';

    orderToggle.addEventListener('click', () => {
      const next = orderToggle.dataset.order === 'asc' ? 'desc' : 'asc';
      orderToggle.dataset.order = next;
      orderToggle.textContent = next === 'asc' ? '↑' : '↓';
      this.elements.sortOrder.value = next;
      this.refresh();
    });
  }

  loadMore() {
    if (window.app) {
        window.app.discoverGems(true);
    }
  }

  refresh() {
    if (window.app) window.app.discoverGems();
  }

  // UI state management
  showLoading() {
    if (this.elements.loading) {
      this.elements.loading.classList.remove('hidden');
    }
    if (this.elements.results) {
      this.elements.results.innerHTML = '';
    }
    if (this.elements.loadMoreContainer) {
      this.elements.loadMoreContainer.classList.add('hidden');
    }
  }

  hideLoading() {
    if (this.elements.loading) {
      this.elements.loading.classList.add('hidden');
    }
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.disabled = false;
      this.elements.loadMoreBtn.textContent = 'Load More Gems';
    }
  }

  showLoadMoreLoading() {
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.disabled = true;
      this.elements.loadMoreBtn.textContent = 'Loading...';
    }
  }

  toggleLoadMore(show) {
    if (this.elements.loadMoreContainer) {
      if (show) {
        this.elements.loadMoreContainer.classList.remove('hidden');
      } else {
        this.elements.loadMoreContainer.classList.add('hidden');
      }
    }
  }

  updateStats(analyzing, found, avgQuality) {
    if (this.elements.analyzingCount) {
      this.elements.analyzingCount.textContent = analyzing;
    }
    if (this.elements.gemsFound) {
      this.elements.gemsFound.textContent = found;
    }
    if (this.elements.avgQuality) {
      this.elements.avgQuality.textContent = avgQuality.toFixed(2);
    }
  }

  renderProjects(projects, append = false) {
    window.GridRenderer.renderProjects(projects, this.elements.results, append);
  }

  showError(message) {
    if (this.elements.results) {
      this.elements.results.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Error</h3>
          <p>${this.escapeHtml(message)}</p>
        </div>
      `;
    }
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