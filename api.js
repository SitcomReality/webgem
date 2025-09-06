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

  // Normalize feed items (trending/search) to a flat shape our UI expects
  normalizeFeedItems(items = []) {
    return items.map((it) => {
      // Handle posts feed format
      if (it.comment?.card_data?.type === 'project_post' && it.comment.card_data.project) {
        const postProject = it.comment.card_data.project;
        
        // Use project_id from comment for site-level linking
        const siteId = it.comment.project_id;

        // Re-structure the raw data to be consistent with other feeds
        const rawData = {
          project: postProject,
          site: {
            id: siteId,
            owner: postProject.created_by,
            thumbnail: postProject.thumbnail?.url || null
          },
        };
        
        return {
          id: siteId,
          siteId: siteId,
          projectId: postProject.id,
          title: postProject.title || 'Untitled',
          description: postProject.description || '',
          created_at: it.comment.created_at || new Date().toISOString(),
          raw: rawData,
        };
      }

      // Existing logic for other feeds (trending, search)
      const site = it.site || it; // some endpoints may return site directly
      const project = it.project || it.project_revision?.project || it.project_data || it.project;
      const id = site?.id || project?.site_id || project?.id; // prefer site.id for images/links

      if (!id) return null; // If we can't identify a project, skip it.
      
      return {
        id, // treat as site id for UI/link/image
        siteId: site?.id || null,
        projectId: project?.id || it.project_id || null,
        title: project?.title || site?.title || it.title || 'Untitled',
        description: project?.description || it.description || '',
        created_at: site?.created_at || project?.created_at || it.created_at || new Date().toISOString(),
        raw: it
      };
    }).filter(Boolean); // Filter out items that couldn't be normalized (e.g., text-only posts)
  }

  async getTrendingFeed(params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      range: params.range || 'day',  
      ...params
    }).toString();
    
    const raw = await this.fetch(`/feed/trending?${query}`);
    const items = raw.feed?.data || raw.data || [];
    const feedItems = this.normalizeFeedItems(items);
    console.log(`🧭 Trending feed (${params.range || 'day'}): ${feedItems.length} items`);
    return { data: feedItems };
  }

  async getPostsFeed(params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      sort: params.sort || 'latest',
      ...params
    }).toString();

    const raw = await this.fetch(`/feed/posts?${query}`);
    const items = raw.feed?.data || raw.data || [];
    const feedItems = this.normalizeFeedItems(items);
    console.log(`📝 Posts feed (${params.sort || 'latest'}): ${feedItems.length} items`);
    return { data: feedItems };
  }

  async getSearchFeed(sort, search, params = {}) {
    const requested = (sort || '').toLowerCase();
    const safeSort = ['best', 'newest', 'best_template'].includes(requested) ? requested : 'newest';
    const safeSearch = (search && String(search).trim().length > 0) ? search : '*';
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      range: params.range || 'day',  
      ...params
    }).toString();
    
    const endpoint = `/feed/search/${safeSort}/${encodeURIComponent(safeSearch)}?${query}`;
    const raw = await this.fetch(endpoint);
    const items = raw.feed?.data || raw.data || [];
    const searchItems = this.normalizeFeedItems(items);
    console.log(`🧭 Search (${safeSort}/${safeSearch}/${params.range || 'day'}): ${searchItems.length} items`);
    return { data: searchItems };
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