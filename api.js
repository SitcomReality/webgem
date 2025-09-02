  normalizeFeedItems(items = []) {
    return items.map((it) => {
      const site = it.site || it;
      const project = it.project || it.project_revision?.project || it.project_data || it.project;
      const id = site?.id || project?.site_id || project?.id;
      
      // Extract actual version count from project data
      const currentVersion = project?.current_version || 
                           project?.stats?.current_version || 
                           project?.revisions_count || 
                           project?.version_count || 
                           1;
      
      return {
        id,
        siteId: site?.id || null,
        projectId: project?.id || it.project_id || null,
        title: project?.title || site?.title || it.title || 'Untitled',
        description: project?.description || it.description || '',
        created_at: site?.created_at || project?.created_at || it.created_at || new Date().toISOString(),
        currentVersion: currentVersion,
        raw: it
      };
    });
  }

