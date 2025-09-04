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

