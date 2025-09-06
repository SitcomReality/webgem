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

  loadMore() {
    if (window.app) {
        window.app.discoverGems(true);
    }
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

  refresh() {
    if (window.app) window.app.discoverGems();
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