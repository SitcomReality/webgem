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
    
    const creator = project.raw?.project?.created_by || project.raw?.site?.owner;
    const creatorUsername = creator?.username || 'unknown';
    const creatorAvatar = creator?.avatar_url || `https://images.websim.com/avatar/${creatorUsername}`;

    // Use thumbnail URL from posts feed if available, otherwise use the standard image URL
    const imageUrl = project.raw?.thumbnailUrl 
      ? `${project.raw.thumbnailUrl}/600`
      : `https://images.websim.com/v1/site/${project.id}/600`;

    const versionCount = project.raw?.project?.current_version || 1;

    card.innerHTML = `
      <div class="project-image-container">
        <a href="https://websim.com/c/${project.id}" target="_blank" class="project-image-link">
          <img src="${imageUrl}" 
               alt="${GridRenderer.escapeHtml(project.title)}"
               loading="lazy"
               class="project-image"
               onerror="this.style.display='none'">
        </a>
      </div>

      <div class="project-content">
        <div class="project-header">
          <div class="project-title-wrapper">
            <h3 class="project-title">
              <a href="https://websim.com/c/${project.id}" target="_blank">${GridRenderer.escapeHtml(project.title)}</a>
            </h3>
            ${isTemplateBased ? `
              <a href="https://websim.com/p/${parentProjectId}" 
                 target="_blank" 
                 class="template-badge template-based"
                 title="View original template">
                <span class="template-text">fork</span>
              </a>
            ` : ''}
          </div>
          <div class="project-score" style="--score-color: ${scoreColor}">
            ${(qualityScore * 100).toFixed(0)}
          </div>
        </div>
        
        <div class="project-meta">
          <span class="meta-item" title="Versions">V. ${versionCount}</span>
          <span class="meta-divider">•</span>
          <span class="meta-item" title="Created Date">⏰️ ${GridRenderer.formatDate(project.created_at)}</span>
          <span class="meta-divider">•</span>
          <span class="meta-item" title="Likes">👍 ${(project.raw?.project?.stats?.likes || 0).toLocaleString()}</span>
          <span class="meta-divider">•</span>
          <span class="meta-item" title="Views">👀 ${(project.raw?.project?.stats?.views || 0).toLocaleString()}</span>
          <span class="meta-divider">•</span>
          <a href="https://websim.com/@${creatorUsername}" target="_blank" class="creator-link" title="${creatorUsername}">
            <img src="${creatorAvatar}" alt="${creatorUsername}" class="creator-avatar">
            <span class="creator-username">${creatorUsername}</span>
          </a>
        </div>

        ${project.description ? `
          <p class="project-description">${GridRenderer.escapeHtml(project.description)}</p>
        ` : ''}

        <div class="project-footer">
          <div class="project-tags">
            ${GridRenderer.generateQualityTags(project, qualityScore)}
          </div>
        </div>
      </div>
    `;

    // Add effort tag styling based on version count
    const effortTag = card.querySelector('.tag-effort');
    if (effortTag) {
      GridRenderer.applyEffortStyling(effortTag, versionCount);
    }

    return card;
  }

  static applyEffortStyling(element, versionCount) {
    if (versionCount >= 500) {
      element.className = 'tag tag-passion';
      element.textContent = 'Passion Project!';
    } else if (versionCount >= 250) {
      element.className = 'tag tag-effort';
      element.textContent = 'High Effort';
      
      const intensity = Math.min((versionCount - 250) / 250, 1);
      const red = Math.floor(231 + (255 - 231) * intensity);
      const green = Math.floor(76 - 76 * intensity);
      const blue = Math.floor(60 - 60 * intensity);
      
      element.style.setProperty('--base-red', red);
      element.style.setProperty('--base-green', green);
      element.style.setProperty('--base-blue', blue);
      element.style.setProperty('--effort-alpha', 0.1 + 0.2 * intensity);
      element.style.setProperty('--effort-border-alpha', 0.3 + 0.3 * intensity);
      element.style.setProperty('--effort-animation', 'effortGlow 2s ease-in-out infinite alternate');
    } else if (versionCount >= 100) {
      element.className = 'tag tag-effort';
      element.textContent = 'High Effort';
      
      const intensity = Math.min((versionCount - 100) / 150, 1);
      const alpha = 0.05 + 0.15 * intensity;
      const borderAlpha = 0.15 + 0.25 * intensity;
      
      element.style.setProperty('--base-red', 231);
      element.style.setProperty('--base-green', 76);
      element.style.setProperty('--base-blue', 60);
      element.style.setProperty('--effort-alpha', alpha);
      element.style.setProperty('--effort-border-alpha', borderAlpha);
      element.style.setProperty('--effort-animation', 'none');
    }
  }

  static getScoreColor(score) {
    return score >= 0.8 ? 'var(--accent-emerald)' :
           score >= 0.6 ? 'var(--accent-sapphire)' :
           score >= 0.4 ? 'var(--accent-gold)' :
           'var(--accent-ruby)';
  }

  static generateQualityTags(project, qualityScore) {
    const tags = [];
    const versionCount = project.raw?.project?.current_version || 1;

    if (qualityScore >= 0.8) {
      tags.push('<span class="tag tag-excellent">Exceptional</span>');
    }

    // Check for unique projects
    const text = `${project.title} ${project.description || ''}`.toLowerCase();
    let uniquenessScore = 1.0;
    
    if (window.gemFilter) {
      const genericKeywords = Array.from(window.gemFilter.genericKeywords || []);
      const blockedTerms = Array.from(window.gemFilter.blockedTerms || []);
      
      genericKeywords.forEach(keyword => { if (text.includes(keyword)) { uniquenessScore -= 0.15; } });
      blockedTerms.forEach(term => { if (text.includes(term.toLowerCase())) { uniquenessScore -= 0.3; } });
      
      const genericPatterns = [
        /^(simple|basic|easy|quick)\s+/,
        /\b(test|demo|example)\b/,
        /\b(copy|clone)\b/,
        /\bmeme\b/,
        /_{4,}/
      ];
      genericPatterns.forEach(pattern => { if (pattern.test(text)) { uniquenessScore -= 0.2; } });
    }

    if (uniquenessScore >= 0.99) {
      tags.push('<span class="tag tag-unique">Unique</span>');
    }

    if (window.gemFilter?.qualityTerms?.some(term => text.includes(term))) {
      tags.push('<span class="tag tag-technical">Technical</span>');
    }

    if (versionCount >= 100) {
      let effortClass = 'tag-effort';
      let effortText = 'High Effort';
      
      if (versionCount >= 500) {
        effortClass = 'tag-passion';
        effortText = 'Passion Project!';
      }
      
      tags.push(`<span class="tag ${effortClass}">${effortText}</span>`);
    }

    return tags.join('');
  }

  static formatDate(dateString) {
    try {
      const d = new Date(dateString);
      if (isNaN(d)) return '';
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static renderProjects(projects, container, append = false) {
    if (!append) {
        container.innerHTML = '';
    }
    
    // Find the starting index for new cards to apply staggered animation
    const startIndex = append ? container.children.length : 0;
    
    projects.slice(startIndex).forEach((project, index) => {
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