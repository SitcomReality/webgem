class GridRenderer {
  static createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';

    const qualityScore = project.qualityScore || 0;
    const scoreColor = GridRenderer.getScoreColor(qualityScore);

    const isTemplateBased = project.raw?.project?.parent_id || project.project?.parent_id;
    const parentProjectId = project.raw?.project?.parent_id || project.project?.parent_id;
    const hasDerivatives = project.raw?.project?.stats?.remixes > 0;
    const remixCount = project.raw?.project?.stats?.remixes || 0;

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
          <a href="https://websim.com/c/${project.id}" target="_blank">${GridRenderer.escapeHtml(project.title)}</a>
        </h3>
        <div class="project-score" style="color: ${scoreColor}">
          ${(qualityScore * 100).toFixed(0)}%
        </div>
      </div>
      
      <div class="project-stats">
        <div class="meta-item">
          <span class="meta-label">👍</span>
          <span class="meta-value">${(project.raw?.project?.stats?.likes || 0).toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">👀</span>
          <span class="meta-value">${(project.raw?.project?.stats?.views || 0).toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Versions:</span>
          <span class="meta-value">${project.raw?.project?.current_version || 1}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Created:</span>
          <span class="meta-value">${GridRenderer.formatDate(project.created_at)}</span>
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
        <p class="project-description">${GridRenderer.escapeHtml(project.description)}</p>
      ` : '<p class="project-description">No description available.</p>'}

      <div class="project-image">
        <img src="${imageUrl}" 
             alt="${GridRenderer.escapeHtml(project.title)}"
             loading="lazy"
             onload="this.style.display='block'"
             onerror="this.style.display='none'">
      </div>

      <div class="project-footer">
        <div class="project-tags">
          ${GridRenderer.generateQualityTags(project, qualityScore)}
        </div>
      </div>
    `;

    return card;
  }

  static getScoreColor(score) {
    return score >= 0.8 ? 'var(--accent-emerald)' :
           score >= 0.6 ? 'var(--accent-sapphire)' :
           score >= 0.4 ? 'var(--accent-gold)' :
           'var(--accent-ruby)';
  }

  static generateQualityTags(project, score) {
    const tags = [];

    if (score >= 0.8) tags.push('<span class="tag tag-excellent">Exceptional</span>');
    else if (score >= 0.6) tags.push('<span class="tag tag-high">High Quality</span>');
    else if (score >= 0.4) tags.push('<span class="tag tag-good">Solid Work</span>');

    const text = `${project.title} ${project.description || ''}`.toLowerCase();
    if (window.gemFilter?.qualityTerms?.some(term => text.includes(term))) {
      tags.push('<span class="tag tag-technical">Technical</span>');
    }

    if ((project.raw?.project?.current_version || 1) > 100) {
      tags.push('<span class="tag tag-effort">High Effort</span>');
    }

    return tags.join('');
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static renderProjects(projects, container) {
    container.innerHTML = '';
    
    projects.forEach((project, index) => {
      const card = this.createProjectCard(project);
      container.appendChild(card);
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }
}

window.GridRenderer = GridRenderer;