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
      const timeRange = window.uiManager.elements.timeRange.value;
      const sortBy = window.uiManager.elements.sortBy.value;
      const sortOrder = window.uiManager.elements.sortOrder.value;
      
      // Fetch and score projects
      const projectSources = await this.fetchProjectSources(timeRange);
      const scoredProjects = await this.scoreProjects(projectSources);
      const gems = this.filterGems(scoredProjects, minVersions);
      
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
      
      // Use actual version count from API data
      const actualVersions = project.raw?.project?.current_version || 1;
      if (actualVersions < Math.max(10, minVersions)) return false;
      
      // Remove projects that are too popular (anti-trending bias)
      const text = `${project.title} ${project.description || ''}`.toLowerCase();
      const hasGenericKeywords = Array.from(window.gemFilter.genericKeywords)
        .some(keyword => text.includes(keyword));
      
      if (hasGenericKeywords && project.qualityScore < 0.6) return false;
      
      return true;
    }).slice(0, 50); // Limit results
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

// Add curated lists functionality
class CuratedLists {
    constructor() {
        this.room = new WebsimSocket();
        this.curatorUsername = 'SitcomReality';
        this.lists = {
            'underappreciated': [],
            'overlooked': [],
            'up-and-comers': []
        };
        this.currentList = 'underappreciated';
        this.isCurator = false;
        
        this.initializeCuratedSystem();
    }

    async initializeCuratedSystem() {
        // Check if current user is the curator
        try {
            const currentUser = await window.websim.getCurrentUser();
            this.isCurator = currentUser.username === this.curatorUsername;
            
            if (this.isCurator) {
                this.setupCuratedUI();
                await this.loadCuratedProjects();
            }
        } catch (error) {
            console.warn('Failed to initialize curated system:', error);
        }
    }

    setupCuratedUI() {
        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'curated-toggle';
        toggleBtn.innerHTML = '⚡';
        toggleBtn.title = 'Toggle Curated Projects';
        document.body.appendChild(toggleBtn);

        // Add event listeners
        toggleBtn.addEventListener('click', () => {
            this.toggleCuratedPanel();
        });

        document.querySelector('.curated-close').addEventListener('click', () => {
            this.toggleCuratedPanel();
        });

        document.querySelectorAll('.curated-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchList(e.target.dataset.list);
            });
        });
    }

    toggleCuratedPanel() {
        const panel = document.getElementById('curatedPanel');
        panel.classList.toggle('hidden');
    }

    async loadCuratedProjects() {
        try {
            for (const listName of Object.keys(this.lists)) {
                const projects = await this.room.collection(listName).getList();
                this.lists[listName] = projects;
                this.renderCuratedList(listName);
            }
        } catch (error) {
            console.error('Failed to load curated projects:', error);
        }
    }

    async addToList(project, listName) {
        try {
            await this.room.collection(listName).create({
                projectId: project.id,
                title: project.title,
                description: project.description || '',
                createdAt: new Date().toISOString(),
                projectData: project
            });
            
            this.lists[listName] = await this.room.collection(listName).getList();
            this.renderCuratedList(listName);
            
            console.log(`Added project to ${listName}`);
        } catch (error) {
            console.error('Failed to add to curated list:', error);
        }
    }

    async removeFromList(projectId, listName) {
        try {
            const projects = this.lists[listName];
            const project = projects.find(p => p.projectId === projectId);
            if (project) {
                await this.room.collection(listName).delete(project.id);
                this.lists[listName] = await this.room.collection(listName).getList();
                this.renderCuratedList(listName);
            }
        } catch (error) {
            console.error('Failed to remove from curated list:', error);
        }
    }

    renderCuratedList(listName) {
        const container = document.querySelector(`[data-list="${listName}"]`);
        container.innerHTML = '';
        
        const projects = this.lists[listName];
        projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'curated-item';
            item.innerHTML = `
                <div class="curated-item-title">${project.title}</div>
                <div class="curated-item-meta">
                    ${project.projectData.raw?.project?.stats?.views?.toLocaleString() || 0} views
                </div>
            `;
            
            item.addEventListener('click', () => {
                window.open(`https://websim.com/c/${project.projectId}`, '_blank');
            });
            
            container.appendChild(item);
        });
    }

    switchList(listName) {
        document.querySelectorAll('.curated-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.list === listName);
        });
        
        document.querySelectorAll('.curated-list').forEach(list => {
            list.classList.toggle('hidden', list.dataset.list !== listName);
        });
        
        this.currentList = listName;
    }

    // Add add-to-list button to project cards
    addCurateButton(projectCard, project) {
        if (!this.isCurator) return;
        
        const template = document.getElementById('addToListTemplate');
        const clone = template.content.cloneNode(true);
        
        const addBtn = clone.querySelector('.add-btn');
        const menu = clone.querySelector('.list-menu');
        
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });
        
        clone.querySelectorAll('[data-list]').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.addToList(project, e.target.dataset.list);
                menu.classList.add('hidden');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-list')) {
                menu.classList.add('hidden');
            }
        });
        
        projectCard.querySelector('.project-footer').appendChild(clone);
    }
}

// Update UIManager to include curated functionality
class UIManager {
    // ...existing code...
    
    createProjectCard(project) {
        // ...existing card creation...
        
        // Add curate button if curator
        window.curatedLists.addCurateButton(card, project);
        
        return card;
    }
}

// Initialize curated lists
document.addEventListener('DOMContentLoaded', async () => {
    window.curatedLists = new CuratedLists();
});