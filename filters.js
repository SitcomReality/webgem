class GemFilter {
  constructor() {
    this.genericKeywords = new Set();
    this.memeIndicators = new Set();
    this.qualityIndicators = new Set();
    this.initializeKeywordSets();
  }

  initializeKeywordSets() {
    // These will be populated dynamically from trending data
    this.commonGenericTerms = [
      'meme', 'funny', 'lol', 'joke', 'simple', 'quick', 'easy',
      'basic', 'test', 'demo', 'hello', 'world', 'copy', 'clone'
    ];

    this.qualityTerms = [
      'algorithm', 'simulation', 'visualization', 'interactive',
      'physics', 'graphics', 'art', 'creative', 'technical',
      'advanced', 'complex', 'detailed', 'comprehensive'
    ];
  }

  async analyzeGenericKeywords() {
    try {
      // Get trending and top searches to identify generic terms
      const [trending, topSearches] = await Promise.all([
        window.websimAPI.getTrendingFeed({ limit: 100 }),
        window.websimAPI.getTopSearches({ limit: 50 })
      ]);

      // Extract keywords from trending titles and descriptions
      const trendingKeywords = this.extractKeywords(
        trending.data?.map(item => `${item.title} ${item.description || ''}`) || []
      );

      // Get search terms
      const searchTerms = topSearches.data?.map(item => item.query.toLowerCase()) || [];

      // Find overlapping keywords (likely generic/meme content)
      this.genericKeywords = new Set([
        ...this.commonGenericTerms,
        ...trendingKeywords.filter(keyword => 
          searchTerms.some(term => term.includes(keyword) || keyword.includes(term))
        )
      ]);

      return this.genericKeywords;
    } catch (error) {
      console.error('Error analyzing generic keywords:', error);
      this.genericKeywords = new Set(this.commonGenericTerms);
      return this.genericKeywords;
    }
  }

  extractKeywords(texts) {
    const keywords = new Set();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

    texts.forEach(text => {
      if (!text) return;
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
      
      words.forEach(word => keywords.add(word));
    });

    // Return keywords that appear more than once
    const wordCounts = {};
    texts.forEach(text => {
      if (!text) return;
      const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    return Array.from(keywords).filter(keyword => wordCounts[keyword] > 2);
  }

  async calculateQualityScore(project) {
    let score = 0;
    
    // Version-based scoring (major factor)
    const versionScore = this.calculateVersionScore(project);
    score += versionScore * 0.4;

    // Content quality scoring
    const contentScore = this.calculateContentScore(project);
    score += contentScore * 0.3;

    // Uniqueness scoring (penalize generic keywords)
    const uniquenessScore = this.calculateUniquenessScore(project);
    score += uniquenessScore * 0.3;

    return Math.max(0, Math.min(1, score));
  }

  calculateVersionScore(project) {
    const currentVersion = project.currentVersion || 1;
    
    if (currentVersion < 10) return 0.1;
    if (currentVersion < 25) return 0.3;
    if (currentVersion < 50) return 0.5;
    if (currentVersion < 100) return 0.7;
    if (currentVersion < 200) return 0.9;
    return 1.0;
  }

  calculateContentScore(project) {
    const text = `${project.title} ${project.description || ''}`.toLowerCase();
    let score = 0.5; // Base score
    
    // Positive indicators
    this.qualityTerms.forEach(term => {
      if (text.includes(term)) score += 0.1;
    });
    
    // Length and detail bonus
    if (text.length > 100) score += 0.1;
    if (text.length > 300) score += 0.1;
    
    // Technical terms bonus
    const techTerms = ['api', 'algorithm', 'database', 'framework', 'library', 'function', 'method'];
    techTerms.forEach(term => {
      if (text.includes(term)) score += 0.05;
    });
    
    return Math.min(1, score);
  }

  calculateUniquenessScore(project) {
    const text = `${project.title} ${project.description || ''}`.toLowerCase();
    let score = 1.0;
    
    // Penalize generic keywords
    this.genericKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score -= 0.15;
      }
    });
    
    // Penalize very short titles (likely generic)
    if (project.title.length < 20) score -= 0.2;
    
    // Penalize common patterns
    const genericPatterns = [
      /^(simple|basic|easy|quick)\s+/,
      /\b(test|demo|example)\b/,
      /\b(copy|clone)\b/,
      /\bmeme\b/
    ];
    
    genericPatterns.forEach(pattern => {
      if (pattern.test(text)) score -= 0.2;
    });
    
    return Math.max(0, score);
  }

  filterHiddenGems(projects, minQualityScore = 0.4) {
    return projects.filter(project => {
      const score = this.calculateQualityScore(project);
      return score >= minQualityScore;
    });
  }

  rankByQualityScore(projects) {
    return projects
      .map(project => ({
        ...project,
        qualityScore: this.calculateQualityScore(project)
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore);
  }
}

// Global filter instance
window.gemFilter = new GemFilter();