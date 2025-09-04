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
          <span class="meta-label">V.</span>
          <span class="meta-value">${project.raw?.project?.current_version || 1}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">⏰️</span>
          <span class="meta-value">${GridRenderer.formatDate(project.created_at)}</span>
        </div>
      </div>

      <div class="project-header">
        <h3 class="project-title">
          <a href="https://websim.com/c/${project.id}" target="_blank">${GridRenderer.escapeHtml(project.title)}</a>
        </h3>
        <div class="score-section">
          <div class="project-score" style="color: ${scoreColor}">
            ${(qualityScore * 100).toFixed(0)}%
          </div>
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
        </div>
      </div>

