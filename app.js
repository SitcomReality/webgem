class HiddenGemsApp {
  constructor() {
    this.isLoading = false;
    this.currentProjects = [];
  }

  async initialize() {
    console.log('🚀 Hidden Gems Discovery Platform Initializing...');
    
    try {
      // Set default sort to views ascending
      window.uiManager.elements.sortBy.value = 'views';
      window.uiManager.elements.sortOrder.value = 'asc';
      
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
      
      // Get discovery parameters
      const minVersions = parseInt(window.uiManager.elements.minVersions.value);
      const maxViews = parseInt(window.uiManager.elements.maxViews.value);
      const timeRange = window.uiManager.elements.timeRange.value;
      const sortBy = window.uiManager.elements.sortBy.value;
      const sortOrder = window.uiManager.elements.sortOrder.value;
      
      // Fetch and score projects
      const projectSources = await this.fetchProjectSources(timeRange);
      const scoredProjects = await this.scoreProjects(projectSources);
      const gems = this.filterGems(scoredProjects, minVersions, maxViews);
      
      // Sort the gems
      const sortedGems = this.sortProjects(gems, sortBy, sortOrder);
      
      console.log(`💎 Found ${sortedGems.length} hidden gems in ${timeRange} range`);
      
      // Calculate average quality
      const avgQuality = sortedGems.length > 0 
        ? sortedGems.reduce((sum, p) => sum + p.qualityScore, 0) / sortedGems.length 
        : 0;
      
      window.uiManager.updateStats(projectSources.length, sortedGems.length, avgQuality);
      
      // Render results
      window.uiManager.renderProjects(sortedGems);
      
      this.currentProjects = sortedGems;
      
    } catch (error) {
      console.error('❌ Gem discovery failed:', error);
      window.uiManager.showError('Failed to discover gems. Please try again.');
    } finally {
      this.isLoading = false;
      window.uiManager.hideLoading();
    }
  }

  async fetchProjectSources(range) {
    const sources = [];
    console.log(`🎯 Time range: ${range}`);
    
    try {
      // Get projects from the selected time range
      console.log('🔍 Fetching projects from time range...');
      const results = await window.websimAPI.getTrendingFeed({ 
        limit: 100,
        range: range 
      });
      console.log(`📈 Projects from ${range} range: ${results.data?.length || 0}`);
      
      if (results.data) {
        sources.push(...results.data);
      }
      
      // Also get some search results to ensure diversity
      const searchResults = await window.websimAPI.getSearchFeed('newest', '*', { 
        limit: 50,
        range: range 
      });
      
      if (searchResults.data) {
        sources.push(...searchResults.data);
      }
      
    } catch (error) {
      console.error('❌ Error fetching project sources:', error);
    }
    
    // Remove duplicates
    const uniqueProjects = sources.filter((project, index, array) => 
      array.findIndex(p => p.id === project.id) === index
    );
    
    console.log(`🎯 Unique projects: ${uniqueProjects.length}`);
    return uniqueProjects;
  }

  async fetchTechnicalProjects() {
    // Removed - no longer needed with time-based discovery
    return [];
  }

  async fetchArtisticProjects() {
    // Removed - no longer needed with time-based discovery
    return [];
  }

  async fetchUnderratedProjects() {
    // Removed - no longer needed with time-based discovery
    return [];
  }

  async fetchGeneralProjects() {
    // Removed - no longer needed with time-based discovery
    return [];
  }

  async fetchTemplateProjects() {
    // Removed - no longer needed with time-based discovery
    return [];
  }

  async scoreProjects(projects) {
    console.log(`🎯 Starting to score ${projects.length} projects...`);
    const scoredProjects = [];
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      
      try {
        const qualityScore = await window.gemFilter.calculateQualityScore(project);
        scoredProjects.push({
          ...project,
          qualityScore
        });
      } catch (error) {
        console.warn(`⚠️ Failed to score project ${project.id}:`, error);
        scoredProjects.push({
          ...project,
          qualityScore: 0.3 // Default low score
        });
      }
    }
    
    const sorted = scoredProjects.sort((a, b) => b.qualityScore - a.qualityScore);
    return sorted;
  }

  filterGems(projects, minVersions, maxViews) {
    console.log(`🔍 Starting filterGems with ${projects.length} projects, minVersions: ${minVersions}, maxViews: ${maxViews}`);
    
    const filtered = projects.filter((project, index) => {
      // Quality score threshold
      if (project.qualityScore < 0.4) {
        return false;
      }
      
      // Version filter
      const actualVersions = project.raw?.project?.current_version || 1;
      const versionThreshold = Math.max(10, minVersions);
      if (actualVersions < versionThreshold) {
        return false;
      }

      // Max views filter
      const views = project.raw?.project?.stats?.views || 0;
      if (views > maxViews) {
        return false;
      }
      
      // Apply term filtering - REMOVE projects with blocked terms
      const text = `${project.title} ${project.description || ''}`.toLowerCase();
      
      const blockedTermsFound = [];
      for (const blockedTerm of window.gemFilter.blockedTerms) {
        if (text.includes(blockedTerm.toLowerCase())) {
          blockedTermsFound.push(blockedTerm);
        }
      }
      
      if (blockedTermsFound.length > 0) {
        return false;
      }
      
      // Remove projects that are too popular (anti-trending bias)
      const hasGenericKeywords = Array.from(window.gemFilter.genericKeywords)
        .some(keyword => text.includes(keyword));
      
      if (hasGenericKeywords && project.qualityScore < 0.6) {
        return false;
      }
      
      return true;
    }).slice(0, 50); // Limit results
    
    console.log(`📈 Filtering complete: ${filtered.length}/${projects.length} projects passed filters`);
    return filtered;
  }

  sortProjects(projects, sortBy, sortOrder) {
    const sorted = [...projects].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'views':
          valueA = a.raw?.project?.stats?.views || 0;
          valueB = b.raw?.project?.stats?.views || 0;
          break;
        case 'likes':
          valueA = a.raw?.project?.stats?.likes || 0;
          valueB = b.raw?.project?.stats?.likes || 0;
          break;
        case 'created_at':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        case 'current_version':
          valueA = a.raw?.project?.current_version || 1;
          valueB = b.raw?.project?.current_version || 1;
          break;
        case 'qualityScore':
          valueA = a.qualityScore || 0;
          valueB = b.qualityScore || 0;
          break;
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    return sorted;
  }
}

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