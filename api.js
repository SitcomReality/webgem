class WebsimAPI {
  constructor() {
    this.baseURL = 'https://api.websim.com/api/v1';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetch(endpoint, options = {}) {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 Cache hit for: ${endpoint}`);
      return cached.data;
    }

    const fullUrl = `${this.baseURL}${endpoint}`;
    console.log(`🌐 API Call: ${fullUrl}`);
    console.log(`📋 Options:`, options);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Response data:`, data);
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async getTrendingFeed(params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      range: params.range || 'day',
      ...params
    }).toString();
    
    return this.fetch(`/feed/trending?${query}`);
  }

  async getSearchFeed(sort, search, params = {}) {
    const requested = (sort || '').toLowerCase();
    const normalized = requested === 'new' ? 'newest' : requested;
    const safeSort = ['best', 'newest', 'best_template'].includes(normalized) ? normalized : 'newest';
    const safeSearch = (search && String(search).trim().length > 0) ? search : 'a';
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      range: params.range || 'day',
      ...params
    }).toString();
    return this.fetch(`/feed/search/${safeSort}/${encodeURIComponent(safeSearch)}?${query}`);
  }

  async getTopSearches(params = {}) {
    const query = new URLSearchParams({
      day: params.day || 'latest',
      limit: params.limit || 20,
      offset: params.offset || 0,
      ...params
    }).toString();
    
    return this.fetch(`/search/top?${query}`);
  }

  async getRelatedKeywords(searchTerm, params = {}) {
    const query = new URLSearchParams({
      q: searchTerm,
      limit: params.limit || 10,
      min_frequency: params.min_frequency || 2,
      ...params
    }).toString();
    
    return this.fetch(`/search/related?${query}`);
  }

  async getProjectRevisions(projectId) {
    return this.fetch(`/projects/${projectId}/revisions`);
  }

  async getAllProjects(params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      ...params
    }).toString();
    
    return this.fetch(`/projects?${query}`);
  }

  async getTrendingRooms(params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 20,
      offset: params.offset || 0,
      ...params
    }).toString();
    
    try {
      return this.fetch(`/feed/rooms?${query}`);
    } catch (error) {
      console.warn('Trending rooms API unavailable:', error.message);
      return { data: [] };
    }
  }
}

// Global API instance
window.websimAPI = new WebsimAPI();