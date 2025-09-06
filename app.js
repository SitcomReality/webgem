class HiddenGemsApp {
  constructor() {
    this.isLoading = false;
    this.currentProjects = [];
    this.currentOffset = 0;
    this.projectsPerBatch = 250;
  }

  async initialize() {
    console.log('🚀 Hidden Gems Discovery Platform Initializing...');
    
    try {
      // Set default sort to prestige descending
      window.uiManager.elements.sortBy.value = 'prestige';
      window.uiManager.elements.sortOrder.value = 'desc';
      
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

  async discoverGems(loadMore = false) {
    if (this.isLoading) return;
    
    this.isLoading = true;

    if (loadMore) {
        this.currentOffset += this.projectsPerBatch;
        window.uiManager.showLoadMoreLoading();
    } else {
        this.currentOffset = 0;
        this.currentProjects = [];
        window.uiManager.showLoading();
    }
    
    try {
      console.log('🔍 Starting gem discovery process...');
      
      // Get discovery parameters
      const minVersions = parseInt(window.uiManager.elements.minVersions.value);
      const maxViews = parseInt(window.uiManager.elements.maxViews.value);
      const timeRange = window.uiManager.elements.timeRange.value;
      const feedSource = window.uiManager.elements.feedSource.value;
      const sortBy = window.uiManager.elements.sortBy.value;
      const sortOrder = window.uiManager.elements.sortOrder.value;
      
      // Fetch and score projects
      const projectSources = await this.fetchProjectSources(feedSource, timeRange);
      const scoredProjects = await this.scoreProjects(projectSources);
      const gems = this.filterGems(scoredProjects, minVersions, maxViews);
      
      // Sort the new gems before appending
      const newGems = this.sortProjects(gems, sortBy, sortOrder);
      
      if (loadMore) {
        // Append new gems and remove duplicates that might have slipped in
        const allGems = [...this.currentProjects, ...newGems];
        this.currentProjects = allGems.filter((project, index, self) =>
            index === self.findIndex((p) => (
                p.id === project.id
            ))
        );
      } else {
        this.currentProjects = newGems;
      }

      console.log(`💎 Found ${this.currentProjects.length} total hidden gems in ${timeRange} range`);
      
      // Calculate average quality
      const avgQuality = this.currentProjects.length > 0 
        ? this.currentProjects.reduce((sum, p) => sum + p.qualityScore, 0) / this.currentProjects.length 
        : 0;
      
      const totalAnalyzed = this.currentOffset + projectSources.length;
      window.uiManager.updateStats(totalAnalyzed, this.currentProjects.length, avgQuality);
      
      // Render results
      window.uiManager.renderProjects(this.currentProjects, loadMore);
      
      // Show or hide load more button
      window.uiManager.toggleLoadMore(projectSources.length === this.projectsPerBatch);
      
    } catch (error) {
      console.error('❌ Gem discovery failed:', error);
      window.uiManager.showError('Failed to discover gems. Please try again.');
    } finally {
      this.isLoading = false;
      window.uiManager.hideLoading();
    }
  }

  async fetchProjectSources(feedSource, range) {
    const sources = [];
    console.log(`🎯 Feed source: ${feedSource}, Time range: ${range}`);
    
    try {
      let results;
      const params = {
          limit: this.projectsPerBatch,
          offset: this.currentOffset,
          range: range
      };

      switch(feedSource) {
        case 'trending':
          console.log('🔍 Fetching projects from trending feed...');
          results = await window.websimAPI.getTrendingFeed(params);
          console.log(`📈 Projects from trending feed: ${results.data?.length || 0}`);
          break;
        case 'posts':
          console.log('🔍 Fetching projects from posts feed...');
          results = await window.websimAPI.getPostsFeed({ 
            limit: this.projectsPerBatch,
            offset: this.currentOffset,
            sort: 'latest'
          });
          console.log(`📝 Projects from posts feed: ${results.data?.length || 0}`);
          break;
        case 'search':
        default:
          console.log('🔍 Fetching projects from search feed...');
          results = await window.websimAPI.getSearchFeed('newest', 'e', params);
          console.log(`🔍 Projects from search feed: ${results.data?.length || 0}`);
          break;
      }
      
      if (results && results.data) {
        sources.push(...results.data);
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
    }); // Do not slice here, sort first then slice
    
    console.log(`📈 Filtering complete: ${filtered.length}/${projects.length} projects passed filters`);
    return filtered;
  }

  sortProjects(projects, sortBy, sortOrder) {
    if (sortBy === 'prestige') {
      if (projects.length === 0) return [];

      // 1. Find min/max for normalization
      const stats = {
        minViews: Infinity, maxViews: -Infinity,
        minLikes: Infinity, maxLikes: -Infinity,
        minVersions: Infinity, maxVersions: -Infinity,
        minTimestamp: Infinity, maxTimestamp: -Infinity,
      };

      projects.forEach(p => {
        const views = p.raw?.project?.stats?.views || 0;
        const likes = p.raw?.project?.stats?.likes || 0;
        const versions = p.raw?.project?.current_version || 1;
        const timestamp = new Date(p.created_at).getTime();

        stats.minViews = Math.min(stats.minViews, views);
        stats.maxViews = Math.max(stats.maxViews, views);
        stats.minLikes = Math.min(stats.minLikes, likes);
        stats.maxLikes = Math.max(stats.maxLikes, likes);
        stats.minVersions = Math.min(stats.minVersions, versions);
        stats.maxVersions = Math.max(stats.maxVersions, versions);
        stats.minTimestamp = Math.min(stats.minTimestamp, timestamp);
        stats.maxTimestamp = Math.max(stats.maxTimestamp, timestamp);
      });

      // Handle cases where all values are the same
      const rangeViews = stats.maxViews - stats.minViews || 1;
      const rangeLikes = stats.maxLikes - stats.minLikes || 1;
      const rangeVersions = stats.maxVersions - stats.minVersions || 1;
      const rangeTimestamp = stats.maxTimestamp - stats.minTimestamp || 1;

      // 2. Calculate prestige score for each project
      const scoredProjects = projects.map(p => {
        const views = p.raw?.project?.stats?.views || 0;
        const likes = p.raw?.project?.stats?.likes || 0;
        const versions = p.raw?.project?.current_version || 1;
        const timestamp = new Date(p.created_at).getTime();
        const quality = p.qualityScore || 0;

        // Normalize values
        const normViews = (views - stats.minViews) / rangeViews;
        const normLikes = (likes - stats.minLikes) / rangeLikes;
        const normVersions = (versions - stats.minVersions) / rangeVersions;
        const normAge = (stats.maxTimestamp - timestamp) / rangeTimestamp;

        // Weights
        const weights = { views: 0.35, versions: 0.4, quality: 0.15, age: 0.05, likes: 0.05 };

        // Score calculation
        const score = 
          (weights.views * (1 - normViews)) +
          (weights.likes * (1 - normLikes)) +
          (weights.versions * Math.pow(normVersions, 2)) + // Exponential bonus for versions
          (weights.quality * quality) +
          (weights.age * normAge);
        
        return { ...p, prestigeScore: score };
      });
      
      // 3. Sort by prestige score
      const sorted = scoredProjects.sort((a, b) => {
        const scoreA = a.prestigeScore;
        const scoreB = b.prestigeScore;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });

      return sorted.slice(0, 50); // Limit results after sorting
    }

    // Fallback to original sorting logic
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
        default: // Default to prestige if sortBy is unknown
          valueA = a.prestigeScore || 0;
          valueB = b.prestigeScore || 0;
          break;
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    return sorted.slice(0, 50); // Limit results for other sort types too
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