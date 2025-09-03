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
    this.initializeControls();
  }

  initializeControls() {
    this.elements.minVersions.addEventListener('input', (e) => {
      this.elements.minVersionsDisplay.textContent = e.target.value;
    });

    this.elements.sortBy.addEventListener('change', () => {
      window.app.discoverGems();
    });

    this.elements.sortOrder.addEventListener('change', () => {
      window.app.discoverGems();
    });

    this.elements.refreshBtn.addEventListener('click', () => {
      window.app.discoverGems();
    });

    // Time range buttons
    document.querySelectorAll('.seg-btn[data-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn[data-range]').forEach(b => b.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        this.elements.timeRange.value = btn.dataset.range;
        window.app.discoverGems();
      });
    });

    // Sort buttons
    document.querySelectorAll('.seg-btn[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn[data-sort]').forEach(b => b.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        this.elements.sortBy.value = btn.dataset.sort;
        window.app.discoverGems();
      });
    });

    const orderToggle = document.getElementById('orderToggle');
    if (orderToggle) {
      orderToggle.addEventListener('click', () => {
        const next = orderToggle.dataset.order === 'asc' ? 'desc' : 'asc';
        orderToggle.dataset.order = next;
        orderToggle.textContent = next === 'asc' ? '↑' : '↓';
        this.elements.sortOrder.value = next;
        window.app.discoverGems();
      });
    }

    // Filter toggle button
    const filterToggle = document.getElementById('filterToggle');
    const filterPanel = document.createElement('div');
    filterPanel.className = 'filter-panel';
    filterPanel.innerHTML = `
        <div class="filter-header">
            <h3>Filter Terms</h3>
            <button class="filter-close" aria-label="Close filters">×</button>
        </div>
        <div class="filter-content">
            ${this.generateFilterCategories()}
        </div>
        <div class="filter-actions">
            <button class="filter-btn" onclick="window.uiManager.resetFilters()">Reset All</button>
            <button class="filter-btn primary" onclick="window.uiManager.applyFilters()">Apply Filters</button>
        </div>
    `;
    
    document.body.appendChild(filterPanel);
    
    filterToggle.addEventListener('click', () => {
        filterPanel.classList.toggle('active');
    });
    
    filterPanel.querySelector('.filter-close').addEventListener('click', () => {
        filterPanel.classList.remove('active');
    });
    
    // Close on outside click
    filterPanel.addEventListener('click', (e) => {
        if (e.target === filterPanel) {
            filterPanel.classList.remove('active');
        }
    });

    // init curator UI
    this.initCurationsUI();
  }

  async initCurationsUI() {
    try {
      const user = await window.websim?.getUser?.();
      this.isCurator = user?.username === 'SitcomReality';
    } catch { this.isCurator = false; }
    if (!this.isCurator) return;
    // FAB
    const fab = document.createElement('button');
    fab.className = 'curations-fab';
    fab.id = 'curationsFab';
    fab.textContent = 'Curated';
    document.body.appendChild(fab);
    // Panel
    const panel = document.createElement('div');
    panel.className = 'curations-panel';
    panel.id = 'curationsPanel';
    panel.innerHTML = `
      <header>
        <strong>Curated Projects</strong>
        <button class="cur-remove" id="curationsClose">Close</button>
      </header>
      <div class="curations-list" id="curationsList"></div>
    `;
    document.body.appendChild(panel);
    fab.addEventListener('click', async () => {
      panel.classList.toggle('active');
      await this.refreshCurationsPanel();
    });
    panel.querySelector('#curationsClose').addEventListener('click', () => panel.classList.remove('active'));
  }

  async refreshCurationsPanel() {
    const listEl = document.getElementById('curationsList');
    if (!listEl) return;
    const data = await window.curationsDB.load();
    const sections = [
      { key: 'underappreciated', label: 'Underappreciated' },
      { key: 'overlooked', label: 'Overlooked' },
      { key: 'rising', label: 'Rising' }
    ];
    listEl.innerHTML = sections.map(sec => {
      const items = (data[sec.key] || []).map(it => `
        <div class="cur-item">
          <a href="https://websim.com/c/${it.id}" target="_blank">${this.escapeHtml(it.title)}</a>
          <button class="cur-remove" data-k="${sec.key}" data-id="${it.id}">Remove</button>
        </div>`).join('') || '<div class="cur-item"><em>None yet</em></div>';
      return `<div class="curations-section"><h4>${sec.label}</h4>${items}</div>`;
    }).join('');
    listEl.querySelectorAll('.cur-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await window.curationsDB.remove(btn.dataset.k, btn.dataset.id);
        await this.refreshCurationsPanel();
      });
    });
  }

  generateFilterCategories() {
    const checkCategoryStatus = (categoryKey) => {
      const category = window.gemFilter.filterCategories[categoryKey];
      const activeTerms = Array.from(category.terms).filter(term => 
        window.gemFilter.isTermActive(term)
      );
      if (activeTerms.length === 0) return 'none';
      if (activeTerms.length === category.terms.size) return 'all';
      return 'some';
    };

    let html = '';
    Object.entries(window.gemFilter.filterCategories).forEach(([key, category]) => {
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
                       ${window.gemFilter.isTermActive(term) ? 'checked' : ''}
                       data-term="${term}"
                       data-category="${key}">
                ${term}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    // Add event handlers for category toggles after appending
    requestAnimationFrame(() => {
      this.bindFilterEvents();
    });
    
    return html;
  }

  bindFilterEvents() {
    // Category toggle handlers
    document.querySelectorAll('[data-category]').forEach(checkbox => {
      if (checkbox.dataset.category && !checkbox.dataset.term) {
        checkbox.addEventListener('change', (e) => {
          const categoryKey = e.target.dataset.category;
          const allChecked = e.target.checked;
          
          // Update all child terms for this category
          document.querySelectorAll(`[data-category="${categoryKey}"][data-term]`).forEach(termCheckbox => {
            termCheckbox.checked = allChecked;
            handleTermToggle(termCheckbox.dataset.term, allChecked);
          });
          
          e.target.dataset.status = allChecked ? 'all' : 'none';
        });
      }
    });

    // Individual term handlers
    document.querySelectorAll('[data-term]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const term = e.target.dataset.term;
        const category = e.target.dataset.category;
        const checked = e.target.checked;
        
        handleTermToggle(term, checked);
        
        // Update parent category checkbox
        const categoryCheckbox = document.querySelector(`[data-category="${category}"]:not([data-term])`);
        if (categoryCheckbox) {
          const termsInCategory = Array.from(
            document.querySelectorAll(`[data-category="${category}"][data-term]`)
          );
          const checkedTerms = termsInCategory.filter(cb => cb.checked);
          
          if (checkedTerms.length === termsInCategory.length) {
            categoryCheckbox.checked = true;
            categoryCheckbox.dataset.status = 'all';
          } else if (checkedTerms.length === 0) {
            categoryCheckbox.checked = false;
            categoryCheckbox.dataset.status = 'none';
          } else {
            categoryCheckbox.checked = false;
            categoryCheckbox.dataset.status = 'some';
          }
        }
      });
    });

    // Helper to handle term toggling
    function handleTermToggle(term, checked) {
      const lowerTerm = term.toLowerCase();
      if (checked) {
        window.gemFilter.blockedTerms.add(lowerTerm);
      } else {
        window.gemFilter.blockedTerms.delete(lowerTerm);
      }
      window.gemFilter.saveFilterState();
    }
  }

  toggleTerm(term) {
    window.gemFilter.toggleTerm(term);
    this.generateFilterCategories();
  }

  toggleCategory(categoryKey) {
    window.gemFilter.toggleCategory(categoryKey);
    this.generateFilterCategories();
  }

  resetFilters() {
    window.gemFilter.blockedTerms.clear();
    Object.values(window.gemFilter.filterCategories).forEach(category => {
      category.terms.forEach(term => {
        window.gemFilter.blockedTerms.delete(term);
      });
    });
    window.gemFilter.saveFilterState();
    
    // Update UI without refreshing search
    this.generateFilterCategories();
  }

  applyFilters() {
    document.querySelector('.filter-panel').classList.remove('active');
    window.app.discoverGems();
  }

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
    this.elements.results.innerHTML = '';

    projects.forEach(project => {
      const projectCard = this.createProjectCard(project);
      this.elements.results.appendChild(projectCard);
    });

    setTimeout(() => {
      const cards = this.elements.results.querySelectorAll('.project-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }, 100);
  }

  createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';

    const qualityScore = project.qualityScore || 0;
    const scoreColor = this.getScoreColor(qualityScore);
    const estimatedVersions = window.gemFilter.estimateVersionCount(project);

    const isTemplateBased = project.raw?.project?.parent_id || project.project?.parent_id;
    const parentProjectId = project.raw?.project?.parent_id || project.project?.parent_id;
    const hasDerivatives = project.raw?.project?.stats?.remixes > 0;
    const remixCount = project.raw?.project?.stats?.remixes || 0;

    const likes = project.raw?.project?.stats?.likes || 0
    const views = project.raw?.project?.stats?.views || 0

    const creator = project.raw?.project?.created_by || project.raw?.site?.owner;
    const creatorUsername = creator?.username || 'unknown';
    const creatorAvatar = creator?.avatar_url || null;

    const imageUrl = `https://images.websim.com/v1/site/${project.id}/600`;

    card.innerHTML = `
      ${isTemplateBased ? `
        <div class="template-info">
          <a href="https://websim.com/p/${parentProjectId}" 
             target="_blank" 
             class="template-badge template-based"
             title="View original template">
            <span class="template-text">fork</span>
          </a>
        </div>
      ` : ''}
      
      ${hasDerivatives ? `
        <div class="template-info">
          <span class="template-badge derivatives">
            ${remixCount} ${remixCount === 1 ? 'remix' : 'remixes'}
          </span>
        </div>
      ` : ''}

      <div class="project-header">
        <h3 class="project-title">
          <a href="https://websim.com/c/${project.id}" target="_blank">${this.escapeHtml(project.title)}</a>
        </h3>
        <div class="project-score" style="color: ${scoreColor}">
          ${(qualityScore * 100).toFixed(0)}%
        </div>
      </div>
      
      <div class="project-stats">
        <div class="meta-item">
          <span class="meta-label">👍</span>
          <span class="meta-value">${likes.toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">👀</span>
          <span class="meta-value">${views.toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Versions:</span>
          <span class="meta-value">${project.raw?.project?.current_version || 1}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Created:</span>
          <span class="meta-value">${this.formatDate(project.created_at)}</span>
        </div>
      </div>

      <div class="project-creator">
        <a href="https://websim.com/@${creatorUsername}" target="_blank" class="creator-link">
          ${creatorAvatar ? `
            <img src="${creatorAvatar}" alt="${creatorUsername}" class="creator-avatar">
          ` : ''}
          <span class="creator-username">@${creatorUsername}</span>
        </a>
      </div>

      ${project.description ? `
        <p class="project-description">${this.escapeHtml(project.description)}</p>
      ` : '<p class="project-description">No description available.</p>'}

      <div class="project-image">
        <img src="${imageUrl}" 
             alt="${this.escapeHtml(project.title)}"
             loading="lazy"
             onload="this.style.display='block'"
             onerror="this.style.display='none'">
      </div>

      <div class="project-footer">
        <div class="project-tags">
          ${this.generateQualityTags(project, qualityScore)}
        </div>
        ${this.isCurator ? `
          <div class="curation-controls">
            <select class="curation-select">
              <option value="underappreciated">Underappreciated</option>
              <option value="overlooked">Overlooked</option>
              <option value="rising">Rising</option>
            </select>
            <button class="curation-add-btn">Add</button>
          </div>
        ` : ''}
      </div>
    `;

    if (this.isCurator) {
      const sel = card.querySelector('.curation-select');
      const add = card.querySelector('.curation-add-btn');
      add.addEventListener('click', async () => {
        const listKey = sel.value;
        await window.curationsDB.add(listKey, { id: project.id, title: project.title });
        await this.refreshCurationsPanel();
        add.textContent = 'Added ✓';
        setTimeout(() => (add.textContent = 'Add'), 1200);
      });
    }

    return card;
  }

  getScoreColor(score) {
    if (score >= 0.8) return 'var(--rainbow-green)';
    if (score >= 0.6) return 'var(--rainbow-cyan)';
    if (score >= 0.4) return 'var(--rainbow-yellow)';
    if (score >= 0.2) return 'var(--rainbow-orange)';
    return 'var(--rainbow-red)';
  }

  generateQualityTags(project, score) {
    const tags = [];

    if (score >= 0.8) tags.push('<span class="tag tag-excellent">Exceptional</span>');
    else if (score >= 0.6) tags.push('<span class="tag tag-high">High Quality</span>');
    else if (score >= 0.4) tags.push('<span class="tag tag-good">Solid Work</span>');

    const text = `${project.title} ${project.description || ''}`.toLowerCase();

    if (window.gemFilter.qualityTerms.some(term => text.includes(term))) {
      tags.push('<span class="tag tag-technical">Technical</span>');
    }

    const estimatedVersions = window.gemFilter.estimateVersionCount(project);
    if (estimatedVersions > 100) {
      tags.push('<span class="tag tag-effort">High Effort</span>');
    }

    return tags.join('');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <h3>⚠️ Error</h3>
      <p>${this.escapeHtml(message)}</p>
    `;

    this.elements.results.innerHTML = '';
    this.elements.results.appendChild(errorDiv);
  }
}

window.uiManager = new UIManager();