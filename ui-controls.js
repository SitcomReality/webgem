
```javascript
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
      refreshBtn: document.getElementById('refreshBtn')
    };

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

    document.querySelectorAll('.seg-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn[data-mode]').forEach(b => b.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        this.elements.discoveryMode.value = btn.dataset.mode;
        window.app.discoverGems();
      });
    });

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

window.uiManager = new UIManager();