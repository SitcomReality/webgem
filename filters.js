class GemFilter {
  constructor() {
    this.genericKeywords = new Set();
    this.memeIndicators = new Set();
    this.qualityIndicators = new Set();
    this.initializeKeywordSets();
    
    // Define filter categories
    this.filterCategories = {
      memes: {
        name: 'Meme Culture',
        color: '#ff6b6b',
        terms: new Set(['meme', 'brainrot', 'cringe', 'waifu', 'dumbest', 'meme', 'shitpost', 'ragebait'])
      },
      gaming: {
        name: 'Gaming',
        color: '#4ecdc4',
        terms: new Set(['minecraft', 'roblox', 'robux', 'mario', 'fnaf', 'fnf', 'fortnite', 'funkin', 'pokémon', 'pokemon', 'fakemon', 'undertale', 'deltarune', 'knuckles', 'stickman', 'kirby', 'geometry dash', 'smash bro'])
      },
      social: {
        name: 'Social Media',
        color: '#45b7d1',
        terms: new Set(['youtube', 'reddit', 'tiktok', 'instagram', 'facebook', '4chan', 'twitch', 'discord', 'wikipedia'])
      },
      entertainment: {
        name: 'Entertainment',
        color: '#f9ca24',
        terms: new Set(['spongebob', 'squidward', 'simpsons', 'family guy', 'south park', 'phineas', 'digital circus', 'bimo', 'labubu', 'bfdi', 'dream island', 'dandy', 'caillou', 'gumball', 'squid game', 'kronos database'])
      },
      content: {
        name: 'Content Terms',
        color: '#a55eea',
        terms: new Set(['chibi', 'jerma', 'markiplier', 'little timmy', 'fandom', 'crossover', 'mashup', 'backrooms', 'drip out', 'plushie', 'plushify', 'doesn\'t exist', 'does not exist', 'windows'])
      },
      lowQuality: {
        name: 'Low Quality',
        color: '#fd79a8',
        terms: new Set(['emoji', 'noob', 'ytp', 'forsaken', 'sprunki', 'character clash', 'banned', 'poop', '____'])
      },
      promotional: {
        name: 'Promotional',
        color: '#fd9644',
        terms: new Set(['donate', 'donations', 'credits', '♦'])
      }
    };

    // Initialize all blocked terms
    this.blockedTerms = new Set();
    Object.values(this.filterCategories).forEach(category => {
      category.terms.forEach(term => this.blockedTerms.add(term));
    });

    // Load saved state
    this.loadFilterState();
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
    console.log(`\n🔍 Calculating quality score for: "${project.title || 'Untitled'}"`);
    
    let score = 0;
    
    // Version-based scoring (major factor)
    const versionScore = this.calculateVersionScore(project);
    console.log(`📊 Version score: ${versionScore} (weighted: ${versionScore * 0.4})`);
    score += versionScore * 0.4;

    // Content quality scoring
    const contentScore = this.calculateContentScore(project);
    console.log(`📊 Content score: ${contentScore} (weighted: ${contentScore * 0.3})`);
    score += contentScore * 0.3;

    // Uniqueness scoring (penalize generic keywords)
    const uniquenessScore = this.calculateUniquenessScore(project);
    console.log(`📊 Uniqueness score: ${uniquenessScore} (weighted: ${uniquenessScore * 0.3})`);
    score += uniquenessScore * 0.3;

    const finalScore = Math.max(0, Math.min(1, score));
    console.log(`📈 Final quality score: ${finalScore}`);
    
    return finalScore;
  }

  calculateVersionScore(project) {
    const actualVersions = project.raw?.project?.current_version || 1;
    console.log(`  📊 Version count: ${actualVersions}`);
    
    if (actualVersions < 10) return 0.1;
    if (actualVersions < 25) return 0.3;
    if (actualVersions < 50) return 0.5;
    if (actualVersions < 100) return 0.7;
    if (actualVersions < 200) return 0.9;
    return 1.0;
  }

  estimateVersionCount(project) {
    // Fallback to actual version if available, otherwise use basic heuristic
    return project.raw?.project?.current_version || 1;
  }

  calculateContentScore(project) {
    const text = `${project.title} ${project.description || ''}`.toLowerCase();
    let score = 0.5; // Base score
    console.log(`  🔍 Content analysis for: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`);
    // Remove positive boosts for "quality terms" and "technical terms"
    // Length and detail bonus (description-based, not title length)
    if (text.length > 100) { score += 0.1; console.log(`  ✅ Long description bonus (+0.1)`); }
    if (text.length > 300) { score += 0.1; console.log(`  ✅ Very long description bonus (+0.1)`); }
    const finalScore = Math.min(1, score);
    console.log(`  📊 Content score: ${finalScore}`);
    return finalScore;
  }

  calculateUniquenessScore(project) {
    const text = `${project.title} ${project.description || ''}`.toLowerCase();
    let score = 1.0;
    console.log(`  🔍 Uniqueness analysis...`);
    // Penalize generic keywords (log which ones)
    const matchedGeneric = [];
    this.genericKeywords.forEach(keyword => { if (text.includes(keyword)) { score -= 0.15; matchedGeneric.push(keyword); } });
    console.log(`  ⚠️ Generic keywords found: ${matchedGeneric.length}${matchedGeneric.length ? ` -> [${matchedGeneric.join(', ')}]` : ''}`);
    // Penalize blocked terms (unchanged)
    let blockedTermCount = 0;
    this.blockedTerms.forEach(term => { if (text.includes(term.toLowerCase())) { score -= 0.3; blockedTermCount++; } });
    console.log(`  ❌ Blocked terms found: ${blockedTermCount}`);
    
    // Penalize common patterns
    const genericPatterns = [
      /^(simple|basic|easy|quick)\s+/,
      /\b(test|demo|example)\b/,
      /\b(copy|clone)\b/,
      /\bmeme\b/,
      /_{4,}/
    ];
    const matchedPatterns = [];
    genericPatterns.forEach(pattern => { if (pattern.test(text)) { score -= 0.2; matchedPatterns.push(pattern.toString()); } });
    console.log(`  ⚠️ Generic patterns found: ${matchedPatterns.length}${matchedPatterns.length ? ` -> [${matchedPatterns.join(', ')}]` : ''}`);
    const finalScore = Math.max(0, score);
    console.log(`  📊 Uniqueness score: ${finalScore}`);
    return finalScore;
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

  // Save/Load filter state
  saveFilterState() {
    const state = {
      blockedTerms: Array.from(this.blockedTerms),
      categories: {}
    };
    
    Object.keys(this.filterCategories).forEach(key => {
      const category = this.filterCategories[key];
      const activeTerms = Array.from(category.terms).filter(term => this.blockedTerms.has(term));
      state.categories[key] = activeTerms.length === category.terms.size;
    });
    
    localStorage.setItem('hiddenGemsFilters', JSON.stringify(state));
  }

  loadFilterState() {
    try {
      const saved = localStorage.getItem('hiddenGemsFilters');
      if (saved) {
        const state = JSON.parse(saved);
        this.blockedTerms = new Set(state.blockedTerms);
      }
    } catch (e) {
      console.warn('Failed to load filter state', e);
    }
  }

  // Filter management methods
  toggleTerm(term) {
    const lowerTerm = term.toLowerCase();
    if (this.blockedTerms.has(lowerTerm)) {
      this.blockedTerms.delete(lowerTerm);
    } else {
      this.blockedTerms.add(lowerTerm);
    }
    this.saveFilterState();
  }

  toggleCategory(categoryKey) {
    const category = this.filterCategories[categoryKey];
    const allActive = Array.from(category.terms).every(term => this.blockedTerms.has(term));
    
    if (allActive) {
      category.terms.forEach(term => this.blockedTerms.delete(term));
    } else {
      category.terms.forEach(term => this.blockedTerms.add(term));
    }
    this.saveFilterState();
  }

  getActiveFilters() {
    return Array.from(this.blockedTerms);
  }

  isCategoryActive(categoryKey) {
    const category = this.filterCategories[categoryKey];
    return Array.from(category.terms).every(term => this.blockedTerms.has(term));
  }

  isTermActive(term) {
    return this.blockedTerms.has(term.toLowerCase());
  }
}

// Global filter instance
window.gemFilter = new GemFilter();