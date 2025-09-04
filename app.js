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
    console.log(`\n🏆 Top 5 projects by quality score:`);
    sorted.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.title}" - Score: ${p.qualityScore}`);
    });
    
    return sorted;
  }

