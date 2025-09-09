// Build assistant prompt from app state
window.AssistantPrompt = {
  build({ intent = 'suggest' } = {}) {
    const projects = (window.app?.currentProjects || []).map(p => ({
      title: p.title,
      description: String(p.description || '').slice(0, 150),
      versions: p.raw?.project?.current_version || 1,
      views: p.raw?.project?.stats?.views || 0,
      likes: p.raw?.project?.stats?.likes || 0,
      date: p.created_at,
    }));
    const overview = {
      goal: "Surface underrated, technically interesting projects with healthy version counts and low-to-moderate views.",
      intent,
      stats: {
        analyzing: document.getElementById('analyzingCount')?.textContent || null,
        gemsFound: document.getElementById('gemsFound')?.textContent || null
      }
    };
    const instructions = `
You are a playful, slightly obnoxious but helpful mascot assistant. Be concise, whimsical, and specific.
- Recommend 1–3 projects MAX, with a one-liner why.
- Prefer high versions, low views, and technical uniqueness.
- If list is weak, say what to tweak (briefly).
Return plain text with short bullets.`;
    return {
      messages: [
        { role: "system", content: "You are a whimsical but helpful discovery mascot. Keep replies under 120 words." },
        { role: "user", content: `${instructions}\n\nOverview:\n${JSON.stringify(overview, null, 2)}\n\nProjects:\n${JSON.stringify(projects, null, 2)}` }
      ]
    };
  }
};