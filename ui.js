class FilterUIManager {
  constructor() {
    this.isOpen = false;
    this.createFilterPanel();
    this.createToggleButton();
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.id = 'filterToggle';
    button.innerHTML = '⚙️ Filters';
    button.className = 'filter-toggle-btn';
    button.addEventListener('click', () => this.togglePanel());
    
    // Insert after refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.parentNode.insertBefore(button, refreshBtn.nextSibling);
  }

  createFilterPanel() {
    const panel = document.createElement('div');
    panel.id = 'filterPanel';
    panel.className = 'filter-panel hidden';
    
    const header = document.createElement('div');
    header.className = 'filter-header';
    header.innerHTML = `
      <h3>Content Filters</h3>
      <button id="closeFilters" class="filter-close">×</button>
    `;

    const content = document.createElement('div');
    content.className = 'filter-content';

    // Create categories
    Object.entries(window.gemFilter.filterCategories).forEach(([key, category]) => {
      const categoryDiv = this.createCategorySection(key, category);
      content.appendChild(categoryDiv);
    });

    // Add quick actions
    const actions = document.createElement('div');
    actions.className = 'filter-actions';
    actions.innerHTML = `
      <button class="filter-btn" onclick="window.filterUI.selectAll()">Select All</button>
      <button class="filter-btn" onclick="window.filterUI.deselectAll()">Clear All</button>
      <button class="filter-btn primary" onclick="window.filterUI.applyFilters()">Apply</button>
    `;

    panel.appendChild(header);
    panel.appendChild(content);
    panel.appendChild(actions);
    
    document.body.appendChild(panel);

    // Close button
    document.getElementById('closeFilters').addEventListener('click', () => this.togglePanel());
  }

  createCategorySection(key, category) {
    const div = document.createElement('div');
    div.className = 'filter-category';
    div.style.borderLeftColor = category.color;

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <label class="category-label">
        <input type="checkbox" 
               ${window.gemFilter.isCategoryActive(key) ? 'checked' : ''}
               onchange="window.filterUI.toggleCategory('${key}')">
        <span>${category.name}</span>
      </label>
    `;

    const terms = document.createElement('div');
    terms.className = 'category-terms';
    
    Array.from(category.terms).sort().forEach(term => {
      const termLabel = document.createElement('label');
      termLabel.className = 'term-label';
      termLabel.innerHTML = `
        <input type="checkbox" 
               ${window.gemFilter.isTermActive(term) ? 'checked' : ''}
               onchange="window.filterUI.toggleTerm('${term}')">
        <span>${term}</span>
      `;
      terms.appendChild(termLabel);
    });

    div.appendChild(header);
    div.appendChild(terms);
    return div;
  }

  togglePanel() {
    const panel = document.getElementById('filterPanel');
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      panel.classList.remove('hidden');
      this.refreshDisplay();
    } else {
      panel.classList.add('hidden');
    }
  }

  toggleTerm(term) {
    window.gemFilter.toggleTerm(term);
    this.refreshDisplay();
  }

  toggleCategory(key) {
    window.gemFilter.toggleCategory(key);
    this.refreshDisplay();
  }

  selectAll() {
    Object.entries(window.gemFilter.filterCategories).forEach(([key, category]) => {
      category.terms.forEach(term => window.gemFilter.blockedTerms.add(term));
    });
    window.gemFilter.saveFilterState();
    this.refreshDisplay();
  }

  deselectAll() {
    window.gemFilter.blockedTerms.clear();
    window.gemFilter.saveFilterState();
    this.refreshDisplay();
  }

  applyFilters() {
    this.togglePanel();
    window.app.discoverGems();
  }

  refreshDisplay() {
    // Update category checkboxes
    Object.keys(window.gemFilter.filterCategories).forEach(key => {
      const checkbox = document.querySelector(`.category-label input[type="checkbox"][onchange*="${key}"]`);
      if (checkbox) {
        checkbox.checked = window.gemFilter.isCategoryActive(key);
      }
    });

    // Update term checkboxes
    Array.from(window.gemFilter.blockedTerms).forEach(term => {
      const checkbox = document.querySelector(`input[type="checkbox"][onchange*="${term}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
}

// Update UIManager to include filter UI
const originalInitialize = UIManager.prototype.initializeControls;
UIManager.prototype.initializeControls = function() {
  originalInitialize.call(this);
  window.filterUI = new FilterUIManager();
};

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
      refreshBtn: document.getElementById('refreshBtn')
    };

    this.initializeControls();
  }

  initializeControls() {
    // Version slider
    this.elements.minVersions.addEventListener('input', (e) => {
      this.elements.minVersionsDisplay.textContent = e.target.value;
    });

    // Refresh button
    this.elements.refreshBtn.addEventListener('click', () => {
      window.app.discoverGems();
    });
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

    // Animate in the cards
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
    
    // Template information
    const isTemplateBased = project.raw?.project?.parent_id || project.project?.parent_id;
    const hasDerivatives = project.raw?.project?.stats?.remixes > 0;
    const remixCount = project.raw?.project?.stats?.remixes || 0;

    const likes = project.raw?.project?.stats?.likes || 0
    const views = project.raw?.project?.stats?.views || 0

    // Creator information
    const creator = project.raw?.project?.created_by || project.raw?.site?.owner;
    const creatorUsername = creator?.username || 'unknown';
    const creatorAvatar = creator?.avatar_url || null;

    // Check if image exists by trying to load it
    const imageUrl = `https://images.websim.com/v1/site/${project.id}/600`;
    
    card.innerHTML = `
      ${isTemplateBased || hasDerivatives ? `
        <div class="template-info">
          ${isTemplateBased ? `
            <span class="template-badge template-based">
              Template
            </span>
          ` : ''}
          ${hasDerivatives ? `
            <span class="template-badge derivatives">
              ${remixCount} ${remixCount === 1 ? 'remix' : 'remixes'}
            </span>
          ` : ''}
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
      ` : `
        <p class="project-description">No description available.</p>
      `}

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
      </div>
    `;

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

// Add project card styles to the document
const additionalStyles = `
.project-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius);
  padding: var(--space-lg);
  transition: all 0.3s ease;
}

.project-card:hover {
  border-color: var(--rainbow-cyan);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 255, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
}

.project-title a {
  color: var(--text-primary);
  text-decoration: none;
  font-size: var(--font-size-lg);
  font-weight: 700;
  line-height: 1.2;
}

.project-title a:hover {
  color: var(--rainbow-cyan);
}

.project-score {
  font-size: var(--font-size-lg);
  font-weight: 700;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
}

.project-meta {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
  font-size: var(--font-size-sm);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.meta-label {
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  color: var(--text-secondary);
  font-weight: 700;
}

.project-description {
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
  line-height: 1.4;
}

.project-image {
  margin: var(--space-md) 0;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.project-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: var(--border-radius);
}

.project-footer {
  margin-top: var(--space-md);
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.tag {
  font-size: var(--font-size-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.tag-excellent {
  background: rgba(0, 255, 64, 0.2);
  color: var(--rainbow-green);
  border: 1px solid var(--rainbow-green);
}

.tag-high {
  background: rgba(0, 255, 255, 0.2);
  color: var(--rainbow-cyan);
  border: 1px solid var(--rainbow-cyan);
}

.tag-good {
  background: rgba(255, 255, 0, 0.2);
  color: var(--rainbow-yellow);
  border: 1px solid var(--rainbow-yellow);
}

.tag-technical {
  background: rgba(128, 0, 255, 0.2);
  color: var(--rainbow-purple);
  border: 1px solid var(--rainbow-purple);
}

.tag-effort {
  background: rgba(255, 0, 64, 0.2);
  color: var(--rainbow-red);
  border: 1px solid var(--rainbow-red);
}

.error-message {
  text-align: center;
  padding: var(--space-xxl);
  color: var(--rainbow-red);
}

.error-message h3 {
  margin-bottom: var(--space-md);
  font-size: var(--font-size-xl);
}
`;

// Inject additional styles
const style = document.createElement('style');
style.textContent = additionalStyles;
document.head.appendChild(style);

// Global UI instance
window.uiManager = new UIManager();