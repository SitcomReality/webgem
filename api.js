  async getSearchFeed(sort, search, params = {}) {
    const query = new URLSearchParams({
      limit: params.limit || 50,
      offset: params.offset || 0,
      range: params.range || 'day',
      ...params
    }).toString();
    
    // Ensure search parameter is not empty
    const searchTerm = search || '*';
    return this.fetch(`/feed/search/${sort}/${encodeURIComponent(searchTerm)}?${query}`);
  }

