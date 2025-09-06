class InfoPanelManager {
  constructor() {
    this.panel = null;
  }

  createInfoPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'info-panel filter-panel'; 
    this.panel.innerHTML = `
      <div class="filter-header">
        <h3>About WebGem Discovery Platform</h3>
        <button class="filter-close" aria-label="Close info">×</button>
      </div>
      <div class="filter-content" id="infoContent">
        ${this.generateInfoContent()}
      </div>
    `;
    
    document.body.appendChild(this.panel);
    this.bindPanelEvents();
  }

  generateInfoContent() {
    return `
      <div class="info-section">
        <h4>🎯 What This Platform Does</h4>
        <p>WebGem discovers technically sophisticated projects that are overlooked by mainstream trending algorithms. We analyze projects based on effort indicators rather than viral potential.</p>
      </div>

      <div class="info-section">
        <h4>🔍 Data Sources</h4>
        <ul>
          <li><strong>Search Feed:</strong> Newest projects from websim.com/api/v1/feed/search</li>
          <li><strong>Posts Feed:</strong> Latest project posts from websim.com/api/v1/feed/posts</li>
          <li><strong>Trending Feed:</strong> Week-range trending from websim.com/api/v1/feed/trending</li>
        </ul>
      </div>

      <div class="info-section">
        <h4>⚖️ Ranking Algorithm</h4>
        <p>Projects are scored using a prestige algorithm that prioritizes:</p>
        <ul>
          <li><strong>Version Count (40%):</strong> Higher versions indicate sustained effort</li>
          <li><strong>View Count (35%):</strong> Lower views suggest undiscovered gems</li>
          <li><strong>Quality Score (15%):</strong> Technical indicators and uniqueness</li>
          <li><strong>Recency (5%):</strong> Recent projects get slight boost</li>
          <li><strong>Like Count (5%):</strong> Engagement without popularity</li>
        </ul>
      </div>

      <div class="info-section">
        <h4>🏷️ Tag Meanings</h4>
        <div class="tag-explanations">
          <div class="tag-item">
            <span class="tag tag-excellent">★ Exceptional</span>
            <span>Quality score ≥ 0.8</span>
          </div>
          <div class="tag-item">
            <span class="tag tag-unique">✦ Unique</span>
            <span>No generic keywords or blocked terms</span>
          </div>
          <div class="tag-item">
            <span class="tag tag-technical">⚙ Technical</span>
            <span>Contains technical keywords (algorithm, simulation, etc.)</span>
          </div>
          <div class="tag-item">
            <span class="tag tag-effort">⚡️ High Effort</span>
            <span>100+ versions (icon in list view, text in grid view)</span>
          </div>
          <div class="tag-item">
            <span class="tag tag-passion">❤ Passion Project</span>
            <span>500+ versions with rainbow glow effect</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h4>🎨 Visual Indicators</h4>
        <ul>
          <li><strong>Rainbow Border:</strong> Passion projects (500+ versions)</li>
          <li><strong>Template Badge:</strong> Forked projects show "fork" link to original</li>
          <li><strong>Compact Tags:</strong> Icons in list view, text in grid view</li>
        </ul>
      </div>

      <div class="info-section">
        <h4>⚙️ Filters</h4>
        <p>Block specific categories of content using the filter panel. Categories include Meme Culture, Gaming, Social Media, Entertainment, and more.</p>
      </div>

      <div class="info-section">
        <h4>📊 Stats Display</h4>
        <p>Header shows real-time analysis progress and discovered gems count, helping you understand the discovery rate.</p>
      </div>
    `;
  }

  bindPanelEvents() {
    this.panel.querySelector('.filter-close').addEventListener('click', () => {
      this.hide();
    });

    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });
  }

  show() {
    this.panel.classList.add('active');
  }

  hide() {
    this.panel.classList.remove('active');
  }
}

window.InfoPanelManager = InfoPanelManager;