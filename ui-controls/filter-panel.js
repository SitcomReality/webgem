class FilterPanelManager {
  constructor(gemFilter, appRef) {
    this.gemFilter = gemFilter;
    this.appRef = appRef;
    this.panel = null;
  }

  createFilterPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'filter-panel';
    this.panel.innerHTML = `
      <div class="filter-header">
        <h3>Filter Terms</h3>
        <button class="filter-close" aria-label="Close filters">×</button>
      </div>
      <div class="filter-content" id="filterContent">
        ${this.generateFilterCategories()}
      </div>
      <div class="filter-actions">
        <button class="filter-btn" id="resetFiltersBtn">Reset All</button>
        <button class="filter-btn primary" id="applyFiltersBtn">Apply Filters</button>
      </div>
    `;
    
    document.body.appendChild(this.panel);
    this.bindPanelEvents();
  }

  generateFilterCategories() {
    const checkCategoryStatus = (categoryKey) => {
      const category = this.gemFilter.filterCategories[categoryKey];
      const activeTerms = Array.from(category.terms).filter(term => 
        this.gemFilter.isTermActive(term)
      );
      if (activeTerms.length === 0) return 'none';
      if (activeTerms.length === category.terms.size) return 'all';
      return 'some';
    };

    let html = '';
    Object.entries(this.gemFilter.filterCategories).forEach(([key, category]) => {
      const status = checkCategoryStatus(key);
      const categoryChecked = status === 'all';
      html += `
        <div class="filter-category">
          <div class="category-header">
            <label class="category-label">
              <input type="checkbox" 
                     ${categoryChecked ? 'checked' : ''}
                     data-category="${key}"
                     data-status="${status}">
              ${category.name}
            </label>
          </div>
          <div class="category-terms">
            ${Array.from(category.terms).map(term => `
              <label class="term-label">
                <input type="checkbox" 
                       ${this.gemFilter.isTermActive(term) ? 'checked' : ''}
                       data-term="${term}"
                       data-category="${key}">
                ${term}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    return html;
  }

  bindPanelEvents() {
    // Close button
    this.panel.querySelector('.filter-close').addEventListener('click', () => {
      this.hide();
    });

    // Reset button
    this.panel.querySelector('#resetFiltersBtn').addEventListener('click', () => {
      this.resetFilters();
    });

    // Apply button
    this.panel.querySelector('#applyFiltersBtn').addEventListener('click', () => {
      this.applyFilters();
    });

    // Category toggles
    this.panel.addEventListener('change', (e) => {
      if (e.target.dataset.category) {
        if (e.target.dataset.term) {
          // Individual term
          this.handleTermToggle(e.target.dataset.term, e.target.checked);
        } else {
          // Category toggle
          this.handleCategoryToggle(e.target.dataset.category, e.target.checked);
        }
      }
    });

    // Click outside to close
    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });
  }

  handleTermToggle(term, checked) {
    const lowerTerm = term.toLowerCase();
    if (checked) {
      this.gemFilter.blockedTerms.add(lowerTerm);
    } else {
      this.gemFilter.blockedTerms.delete(lowerTerm);
    }
    this.gemFilter.saveFilterState();
  }

  handleCategoryToggle(categoryKey, checked) {
    const category = this.gemFilter.filterCategories[categoryKey];
    if (checked) {
      category.terms.forEach(term => this.gemFilter.blockedTerms.add(term));
    } else {
      category.terms.forEach(term => this.gemFilter.blockedTerms.delete(term));
    }
    this.gemFilter.saveFilterState();
  }

  resetFilters() {
    this.gemFilter.blockedTerms.clear();
    
    // Clear all cached state
    Object.values(this.gemFilter.filterCategories).forEach(category => {
      category.terms.forEach(term => {
        this.gemFilter.blockedTerms.delete(term);
      });
    });
    
    this.gemFilter.saveFilterState();
    this.refresh();
  }

  applyFilters() {
    this.hide();
    // Ensure appRef is available before calling discoverGems; fallback to UIManager refresh
    if (this.appRef && typeof this.appRef.discoverGems === 'function') {
      this.appRef.discoverGems();
    } else if (window.app && typeof window.app.discoverGems === 'function') {
      window.app.discoverGems();
    } else if (window.uiManager && typeof window.uiManager.refresh === 'function') {
      window.uiManager.refresh();
    } else {
      console.warn('applyFilters: no app reference available to trigger discovery');
    }
  }

  show() {
    this.refresh();
    this.panel.classList.add('active');
  }

  hide() {
    this.panel.classList.remove('active');
  }

  refresh() {
    const content = this.panel.querySelector('#filterContent');
    content.innerHTML = this.generateFilterCategories();
  }
}

// Export for use in UI manager
window.FilterPanelManager = FilterPanelManager;