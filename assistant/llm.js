// LLM client wrapper
window.AssistantLLM = {
  async getSuggestion(payload) {
    try {
      const completion = await websim.chat.completions.create({
        messages: payload.messages
      });
      return completion.content || "No suggestion available.";
    } catch (e) {
      console.error('Assistant LLM error:', e);
      return "I biffed it fetching advice. Try again in a moment.";
    }
  }
};

