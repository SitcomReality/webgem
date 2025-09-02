class HiddenGemsApp {
  constructor() {
    this.isLoading = false;
    this.currentProjects = [];
  }

  async initialize() {
    console.log('🚀 Hidden Gems Discovery Platform Initializing...');
    
    try {
      // Initialize the gem filter with current trending data
      await window.gemFilter.analyzeGenericKeywords();
      console.log('✅ Generic keywords analyzed');
      
      // Start discovering gems
      await this.discoverGems();
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      window.uiManager.showError('Failed to initialize the discovery system. Please refresh and try again.');
    }
  }

  async discoverGems() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    window.uiManager.showLoading();
    
    try {
      console.log('🔍 Starting gem discovery process...');
      
      // Update generic keywords first
      await window.gemFilter.analyzeGenericKeywords();
      
      // Get discovery parameters
      const minVersions = parseInt(window.uiManager.elements.minVersions.value);
      const discoveryMode = window.uiManager.elements.discoveryMode.value;
      
      // Fetch projects from multiple sources
      const projectSources = await this.fetchProjectSources(discoveryMode);
      
      console.log(`📊 Analyzing ${projectSources.length} projects...`);
      window.uiManager.updateStats(projectSources.length, 0, 0);
      
      // Apply gem filtering and scoring
      const scoredProjects = await this.scoreProjects(projectSources);
      
      // Filter based on criteria
      const gems = this.filterGems(scoredProjects, minVersions);
      
      console.log(`💎 Found ${gems.length} hidden gems`);
      
      // Calculate average quality
      const avgQuality = gems.length > 0 
        ? gems.reduce((sum, p) => sum + p.qualityScore, 0) / gems.length 
        : 0;
      
      window.uiManager.updateStats(projectSources.length, gems.length, avgQuality);
      
      // Render results
      window.uiManager.renderProjects(gems);
      
      this.currentProjects = gems;
      
    } catch (error) {
      console.error('❌ Gem discovery failed:', error);
      window.uiManager.showError('Failed to discover gems. Please try again.');
    } finally {
      this.isLoading = false;
      window.uiManager.hideLoading();
    }
  }

  async fetchProjectSources(mode) {
    const sources = [];
    
    try {
      // Always get some trending projects for comparison/filtering
      const trending = await window.websimAPI.getTrendingFeed({ limit: 100 });
      if (trending.data) sources.push(...trending.data);
      
      // Mode-specific additional sources
      switch (mode) {
        case 'technical':
          sources.push(...await this.fetchTechnicalProjects());
          break;
        case 'artistic':
          sources.push(...await this.fetchArtisticProjects());
          break;
        case 'underrated':
          sources.push(...await this.fetchUnderratedProjects());
          break;
        default: // gems
          sources.push(...await this.fetchGeneralProjects());
      }
      
    } catch (error) {
      console.error('Error fetching project sources:', error);
    }
    
    // Remove duplicates
    const uniqueProjects = sources.filter((project, index, array) => 
      array.findIndex(p => p.id === project.id) === index
    );
    
    return uniqueProjects;
  }

  async fetchTechnicalProjects() {
    const projects = [];
    const technicalTerms = ['algorithm', 'simulation', 'visualization', 'physics', 'ai', 'ml', 'data'];
    
    for (const term of technicalTerms.slice(0, 3)) { // Limit to avoid rate limits
      try {
        const results = await window.websimAPI.getSearchFeed('new', term, { limit: 20 });
        if (results.data) projects.push(...results.data);
      } catch (error) {
        console.warn(`Failed to fetch technical projects for term: ${term}`, error);
      }
    }
    
    return projects;
  }

  async fetchArtisticProjects() {
    const projects = [];
    const artisticTerms = ['art', 'creative', 'design', 'visual', 'interactive', 'animation'];
    
    for (const term of artisticTerms.slice(0, 3)) {
      try {
        const results = await window.websimAPI.getSearchFeed('new', term, { limit: 20 });
        if (results.data) projects.push(...results.data);
      } catch (error) {
        console.warn(`Failed to fetch artistic projects for term: ${term}`, error);
      }
    }
    
    return projects;
  }

  async fetchUnderratedProjects() {
    const projects = [];
    
    try {
      // Get projects sorted by quality rather than popularity
      const qualityResults = await window.websimAPI.getSearchFeed('new', 'a', { limit: 100 });
      if (qualityResults.data) projects.push(...qualityResults.data);
      
      // Get some older projects that might be overlooked
      const olderResults = await window.websimAPI.getTrendingFeed({ 
        limit: 50, 
        range: 'week' // Older range
      });
      if (olderResults.data) projects.push(...olderResults.data);
      
    } catch (error) {
      console.warn('Failed to fetch underrated projects:', error);
    }
    
    return projects;
  }

  async fetchGeneralProjects() {
    const projects = [];
    
    try {
      // Mix of different sources
      const [quality, older] = await Promise.all([
        window.websimAPI.getSearchFeed('new', 'a', { limit: 50 }),
        window.websimAPI.getTrendingFeed({ limit: 50, range: 'week' })
      ]);
      
      if (quality.data) projects.push(...quality.data);
      if (older.data) projects.push(...older.data);
      
    } catch (error) {
      console.warn('Failed to fetch general projects:', error);
    }
    
    return projects;
  }

  async scoreProjects(projects) {
    const scoredProjects = [];
    
    for (const project of projects) {
      try {
        const qualityScore = await window.gemFilter.calculateQualityScore(project);
        scoredProjects.push({
          ...project,
          qualityScore
        });
      } catch (error) {
        console.warn(`Failed to score project ${project.id}:`, error);
        scoredProjects.push({
          ...project,
          qualityScore: 0.3 // Default low score
        });
      }
    }
    
    return scoredProjects.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  filterGems(projects, minVersions) {
    return projects.filter(project => {
      // Quality score threshold
      if (project.qualityScore < 0.4) return false;
      
      // Version threshold (estimated)
      const estimatedVersions = window.gemFilter.estimateVersionCount(project);
      if (estimatedVersions < Math.max(10, minVersions)) return false;
      
      // Remove projects that are too popular (anti-trending bias)
      const text = `${project.title} ${project.description || ''}`.toLowerCase();
      const hasGenericKeywords = Array.from(window.gemFilter.genericKeywords)
        .some(keyword => text.includes(keyword));
      
      if (hasGenericKeywords && project.qualityScore < 0.6) return false;
      
      return true;
    }).slice(0, 50); // Limit results
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new HiddenGemsApp();
  window.app.initialize();
});

// Add some helpful console messages for debugging
console.log('🎭 Hidden Gems Discovery Platform');
console.log('📡 API endpoints ready');
console.log('🔍 Gem filtering algorithms loaded');
console.log('🎨 Pride Matrix aesthetic active');
console.log('⚡ Ready to discover overlooked treasures...');