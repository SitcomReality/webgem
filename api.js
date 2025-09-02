  async getSearchFeed(sort, search, params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      range: params.range || 'day',
      ...params
    }).toString();
    
    // Ensure search is not empty - use a wildcard or fallback
    const searchTerm = search && search.trim() ? encodeURIComponent(search) : '*';
    return this.fetch(`/feed/search/${sort}/${searchTerm}?${query}`);
  }

