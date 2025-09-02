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
    console.log(`🎯 Discovery mode: ${mode}`);
    
    try {
      // Always get some trending projects for comparison/filtering
      console.log('🔍 Fetching trending feed...');
      const trending = await window.websimAPI.getTrendingFeed({ limit: 100 });
      console.log(`📈 Trending feed: ${trending.data?.length || 0} projects`);
      
      if (trending.data) {
        sources.push(...trending.data);
        console.log(`✅ Added ${trending.data.length} from trending`);
      } else {
        console.warn('⚠️ No data in trending response:', trending);
      }

      // Mode-specific additional sources
      console.log(`🎭 Fetching mode-specific sources for: ${mode}`);
      let additionalProjects = [];
      
      switch (mode) {
        case 'technical':
          additionalProjects = await this.fetchTechnicalProjects();
          break;
        case 'artistic':
          additionalProjects = await this.fetchArtisticProjects();
          break;
        case 'underrated':
          additionalProjects = await this.fetchUnderratedProjects();
          break;
        case 'templates':
          additionalProjects = await this.fetchTemplateProjects();
          break;
        default: // gems
          additionalProjects = await this.fetchGeneralProjects();
      }
      
      console.log(`📦 Additional projects for ${mode}: ${additionalProjects.length}`);
      
      if (additionalProjects.length > 0) {
        sources.push(...additionalProjects);
      }
      
    } catch (error) {
      console.error('❌ Error fetching project sources:', error);
    }
    
    console.log(`📊 Total raw sources before deduplication: ${sources.length}`);
    
    // Remove duplicates
    const uniqueProjects = sources.filter((project, index, array) => 
      array.findIndex(p => p.id === project.id) === index
    );
    
    console.log(`🎯 Unique projects after deduplication: ${uniqueProjects.length}`);
    
    return uniqueProjects;
  }

  async fetchTechnicalProjects() {
    const projects = [];
    
    console.log(`🔧 Fetching technical projects with terms: ${technicalSearchTerms.slice(0, 3)}`);
    
    for (const term of technicalSearchTerms.slice(0, 3)) {
      console.log(`📡 Searching for: ${term}`);
      const results = await window.websimAPI.getSearchFeed('newest', term, { limit: projectsPerSearchTerm });
      console.log(`📊 Results for "${term}": ${results.data?.length || 0} projects`);
      
      if (results.data) {
        projects.push(...results.data);
      }
    }
    
    console.log(`🔧 Total technical projects: ${projects.length}`);
    return projects;
  }

  async fetchArtisticProjects() {
    const projects = [];
    
    console.log(`🎨 Fetching artistic projects with terms: ${artisticSearchTerms.slice(0, 3)}`);
    
    for (const term of artisticSearchTerms.slice(0, 3)) {
      console.log(`📡 Searching for: ${term}`);
      const results = await window.websimAPI.getSearchFeed('newest', term, { limit: projectsPerSearchTerm });
      console.log(`📊 Results for "${term}": ${results.data?.length || 0} projects`);
      
      if (results.data) {
        projects.push(...results.data);
      }
    }
    
    console.log(`🎨 Total artistic projects: ${projects.length}`);
    return projects;
  }

  async fetchUnderratedProjects() {
    console.log(`⭐ Fetching underrated projects...`);
    
    const projects = [];
    const qualityResults = await window.websimAPI.getSearchFeed('newest', genericFallbackTerm, { limit: searchResultsLimit });
    console.log(`📊 Underrated - quality results: ${qualityResults.data?.length || 0}`);
    
    if (qualityResults.data) projects.push(...qualityResults.data);
    
    const olderResults = await window.websimAPI.getTrendingFeed({ limit: searchResultsLimit / 2, range: trendingRange });
    console.log(`📊 Underrated - older trending: ${olderResults.data?.length || 0}`);
    
    if (olderResults.data) projects.push(...olderResults.data);
    
    console.log(`⭐ Total underrated projects: ${projects.length}`);
    return projects;
  }

  async fetchGeneralProjects() {
    console.log(`🌟 Fetching general projects...`);
    
    const projects = [];
    
    const [quality, older] = await Promise.all([
      window.websimAPI.getSearchFeed('newest', genericFallbackTerm, { limit: searchResultsLimit }),
      window.websimAPI.getTrendingFeed({ limit: searchResultsLimit / 2, range: trendingRange })
    ]);
    
    console.log(`📊 General - search feed results: ${quality.data?.length || 0}`);
    console.log(`📊 General - trending feed results: ${older.data?.length || 0}`);
    
    if (quality.data) projects.push(...quality.data);
    if (older.data) projects.push(...older.data);
    
    console.log(`🌟 Total general projects: ${projects.length}`);
    return projects;
  }

  async fetchTemplateProjects() {
    console.log(`📐 Fetching template projects...`);
    
    const projects = [];
    const res = await window.websimAPI.getSearchFeed('best_template', genericFallbackTerm, { limit: templateSearchLimit });
    console.log(`📊 Template projects response: ${res.data?.length || 0}`);
    
    if (res.data) projects.push(...res.data);
    
    console.log(`📐 Total template projects: ${projects.length}`);
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

const technicalSearchTerms = ['algorithm', 'simulation', 'visualization', 'physics', 'ai', 'ml', 'data'];

const artisticSearchTerms = ['art', 'creative', 'design', 'visual', 'interactive', 'animation'];

const genericFallbackTerm = "*";

const projectsPerSearchTerm = 20;

const trendingFeedLimit = 100;

const searchResultsLimit = 50;

const trendingRange = 'week';

const maxProjectAge = 30;

const templateSearchLimit = 100;